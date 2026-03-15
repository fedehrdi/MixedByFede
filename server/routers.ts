import Stripe from "stripe";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import {
  addToCart,
  clearCart,
  createFileUpload,
  createOrder,
  createPortfolioItem,
  createTestimonial,
  createVoiceNote,
  deletePortfolioItem,
  deleteTestimonial,
  getAllOrders,
  getAllPortfolioItems,
  getAllServices,
  getAllTestimonials,
  getCartByUserId,
  getFileUploadsByOrderId,
  getOrderById,
  getOrderItemsByOrderId,
  getOrdersByUserId,
  getPublishedPortfolioItems,
  getPublishedTestimonials,
  getServiceById,
  getVoiceNotesByOrderId,
  removeFromCart,
  updateFileAiAnalysis,
  updateOrderStatus,
  updatePortfolioItem,
  updateTestimonial,
  updateOrderStripeData,
  getDb,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { TRPCError } from "@trpc/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-02-25.clover" });

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  services: router({
    list: publicProcedure.query(async () => {
      const items = await getAllServices();
      return items.map((s) => ({ ...s, price: Number(s.price), features: JSON.parse(s.features) as string[] }));
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const s = await getServiceById(input.id);
      if (!s) throw new TRPCError({ code: "NOT_FOUND" });
      return { ...s, price: Number(s.price), features: JSON.parse(s.features) as string[] };
    }),
  }),

  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const items = await getCartByUserId(ctx.user.id);
      const enriched = await Promise.all(
        items.map(async (item) => {
          const svc = await getServiceById(item.serviceId);
          return { ...item, service: svc ? { ...svc, price: Number(svc.price), features: JSON.parse(svc.features) as string[] } : null };
        })
      );
      return enriched;
    }),
    add: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await addToCart({ userId: ctx.user.id, serviceId: input.serviceId, quantity: 1 });
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeFromCart(input.cartItemId, ctx.user.id);
        return { success: true };
      }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  orders: router({
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const list = await getOrdersByUserId(ctx.user.id);
      return list.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) }));
    }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.userId !== ctx.user.id && ctx.user.role !== "admin")
        throw new TRPCError({ code: "FORBIDDEN" });
      const items = await getOrderItemsByOrderId(input.id);
      const uploads = await getFileUploadsByOrderId(input.id);
      const notes = await getVoiceNotesByOrderId(input.id);
      return {
        ...order,
        totalAmount: Number(order.totalAmount),
        items: items.map((i) => ({ ...i, price: Number(i.price) })),
        uploads,
        voiceNotes: notes,
      };
    }),
    createCheckout: protectedProcedure
      .input(z.object({ notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const cartData = await getCartByUserId(ctx.user.id);
        if (cartData.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Carrello vuoto" });

        const enriched = await Promise.all(
          cartData.map(async (item) => {
            const svc = await getServiceById(item.serviceId);
            if (!svc) throw new TRPCError({ code: "NOT_FOUND" });
            return { ...item, service: { ...svc, price: Number(svc.price) } };
          })
        );

        const total = enriched.reduce((sum, i) => sum + i.service.price * i.quantity, 0);

        const order = await createOrder(
          { userId: ctx.user.id, totalAmount: total.toFixed(2), notes: input.notes, status: "pending_payment" },
          enriched.map((i) => ({
            orderId: 0,
            serviceId: i.serviceId,
            serviceName: i.service.name,
            price: i.service.price.toFixed(2),
            quantity: i.quantity,
          }))
        );

        const origin = (ctx.req.headers.origin as string) || "http://localhost:3000";
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: enriched.map((i) => ({
            price_data: { currency: "eur", product_data: { name: i.service.name }, unit_amount: Math.round(i.service.price * 100) },
            quantity: i.quantity,
          })),
          mode: "payment",
          customer_email: ctx.user.email ?? undefined,
          allow_promotion_codes: true,
          client_reference_id: ctx.user.id.toString(),
          metadata: { user_id: ctx.user.id.toString(), order_id: order.id.toString(), customer_email: ctx.user.email ?? "", customer_name: ctx.user.name ?? "" },
          success_url: `${origin}/orders/${order.id}?success=1`,
          cancel_url: `${origin}/cart?cancelled=1`,
        });

        const db = await getDb();
        if (db) {
          const { orders: ordersTable } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await db.update(ordersTable).set({ stripeCheckoutSessionId: session.id }).where(eq(ordersTable.id, order.id));
        }

        await clearCart(ctx.user.id);
        await notifyOwner({ title: "Nuovo ordine creato", content: `Ordine #${order.id} da ${ctx.user.name ?? ctx.user.email} — €${total.toFixed(2)}` });

        return { checkoutUrl: session.url, orderId: order.id };
      }),
  }),

  uploads: router({
    saveUpload: protectedProcedure
      .input(z.object({ orderId: z.number(), fileName: z.string(), fileKey: z.string(), fileUrl: z.string(), fileSize: z.number().optional(), mimeType: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const upload = await createFileUpload({ orderId: input.orderId, userId: ctx.user.id, fileName: input.fileName, fileKey: input.fileKey, fileUrl: input.fileUrl, fileSize: input.fileSize, mimeType: input.mimeType, uploadType: "client_source" });
        await notifyOwner({ title: "Nuovo file caricato", content: `Ordine #${input.orderId}: ${input.fileName} da ${ctx.user.name ?? ctx.user.email}` });
        return upload;
      }),
    analyzeWithAI: protectedProcedure
      .input(z.object({ fileId: z.number(), fileName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Sei un ingegnere del suono esperto in mixing e mastering professionale. Analizza il file audio e genera suggerimenti tecnici dettagliati in italiano. Rispondi SOLO con JSON valido." },
            { role: "user", content: `Analizza questo file audio per mixing/mastering: "${input.fileName}". Fornisci suggerimenti tecnici professionali per equalizzazione, compressione, stereo width e loudness.` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "audio_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  overallAssessment: { type: "string" },
                  eq: { type: "object", properties: { suggestion: { type: "string" }, frequencies: { type: "array", items: { type: "string" } } }, required: ["suggestion", "frequencies"], additionalProperties: false },
                  compression: { type: "object", properties: { suggestion: { type: "string" }, ratio: { type: "string" }, attack: { type: "string" }, release: { type: "string" } }, required: ["suggestion", "ratio", "attack", "release"], additionalProperties: false },
                  stereoWidth: { type: "object", properties: { suggestion: { type: "string" }, recommendation: { type: "string" } }, required: ["suggestion", "recommendation"], additionalProperties: false },
                  loudness: { type: "object", properties: { suggestion: { type: "string" }, targetLUFS: { type: "number" } }, required: ["suggestion", "targetLUFS"], additionalProperties: false },
                  additionalNotes: { type: "array", items: { type: "string" } },
                },
                required: ["overallAssessment", "eq", "compression", "stereoWidth", "loudness", "additionalNotes"],
                additionalProperties: false,
              },
            },
          },
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : "{}";
        await updateFileAiAnalysis(input.fileId, content);
        return JSON.parse(content);
      }),
    listByOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getFileUploadsByOrderId(input.orderId);
      }),
  }),

  voiceNotes: router({
    transcribe: protectedProcedure
      .input(z.object({ orderId: z.number(), audioKey: z.string(), audioUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const result = await transcribeAudio({ audioUrl: input.audioUrl, language: "it" });
        const transcriptionText = 'text' in result ? result.text : 'Trascrizione non disponibile';
        return createVoiceNote({ orderId: input.orderId, userId: ctx.user.id, audioKey: input.audioKey, audioUrl: input.audioUrl, transcription: transcriptionText });
      }),
    listByOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getVoiceNotesByOrderId(input.orderId);
      }),
  }),

  portfolio: router({
    list: publicProcedure.query(() => getPublishedPortfolioItems()),
    adminList: adminProcedure.query(() => getAllPortfolioItems()),
    create: adminProcedure
      .input(z.object({ title: z.string(), artist: z.string(), genre: z.string().optional(), serviceType: z.enum(["mixing", "mastering", "mixing_mastering"]), description: z.string().optional(), coverImageUrl: z.string().optional(), isPublished: z.boolean().default(true), sortOrder: z.number().default(0) }))
      .mutation(async ({ input }) => { await createPortfolioItem(input); return { success: true }; }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.object({ title: z.string().optional(), artist: z.string().optional(), genre: z.string().optional(), description: z.string().optional(), coverImageUrl: z.string().optional(), isPublished: z.boolean().optional(), sortOrder: z.number().optional() }) }))
      .mutation(async ({ input }) => { await updatePortfolioItem(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deletePortfolioItem(input.id); return { success: true }; }),
  }),

  testimonials: router({
    list: publicProcedure.query(() => getPublishedTestimonials()),
    adminList: adminProcedure.query(() => getAllTestimonials()),
    create: adminProcedure
      .input(z.object({ clientName: z.string(), clientRole: z.string().optional(), content: z.string(), rating: z.number().min(1).max(5).default(5), serviceType: z.enum(["mixing", "mastering", "mixing_mastering"]).optional(), isPublished: z.boolean().default(true), sortOrder: z.number().default(0) }))
      .mutation(async ({ input }) => { await createTestimonial(input); return { success: true }; }),
    update: adminProcedure
      .input(z.object({ id: z.number(), data: z.object({ clientName: z.string().optional(), clientRole: z.string().optional(), content: z.string().optional(), rating: z.number().optional(), isPublished: z.boolean().optional() }) }))
      .mutation(async ({ input }) => { await updateTestimonial(input.id, input.data); return { success: true }; }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await deleteTestimonial(input.id); return { success: true }; }),
  }),

  admin: router({
    allOrders: adminProcedure.query(async () => {
      const list = await getAllOrders();
      return list.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) }));
    }),
    updateOrderStatus: adminProcedure
      .input(z.object({ orderId: z.number(), status: z.enum(["pending_payment", "paid", "in_progress", "revision", "delivered", "completed", "cancelled"]), adminNotes: z.string().optional() }))
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.orderId, input.status, input.adminNotes);
        return { success: true };
      }),
    uploadFinalFile: adminProcedure
      .input(z.object({ orderId: z.number(), fileName: z.string(), fileKey: z.string(), fileUrl: z.string(), fileSize: z.number().optional() }))
      .mutation(async ({ input }) => {
        await createFileUpload({ orderId: input.orderId, userId: 0, fileName: input.fileName, fileKey: input.fileKey, fileUrl: input.fileUrl, fileSize: input.fileSize, uploadType: "admin_final" });
        return { success: true };
      }),
    getOrderDetail: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        const items = await getOrderItemsByOrderId(input.id);
        const uploads = await getFileUploadsByOrderId(input.id);
        const notes = await getVoiceNotesByOrderId(input.id);
        return { ...order, totalAmount: Number(order.totalAmount), items: items.map((i) => ({ ...i, price: Number(i.price) })), uploads, voiceNotes: notes };
      }),
  }),
});

export type AppRouter = typeof appRouter;

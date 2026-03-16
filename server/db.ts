import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  cartItems,
  clientReviews,
  contacts,
  fileUploads,
  orderItems,
  orders,
  portfolioItems,
  services,
  testimonials,
  users,
  voiceNotes,
  type InsertCartItem,
  type InsertClientReview,
  type InsertContact,
  type InsertFileUpload,
  type InsertOrder,
  type InsertOrderItem,
  type InsertPortfolioItem,
  type InsertTestimonial,
  type InsertVoiceNote,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ stripeCustomerId }).where(eq(users.id, userId));
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).where(eq(services.isActive, true)).orderBy(services.sortOrder);
}

export async function getServiceBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return result[0];
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export async function getCartByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cartItems).where(eq(cartItems.userId, userId));
}

export async function addToCart(item: InsertCartItem) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, item.userId), eq(cartItems.serviceId, item.serviceId)))
    .limit(1);
  if (existing[0]) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + 1 }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values(item);
  }
}

export async function removeFromCart(cartItemId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(order: InsertOrder, items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(orders).values(order);
  const created = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, order.userId), eq(orders.totalAmount, order.totalAmount)))
    .orderBy(desc(orders.createdAt))
    .limit(1);
  const orderId = created[0]!.id;
  const itemsWithOrderId = items.map((i) => ({ ...i, orderId }));
  await db.insert(orderItems).values(itemsWithOrderId);
  return created[0]!;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result[0];
}

export async function getOrderItemsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(
  orderId: number,
  status: "pending_payment" | "paid" | "in_progress" | "revision" | "delivered" | "completed" | "cancelled",
  adminNotes?: string
) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  await db.update(orders).set(updateData).where(eq(orders.id, orderId));
}

export async function updateOrderStripeData(sessionId: string, stripePaymentIntentId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(orders)
    .set({ stripePaymentIntentId, status: "paid" })
    .where(eq(orders.stripeCheckoutSessionId, sessionId));
}

export async function getOrderByCheckoutSession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.stripeCheckoutSessionId, sessionId)).limit(1);
  return result[0];
}

// ─── File Uploads ─────────────────────────────────────────────────────────────

export async function createFileUpload(upload: InsertFileUpload) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(fileUploads).values(upload);
  const result = await db.select().from(fileUploads).where(eq(fileUploads.fileKey, upload.fileKey)).limit(1);
  return result[0]!;
}

export async function getFileUploadsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fileUploads).where(eq(fileUploads.orderId, orderId));
}

export async function updateFileAiAnalysis(fileId: number, aiAnalysis: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(fileUploads).set({ aiAnalysis }).where(eq(fileUploads.id, fileId));
}

// ─── Voice Notes ──────────────────────────────────────────────────────────────

export async function createVoiceNote(note: InsertVoiceNote) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(voiceNotes).values(note);
  const result = await db.select().from(voiceNotes).where(eq(voiceNotes.audioKey, note.audioKey)).limit(1);
  return result[0]!;
}

export async function getVoiceNotesByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(voiceNotes).where(eq(voiceNotes.orderId, orderId));
}

export async function updateVoiceNoteTranscription(noteId: number, transcription: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(voiceNotes).set({ transcription }).where(eq(voiceNotes.id, noteId));
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function getPublishedPortfolioItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioItems).where(eq(portfolioItems.isPublished, true)).orderBy(portfolioItems.sortOrder);
}

export async function getAllPortfolioItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(portfolioItems).orderBy(portfolioItems.sortOrder);
}

export async function createPortfolioItem(item: InsertPortfolioItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(portfolioItems).values(item);
}

export async function updatePortfolioItem(id: number, data: Partial<InsertPortfolioItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(portfolioItems).set(data).where(eq(portfolioItems.id, id));
}

export async function deletePortfolioItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export async function getPublishedTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testimonials).where(eq(testimonials.isPublished, true)).orderBy(testimonials.sortOrder);
}

export async function getAllTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testimonials).orderBy(testimonials.sortOrder);
}

export async function createTestimonial(item: InsertTestimonial) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(testimonials).values(item);
}

export async function updateTestimonial(id: number, data: Partial<InsertTestimonial>) {
  const db = await getDb();
  if (!db) return;
  await db.update(testimonials).set(data).where(eq(testimonials.id, id));
}

export async function deleteTestimonial(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(testimonials).where(eq(testimonials.id, id));
}


// ─── Contacts ────────────────────────────────────────────────────────────────

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contacts).values(data);
  return result;
}

export async function getAllContacts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).orderBy(contacts.createdAt);
}

export async function updateContactStatus(id: number, status: "new" | "read" | "replied") {
  const db = await getDb();
  if (!db) return;
  await db.update(contacts).set({ status }).where(eq(contacts.id, id));
}

// ─── Client Reviews ──────────────────────────────────────────────────────────

export async function createClientReview(data: InsertClientReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientReviews).values(data);
  return result;
}

export async function getClientReviewsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientReviews).where(eq(clientReviews.orderId, orderId));
}

export async function getPublishedClientReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientReviews).where(eq(clientReviews.isPublished, true)).orderBy(clientReviews.createdAt);
}

export async function updateClientReview(id: number, data: Partial<InsertClientReview>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientReviews).set(data).where(eq(clientReviews.id, id));
}

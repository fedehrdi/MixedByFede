import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { updateOrderStripeData, getOrderByCheckoutSession } from "./db";
import { notifyOwner } from "./_core/notification";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-02-25.clover" });

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Stripe Webhook] Signature verification failed:", message);
        res.status(400).send(`Webhook Error: ${message}`);
        return;
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        res.json({ verified: true });
        return;
      }

      console.log(`[Stripe Webhook] Event: ${event.type}`);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        const paymentIntentId = session.payment_intent as string;

        if (orderId && session.id) {
          await updateOrderStripeData(session.id, paymentIntentId);
          const order = await getOrderByCheckoutSession(session.id);
          if (order) {
            await notifyOwner({
              title: `Pagamento ricevuto — Ordine #${order.id}`,
              content: `€${Number(order.totalAmount).toFixed(2)} da ${session.customer_email ?? "cliente"}`,
            });
          }
        }
      }

      res.json({ received: true });
    }
  );
}

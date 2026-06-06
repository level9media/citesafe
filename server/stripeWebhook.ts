import type { Express, Request, Response } from "express";
import express from "express";
import { ENV } from "./_core/env";
import { getStripe } from "./stripe";
import {
  getUserByStripeCustomerId,
  updateUserStripeCustomerId,
  upsertSubscription,
  deleteSubscriptionByUserId,
  getDb,
} from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export function registerStripeWebhook(app: Express) {
  // MUST use raw body BEFORE express.json() — registered in index.ts before global json parser
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;

      let event: Stripe.Event;
      try {
        event = getStripe().webhooks.constructEvent(
          req.body,
          sig,
          ENV.stripeWebhookSecret
        );
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      }

      // Test events — return immediately
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ${event.id}`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.mode !== "subscription") break;

            const userId = parseInt(session.metadata?.user_id ?? "0", 10);
            if (!userId) break;

            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;
            const plan = (session.metadata?.plan ?? "pro") as "pro" | "team";

            // Save customer ID to user
            await updateUserStripeCustomerId(userId, customerId);

            // Fetch full subscription for price + period info
            const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId) as unknown as {
              items: { data: Array<{ price: { id: string } }> };
              status: string;
              current_period_end?: number;
              cancel_at_period_end: boolean;
            };
            const priceId = stripeSub.items.data[0]?.price.id ?? "";
            const periodEnd = stripeSub.current_period_end
              ? new Date(stripeSub.current_period_end * 1000)
              : null;

            await upsertSubscription({
              userId,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              plan,
              status: stripeSub.status,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            });

            console.log(`[Stripe Webhook] Subscription activated for user ${userId} (${plan})`);
            break;
          }

          case "customer.subscription.updated": {
            const stripeSub = event.data.object as unknown as {
              id: string;
              customer: string;
              items: { data: Array<{ price: { id: string } }> };
              status: string;
              current_period_end?: number;
              cancel_at_period_end: boolean;
            };
            const customerId = stripeSub.customer as string;

            const user = await getUserByStripeCustomerId(customerId);
            if (!user) break;

            const priceId = stripeSub.items.data[0]?.price.id ?? "";
            const periodEnd = stripeSub.current_period_end
              ? new Date(stripeSub.current_period_end * 1000)
              : null;

            // Determine plan from product metadata
            const price = await getStripe().prices.retrieve(priceId, {
              expand: ["product"],
            });
            const product = price.product as Stripe.Product;
            const plan = (product.metadata?.citesafe_plan ?? "pro") as "pro" | "team";

            await upsertSubscription({
              userId: user.id,
              stripeSubscriptionId: stripeSub.id,
              stripePriceId: priceId,
              plan,
              status: stripeSub.status,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
            });

            console.log(`[Stripe Webhook] Subscription updated for user ${user.id}: ${stripeSub.status}`);
            break;
          }

          case "customer.subscription.deleted": {
            const stripeSub = event.data.object as Stripe.Subscription;
            const customerId = stripeSub.customer as string;

            const user = await getUserByStripeCustomerId(customerId);
            if (!user) break;

            await deleteSubscriptionByUserId(user.id);
            console.log(`[Stripe Webhook] Subscription cancelled for user ${user.id}`);
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as unknown as {
              customer: string;
              subscription?: string | { id: string } | null;
            };
            const customerId = invoice.customer as string;

            const user = await getUserByStripeCustomerId(customerId);
            if (!user) break;

            const subId = typeof invoice.subscription === "string"
              ? invoice.subscription
              : (invoice.subscription as { id: string } | null)?.id;

            if (subId) {
              const db = await getDb();
              if (db) {
                // Mark subscription as past_due
                const { subscriptions } = await import("../drizzle/schema");
                await db.update(subscriptions)
                  .set({ status: "past_due" })
                  .where(eq(subscriptions.userId, user.id));
              }
            }

            console.log(`[Stripe Webhook] Payment failed for user ${user.id}`);
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Handler error:", err);
        return res.status(500).json({ error: "Webhook handler failed" });
      }

      res.json({ received: true });
    }
  );
}

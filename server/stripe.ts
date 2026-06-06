import Stripe from "stripe";
import { ENV } from "./_core/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _stripe;
}

// ── Product / Price catalogue ─────────────────────────────────────────────────
// These are created on-demand in Stripe if they don't exist yet.
// We look them up by metadata key so they survive key rotations.

export const PLANS = {
  pro: {
    name: "CiteSafe Pro",
    description: "Unlimited OSHA analyses, PDF reports, violation history export",
    amount: 4900, // $49.00 in cents
    interval: "month" as const,
    metaKey: "citesafe_plan_pro",
    limit: null, // unlimited
  },
  team: {
    name: "CiteSafe Team",
    description: "Everything in Pro + multi-user org accounts (up to 10 seats)",
    amount: 14900, // $149.00 in cents
    interval: "month" as const,
    metaKey: "citesafe_plan_team",
    limit: null,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * Ensures a Stripe Product + Price exists for the given plan key.
 * Returns the Price ID to use in checkout sessions.
 * Uses metadata to avoid creating duplicates on every deploy.
 */
export async function getOrCreatePriceId(planKey: PlanKey): Promise<string> {
  const stripe = getStripe();
  const plan = PLANS[planKey];

  // Search for existing price by metadata
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
    limit: 100,
  });

  const existing = prices.data.find(p => {
    const prod = p.product as Stripe.Product;
    return prod.metadata?.citesafe_plan === planKey && p.recurring?.interval === "month";
  });

  if (existing) return existing.id;

  // Create product + price
  const product = await stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { citesafe_plan: planKey },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: plan.amount,
    currency: "usd",
    recurring: { interval: plan.interval },
    metadata: { citesafe_plan: planKey },
  });

  return price.id;
}

/**
 * Creates or retrieves a Stripe Customer for a user.
 */
export async function getOrCreateCustomer(
  stripeCustomerId: string | null | undefined,
  email: string | null | undefined,
  name: string | null | undefined
): Promise<string> {
  const stripe = getStripe();

  if (stripeCustomerId) {
    return stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: name ?? undefined,
  });

  return customer.id;
}

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeClaudeVision } from "./claude";
import { getOrCreateCustomer, getOrCreatePriceId, getStripe, PLANS, type PlanKey } from "./stripe";
import {
  createInspection,
  getInspectionsByUser,
  deleteInspection,
  getInspectionCountThisMonth,
  getInspectionCountToday,
  getSubscriptionByUserId,
  upsertSubscription,
  deleteSubscriptionByUserId,
  getUserByStripeCustomerId,
  updateUserStripeCustomerId,
} from "./db";
import { z } from "zod";
import type { InspectionResult } from "@shared/types";

// ── Limits ────────────────────────────────────────────────────────────────────
const FREE_TIER_MONTHLY_LIMIT = 5;
const PRO_DAILY_LIMIT = 50;

// ── OSHA system prompt ────────────────────────────────────────────────────────
const OSHA_SYSTEM_PROMPT = `You are CiteSafe AI, an expert OSHA compliance inspector with deep mastery of 29 CFR 1926 (Construction) and 29 CFR 1910 (General Industry). Analyze job site photos and descriptions for OSHA violations.

PENALTY REFERENCE (2024): Serious: up to $16,131 per violation. Willful/Repeat: up to $161,323 per violation.

RULES:
1. If the description is too vague to determine a specific violation, set status "unclear" and ask ONE specific clarifying question.
2. Otherwise classify as "violation" or "clear".
3. Cite the most specific CFR section possible.
4. Be direct and professional — this is a compliance tool used by safety officers.

RESPOND ONLY WITH VALID JSON, no preamble, no markdown fences:
{
  "status": "violation" | "clear" | "unclear",
  "headline": "max 8 words describing the finding",
  "analysis": "2-3 sentences of professional analysis",
  "clarifyingQuestion": "only if status is unclear",
  "citations": [{"code": "29 CFR X.XXX(x)", "title": "standard name", "relevance": "one sentence"}],
  "correctiveAction": "concrete corrective steps if violation, omit if clear/unclear",
  "severity": "willful" | "serious" | "repeat" | "other-than-serious" | "none",
  "maxPenalty": "$X,XXX per violation or N/A",
  "confidence": 0-100
}`;

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Inspect ────────────────────────────────────────────────────────────────
  inspect: router({
    analyze: protectedProcedure
      .input(
        z.object({
          text: z.string().optional(),
          imageBase64: z.string().optional(),
          imageMimeType: z
            .enum(["image/jpeg", "image/png", "image/gif", "image/webp"])
            .optional()
            .default("image/jpeg"),
          conversationHistory: z
            .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;

        // Check subscription tier
        const sub = await getSubscriptionByUserId(userId);
        const isPro = sub && (sub.status === "active" || sub.status === "trialing");

        if (isPro) {
          // Pro/Team: enforce 50/day cap
          const usedToday = await getInspectionCountToday(userId);
          if (usedToday >= PRO_DAILY_LIMIT) {
            throw new Error(
              `Daily limit reached. You've used ${usedToday}/${PRO_DAILY_LIMIT} analyses today. Resets at midnight.`
            );
          }
        } else {
          // Free tier: enforce 5/month cap
          const usedThisMonth = await getInspectionCountThisMonth(userId);
          if (usedThisMonth >= FREE_TIER_MONTHLY_LIMIT) {
            throw new Error(
              `Monthly limit reached. You've used ${usedThisMonth}/${FREE_TIER_MONTHLY_LIMIT} free analyses this month. Upgrade to Pro for unlimited access.`
            );
          }
        }

        // Build Claude messages
        type ClaudeContent =
          | { type: "text"; text: string }
          | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } };

        type ClaudeMsg = { role: "user" | "assistant"; content: string | ClaudeContent[] };

        const messages: ClaudeMsg[] = [];

        // Add conversation history
        for (const msg of input.conversationHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }

        // Build current user message
        if (input.imageBase64) {
          const contentParts: ClaudeContent[] = [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: input.imageMimeType,
                data: input.imageBase64,
              },
            },
          ];
          contentParts.push({
            type: "text",
            text: input.text || "Analyze this job site image for OSHA violations.",
          });
          messages.push({ role: "user", content: contentParts });
        } else {
          messages.push({
            role: "user",
            content: input.text || "Analyze for OSHA violations.",
          });
        }

        // Call Claude Vision
        const rawText = await invokeClaudeVision({
          systemPrompt: OSHA_SYSTEM_PROMPT,
          messages,
          maxTokens: 1200,
        });

        const clean = rawText.replace(/```json|```/g, "").trim();
        let result: InspectionResult;
        try {
          result = JSON.parse(clean);
        } catch {
          throw new Error("AI returned an unexpected response format. Please try again.");
        }

        // Persist to DB
        const firstCitation = result.citations?.[0]?.code ?? "";
        await createInspection({
          userId,
          status: result.status,
          headline: result.headline,
          citation: firstCitation,
          analysis: result.analysis,
          severity: result.severity,
          maxPenalty: result.maxPenalty,
          confidence: result.confidence,
          fullResult: JSON.stringify(result),
        });

        // Return result + updated usage
        if (isPro) {
          const usedToday = await getInspectionCountToday(userId);
          return { result, usage: { used: usedToday, limit: PRO_DAILY_LIMIT, period: "day" as const } };
        } else {
          const usedThisMonth = await getInspectionCountThisMonth(userId);
          return { result, usage: { used: usedThisMonth, limit: FREE_TIER_MONTHLY_LIMIT, period: "month" as const } };
        }
      }),

    usageThisMonth: protectedProcedure.query(async ({ ctx }) => {
      const sub = await getSubscriptionByUserId(ctx.user.id);
      const isPro = sub && (sub.status === "active" || sub.status === "trialing");
      if (isPro) {
        const used = await getInspectionCountToday(ctx.user.id);
        return { used, limit: PRO_DAILY_LIMIT, period: "day" as const, plan: sub.plan };
      }
      const used = await getInspectionCountThisMonth(ctx.user.id);
      return { used, limit: FREE_TIER_MONTHLY_LIMIT, period: "month" as const, plan: "free" as const };
    }),
  }),

  // ── History ────────────────────────────────────────────────────────────────
  history: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getInspectionsByUser(ctx.user.id, 100);
    }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return deleteInspection(input.id, ctx.user.id);
      }),
  }),

  // ── Billing / Stripe ───────────────────────────────────────────────────────
  billing: router({
    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      return getSubscriptionByUserId(ctx.user.id);
    }),

    createCheckoutSession: protectedProcedure
      .input(z.object({ plan: z.enum(["pro", "team"]), origin: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const stripe = getStripe();
        const user = ctx.user;

        // Get or create Stripe customer
        const customerId = await getOrCreateCustomer(
          user.stripeCustomerId,
          user.email,
          user.name
        );

        // Save customer ID if new
        if (!user.stripeCustomerId) {
          await updateUserStripeCustomerId(user.id, customerId);
        }

        // Get price ID for plan
        const priceId = await getOrCreatePriceId(input.plan as PlanKey);

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          allow_promotion_codes: true,
          success_url: `${input.origin}/account?upgrade=success`,
          cancel_url: `${input.origin}/account?upgrade=cancelled`,
          client_reference_id: user.id.toString(),
          metadata: {
            user_id: user.id.toString(),
            customer_email: user.email ?? "",
            customer_name: user.name ?? "",
            plan: input.plan,
          },
        });

        return { url: session.url };
      }),

    createPortalSession: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const stripe = getStripe();
        const user = ctx.user;

        if (!user.stripeCustomerId) {
          throw new Error("No billing account found. Please subscribe first.");
        }

        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${input.origin}/account`,
        });

        return { url: session.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;

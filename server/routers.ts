import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  createInspection,
  getInspectionsByUser,
  deleteInspection,
  getInspectionCountThisMonth,
} from "./db";
import { z } from "zod";
import type { InspectionResult } from "@shared/types";

const FREE_TIER_LIMIT = 5;

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

  inspect: router({
    analyze: protectedProcedure
      .input(
        z.object({
          text: z.string().optional(),
          imageBase64: z.string().optional(),
          imageMimeType: z.string().optional().default("image/jpeg"),
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;

        // Check monthly usage limit
        const usedThisMonth = await getInspectionCountThisMonth(userId);
        if (usedThisMonth >= FREE_TIER_LIMIT) {
          throw new Error(
            `Monthly limit reached. You've used ${usedThisMonth}/${FREE_TIER_LIMIT} free analyses this month. Upgrade to Pro for unlimited access.`
          );
        }

        // Build messages
        const messages: Array<{
          role: "system" | "user" | "assistant";
          content:
            | string
            | Array<{
                type: string;
                text?: string;
                image_url?: { url: string };
              }>;
        }> = [{ role: "system", content: OSHA_SYSTEM_PROMPT }];

        // Add conversation history
        for (const msg of input.conversationHistory) {
          messages.push({ role: msg.role, content: msg.content });
        }

        // Build current user message
        if (input.imageBase64) {
          const contentParts: Array<{
            type: string;
            text?: string;
            image_url?: { url: string };
          }> = [
            {
              type: "image_url",
              image_url: {
                url: `data:${input.imageMimeType};base64,${input.imageBase64}`,
              },
            },
          ];
          if (input.text) {
            contentParts.push({ type: "text", text: input.text });
          } else {
            contentParts.push({
              type: "text",
              text: "Analyze this job site image for OSHA violations.",
            });
          }
          messages.push({ role: "user", content: contentParts });
        } else {
          messages.push({
            role: "user",
            content: input.text || "Analyze for OSHA violations.",
          });
        }

        // Call LLM
        const llmResult = await invokeLLM({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          messages: messages as any,
          maxTokens: 1200,
        });

        const rawText =
          llmResult.choices[0]?.message?.content;
        const textContent =
          typeof rawText === "string"
            ? rawText
            : Array.isArray(rawText)
            ? rawText
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map(p => p.text)
                .join("")
            : "";

        const clean = textContent.replace(/```json|```/g, "").trim();
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

        const newUsed = usedThisMonth + 1;
        return {
          result,
          usage: { used: newUsed, limit: FREE_TIER_LIMIT },
        };
      }),

    usageThisMonth: protectedProcedure.query(async ({ ctx }) => {
      const used = await getInspectionCountThisMonth(ctx.user.id);
      return { used, limit: FREE_TIER_LIMIT };
    }),
  }),

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
});

export type AppRouter = typeof appRouter;

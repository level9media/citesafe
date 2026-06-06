import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getInspectionsByUser: vi.fn().mockResolvedValue([
    {
      id: 1, userId: 1, status: "violation",
      headline: "No guardrails on scaffold",
      citation: "29 CFR 1926.502(d)(16)",
      analysis: "Worker on scaffold without guardrails.",
      severity: "serious", maxPenalty: "$16,131", confidence: 95,
      fullResult: "{}", createdAt: new Date("2026-06-04"),
    },
  ]),
  createInspection: vi.fn().mockResolvedValue({ id: 2 }),
  deleteInspection: vi.fn().mockResolvedValue({ success: true }),
  getInspectionCountThisMonth: vi.fn().mockResolvedValue(2),
  getInspectionCountToday: vi.fn().mockResolvedValue(5),
  getSubscriptionByUserId: vi.fn().mockResolvedValue(null), // free tier default
  upsertSubscription: vi.fn().mockResolvedValue(undefined),
  deleteSubscriptionByUserId: vi.fn().mockResolvedValue(undefined),
  getUserByStripeCustomerId: vi.fn().mockResolvedValue(null),
  updateUserStripeCustomerId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./claude", () => ({
  invokeClaudeVision: vi.fn().mockResolvedValue(
    JSON.stringify({
      status: "violation",
      headline: "Missing fall protection on scaffold",
      analysis: "Worker observed on scaffold without guardrails or PFAS.",
      citations: [{ code: "29 CFR 1926.502(b)", title: "Guardrail systems", relevance: "Required for scaffolds above 10 ft." }],
      correctiveAction: "Install guardrails or provide PFAS immediately.",
      severity: "serious",
      maxPenalty: "$16,131 per violation",
      confidence: 92,
    })
  ),
}));

vi.mock("./stripe", () => ({
  getStripe: vi.fn().mockReturnValue({
    checkout: { sessions: { create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }) } },
    billingPortal: { sessions: { create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/test" }) } },
  }),
  getOrCreateCustomer: vi.fn().mockResolvedValue("cus_test123"),
  getOrCreatePriceId: vi.fn().mockResolvedValue("price_test123"),
  PLANS: {
    pro: { name: "CiteSafe Pro", amount: 4900, interval: "month", limit: null },
    team: { name: "CiteSafe Team", amount: 14900, interval: "month", limit: null },
  },
}));

// ── Context helper ─────────────────────────────────────────────────────────────
function makeCtx(): TrpcContext {
  return {
    user: {
      id: 1, openId: "test-user", email: "test@citesafe.com",
      name: "Test User", loginMethod: "manus", role: "user",
      stripeCustomerId: null, createdAt: new Date(),
      updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: { origin: "https://citesafe.test" } } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("inspect.analyze", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a violation result via Claude Vision for text input", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.inspect.analyze({ text: "Worker on scaffold 15 ft high, no guardrails." });
    expect(result.result.status).toBe("violation");
    expect(result.result.citations.length).toBeGreaterThan(0);
    expect(result.result.citations[0].code).toContain("CFR");
    expect(result.usage.limit).toBe(5);
    expect(result.usage.period).toBe("month");
  });

  it("rejects when free tier monthly limit is reached", async () => {
    const { getInspectionCountThisMonth } = await import("./db");
    vi.mocked(getInspectionCountThisMonth).mockResolvedValueOnce(5);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.inspect.analyze({ text: "Another inspection." })).rejects.toThrow(/Monthly limit reached/);
  });

  it("enforces 50/day cap for Pro subscribers", async () => {
    const { getSubscriptionByUserId, getInspectionCountToday } = await import("./db");
    vi.mocked(getSubscriptionByUserId).mockResolvedValueOnce({
      id: 1, userId: 1, stripeSubscriptionId: "sub_test", stripePriceId: "price_test",
      plan: "pro", status: "active", currentPeriodEnd: null, cancelAtPeriodEnd: 0,
      createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(getInspectionCountToday).mockResolvedValueOnce(50);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.inspect.analyze({ text: "Over daily limit." })).rejects.toThrow(/Daily limit reached/);
  });
});

describe("inspect.usageThisMonth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns free tier monthly usage", async () => {
    const { getInspectionCountThisMonth } = await import("./db");
    vi.mocked(getInspectionCountThisMonth).mockResolvedValueOnce(2);
    const caller = appRouter.createCaller(makeCtx());
    const usage = await caller.inspect.usageThisMonth();
    expect(usage.used).toBe(2);
    expect(usage.limit).toBe(5);
    expect(usage.plan).toBe("free");
  });

  it("returns Pro daily usage for active subscribers", async () => {
    const { getSubscriptionByUserId, getInspectionCountToday } = await import("./db");
    vi.mocked(getSubscriptionByUserId).mockResolvedValueOnce({
      id: 1, userId: 1, stripeSubscriptionId: "sub_test", stripePriceId: "price_test",
      plan: "pro", status: "active", currentPeriodEnd: null, cancelAtPeriodEnd: 0,
      createdAt: new Date(), updatedAt: new Date(),
    });
    vi.mocked(getInspectionCountToday).mockResolvedValueOnce(12);
    const caller = appRouter.createCaller(makeCtx());
    const usage = await caller.inspect.usageThisMonth();
    expect(usage.used).toBe(12);
    expect(usage.limit).toBe(50);
    expect(usage.plan).toBe("pro");
  });
});

describe("history.list", () => {
  it("returns the user's inspection history", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const list = await caller.history.list();
    expect(Array.isArray(list)).toBe(true);
    expect(list[0].status).toBe("violation");
  });
});

describe("history.delete", () => {
  it("deletes an inspection by id", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.history.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

describe("billing.getSubscription", () => {
  it("returns null for free tier users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const sub = await caller.billing.getSubscription();
    expect(sub).toBeNull();
  });
});

describe("billing.createCheckoutSession", () => {
  it("returns a Stripe checkout URL for Pro plan", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.billing.createCheckoutSession({
      plan: "pro",
      origin: "https://citesafe.test",
    });
    expect(result.url).toContain("stripe.com");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

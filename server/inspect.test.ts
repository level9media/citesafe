import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the DB and LLM to avoid real network/DB calls in unit tests
vi.mock("./db", () => ({
  createInspection: vi.fn().mockResolvedValue({ id: 1 }),
  getInspectionsByUser: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      status: "violation",
      headline: "No guardrails on scaffold",
      citation: "29 CFR 1926.502(d)(16)",
      analysis: "Worker on scaffold without guardrails.",
      severity: "serious",
      maxPenalty: "$16,131",
      confidence: 95,
      fullResult: "{}",
      createdAt: new Date("2026-06-04"),
    },
  ]),
  deleteInspection: vi.fn().mockResolvedValue({ success: true }),
  getInspectionCountThisMonth: vi.fn().mockResolvedValue(2),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "mock-id",
    created: Date.now(),
    model: "mock-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            status: "violation",
            headline: "No guardrails on scaffold",
            analysis: "Worker on scaffold without guardrails.",
            citations: [
              {
                code: "29 CFR 1926.502(d)(16)",
                title: "Fall Protection",
                relevance: "Guardrails required above 6 feet.",
              },
            ],
            correctiveAction: "Install guardrails immediately.",
            severity: "serious",
            maxPenalty: "$16,131",
            confidence: 95,
          }),
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-openid",
    email: "test@citesafe.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("inspect.analyze", () => {
  it("returns a violation result with citations and usage", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspect.analyze({
      text: "Worker on scaffold 15 ft high, no guardrails.",
    });

    expect(result.result.status).toBe("violation");
    expect(result.result.headline).toBeTruthy();
    expect(result.result.citations).toHaveLength(1);
    expect(result.result.citations[0].code).toContain("CFR");
    expect(result.usage.used).toBe(3); // was 2, now +1
    expect(result.usage.limit).toBe(5);
  });

  it("rejects when monthly limit is reached", async () => {
    const { getInspectionCountThisMonth } = await import("./db");
    vi.mocked(getInspectionCountThisMonth).mockResolvedValueOnce(5);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.inspect.analyze({ text: "Some scenario" })
    ).rejects.toThrow(/Monthly limit reached/);
  });
});

describe("inspect.usageThisMonth", () => {
  it("returns current usage count and limit", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inspect.usageThisMonth();
    expect(result.used).toBe(2);
    expect(result.limit).toBe(5);
  });
});

describe("history.list", () => {
  it("returns the user's inspection history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].status).toBe("violation");
    expect(result[0].headline).toBeTruthy();
  });
});

describe("history.delete", () => {
  it("deletes an inspection by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.history.delete({ id: 1 });
    expect(result).toEqual({ success: true });
  });
});

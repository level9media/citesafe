import { useState } from "react";
import { useLocation } from "wouter";
import { Check, Zap, Shield, Users, Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

type BillingInterval = "month" | "year";
type PlanKey = "basic" | "pro" | "team";

const PLANS = [
  {
    key: "basic" as PlanKey,
    name: "Basic",
    icon: Shield,
    tagline: "For individual inspectors getting started",
    monthly: 19,
    annual: 12.67,
    annualTotal: 152,
    color: "border-zinc-700",
    badgeColor: "bg-zinc-700 text-zinc-200",
    ctaColor: "bg-zinc-700 hover:bg-zinc-600 text-white",
    features: [
      "25 AI inspections per month",
      "Photo + text analysis",
      "CFR / OSHA citation lookup",
      "Violation history (30 days)",
      "Email support",
    ],
    notIncluded: [
      "PDF reports",
      "Job site profiles",
      "Corrective action checklists",
      "Team dashboard",
    ],
  },
  {
    key: "pro" as PlanKey,
    name: "Pro",
    icon: Zap,
    tagline: "For safety officers and field inspectors",
    monthly: 49,
    annual: 32.67,
    annualTotal: 392,
    popular: true,
    color: "border-[#F2C230]",
    badgeColor: "bg-[#F2C230] text-[#1F2224]",
    ctaColor: "bg-[#F2C230] hover:bg-yellow-400 text-[#1F2224]",
    features: [
      "50 AI inspections per day",
      "Photo + text analysis",
      "CFR / OSHA citation lookup",
      "Full violation history",
      "PDF citation reports",
      "Job site profiles + risk scores",
      "Corrective action checklists",
      "Priority email support",
    ],
    notIncluded: [
      "Team dashboard",
      "OSHA 300 log",
      "Multi-user seats",
    ],
  },
  {
    key: "team" as PlanKey,
    name: "Team",
    icon: Users,
    tagline: "For safety managers and GC firms",
    monthly: 149,
    annual: 99.33,
    annualTotal: 1192,
    color: "border-zinc-600",
    badgeColor: "bg-zinc-600 text-zinc-100",
    ctaColor: "bg-zinc-700 hover:bg-zinc-600 text-white",
    features: [
      "200 AI inspections per day",
      "Everything in Pro",
      "Up to 10 team member seats",
      "Team compliance dashboard",
      "OSHA 300 log integration",
      "Site-wide compliance scoring",
      "Compliance trend reports",
      "Dedicated support",
    ],
    notIncluded: [],
  },
];

export default function Pricing() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const createCheckout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecting to checkout...");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  const handleCTA = (planKey: PlanKey) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    createCheckout.mutate({
      plan: planKey,
      interval,
      origin: window.location.origin,
    });
  };

  const annualSavings = 33;

  return (
    <div className="min-h-screen bg-[#1F2224] text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white font-bold text-lg"
        >
          <span className="text-2xl">⚙</span>
          <span>Cite<span className="text-[#F2C230]">Safe</span></span>
        </button>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/inspect")}
              className="bg-[#F2C230] text-[#1F2224] font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors"
            >
              Go to App
            </button>
          ) : (
            <>
              <a
              href={getLoginUrl()}
              className="text-zinc-400 hover:text-white text-sm transition-colors"
              >
                Sign In
              </a>
              <a
              href={getLoginUrl()}
              className="bg-[#F2C230] text-[#1F2224] font-bold px-4 py-2 rounded-lg text-sm hover:bg-yellow-400 transition-colors"
              >
                Start Free
              </a>
            </>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="text-center px-6 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-1.5 text-sm text-zinc-300 mb-6">
          <Star className="w-3.5 h-3.5 text-[#F2C230]" />
          Start free — 3 inspections included, no credit card required
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          Pay for what you need. Upgrade or cancel anytime.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-xl p-1 mt-8">
          <button
            onClick={() => setInterval("month")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              interval === "month"
                ? "bg-[#F2C230] text-[#1F2224]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              interval === "year"
                ? "bg-[#F2C230] text-[#1F2224]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Annual
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                interval === "year"
                  ? "bg-[#1F2224] text-[#F2C230]"
                  : "bg-[#F2C230] text-[#1F2224]"
              }`}
            >
              Save {annualSavings}%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const price = interval === "year" ? plan.annual : plan.monthly;
          const isLoading = createCheckout.isPending;

          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 ${plan.color} bg-zinc-900 p-7 flex flex-col ${
                plan.popular ? "ring-2 ring-[#F2C230] ring-offset-2 ring-offset-[#1F2224]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#F2C230] text-[#1F2224] text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${plan.badgeColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-lg">{plan.name}</span>
                </div>
                <p className="text-zinc-400 text-sm">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black">${Math.floor(price)}</span>
                  <span className="text-zinc-400 text-sm mb-2">
                    {price % 1 !== 0 ? `.${String(Math.round((price % 1) * 100)).padStart(2, "0")}` : ""}
                    /mo
                  </span>
                </div>
                {interval === "year" && (
                  <p className="text-zinc-500 text-xs mt-1">
                    Billed annually (${plan.annualTotal}/yr)
                  </p>
                )}
                {interval === "month" && (
                  <p className="text-zinc-500 text-xs mt-1">
                    Or ${plan.annual.toFixed(2)}/mo billed annually
                  </p>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleCTA(plan.key)}
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97] mb-6 ${plan.ctaColor} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? "Loading..." : isAuthenticated ? `Upgrade to ${plan.name}` : `Get Started — ${plan.name}`}
              </button>

              {/* Features */}
              <div className="flex-1 space-y-3">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-[#F2C230] mt-0.5 shrink-0" />
                    <span className="text-zinc-200">{f}</span>
                  </div>
                ))}
                {plan.notIncluded.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm opacity-40">
                    <span className="w-4 h-4 mt-0.5 shrink-0 text-center text-xs">✕</span>
                    <span className="text-zinc-400 line-through">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Free tier callout */}
      <div className="max-w-2xl mx-auto px-6 pb-16 text-center">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8">
          <h3 className="font-bold text-xl mb-2">Not ready to commit?</h3>
          <p className="text-zinc-400 mb-5">
            Every account starts with <strong className="text-white">3 free inspections</strong> — no credit card required. See exactly what CiteSafe can do before you pay a cent.
          </p>
          <a
            href={isAuthenticated ? "/inspect" : getLoginUrl()}
            className="inline-block bg-zinc-700 hover:bg-zinc-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Try Free — No Card Needed
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-black text-center mb-10">Common Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel from your Account page at any time. You keep access until the end of your billing period.",
            },
            {
              q: "What counts as an inspection?",
              a: "Each time you submit a photo or description for AI analysis counts as one inspection.",
            },
            {
              q: "Is there a free trial?",
              a: "Every new account gets 3 free inspections — no credit card required. Upgrade when you're ready.",
            },
            {
              q: "What OSHA standards does CiteSafe cover?",
              a: "CiteSafe's AI is trained on 29 CFR 1910 (General Industry) and 29 CFR 1926 (Construction), covering the most common job site violation categories.",
            },
            {
              q: "Can I switch plans?",
              a: "Yes. Upgrade or downgrade at any time from your Account page. Prorated credits apply automatically.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h4 className="font-bold mb-2">{q}</h4>
              <p className="text-zinc-400 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-6 py-6 text-center text-zinc-500 text-xs">
        <p>
          © {new Date().getFullYear()} CiteSafe. All rights reserved. &nbsp;·&nbsp;
          <a href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
          &nbsp;·&nbsp;
          <a href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          &nbsp;·&nbsp;
          <a href="/support" className="hover:text-zinc-300 transition-colors">Support</a>
        </p>
        <p className="mt-2">
          Site built and managed by{" "}
          <a href="https://levelninemedia.com" className="hover:text-zinc-300 transition-colors">
            Level Nine Media
          </a>
        </p>
      </div>
    </div>
  );
}

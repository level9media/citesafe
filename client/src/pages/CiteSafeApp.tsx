import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useAuth } from "@/_core/hooks/useAuth";
import { useNativeLogin } from "@/hooks/useNativeLogin";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Camera,
  Search,
  ClipboardList,
  User,
  LogOut,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Upload,
  X,
  FileText,
  RotateCcw,
  Loader2,
  Shield,
  TrendingUp,
  Calendar,
  MapPin,
  Zap,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import type { InspectionResult } from "@shared/types";
import type { Inspection } from "../../../drizzle/schema";

type Tab = "inspect" | "history" | "account";
type InspectView = "form" | "loading" | "result";

const SAMPLE_PROMPTS = [
  "Worker on scaffold 15 ft high, no guardrails and no personal fall arrest system visible.",
  "Electrical panel open with exposed wiring next to standing water on the floor.",
  "Workers grinding metal without face shields or eye protection. No PPE visible.",
  "Trench about 5 feet deep with no shoring, no ladder, and no spoil pile setback.",
];

// ── Severity dot ─────────────────────────────────────────────────────────────
function SeverityDot({ status }: { status: string }) {
  if (status === "violation") return <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-0.5" />;
  if (status === "clear") return <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0 mt-0.5" />;
  return <span className="w-2.5 h-2.5 rounded-full bg-[#F2C230] flex-shrink-0 mt-0.5" />;
}

// ── Compliance verdict banner ─────────────────────────────────────────────────
function ComplianceVerdict({ status }: { status: string }) {
  if (status === "violation") {
    return (
      <div className="flex items-center gap-3 bg-red-600/20 border border-red-500/40 rounded-xl px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-red-400 uppercase tracking-wide">NOT COMPLIANT</p>
          <p className="text-xs text-red-300/80">OSHA Violation Found</p>
        </div>
      </div>
    );
  }
  if (status === "clear") {
    return (
      <div className="flex items-center gap-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-400 uppercase tracking-wide">COMPLIANT</p>
          <p className="text-xs text-emerald-300/80">No Violations Detected</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-[#F2C230]/10 border border-[#F2C230]/30 rounded-xl px-4 py-3">
      <div className="w-8 h-8 rounded-lg bg-[#F2C230]/10 flex items-center justify-center flex-shrink-0">
        <HelpCircle className="w-4 h-4 text-[#F2C230]" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#F2C230] uppercase tracking-wide">NEEDS CLARIFICATION</p>
        <p className="text-xs text-[#F2C230]/70">More Information Required</p>
      </div>
    </div>
  );
}

// ── Inspect Tab ───────────────────────────────────────────────────────────────
function InspectTab() {
  const [view, setView] = useState<InspectView>("form");
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<"image/jpeg" | "image/png" | "image/gif" | "image/webp">("image/jpeg");
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [clarifyText, setClarifyText] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = trpc.inspect.analyze.useMutation({
    onSuccess: data => {
      setResult(data.result);
      setUsage(data.usage);
      setView("result");
    },
    onError: err => {
      toast.error(err.message || "Analysis failed. Please try again.");
      setView("form");
    },
  });

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
      const mime = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      setImageMime(mime);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = () => {
    setImageBase64(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const canAnalyze = (text.trim().length > 3 || !!imageBase64) && !analyzeMutation.isPending;

  const doAnalyze = (inputText?: string, history?: Array<{ role: "user" | "assistant"; content: string }>) => {
    const t = inputText ?? text;
    const h = history ?? conversationHistory;
    setView("loading");
    analyzeMutation.mutate({
      text: t || undefined,
      imageBase64: imageBase64 || undefined,
      imageMimeType: imageMime,
      conversationHistory: h,
    });
  };

  const submitClarification = () => {
    if (!clarifyText.trim()) return;
    const newHistory: typeof conversationHistory = [
      ...conversationHistory,
      { role: "user" as const, content: text },
      { role: "assistant" as const, content: result?.analysis ?? "" },
    ];
    setConversationHistory(newHistory);
    setText(clarifyText);
    setClarifyText("");
    setImageBase64(null);
    setImagePreview(null);
    doAnalyze(clarifyText, newHistory);
  };

  const resetInspect = () => {
    setView("form");
    setText("");
    setImageBase64(null);
    setImagePreview(null);
    setResult(null);
    setConversationHistory([]);
    setClarifyText("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Loading ──
  if (view === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="relative w-20 h-20 rounded-2xl border-2 border-[#F2C230]/30 bg-[#2F3133] flex items-center justify-center overflow-hidden">
          <Search className="w-8 h-8 text-[#F2C230]/60" />
          <div className="scan-line absolute left-0 right-0 h-0.5 bg-[#F2C230] opacity-80" style={{ top: "0%" }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold tracking-tight text-white">Analyzing scene...</p>
          <p className="text-sm text-white/50 mt-1">Cross-referencing 29 CFR regulations</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="pulse-dot w-2 h-2 rounded-full bg-[#F2C230]" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Result ──
  if (view === "result" && result) {
    const isViolation = result.status === "violation";
    const isUnclear = result.status === "unclear";

    return (
      <div className="space-y-4 fade-up pb-4">
        {/* Compliance verdict */}
        <ComplianceVerdict status={result.status} />

        {/* Main card */}
        <div className="rounded-2xl bg-[#2F3133] border border-white/8 overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">AI ANALYSIS SUMMARY</p>

            {/* Clarification */}
            {isUnclear && result.clarifyingQuestion && (
              <div className="rounded-xl border border-[#F2C230]/30 bg-[#F2C230]/5 p-4 mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#F2C230] mb-2">Clarification Needed</p>
                <p className="text-sm text-white/80">{result.clarifyingQuestion}</p>
                <textarea
                  className="mt-3 w-full rounded-lg border border-white/10 bg-[#1F2224] text-sm text-white p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#F2C230]/30 focus:border-[#F2C230] placeholder:text-white/30"
                  rows={3}
                  placeholder="Type your answer here…"
                  value={clarifyText}
                  onChange={e => setClarifyText(e.target.value)}
                />
                <Button
                  className="mt-2 w-full bg-[#F2C230] hover:bg-[#F2C230]/90 text-[#1F2224] font-bold"
                  onClick={submitClarification}
                  disabled={!clarifyText.trim()}
                >
                  Submit & Re-analyze
                </Button>
              </div>
            )}

            {/* Headline */}
            <h2 className="text-base font-bold text-white leading-snug mb-3">{result.headline}</h2>

            {/* Analysis */}
            <p className="text-sm text-white/70 leading-relaxed mb-4">{result.analysis}</p>

            {/* Severity + Penalty row */}
            {isViolation && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-[#1F2224] border border-white/8 p-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Violation Type</p>
                  <p className="text-sm font-bold text-white uppercase">{result.severity}</p>
                </div>
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Max Penalty</p>
                  <p className="text-sm font-bold text-red-400">{result.maxPenalty}</p>
                </div>
              </div>
            )}

            {/* Citations */}
            {result.citations?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Applicable Regulations</p>
                <div className="space-y-2">
                  {result.citations.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-[#1F2224] border border-white/8 p-3">
                      <SeverityDot status={result.status} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono font-bold text-[#F2C230]">{c.code}</p>
                        <p className="text-sm font-semibold text-white mt-0.5">{c.title}</p>
                        <p className="text-xs text-white/50 mt-1 leading-relaxed">{c.relevance}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Corrective action */}
            {isViolation && result.correctiveAction && (
              <div className="rounded-xl bg-[#F2C230]/8 border border-[#F2C230]/25 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#F2C230] mb-2">Required Corrective Action</p>
                <p className="text-sm text-white/80 leading-relaxed">{result.correctiveAction}</p>
              </div>
            )}
          </div>

          {/* Confidence footer */}
          {result.confidence > 0 && (
            <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
              <span className="text-xs text-white/40">Analysis Confidence</span>
              <span className="text-xs font-bold text-[#F2C230]">{result.confidence}%</span>
            </div>
          )}
        </div>

        {/* Usage */}
        {usage && (
          <div className="rounded-xl bg-[#2F3133] border border-white/8 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-white/40">Monthly usage</span>
            <span className="text-xs font-semibold text-white/70">{usage.used} / {usage.limit} analyses</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isViolation && (
            <Button
              variant="outline"
              className="w-full border-white/15 text-white/40 cursor-not-allowed"
              disabled
            >
              <FileText className="w-4 h-4 mr-2" />
              Download PDF Report — Pro Feature
            </Button>
          )}
          <Button
            className="w-full bg-[#F2C230] hover:bg-[#F2C230]/90 text-[#1F2224] font-bold h-11"
            onClick={resetInspect}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Inspection
          </Button>
        </div>

        <p className="text-xs text-white/30 text-center leading-relaxed">
          CiteSafe is an AI analysis tool and does not constitute legal advice.
        </p>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="space-y-5 pb-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">Snap a Photo.<br /><span className="text-[#F2C230]">Get OSHA Answers.</span></h2>
        <p className="text-sm text-white/50 mt-2">Upload a photo, describe what you see, or both.</p>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {imagePreview ? (
        <div className="relative rounded-2xl overflow-hidden border border-white/10">
          <img src={imagePreview} alt="Job site photo" className="w-full max-h-56 object-cover" />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Camera, label: "Take Photo" },
            { icon: Upload, label: "Upload Image" },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-white/15 bg-[#2F3133] hover:border-[#F2C230]/60 hover:bg-[#F2C230]/5 transition-all group"
            >
              <btn.icon className="w-6 h-6 text-white/30 group-hover:text-[#F2C230] transition-colors" />
              <span className="text-xs font-semibold text-white/40 group-hover:text-[#F2C230] transition-colors">{btn.label}</span>
            </button>
          ))}
        </div>
      )}

      <textarea
        className="w-full rounded-2xl border border-white/10 bg-[#2F3133] text-sm text-white p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#F2C230]/30 focus:border-[#F2C230]/50 placeholder:text-white/25 transition-colors"
        rows={4}
        placeholder="Describe what you see… e.g. 'Worker on scaffold 15 ft high, no guardrails, no harness'"
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <Button
        className="w-full bg-[#F2C230] hover:bg-[#F2C230]/90 text-[#1F2224] font-black text-base h-13 rounded-2xl"
        disabled={!canAnalyze}
        onClick={() => doAnalyze()}
      >
        {analyzeMutation.isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
        ) : (
          <>VIEW FULL GUIDANCE</>
        )}
      </Button>

      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Sample Scenarios</p>
        <div className="space-y-2">
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setText(prompt)}
              className="w-full text-left rounded-xl border border-white/8 bg-[#2F3133] hover:border-[#F2C230]/40 hover:bg-[#F2C230]/5 px-4 py-3 text-sm text-white/50 hover:text-white/80 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────
function HistoryTab() {
  const { data: history, isLoading } = trpc.history.list.useQuery();
  const deleteMutation = trpc.history.delete.useMutation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "violation" | "clear" | "unclear">("all");

  const filtered = (history ?? []).filter((item: Inspection) => {
    const matchFilter = filter === "all" || item.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || item.headline.toLowerCase().includes(q) || item.citation.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, { onSuccess: () => utils.history.list.invalidate() });
  };

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "violation", label: "Violations" },
    { key: "clear", label: "Clear" },
    { key: "unclear", label: "Unclear" },
  ] as const;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">Inspection History</h2>
        <p className="text-sm text-white/40 mt-1">{history?.length ?? 0} total analyses</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Search analyses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#2F3133] text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F2C230]/30 focus:border-[#F2C230]/50 placeholder:text-white/25"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              filter === f.key
                ? "bg-[#F2C230] text-[#1F2224] border-[#F2C230]"
                : "bg-[#2F3133] text-white/50 border-white/10 hover:border-[#F2C230]/40 hover:text-white/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-[#2F3133] h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#2F3133]/50 p-10 text-center">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 text-white/20" />
          <p className="text-sm text-white/40">No analyses found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item: Inspection) => (
            <div key={item.id} className="rounded-2xl bg-[#2F3133] border border-white/8 overflow-hidden group">
              {/* top severity bar */}
              <div className={`h-0.5 w-full ${item.status === "violation" ? "bg-red-500" : item.status === "clear" ? "bg-emerald-400" : "bg-[#F2C230]"}`} />
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <SeverityDot status={item.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white leading-tight">{item.headline}</p>
                    {item.citation && (
                      <p className="text-xs font-mono text-[#F2C230]/80 mt-0.5">{item.citation}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-white/30">
                        {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <div className="flex items-center gap-3">
                        {item.status === "violation" && (
                          <span className="text-xs font-semibold text-red-400">Up to {item.maxPenalty}</span>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Account Tab ───────────────────────────────────────────────────────────────
function AccountTab() {
  const { user, logout } = useAuth();
  const { data: usage } = trpc.inspect.usageThisMonth.useQuery();
  const { data: sub } = trpc.billing.getSubscription.useQuery();

  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 3;
  const isPro = sub && (sub.status === "active" || sub.status === "trialing");
  const planLabel = isPro ? (sub.plan === "team" ? "Team" : "Pro") : "Field (Free)";

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to checkout…");
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleUpgrade = (plan: "pro" | "team") => {
    checkoutMutation.mutate({ plan, origin: window.location.origin });
  };

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">Account</h2>
      </div>

      {/* User card */}
      <div className="rounded-2xl bg-[#2F3133] border border-white/8 p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#F2C230]/15 border border-[#F2C230]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-black text-[#F2C230]">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{user?.name || "CiteSafe User"}</p>
            <p className="text-xs text-white/40 truncate">{user?.email || ""}</p>
          </div>
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${isPro ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-[#F2C230]/15 text-[#F2C230] border border-[#F2C230]/30"}`}>
            {planLabel}
          </span>
        </div>

        <div className="border-t border-white/8 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/40">Analyses Used</span>
            <span className="text-sm font-semibold text-white">{used} / {limit}</span>
          </div>
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isPro ? "bg-emerald-400" : "bg-[#F2C230]"}`}
              style={{ width: `${Math.min(Math.round((used / limit) * 100), 100)}%` }}
            />
          </div>
          {!isPro && (
            <p className="text-xs text-white/30">
              {limit - used} free analyses remaining this month
            </p>
          )}
          {sub?.currentPeriodEnd && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">Renews</span>
              <span className="text-sm font-semibold text-white">
                {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pro subscriber */}
      {isPro ? (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-5">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-white">You're on {planLabel}</h3>
              <p className="text-sm text-white/50 mt-1 leading-relaxed">
                {sub?.plan === "team"
                  ? "Unlimited analyses, multi-user org accounts, PDF reports, and priority support."
                  : "50 analyses/day, PDF reports, and violation history export."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 bg-transparent"
            onClick={() => portalMutation.mutate({ origin: window.location.origin })}
            disabled={portalMutation.isPending}
          >
            {portalMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Manage Billing & Invoices →
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pro */}
          <div className="rounded-2xl bg-[#2F3133] border border-[#F2C230]/30 p-5">
            <div className="flex items-start gap-3 mb-4">
              <Zap className="w-5 h-5 text-[#F2C230] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-white">Pro</h3>
                  <span className="text-sm font-black text-[#F2C230]">$49/mo</span>
                </div>
                <p className="text-sm text-white/50 mt-1 leading-relaxed">
                  50 analyses/day, PDF reports, full violation history export.
                </p>
              </div>
            </div>
            <Button
              className="w-full bg-[#F2C230] hover:bg-[#F2C230]/90 text-[#1F2224] font-black h-11 rounded-xl"
              onClick={() => handleUpgrade("pro")}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Upgrade to Pro →
            </Button>
          </div>

          {/* Team */}
          <div className="rounded-2xl bg-[#2F3133] border border-white/8 p-5">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-5 h-5 text-white/50 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-white">Team</h3>
                  <span className="text-sm font-black text-white/70">$149/mo</span>
                </div>
                <p className="text-sm text-white/50 mt-1 leading-relaxed">
                  Everything in Pro + multi-user org accounts (up to 10 seats).
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/15 text-white/70 hover:bg-white/5 bg-transparent h-11 rounded-xl"
              onClick={() => handleUpgrade("team")}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Upgrade to Team →
            </Button>
          </div>
        </div>
      )}

      {/* About */}
      <div className="rounded-2xl bg-[#2F3133] border border-white/8 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">About CiteSafe</p>
        <div className="space-y-3">
          {[
            { label: "Version", value: "1.0.0" },
            { label: "Regulations", value: "29 CFR 1910 + 1926" },
            { label: "AI Engine", value: "CiteSafe Vision AI™" },
            { label: "Training Data", value: "29 CFR 1910 & 1926 + OSHA Standards" },
            { label: "Last Updated", value: "June 2026" },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-white/40">{row.label}</span>
              <span className="text-sm font-semibold text-white">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent h-11 rounded-xl"
        onClick={logout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>

      <p className="text-xs text-white/20 text-center">
        CiteSafe is an AI analysis tool and does not constitute legal advice.
      </p>
    </div>
  );
}

// ── Guest Gate ────────────────────────────────────────────────────────────────
function GuestGate() {
  const { login, isExchanging } = useNativeLogin();
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#F2C230]/10 border border-[#F2C230]/30 flex items-center justify-center">
        <Shield className="w-8 h-8 text-[#F2C230]" />
      </div>
      <div>
        <p className="font-black text-white text-lg">Sign in to access this section</p>
        <p className="text-sm text-white/40 mt-1 max-w-xs">Create a free account to save your inspection history and track usage.</p>
      </div>
      <Button
        className="bg-[#F2C230] hover:bg-[#F2C230]/90 text-[#1F2224] font-black px-8 h-12 rounded-xl"
        onClick={login}
        disabled={isExchanging}
      >
        {isExchanging ? "Signing in…" : "Sign in — it's free"}
      </Button>
    </div>
  );
}

function GuestInspectTab() {
  const { login, isExchanging } = useNativeLogin();
  const [text, setText] = useState("");
  return (
    <div className="space-y-5 pb-4">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">Snap a Photo.<br /><span className="text-[#F2C230]">Get OSHA Answers.</span></h2>
        <p className="text-sm text-white/50 mt-2">Upload a photo, describe what you see, or both.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[{ icon: Camera, label: "Take Photo" }, { icon: Upload, label: "Upload Image" }].map(btn => (
          <button
            key={btn.label}
            onClick={login}
            className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-white/15 bg-[#2F3133] hover:border-[#F2C230]/60 hover:bg-[#F2C230]/5 transition-all group"
          >
            <btn.icon className="w-6 h-6 text-white/30 group-hover:text-[#F2C230] transition-colors" />
            <span className="text-xs font-semibold text-white/40 group-hover:text-[#F2C230] transition-colors">{btn.label}</span>
          </button>
        ))}
      </div>
      <textarea
        className="w-full rounded-2xl border border-white/10 bg-[#2F3133] text-sm text-white p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[#F2C230]/30 placeholder:text-white/25"
        rows={4}
        placeholder="Describe what you see… e.g. 'Worker on scaffold 15 ft high, no guardrails, no harness'"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <Button
        className="w-full bg-[#F2C230] hover:bg-[#F2C230]/90 text-[#1F2224] font-black text-base h-13 rounded-2xl"
        onClick={login}
        disabled={isExchanging}
      >
        {isExchanging ? "Signing in…" : "Sign in to Analyze"}
      </Button>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Sample Scenarios</p>
        <div className="space-y-2">
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setText(prompt)}
              className="w-full text-left rounded-xl border border-white/8 bg-[#2F3133] hover:border-[#F2C230]/40 hover:bg-[#F2C230]/5 px-4 py-3 text-sm text-white/50 hover:text-white/80 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App Shell ────────────────────────────────────────────────────────────
export default function CiteSafeApp() {
  const { user, loading } = useAuth();
  const { login: nativeLogin } = useNativeLogin();
  const [location, setLocation] = useLocation();

  const tabFromPath = (path: string): Tab => {
    if (path.startsWith("/history")) return "history";
    if (path.startsWith("/account")) return "account";
    return "inspect";
  };

  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromPath(location));

  // Set native status bar style on mount (iOS only)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Scope native-only CSS rules to this platform
      document.documentElement.classList.add('native-platform');
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#1F2224' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setActiveTab(tabFromPath(location));
  }, [location]);

  const navigateTo = (tab: Tab) => {
    const paths: Record<Tab, string> = { inspect: "/inspect", history: "/history", account: "/account" };
    // Haptic feedback on tab switch (iOS only)
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    setLocation(paths[tab]);
  };

  const NAV_ITEMS = [
    { key: "inspect" as Tab, label: "Inspect", icon: Camera },
    { key: "history" as Tab, label: "History", icon: ClipboardList },
    { key: "account" as Tab, label: "Account", icon: User },
  ];

  const isGuest = !user && !loading;

  if (loading) {
    return (
      <div className="h-full bg-[#1F2224] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F2C230] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1F2224] flex flex-col overflow-hidden">
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-[#1F2224] border-b border-white/8">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2F3133] border border-[#F2C230]/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#F2C230]" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Cite<span className="text-[#F2C230]">Safe</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isGuest ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#F2C230]/15 text-[#F2C230] border border-[#F2C230]/30">
                {user?.name?.split(" ")[0] ?? "User"}
              </span>
            ) : (
              <button
                onClick={nativeLogin}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#F2C230] text-[#1F2224] hover:bg-[#F2C230]/90 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
        {/* Gold accent line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#F2C230]/60 to-transparent" />
      </header>

      {/* Page content — native-scroll enables iOS momentum scrolling */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 native-scroll">
        {activeTab === "inspect" && (isGuest ? <GuestInspectTab /> : <InspectTab />)}
        {activeTab === "history" && (isGuest ? <GuestGate /> : <HistoryTab />)}
        {activeTab === "account" && (isGuest ? <GuestGate /> : <AccountTab />)}
      </main>

      {/* Bottom tab bar */}
      <nav className="sticky bottom-0 z-50 bg-[#1F2224] border-t border-white/8">
        <div className="max-w-2xl mx-auto flex">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigateTo(item.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive ? "text-[#F2C230]" : "text-white/30 hover:text-white/60"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Safe area spacer for iOS home bar */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>
    </div>
  );
}

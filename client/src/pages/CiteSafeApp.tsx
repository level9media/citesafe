import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Home,
  Search,
  ClipboardList,
  User,
  LogOut,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Upload,
  Camera,
  X,
  FileText,
  RotateCcw,
  Loader2,
  Shield,
  TrendingUp,
  Calendar,
  Filter,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import type { InspectionResult } from "@shared/types";
import type { Inspection } from "../../../drizzle/schema";

type Tab = "home" | "inspect" | "history" | "account";
type InspectView = "form" | "loading" | "result";

const SAMPLE_PROMPTS = [
  "Worker on scaffold 15 ft high, no guardrails and no personal fall arrest system visible.",
  "Electrical panel open with exposed wiring next to standing water on the floor.",
  "Workers grinding metal without face shields or eye protection. No PPE visible.",
  "Trench about 5 feet deep with no shoring, no ladder, and no spoil pile setback.",
];

function StatusBadge({ status }: { status: string }) {
  if (status === "violation") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold badge-violation">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        Violation Found
      </span>
    );
  }
  if (status === "clear") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold badge-clear">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        No Violation
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold badge-unclear">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      Needs Clarification
    </span>
  );
}

function StatusBar({ status }: { status: string }) {
  const colors: Record<string, string> = {
    violation: "bg-[var(--cs-red)]",
    clear: "bg-[var(--cs-green)]",
    unclear: "bg-[var(--cs-amber)]",
  };
  return <div className={`h-1 w-full rounded-t-lg ${colors[status] ?? "bg-border"}`} />;
}

// ── Home Tab ──────────────────────────────────────────────────────────────────
function HomeTab({
  onStartInspect,
  onGoHistory,
}: {
  onStartInspect: () => void;
  onGoHistory: () => void;
}) {
  const { user } = useAuth();
  const { data: usage } = trpc.inspect.usageThisMonth.useQuery();
  const { data: history } = trpc.history.list.useQuery();

  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 5;
  const pct = Math.round((used / limit) * 100);

  const recent = (history ?? []).slice(0, 3);
  const totalViolations = (history ?? []).filter((h: Inspection) => h.status === "violation").length;

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="cs-stripe" />
        <div className="p-6 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                See a violation?<br />
                <span className="text-[var(--cs-red)]">Cite it now.</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                Photo or description — get the exact OSHA regulation in seconds.
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-xl bg-[var(--cs-red-light)] border border-[var(--cs-red-border)] flex-shrink-0">
              <Shield className="w-8 h-8 text-[var(--cs-red)]" />
            </div>
          </div>
          <Button
            className="mt-5 w-full sm:w-auto bg-[var(--cs-red)] hover:bg-[var(--cs-red)]/90 text-white font-semibold"
            onClick={onStartInspect}
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Inspection
          </Button>
        </div>
      </div>

      {/* Usage card */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Monthly Analyses
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            Free Tier
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{used} of {limit} used</span>
          <span className="text-xs text-muted-foreground">{limit - used} remaining</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--cs-red)] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Upgrade to Pro for unlimited analyses →
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: history?.length ?? 0, icon: ClipboardList, color: "text-foreground" },
          { label: "Violations", value: totalViolations, icon: AlertTriangle, color: "text-[var(--cs-red)]" },
          { label: "This Month", value: used, icon: Calendar, color: "text-foreground" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4 text-center shadow-sm">
            <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent analyses */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Analyses
            </span>
            <button
              onClick={onGoHistory}
              className="text-xs font-medium text-[var(--cs-red)] hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recent.map((item: Inspection) => (
              <div key={item.id} className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
                <StatusBar status={item.status} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.headline}</p>
                      <p className="text-xs text-[var(--cs-red)] font-mono mt-0.5">{item.citation}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {item.status === "violation" && (
                      <span className="text-xs font-medium text-[var(--cs-red)]">
                        Up to {item.maxPenalty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome message if no history */}
      {(history ?? []).length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">No inspections yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start your first inspection to see results here.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Inspect Tab ───────────────────────────────────────────────────────────────
function InspectTab() {
  const [view, setView] = useState<InspectView>("form");
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");
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
      setImageMime(file.type || "image/jpeg");
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

  // ── Loading view ──
  if (view === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative w-20 h-20 rounded-2xl border-2 border-border bg-muted flex items-center justify-center overflow-hidden shadow-sm">
          <Search className="w-8 h-8 text-muted-foreground" />
          <div
            className="scan-line absolute left-0 right-0 h-0.5 bg-[var(--cs-red)] opacity-80"
            style={{ top: "0%" }}
          />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold tracking-tight">Analyzing scene...</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-referencing 29 CFR regulations
          </p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="pulse-dot w-2 h-2 rounded-full bg-[var(--cs-red)]"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Result view ──
  if (view === "result" && result) {
    const isViolation = result.status === "violation";
    const isClear = result.status === "clear";
    const isUnclear = result.status === "unclear";

    return (
      <div className="space-y-4 fade-up">
        {/* Main result card */}
        <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
          <StatusBar status={result.status} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <StatusBadge status={result.status} />
                <h2 className="mt-2 text-lg font-bold text-foreground leading-tight">
                  {result.headline}
                </h2>
              </div>
              {result.confidence > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-2xl font-bold text-[var(--cs-red)]">
                    {result.confidence}%
                  </p>
                </div>
              )}
            </div>

            {/* Clarification needed */}
            {isUnclear && result.clarifyingQuestion && (
              <div className="rounded-lg border border-[oklch(0.85_0.08_60)] bg-[var(--cs-amber-light)] p-4 mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cs-amber)] mb-2">
                  Clarification Needed
                </p>
                <p className="text-sm text-foreground">{result.clarifyingQuestion}</p>
                <textarea
                  className="mt-3 w-full rounded-lg border border-border bg-white text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-red)]/30 focus:border-[var(--cs-red)]"
                  rows={3}
                  placeholder="Type your answer here…"
                  value={clarifyText}
                  onChange={e => setClarifyText(e.target.value)}
                />
                <Button
                  className="mt-2 w-full bg-[var(--cs-red)] hover:bg-[var(--cs-red)]/90 text-white"
                  onClick={submitClarification}
                  disabled={!clarifyText.trim()}
                >
                  Submit & Re-analyze
                </Button>
              </div>
            )}

            {/* Analysis */}
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Analysis
              </p>
              <p className="text-sm text-foreground leading-relaxed">{result.analysis}</p>
            </div>

            {/* Severity + Penalty */}
            {isViolation && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    Violation Type
                  </p>
                  <p className="text-sm font-bold uppercase">{result.severity}</p>
                </div>
                <div className="rounded-lg border border-[var(--cs-red-border)] bg-[var(--cs-red-light)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cs-red)] mb-1">
                    Max Penalty
                  </p>
                  <p className="text-sm font-bold text-[var(--cs-red)]">{result.maxPenalty}</p>
                </div>
              </div>
            )}

            {/* Citations */}
            {result.citations?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Applicable Regulations
                </p>
                <div className="space-y-2">
                  {result.citations.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-lg border-l-4 border-[var(--cs-red)] border border-border bg-muted/20 p-3"
                    >
                      <p className="text-xs font-mono font-semibold text-[var(--cs-red)]">{c.code}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.relevance}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Corrective action */}
            {isViolation && result.correctiveAction && (
              <div className="rounded-lg border border-[var(--cs-red-border)] bg-[var(--cs-red-light)] p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cs-red)] mb-2">
                  Required Corrective Action
                </p>
                <p className="text-sm text-foreground leading-relaxed">{result.correctiveAction}</p>
              </div>
            )}
          </div>
        </div>

        {/* Usage update */}
        {usage && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Monthly usage</span>
            <span className="text-xs font-medium">{usage.used} / {usage.limit} analyses used</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {isViolation && (
            <Button
              variant="outline"
              className="w-full border-[var(--cs-red)] text-[var(--cs-red)] hover:bg-[var(--cs-red-light)] opacity-60 cursor-not-allowed"
              disabled
              title="Upgrade to Pro to download PDF reports"
            >
              <FileText className="w-4 h-4 mr-2" />
              Download PDF Report — Pro Feature
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={resetInspect}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            New Inspection
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          CiteSafe is an AI analysis tool and does not constitute legal advice.
          Consult a licensed attorney or CSP for legal proceedings.
        </p>
      </div>
    );
  }

  // ── Form view ──
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Inspect a Condition</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a photo, describe what you see, or both.
        </p>
      </div>

      {/* Image upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {imagePreview ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img
            src={imagePreview}
            alt="Job site photo"
            className="w-full max-h-56 object-cover"
          />
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
            { icon: Camera, label: "Take Photo", capture: "environment" as const },
            { icon: Upload, label: "Upload Image", capture: undefined },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-[var(--cs-red)] hover:bg-[var(--cs-red-light)] transition-all group"
            >
              <btn.icon className="w-6 h-6 text-muted-foreground group-hover:text-[var(--cs-red)] transition-colors" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-[var(--cs-red)] transition-colors">
                {btn.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Text input */}
      <textarea
        className="w-full rounded-xl border border-border bg-white text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--cs-red)]/30 focus:border-[var(--cs-red)] placeholder:text-muted-foreground/60 transition-colors"
        rows={4}
        placeholder="Describe what you see… e.g. 'Worker on scaffold 15 ft high, no guardrails, no harness'"
        value={text}
        onChange={e => setText(e.target.value)}
      />

      {/* Analyze button */}
      <Button
        className="w-full bg-[var(--cs-red)] hover:bg-[var(--cs-red)]/90 text-white font-semibold h-11"
        disabled={!canAnalyze}
        onClick={() => doAnalyze()}
      >
        {analyzeMutation.isPending ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
        ) : (
          <><Search className="w-4 h-4 mr-2" /> Analyze for Violations</>
        )}
      </Button>

      {/* Sample prompts */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Sample Scenarios
        </p>
        <div className="space-y-2">
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => setText(prompt)}
              className="w-full text-left rounded-lg border border-border bg-white hover:border-[var(--cs-red)] hover:bg-[var(--cs-red-light)] px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-all"
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
  const deleteMutation = trpc.history.delete.useMutation({
    onSuccess: () => {
      toast.success("Inspection deleted");
    },
  });
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "violation" | "clear" | "unclear">("all");

    const filtered = (history ?? []).filter((item: Inspection) => {
    const matchFilter = filter === "all" || item.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.headline.toLowerCase().includes(q) ||
      item.citation.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => utils.history.list.invalidate(),
    });
  };

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "violation", label: "Violations" },
    { key: "clear", label: "Clear" },
    { key: "unclear", label: "Unclear" },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Inspection History</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {history?.length ?? 0} total analyses
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search analyses…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cs-red)]/30 focus:border-[var(--cs-red)] placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === f.key
                ? "bg-[var(--cs-red)] text-white border-[var(--cs-red)]"
                : "bg-white text-muted-foreground border-border hover:border-[var(--cs-red)] hover:text-[var(--cs-red)]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-border bg-white h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No analyses found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item: Inspection) => (
            <div key={item.id} className="rounded-xl border border-border bg-white overflow-hidden shadow-sm group">
              <StatusBar status={item.status} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">{item.headline}</p>
                    {item.citation && (
                      <p className="text-xs font-mono text-[var(--cs-red)] mt-0.5">{item.citation}</p>
                    )}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-3">
                    {item.status === "violation" && (
                      <span className="text-xs font-medium text-[var(--cs-red)]">
                        Up to {item.maxPenalty}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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

  const used = usage?.used ?? 0;
  const limit = usage?.limit ?? 5;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Account</h2>
      </div>

      {/* User card */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[var(--cs-red-light)] border border-[var(--cs-red-border)] flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[var(--cs-red)]">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">{user?.name || "CiteSafe User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
        </div>
        <Separator className="mb-4" />
        <div className="space-y-3">
          {[
            { label: "Plan", value: "Field (Free)", highlight: true },
            { label: "Analyses Used", value: `${used} / ${limit}` },
            { label: "Monthly Limit", value: `${limit} / month` },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className={`text-sm font-medium ${row.highlight ? "text-[var(--cs-red)]" : "text-foreground"}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade card */}
      <div className="rounded-xl border border-[var(--cs-red-border)] bg-[var(--cs-red-light)] p-5">
        <div className="flex items-start gap-3 mb-3">
          <TrendingUp className="w-5 h-5 text-[var(--cs-red)] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground">Upgrade to Pro</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Unlimited analyses, PDF reports, Letters of Interpretation, and violation history export.
            </p>
          </div>
        </div>
        <Button className="w-full bg-[var(--cs-red)] hover:bg-[var(--cs-red)]/90 text-white font-semibold">
          Upgrade — $49/month →
        </Button>
      </div>

      {/* About */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          About CiteSafe
        </p>
        <div className="space-y-3">
          {[
            { label: "Version", value: "1.0.0" },
            { label: "Regulations", value: "29 CFR 1910 + 1926" },
            { label: "AI Engine", value: "Manus Forge LLM" },
            { label: "Last Updated", value: "June 2026" },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-medium text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <Button
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive/5"
        onClick={logout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        CiteSafe is an AI analysis tool and does not constitute legal advice.
      </p>
    </div>
  );
}

// ── Main App Shell ────────────────────────────────────────────────────────────
export default function CiteSafeApp() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  const tabFromPath = (path: string): Tab => {
    if (path.startsWith("/inspect")) return "inspect";
    if (path.startsWith("/history")) return "history";
    if (path.startsWith("/account")) return "account";
    return "home";
  };

  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromPath(location));

  useEffect(() => {
    setActiveTab(tabFromPath(location));
  }, [location]);

  const navigateTo = (tab: Tab) => {
    const paths: Record<Tab, string> = { home: "/", inspect: "/inspect", history: "/history", account: "/account" };
    setLocation(paths[tab]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--cs-red)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--cs-red-light)] border border-[var(--cs-red-border)] mb-4">
              <Shield className="w-8 h-8 text-[var(--cs-red)]" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              CITE<span className="text-[var(--cs-red)]">SAFE</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              OSHA Violation Inspector — AI-powered compliance analysis
            </p>
          </div>
          <div className="space-y-3">
            <Button
              className="w-full bg-[var(--cs-red)] hover:bg-[var(--cs-red)]/90 text-white font-semibold h-11"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              Sign in to continue
            </Button>
            <p className="text-xs text-muted-foreground">
              Free tier includes 5 analyses per month
            </p>
          </div>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    { key: "home" as Tab, label: "Home", icon: Home },
    { key: "inspect" as Tab, label: "Inspect", icon: Search },
    { key: "history" as Tab, label: "History", icon: ClipboardList },
    { key: "account" as Tab, label: "Account", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.002_286)] flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--cs-red)] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">
              CITE<span className="text-[var(--cs-red)]">SAFE</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--cs-red-light)] text-[var(--cs-red)] border border-[var(--cs-red-border)]">
              FREE
            </span>
            <button
              onClick={() => navigateTo("inspect")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--cs-red)] text-white text-xs font-semibold hover:bg-[var(--cs-red)]/90 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              New Scan
            </button>
          </div>
        </div>
      </header>

      {/* Caution stripe */}
      <div className="cs-stripe" />

      {/* Page content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {activeTab === "home" && (
          <HomeTab
            onStartInspect={() => navigateTo("inspect")}
            onGoHistory={() => navigateTo("history")}
          />
        )}
        {activeTab === "inspect" && <InspectTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "account" && <AccountTab />}
      </main>

      {/* Bottom tab bar */}
      <nav className="sticky bottom-0 z-50 bg-white border-t border-border shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => navigateTo(item.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive ? "text-[var(--cs-red)]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                <span className={`text-[10px] font-semibold uppercase tracking-widest ${isActive ? "text-[var(--cs-red)]" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

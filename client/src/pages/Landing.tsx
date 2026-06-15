import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useDemoLogin } from "@/hooks/useDemoLogin";
import { useEffect } from "react";
import { useLocation } from "wouter";

const ICON_URL = "/manus-storage/citesafe-logo-nav_c064a821.png";

export default function Landing() {
  const { user, loading: isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // If already logged in, redirect to app
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/inspect");
    }
  }, [user, isLoading, setLocation]);

  const loginUrl = getLoginUrl();
  const { demoLogin, isLoading: isDemoLoading } = useDemoLogin();

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#1F2224", color: "#F3EFE6" }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-sm" style={{ backgroundColor: "rgba(31,34,36,0.95)" }}>
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <img src={ICON_URL} alt="CiteSafe" className="w-9 h-9" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
            <span className="text-xl font-bold tracking-tight">
              <span style={{ color: "#F3EFE6" }}>Cite</span>
              <span style={{ color: "#F2C230" }}>Safe</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="hidden sm:block text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">Pricing</a>
            <a href="#how-it-works" className="hidden sm:block text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">How It Works</a>
            <a
              href={loginUrl}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95"
              style={{ backgroundColor: "#F2C230", color: "#1F2224" }}
            >
              Sign In
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F2C230' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />

        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-8 border"
              style={{ borderColor: "#F2C230", color: "#F2C230", backgroundColor: "rgba(242,194,48,0.1)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#F2C230" }} />
              AI Trained on 29 CFR 1910 &amp; 1926
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-8">
              <img src={ICON_URL} alt="CiteSafe App Icon" className="w-24 h-24" style={{ filter: 'drop-shadow(0 0 30px rgba(242,194,48,0.5))' }} />
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4 leading-none">
              <span style={{ color: "#F3EFE6" }}>Cite</span>
              <span style={{ color: "#F2C230" }}>Safe</span>
            </h1>
            <p className="text-xl sm:text-2xl font-bold tracking-widest mb-6 uppercase" style={{ color: "#F3EFE6", letterSpacing: "0.2em" }}>
              Photo.{" "}
              <span style={{ color: "#F2C230" }}>Verify.</span>
              {" "}Comply.
            </p>
            <p className="text-lg sm:text-xl opacity-70 max-w-2xl mx-auto mb-10 leading-relaxed">
              Snap a photo of any job site. Get instant OSHA violation citations, penalty ranges, and corrective action steps — in seconds.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={loginUrl}
                className="px-8 py-4 rounded-xl text-lg font-black transition-all active:scale-95 shadow-lg"
                style={{ backgroundColor: "#F2C230", color: "#1F2224", boxShadow: "0 8px 32px rgba(242,194,48,0.4)" }}
              >
                Try It Now — Free
              </a>
              <a
                href="#how-it-works"
                className="px-8 py-4 rounded-xl text-lg font-bold border transition-all active:scale-95"
                style={{ borderColor: "rgba(243,239,230,0.3)", color: "#F3EFE6" }}
              >
                See How It Works
              </a>
            </div>

            {/* Social proof */}
            <p className="mt-6 text-sm opacity-50">No credit card required · 3 free inspections/month · Cancel anytime</p>
            <button
              onClick={demoLogin}
              disabled={isDemoLoading}
              className="mt-2 text-xs opacity-30 hover:opacity-60 underline underline-offset-2 transition-opacity disabled:opacity-20"
              style={{ color: "#F3EFE6" }}
            >
              {isDemoLoading ? "Loading demo…" : "Try Demo — no account needed"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Gold divider ── */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent, #F2C230, transparent)" }} />

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24" style={{ backgroundColor: "#2F3133" }}>
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#F2C230" }}>Simple 3-Step Process</p>
            <h2 className="text-3xl sm:text-5xl font-black" style={{ color: "#F3EFE6" }}>How CiteSafe Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                icon: "📸",
                title: "Snap a Photo",
                desc: "Take a photo of any job site condition — equipment, scaffolding, electrical panels, PPE, fall hazards, anything."
              },
              {
                step: "02",
                icon: "⚡",
                title: "Instant Analysis",
                desc: "Our AI cross-references your photo against federal safety standards and flags every potential violation in seconds."
              },
              {
                step: "03",
                icon: "📋",
                title: "Get Your Citation",
                desc: "Receive the exact CFR code, violation severity, maximum penalty, and a step-by-step corrective action checklist."
              }
            ].map((item) => (
              <div key={item.step} className="relative p-8 rounded-2xl border" style={{ backgroundColor: "#1F2224", borderColor: "rgba(242,194,48,0.2)" }}>
                <div className="text-5xl font-black opacity-10 absolute top-6 right-6" style={{ color: "#F2C230" }}>{item.step}</div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#F3EFE6" }}>{item.title}</h3>
                <p className="opacity-60 leading-relaxed" style={{ color: "#F3EFE6" }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Mid-page CTA */}
          <div className="text-center mt-14">
            <a
              href={loginUrl}
              className="inline-block px-8 py-4 rounded-xl text-base font-black transition-all active:scale-95"
              style={{ backgroundColor: "#F2C230", color: "#1F2224", boxShadow: "0 8px 32px rgba(242,194,48,0.3)" }}
            >
              Try It Now — Free
            </a>
            <p className="mt-3 text-xs opacity-40" style={{ color: "#F3EFE6" }}>No credit card · 3 free inspections/month</p>
          </div>
        </div>
      </section>

      {/* ── Why It Works ── */}
      <section className="py-24" style={{ backgroundColor: "#1F2224" }}>
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#F2C230" }}>The Technology</p>
                <h2 className="text-3xl sm:text-4xl font-black mb-6" style={{ color: "#F3EFE6" }}>
                  Built for the Field.<br />
                  <span style={{ color: "#F2C230" }}>Trained for Compliance.</span>
                </h2>
                <p className="opacity-70 leading-relaxed mb-6" style={{ color: "#F3EFE6" }}>
                  CiteSafe uses advanced visual AI trained specifically on OSHA's 29 CFR 1910 (General Industry) and 29 CFR 1926 (Construction) standards. It doesn't guess — it cites.
                </p>
                <p className="opacity-70 leading-relaxed mb-8" style={{ color: "#F3EFE6" }}>
                  Every analysis returns the specific regulation code, the current penalty range (updated for 2025), and actionable corrective steps your crew can execute immediately.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "CFR Sections", value: "1,400+" },
                    { label: "Violation Types", value: "200+" },
                    { label: "Penalty Data", value: "2025" },
                    { label: "Analysis Time", value: "< 5 sec" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 rounded-xl border" style={{ borderColor: "rgba(242,194,48,0.2)", backgroundColor: "rgba(242,194,48,0.05)" }}>
                      <div className="text-2xl font-black" style={{ color: "#F2C230" }}>{stat.value}</div>
                      <div className="text-xs opacity-60 mt-1" style={{ color: "#F3EFE6" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: "🏗️", title: "Construction Sites", desc: "Scaffolding, fall protection, excavation, electrical — all covered under 29 CFR 1926." },
                  { icon: "🏭", title: "General Industry", desc: "Lockout/tagout, machine guarding, hazard communication, PPE — 29 CFR 1910." },
                  { icon: "📊", title: "Violation History", desc: "Track every inspection result across all your job sites in one searchable log." },
                  { icon: "📁", title: "OSHA 300 Log Ready", desc: "Every violation maps to OSHA recordable incident categories automatically." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-5 rounded-xl border" style={{ backgroundColor: "#2F3133", borderColor: "rgba(242,194,48,0.15)" }}>
                    <div className="text-2xl flex-shrink-0">{item.icon}</div>
                    <div>
                      <div className="font-bold mb-1" style={{ color: "#F3EFE6" }}>{item.title}</div>
                      <div className="text-sm opacity-60" style={{ color: "#F3EFE6" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24" style={{ backgroundColor: "#2F3133" }}>
        <div className="container">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#F2C230" }}>Simple Pricing</p>
            <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: "#F3EFE6" }}>Start Free. Scale When Ready.</h2>
            <p className="opacity-60 max-w-xl mx-auto" style={{ color: "#F3EFE6" }}>No contracts. Cancel anytime. Every plan includes full CFR citation coverage.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-2xl border" style={{ backgroundColor: "#1F2224", borderColor: "rgba(243,239,230,0.1)" }}>
              <div className="text-sm font-bold uppercase tracking-widest mb-4 opacity-60" style={{ color: "#F3EFE6" }}>Field (Free)</div>
              <div className="text-5xl font-black mb-1" style={{ color: "#F3EFE6" }}>$0</div>
              <div className="text-sm opacity-50 mb-8" style={{ color: "#F3EFE6" }}>forever</div>
              <ul className="space-y-3 mb-8">
                {["3 inspections/month", "Full CFR citations", "Violation severity + penalty", "Corrective action steps"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#F3EFE6" }}>
                    <span style={{ color: "#F2C230" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href={loginUrl} className="block text-center py-3 rounded-xl font-bold border transition-all hover:bg-white/5" style={{ borderColor: "rgba(243,239,230,0.2)", color: "#F3EFE6" }}>
                Try It Now — Free
              </a>
            </div>

            {/* Pro — highlighted */}
            <div className="p-8 rounded-2xl relative" style={{ backgroundColor: "#F2C230" }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black" style={{ backgroundColor: "#1F2224", color: "#F2C230" }}>
                MOST POPULAR
              </div>
              <div className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#1F2224", opacity: 0.7 }}>Pro</div>
              <div className="text-5xl font-black mb-1" style={{ color: "#1F2224" }}>$49</div>
              <div className="text-sm mb-8" style={{ color: "#1F2224", opacity: 0.6 }}>/month</div>
              <ul className="space-y-3 mb-8">
                {[
                  "50 inspections/month",
                  "Full violation history",
                  "Job Site Profiles",
                  "Corrective Action Checklists",
                  "OSHA 300 Log export",
                  "PDF report download",
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium" style={{ color: "#1F2224" }}>
                    <span>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href={loginUrl} className="block text-center py-3 rounded-xl font-black transition-all active:scale-95" style={{ backgroundColor: "#1F2224", color: "#F2C230" }}>
                Get Pro
              </a>
            </div>

            {/* Team */}
            <div className="p-8 rounded-2xl border" style={{ backgroundColor: "#1F2224", borderColor: "rgba(242,194,48,0.3)" }}>
              <div className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: "#F2C230" }}>Team</div>
              <div className="text-5xl font-black mb-1" style={{ color: "#F3EFE6" }}>$149</div>
              <div className="text-sm opacity-50 mb-8" style={{ color: "#F3EFE6" }}>/month</div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited inspections",
                  "Up to 10 team members",
                  "Shared job site library",
                  "Team violation dashboard",
                  "Priority support",
                  "Export & reporting",
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "#F3EFE6" }}>
                    <span style={{ color: "#F2C230" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href={loginUrl} className="block text-center py-3 rounded-xl font-bold transition-all hover:bg-white/5 border" style={{ borderColor: "#F2C230", color: "#F2C230" }}>
                Get Team
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24" style={{ backgroundColor: "#1F2224" }}>
        <div className="container text-center">
          <img src={ICON_URL} alt="CiteSafe" className="w-16 h-16 rounded-2xl mx-auto mb-6" />
          <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ color: "#F3EFE6" }}>
            Stop Guessing.<br />
            <span style={{ color: "#F2C230" }}>Start Citing.</span>
          </h2>
          <p className="opacity-60 mb-8 max-w-lg mx-auto" style={{ color: "#F3EFE6" }}>
            Join safety professionals who use CiteSafe to catch violations before OSHA does.
          </p>
          <a
            href={loginUrl}
            className="inline-block px-10 py-5 rounded-xl text-xl font-black transition-all active:scale-95"
            style={{ backgroundColor: "#F2C230", color: "#1F2224", boxShadow: "0 8px 32px rgba(242,194,48,0.4)" }}
          >
            Try It Now — Free
          </a>
          <p className="mt-4 text-sm opacity-40" style={{ color: "#F3EFE6" }}>No credit card required · 3 free inspections/month</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-10" style={{ borderColor: "rgba(243,239,230,0.1)", backgroundColor: "#1F2224" }}>
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={ICON_URL} alt="CiteSafe" className="w-7 h-7 rounded-lg" />
              <span className="font-bold">
                <span style={{ color: "#F3EFE6" }}>Cite</span>
                <span style={{ color: "#F2C230" }}>Safe</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm opacity-50" style={{ color: "#F3EFE6" }}>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/support">Support</Link>
            </div>
            <p className="text-xs opacity-30" style={{ color: "#F3EFE6" }}>
              © 2025 CiteSafe. Built by{" "}
              <a href="https://levelninemedia.com" className="underline">Level Nine Media</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

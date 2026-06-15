import { useLocation } from "wouter";
import { Mail, MessageCircle, BookOpen, AlertCircle } from "lucide-react";

export default function Support() {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-[#1F2224] text-white">
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-white font-bold text-lg">
          <span className="text-2xl">⚙</span>
          <span>Cite<span className="text-[#F2C230]">Safe</span></span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-2">Support</h1>
        <p className="text-zinc-400 mb-12">We're here to help. Reach out through any of the options below.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          <a href="mailto:support@citesafe.app" className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 hover:border-[#F2C230] transition-colors group">
            <Mail className="w-6 h-6 text-[#F2C230] mb-3" />
            <h3 className="font-bold text-lg mb-1">Email Support</h3>
            <p className="text-zinc-400 text-sm">support@citesafe.app</p>
            <p className="text-zinc-500 text-xs mt-2">Response within 24 hours</p>
          </a>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <BookOpen className="w-6 h-6 text-[#F2C230] mb-3" />
            <h3 className="font-bold text-lg mb-1">Documentation</h3>
            <p className="text-zinc-400 text-sm">Guides on using CiteSafe, understanding CFR citations, and managing your account.</p>
            <p className="text-zinc-500 text-xs mt-2">Coming soon</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <MessageCircle className="w-6 h-6 text-[#F2C230] mb-3" />
            <h3 className="font-bold text-lg mb-1">Live Chat</h3>
            <p className="text-zinc-400 text-sm">Real-time support for Pro and Team subscribers.</p>
            <p className="text-zinc-500 text-xs mt-2">Available on Pro & Team plans</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
            <AlertCircle className="w-6 h-6 text-[#F2C230] mb-3" />
            <h3 className="font-bold text-lg mb-1">Report an Issue</h3>
            <p className="text-zinc-400 text-sm">Found a bug or incorrect OSHA citation? Let us know and we'll fix it fast.</p>
            <p className="text-zinc-500 text-xs mt-2"><a href="mailto:bugs@citesafe.app" className="text-[#F2C230] hover:underline">bugs@citesafe.app</a></p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {[
              { q: "How do I cancel my subscription?", a: "Go to Account → Manage Billing. You'll be taken to the Stripe portal where you can cancel anytime. You keep access until the end of your billing period." },
              { q: "Why did my inspection fail?", a: "Inspections can fail if the photo is too dark, blurry, or doesn't show a recognizable job site element. Try a clearer photo with good lighting." },
              { q: "Is CiteSafe a certified OSHA inspection?", a: "No. CiteSafe is an AI-assisted compliance tool for reference and training purposes. It does not replace a certified OSHA inspector or constitute legal advice." },
              { q: "What CFR standards does CiteSafe cover?", a: "CiteSafe's AI covers 29 CFR 1910 (General Industry) and 29 CFR 1926 (Construction) — the two most common OSHA standard sets for job site inspections." },
              { q: "How do I add team members?", a: "Team plan subscribers can invite members from the Team tab inside the app. Each seat gets their own login and inspection history." },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-zinc-800 pb-5 last:border-0 last:pb-0">
                <h4 className="font-semibold mb-1.5">{q}</h4>
                <p className="text-zinc-400 text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800 px-6 py-6 text-center text-zinc-500 text-xs">
        <p>© {new Date().getFullYear()} CiteSafe. All rights reserved. &nbsp;·&nbsp;
          <a href="/privacy" className="hover:text-zinc-300">Privacy Policy</a> &nbsp;·&nbsp;
          <a href="/terms" className="hover:text-zinc-300">Terms of Service</a> &nbsp;·&nbsp;
          <a href="/support" className="hover:text-zinc-300">Support</a>
        </p>
        <p className="mt-2">Site built and managed by <a href="https://levelninemedia.com" className="hover:text-zinc-300">Level Nine Media</a></p>
      </div>
    </div>
  );
}

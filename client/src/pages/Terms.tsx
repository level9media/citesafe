import { useLocation } from "wouter";

export default function Terms() {
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
        <h1 className="text-4xl font-black mb-2">Terms of Service</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: June 2026</p>
        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using CiteSafe, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
            <p>CiteSafe provides AI-assisted OSHA compliance analysis for job site photos and descriptions. The service references 29 CFR 1910 and 29 CFR 1926 regulations. CiteSafe is an informational tool and does not constitute legal advice or a certified OSHA inspection.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Disclaimer of Warranties</h2>
            <p>CiteSafe is provided "as is" without warranty of any kind. AI analysis may not identify all violations and should not replace a qualified safety professional or certified OSHA inspector. Users are solely responsible for workplace safety compliance.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Limitation of Liability</h2>
            <p>CiteSafe and its operators shall not be liable for any direct, indirect, incidental, or consequential damages arising from use of the service, including OSHA fines, penalties, or workplace incidents.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Subscription and Billing</h2>
            <p>Paid plans are billed monthly or annually as selected. Subscriptions auto-renew unless cancelled. Refunds are not provided for partial billing periods. You may cancel at any time from your Account page.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Acceptable Use</h2>
            <p>You agree not to misuse CiteSafe, including attempting to reverse-engineer the AI system, submitting fraudulent inspection data, or using the service for any unlawful purpose.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Contact</h2>
            <p>Questions about these terms? Contact <a href="mailto:support@citesafe.app" className="text-[#F2C230] hover:underline">support@citesafe.app</a>.</p>
          </section>
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

import { useLocation } from "wouter";

export default function Privacy() {
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
        <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
        <p className="text-zinc-400 text-sm mb-10">Last updated: June 2026</p>
        <div className="space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>CiteSafe collects information you provide directly, including your name, email address, and account credentials when you register. We also collect photos and descriptions you submit for OSHA compliance analysis, inspection results, and usage data to improve our services.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use collected information to provide and improve the CiteSafe service, process payments, send transactional emails, and comply with legal obligations. We do not sell your personal information to third parties.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Photo and Inspection Data</h2>
            <p>Photos you upload are processed by our AI analysis system and stored securely. Inspection results are associated with your account and accessible only to you (and your team members, if on a Team plan). We do not use your photos to train AI models without explicit consent.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Data Security</h2>
            <p>We implement industry-standard security measures including encryption in transit and at rest, secure authentication, and regular security reviews. However, no method of transmission over the internet is 100% secure.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting support@citesafe.app.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Third-Party Services</h2>
            <p>CiteSafe uses Stripe for payment processing. Stripe's privacy policy governs their handling of payment information. We do not store full credit card numbers.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Contact Us</h2>
            <p>For privacy-related questions, contact us at <a href="mailto:support@citesafe.app" className="text-[#F2C230] hover:underline">support@citesafe.app</a>.</p>
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

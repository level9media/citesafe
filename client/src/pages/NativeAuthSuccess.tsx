/**
 * NativeAuthSuccess
 *
 * This page is the OAuth callback landing point for native iOS sign-in.
 *
 * Flow:
 *  1. User taps "Sign In" in the app → Browser.open() opens SFSafariViewController
 *  2. Manus OAuth portal redirects to /api/oauth/callback?code=...&state=...
 *  3. Server sets session cookie and redirects to /native-auth-success
 *  4. SFSafariViewController loads this page
 *  5. useNativeLogin's appUrlOpen listener detects the URL contains "native-auth-success"
 *     and calls Browser.close() + invalidates auth state
 *  6. User is now authenticated inside the app
 *
 * This page also handles the case where the user opens it in a regular browser
 * (e.g., they somehow land here on web) — it just redirects them to /app.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { trpc } from "@/lib/trpc";

export default function NativeAuthSuccess() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  useEffect(() => {
    const finish = async () => {
      // Invalidate auth cache so useAuth() re-fetches with the new session cookie
      await utils.auth.me.invalidate();

      if (Capacitor.isNativePlatform()) {
        // Close the SFSafariViewController — the app WebView is still running behind it
        try {
          await Browser.close();
        } catch {
          // Browser may already be closed if the listener beat us here
        }
      }

      // Redirect to the main app
      setLocation("/inspect");
    };

    finish();
  }, [utils, setLocation]);

  return (
    <div
      style={{
        backgroundColor: "#1F2224",
        color: "#F3EFE6",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: "rgba(242,194,48,0.15)",
          border: "1px solid rgba(242,194,48,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
      >
        ✓
      </div>
      <p style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>Signed in successfully</p>
      <p style={{ opacity: 0.4, fontSize: 14, margin: 0 }}>Returning to CiteSafe…</p>
    </div>
  );
}

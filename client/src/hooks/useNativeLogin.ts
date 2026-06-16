/**
 * useNativeLogin — Option B (HTTPS-based callback, no custom URL scheme)
 *
 * On native iOS/Android:
 *   1. Opens SFSafariViewController via Browser.open()
 *   2. OAuth callback hits https://citesafe.app/api/oauth/callback (already whitelisted)
 *   3. Server sets session cookie and redirects to /native-auth-success
 *   4. The NativeAuthSuccess page calls Browser.close() + invalidates auth
 *   5. User is authenticated inside the app — no citesafe:// URL scheme needed
 *
 * On web:
 *   Falls back to standard window.location.href redirect.
 *
 * IMPORTANT: On native, window.location.origin returns "capacitor://localhost"
 * which the OAuth portal rejects. We must use the hardcoded production origin.
 */
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useCallback } from "react";
import { getLoginUrl } from "@/const";

// The production origin — used on native where window.location.origin
// returns "capacitor://localhost" (unreachable by the OAuth portal).
const PRODUCTION_ORIGIN = "https://citesafe.app";

export function useNativeLogin() {
  const login = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      // Use the hardcoded production origin — NOT window.location.origin
      // which returns "capacitor://localhost" on native and would cause
      // the OAuth portal to reject the redirect_uri.
      const redirectUri = `${PRODUCTION_ORIGIN}/api/oauth/callback`;
      const nativeState = btoa(`${redirectUri}?native=1`);
      const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
      const appId = import.meta.env.VITE_APP_ID;

      const url = new URL(`${oauthPortalUrl}/app-auth`);
      url.searchParams.set("appId", appId);
      url.searchParams.set("redirectUri", redirectUri);
      url.searchParams.set("state", nativeState);
      url.searchParams.set("type", "signIn");

      await Browser.open({
        url: url.toString(),
        presentationStyle: "popover",
        toolbarColor: "#1F2224",
      });
    } else {
      // Web: standard full-page redirect
      window.location.href = getLoginUrl();
    }
  }, []);

  return { login, isExchanging: false };
}

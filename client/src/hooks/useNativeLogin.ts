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
 */
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useCallback } from "react";
import { getLoginUrl } from "@/const";

export function useNativeLogin() {
  const login = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      // Build the login URL. The state encodes the redirect URI with native=1 so
      // the server knows to redirect to /native-auth-success after setting the cookie.
      const redirectUri = `${window.location.origin}/api/oauth/callback`;
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

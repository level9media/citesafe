/**
 * useNativeLogin
 *
 * On native Capacitor (iOS/Android):
 *   - Opens the OAuth portal inside SFSafariViewController via @capacitor/browser
 *   - Listens for the deep link callback (citesafe://auth/callback?code=...&state=...)
 *   - Exchanges the code server-side via trpc.auth.nativeCallback
 *   - Closes the in-app browser and refreshes auth state
 *
 * On web:
 *   - Falls back to the standard window.location.href redirect flow
 */
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App as CapApp } from "@capacitor/app";
import { getLoginUrl, NATIVE_REDIRECT_URI } from "@/const";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useRef } from "react";

export function useNativeLogin() {
  const utils = trpc.useUtils();
  const listenerRegistered = useRef(false);

  const exchangeMutation = trpc.auth.nativeCallback.useMutation({
    onSuccess: async () => {
      // Refresh auth state so useAuth() picks up the new session cookie
      await utils.auth.me.invalidate();
    },
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || listenerRegistered.current) return;
    listenerRegistered.current = true;

    // Listen for the deep link that fires when the OAuth server redirects to
    // citesafe://auth/callback?code=...&state=...
    const handlePromise = CapApp.addListener("appUrlOpen", async (event: { url: string }) => {
      const url = event.url;
      if (!url.startsWith(NATIVE_REDIRECT_URI)) return;

      // Close the in-app browser immediately
      await Browser.close().catch(() => {});

      // Parse code and state from the deep link URL
      const parsed = new URL(url);
      const code = parsed.searchParams.get("code");
      const state = parsed.searchParams.get("state");

      if (code && state) {
        exchangeMutation.mutate({ code, state });
      }
    });

    return () => {
      handlePromise.then((h) => h.remove()).catch(() => {});
      listenerRegistered.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      const url = getLoginUrl(true); // forNative=true → citesafe:// redirect URI
      await Browser.open({
        url,
        windowName: "_self",
        presentationStyle: "popover",
        toolbarColor: "#1F2224",
      });
    } else {
      // Web: standard full-page redirect
      window.location.href = getLoginUrl(false);
    }
  }, []);

  return { login, isExchanging: exchangeMutation.isPending };
}

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Custom URL scheme registered in iOS Info.plist for deep link OAuth callback.
// SFSafariViewController closes automatically when it sees this scheme.
export const NATIVE_REDIRECT_URI = "citesafe://auth/callback";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Pass forNative=true on Capacitor iOS/Android to use the custom scheme.
export const getLoginUrl = (forNative = false) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = forNative
    ? NATIVE_REDIRECT_URI
    : `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

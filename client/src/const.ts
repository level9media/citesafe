export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// On native Capacitor, window.location.origin returns "capacitor://localhost"
// which the OAuth portal rejects as an unknown redirect URI.
// Always use the production HTTPS origin for OAuth on native.
const PRODUCTION_ORIGIN = "https://citesafe.app";

// Generate login URL at runtime so redirect URI reflects the current origin.
// On native, always uses the hardcoded production origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Use production origin on native (capacitor://localhost would be rejected),
  // or the actual window origin on web (handles dev/staging environments correctly).
  const origin =
    typeof window !== "undefined" &&
    window.location.origin.startsWith("capacitor://")
      ? PRODUCTION_ORIGIN
      : window.location.origin;

  const redirectUri = `${origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

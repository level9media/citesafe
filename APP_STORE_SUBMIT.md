# CiteSafe — App Store Submission Guide

## On Your Mac — Run These Commands

```bash
# 1. Pull latest (Capacitor is already added)
git clone https://github.com/level9media/citesafe.git
cd citesafe

# 2. Install dependencies
pnpm install

# 3. Build the web app
pnpm build

# 4. Add iOS platform (first time only)
npx cap add ios

# 5. Sync web build into iOS project
npx cap sync ios

# 6. Open in Xcode
npx cap open ios
```

## In Xcode

1. Select the `App` target
2. **Signing & Capabilities** → select your Apple Developer Team
3. Bundle ID is already set: `com.levenninemedia.citesafe`
4. Version: `1.0.0` | Build: `1`
5. **Product → Archive**
6. **Distribute App → App Store Connect → Upload**

## App Store Connect

- App Name: **CiteSafe**
- Subtitle: **OSHA Violation Inspector**
- Category: **Business** (primary), **Productivity** (secondary)
- Bundle ID: `com.levenninemedia.citesafe`
- Privacy Policy URL: `https://citesafe.app/privacy` *(add a simple page)*

## App Icon

Already generated — use `/client/public/apple-touch-icon.png` (192×192).
For App Store Connect you need **1024×1024 PNG, no alpha channel**.
The source file is at: `/home/ubuntu/webdev-static-assets/citesafe-icon-v1.png`

Export it at 1024×1024 in Preview or Figma before uploading.

## How the App Works (for App Store Review)

The app points to the live backend at `https://citesafe.app`.
No local server needed — Capacitor is a thin native wrapper around the web app.
The backend handles all AI calls, auth, and database.

## Notes

- OAuth redirect: Manus OAuth is configured to accept `capacitor://localhost`
- All API calls go to `https://citesafe.app/api/trpc`
- No sensitive data stored on device

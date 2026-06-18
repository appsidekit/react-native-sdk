# SideKit React Native SDK
<p align="center">
  <img src="https://appsidekit.com/app-icon.png" width="300" />
</p>

[![npm version](https://img.shields.io/npm/v/@sidekit/react-native.svg)](https://www.npmjs.com/package/@sidekit/react-native)
[![Platforms](https://img.shields.io/badge/Platforms-iOS%20%7C%20Android-blue.svg?style=flat)](https://developer.apple.com/ios/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

SideKit is a lightweight React Native SDK that provides seamless version gating and analytics for your mobile applications. Ensure your users are always on the right version and gain insights into app usage with minimal setup.

## Features

- **Version Gating**: Remotely force updates or suggest new versions to your users.
- **Analytics Signals**: Send custom events (signals) to track user behavior and app health.
- **Feature Flags & Config**: Remotely toggle features and push config values without shipping an update.
- **User Feedback**: Collect in-app feedback with automatic device/locale metadata.
- **End-User Auth**: Sign users in with a phone number + OTP; sessions persist across launches.
- **Automatic Presentation**: Out-of-the-box UI for update prompts that works for both iOS and Android.
- **Built for Expo**: First-class Expo support (uses Expo modules for device info and secure storage)

## Installation

```bash
npx expo install @sidekit/react-native @react-native-async-storage/async-storage expo-secure-store
```

`expo-secure-store` backs the end-user auth session (Keychain/Keystore). If you don't use end-user auth you can omit it.

## Usage

### 1. Initialize SideKit

Wrap your app with SideKitProvider:

```typescript
import { SideKitProvider } from '@sidekit/react-native';

function App() {
  return (
    <SideKitProvider apiKey="your-api-key" verbose={__DEV__}>
      <YourAppContent />
    </SideKitProvider>
  );
}
```

### 2. Version Gating

By default, SideKit handles version gating automatically if `presentationMode` is set to `'automatic'`. It checks for updates on app launch and whenever the app returns to the foreground.

If you prefer manual control:

```ts
const { showUpdateScreen, gateInformation } = useSideKit();

<SideKitProvider apiKey="your-api-key" presentationMode='manual'>
  <YourAppContent />
  {showUpdateScreen && gateInformation && (
    {/* Show your custom update UI */}
  )}
</SideKitProvider>
```

### 3. Analytics Signals

Send signals to track important events in your app:

```ts
const { sendSignal, sendSignals } = useSideKit();

// Send a simple signal
sendSignal("user_signed_up")

// Send a signal with a value
sendSignal("purchase", "pro_plan")

// Send multiple signals at once (more efficient)
sendSignals([
  { key: "page_view", value: "home" },
  { key: "button_clicked", value: "signup" },
  { key: "feature_used", value: "dark_mode" }
])
```

### 4. Analytics Opt-Out

Allow users to control analytics collection. If it's turned off you will no longer have signal data from users with analytics disabled. Version gating will be uninterrupted.

```ts
const { isAnalyticsEnabled, setAnalyticsEnabled } = useSideKit();

<Switch
  value={isAnalyticsEnabled}
  onValueChange={setAnalyticsEnabled}
/>
```

The preference is automatically persisted across app launches.

### 5. Feature Flags & Config

Remotely toggle features and push config values from the SideKit dashboard. Flags are fetched on `configure()` and cached for offline use; call `refreshFlags()` to pull the latest at any time.

```ts
const { flag, config, flags, refreshFlags } = useSideKit();

// Boolean feature flag (defaults to false if missing)
if (flag("new_onboarding")) {
  // show the new onboarding flow
}

// String config value (defaults to "" if missing)
const banner = config("home_banner_text", "Welcome!");

// Pull the latest flags on demand (e.g. on a screen focus)
await refreshFlags();
```

`flags` is the full array of `FeatureFlag` entries (`{ key, value, isFlag, updatedAt }`) if you need to enumerate them. The SDK caches the last-known flags, so `flag()`/`config()` keep working when the device is offline.

### 6. User Feedback

Collect in-app feedback. Device metadata (OS, app version, device model, country, language, platform) is attached automatically, and when a user is signed in the feedback is attributed to them.

```ts
const { sendFeedback } = useSideKit();

const ok = await sendFeedback("Love the app! Could use dark mode.", {
  userAttributes: { screen: "settings", plan: "pro" },
});
if (ok) showThankYou();
```

`sendFeedback` resolves to `true` when the feedback was accepted, `false` otherwise (it never throws). Feedback is sent regardless of the analytics opt-out setting.

### 7. End-User Authentication

SideKit currently supports phone as the only sign-in channel. `signIn` sends a one-time passcode (OTP); verifying it creates an account if the user doesn't already have one, otherwise signs them in. The session is persisted across app launches, so a returning user stays signed in. Requires your app to be enabled for end-user auth.

```ts
const {
  isAuthenticated,
  authUser,
  sessionToken,
  signIn,
  verifyOtp,
  setHandle,
  logout,
} = useSideKit();

// 1. Send a code (phone, E.164). Creates the account if new, signs in if existing.
const send = await signIn("+15555550100");
if (!send.ok) {
  // send.error: "rate_limited" (with send.retryAfter seconds), "invalid_phone", ...
  return;
}

// 2. Verify the code the user received
const verify = await verifyOtp({
  requestId: send.data.requestId,
  identifier: "+15555550100",
  code: "123456",
});
if (verify.ok) {
  // Signed in — isAuthenticated is now true and authUser is populated.
  console.log("user id:", verify.data.user.id);
  if (verify.data.isNewUser) {
    // first sign-in — route to onboarding (e.g. setHandle)
  }
} else if (verify.error === "invalid_code") {
  // wrong/expired code — let them retry
}

// 3. (Optional) set a handle for the signed-in user
await setHandle("neo");              // -> { ok:false, error:"handle_taken" } on conflict

// 4. Sign out (revokes the session server-side; always clears locally)
await logout();
```

Every auth call returns an `AuthResult<T>`: either `{ ok: true, data }` or `{ ok: false, error, status, retryAfter? }`, where `error` is a short code you can branch on (e.g. `"invalid_code"`, `"rate_limited"`, `"handle_taken"`, `"network_error"`).

**Session storage:** the session token is stored in the platform **Keychain/Keystore** via `expo-secure-store` — no setup required. Non-secret SDK state (analytics flag, cached gate) stays in AsyncStorage.

**Verifying sessions on your backend:** `sessionToken` is the user's credential. Send it to your own backend and verify it server-side by calling SideKit's `POST /v1/auth/introspect` with your API key — don't trust the client's claim of who it is.

## Example App

A comprehensive example app is included in the `example/` directory, demonstrating all SDK features:

```bash
cd example
npm install
npm start
```

## Requirements

- Expo SDK 50 or higher (the SDK uses Expo modules for device info and secure storage)
- React 18.0.0 or higher
- @react-native-async-storage/async-storage 1.21.0 or higher (optional)
- expo-secure-store (required only for end-user auth)

## License

SideKit is available under the MIT license. See the [LICENSE](LICENSE) file for more info.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## Support

- [Documentation](https://docs.appsidekit.com)
- [GitHub Issues](https://github.com/appsidekit/react-native-sdk/issues)
- [Email Support](mailto:support@appsidekit.com)

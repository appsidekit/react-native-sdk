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
- **Automatic Presentation**: Out-of-the-box UI for update prompts that works for both iOS and Android.
- **Expo Compatible**: Works with both Expo and bare React Native

## Installation

```bash
npm install @sidekit/react-native @react-native-async-storage/async-storage
# or
yarn add @sidekit/react-native @react-native-async-storage/async-storage
```

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

## Example App

A comprehensive example app is included in the `example/` directory, demonstrating all SDK features:

```bash
cd example
npm install
npm start
```

## Requirements

- React Native 0.70.0 or higher
- React 18.0.0 or higher
- @react-native-async-storage/async-storage 1.21.0 or higher (optional)

## License

SideKit is available under the MIT license. See the [LICENSE](LICENSE) file for more info.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

## Support

- [Documentation](https://docs.appsidekit.com)
- [GitHub Issues](https://github.com/appsidekit/react-native-sdk/issues)
- [Email Support](mailto:support@appsidekit.com)

# SideKit React Native SDK

> Version gating and analytics for React Native applications

[![npm version](https://img.shields.io/npm/v/@sidekit/react-native.svg)](https://www.npmjs.com/package/@sidekit/react-native)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

SideKit provides powerful version management and analytics for React Native apps. Ensure your users are always on the latest version and track critical events - all with a simple, elegant API.

## Features

- ✅ **Version Gating**: Force or suggest updates to your users
- ✅ **Beautiful UI**: Pre-built update screen matching iOS design
- ✅ **Analytics**: Track custom events with automatic metadata enrichment
- ✅ **Offline Support**: Cached version information for offline scenarios
- ✅ **TypeScript**: Full type safety with TypeScript definitions
- ✅ **Cross-Platform**: Works on iOS and Android
- ✅ **Expo Compatible**: Works with both Expo and bare React Native
- ✅ **Zero Native Modules**: Pure JavaScript/TypeScript implementation

## Installation

```bash
npm install @sidekit/react-native @react-native-async-storage/async-storage
# or
yarn add @sidekit/react-native @react-native-async-storage/async-storage
```

## Quick Start

### 1. Wrap your app with SideKitProvider

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

That's it! The SDK will automatically:
- Initialize and configure itself
- Monitor for version updates
- Display update prompts when needed

### 2. Use the SDK in Your Components

```typescript
import { useSideKit } from '@sidekit/react-native';

function MyComponent() {
  const {
    showUpdateScreen,
    gateInformation,
    isAnalyticsEnabled,
    sendSignal,
    setAnalyticsEnabled,
  } = useSideKit();

  // Track events
  const handleButtonClick = () => {
    sendSignal('button_clicked');
  };

  return (
    <View>
      <Text>Update Available: {showUpdateScreen ? 'Yes' : 'No'}</Text>
      <Text>Analytics: {isAnalyticsEnabled ? 'Enabled' : 'Disabled'}</Text>
      <Button onPress={handleButtonClick} title="Track Event" />
      <Switch value={isAnalyticsEnabled} onValueChange={setAnalyticsEnabled} />
    </View>
  );
}
```

## Example App

A comprehensive example app is included in the `example/` directory, demonstrating all SDK features:

```bash
cd example
npm install
npm start
```

The example app showcases:
- SideKitProvider integration
- Version gate with automatic presentation
- Analytics event tracking
- Analytics opt-in/opt-out
- Real-time state updates
- Debug information display

## API Reference

### `<SideKitProvider />` Component

Main provider component that wraps your entire app and handles SDK configuration.

**Props:**
- `apiKey` (string, required): Your SideKit API key
- `presentationMode` ('automatic' | 'manual', optional): How to present update gates (default: 'automatic')
- `verbose` (boolean, optional): Enable debug logging (default: false)
- `children` (ReactNode, required): Your app content

**Example:**
```typescript
<SideKitProvider
  apiKey="sk_abc123"
  verbose={true}
  presentationMode="automatic"
>
  <YourApp />
</SideKitProvider>
```

### `useSideKit()` Hook

React hook that provides the complete public API for the SideKit SDK. Returns both state and methods for interacting with the SDK.

**Returns:**

**State:**
- `showUpdateScreen` (boolean): Whether to show update screen
- `gateInformation` (GateInformation | null): Current gate information
- `isAnalyticsEnabled` (boolean): Whether analytics is enabled

**Methods:**
- `sendSignal(key: string, value?: string)`: Track a custom analytics event
- `dismissUpdateGate()`: Dismiss the update gate (for dismissable gates only)
- `setAnalyticsEnabled(enabled: boolean)`: Enable or disable analytics tracking

**Example:**
```typescript
const {
  // State
  showUpdateScreen,
  gateInformation,
  isAnalyticsEnabled,
  // Methods
  sendSignal,
  dismissUpdateGate,
  setAnalyticsEnabled,
} = useSideKit();

// Track events
sendSignal('button_clicked');
sendSignal('purchase_completed', '29.99');

// Dismiss update gate
dismissUpdateGate();

// Toggle analytics
setAnalyticsEnabled(false);
```

### `<DefaultVersionGate />` Component

**Note:** This component is now internal to the SDK and is automatically rendered by `SideKitProvider` when `presentationMode` is set to `'automatic'`. You should not use it directly.

For custom version gate UI, use `presentationMode="manual"` and build your own UI using the `useSideKit()` hook.

## Version Gating

SideKit supports four types of version gates, configured in your SideKit dashboard. The server determines which gate type to show based on the current app version:

### Live (Not Blocked)

The current version is up-to-date and not blocked. No gate is shown.

```typescript
VersionGateType.Live = -1
```

### Forced Updates

Users must update before continuing. No skip button is shown.

```typescript
VersionGateType.Forced = 0
```

### Dismissable Updates

Users can skip the update. Gate is shown once per update.

```typescript
VersionGateType.Dismissable = 1
```

### Modal Updates

Similar to dismissable, but with modal presentation.

```typescript
VersionGateType.Modal = 2
```

All version gating logic is handled server-side. The SDK automatically receives the appropriate gate type based on the current app version and your dashboard configuration.

## Analytics

### Automatic Signals

SideKit automatically tracks these events:

- `_first_launch`: Sent once on first app launch
- `_app_open`: Sent on each app open (launch + foreground)
- `_gate_enforced`: Sent when version gate is triggered

### Custom Signals

Track your own events using the `useSideKit()` hook:

```typescript
function MyComponent() {
  const { sendSignal } = useSideKit();

  const handleSignup = () => {
    sendSignal('button_clicked', 'signup');
  };

  const handlePurchase = () => {
    sendSignal('purchase_completed', '29.99');
  };

  // ... rest of component
}
```

### Automatic Metadata

Every signal includes:
- OS version
- App version
- Device model
- Country code
- Language code
- Platform (ios/android)

### Opt-out

Users can opt-out of analytics using the `useSideKit()` hook:

```typescript
function SettingsComponent() {
  const { isAnalyticsEnabled, setAnalyticsEnabled } = useSideKit();

  return (
    <Switch
      value={isAnalyticsEnabled}
      onValueChange={setAnalyticsEnabled}
    />
  );
}
```

Note: Version gating continues to work even when analytics is disabled.

## Manual Presentation Mode

For custom UI, use manual presentation mode:

```typescript
function App() {
  return (
    <SideKitProvider
      apiKey="your-api-key"
      presentationMode="manual"
    >
      <YourApp />
    </SideKitProvider>
  );
}

// In your component:
function YourApp() {
  const { showUpdateScreen, gateInformation } = useSideKit();

  if (showUpdateScreen && gateInformation) {
    // Show your custom UI
    return <CustomUpdateScreen gateInfo={gateInformation} />;
  }

  return <YourAppContent />;
}
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import type {
  GateInformation,
  VersionGateType,
  ConfigOptions,
  SideKitState,
} from '@sidekit/react-native';
```

## Testing

When testing your app, you can mock the SDK:

```typescript
jest.mock('@sidekit/react-native', () => ({
  SideKitProvider: ({ children }: { children: React.ReactNode }) => children,
  useSideKit: jest.fn(() => ({
    showUpdateScreen: false,
    gateInformation: null,
    isAnalyticsEnabled: true,
    sendSignal: jest.fn(),
    dismissUpdateGate: jest.fn(),
    setAnalyticsEnabled: jest.fn(),
  })),
}));
```

## Troubleshooting

### SDK not initializing

Ensure you're wrapping your app with `SideKitProvider`:

```typescript
<SideKitProvider apiKey="your-api-key">
  <App />
</SideKitProvider>
```

### Version gate not showing

1. Check that `presentationMode` is set to `'automatic'` (or omitted, since it's the default)
2. Verify your API key is correct
3. Enable verbose logging with `verbose={true}` to see detailed logs
4. Check your SideKit dashboard configuration

### Analytics not working

1. Ensure analytics is enabled via the `useSideKit()` hook
2. Check network connectivity
3. Verify API key is correct
4. Enable verbose logging for debugging

## Requirements

- React Native 0.70.0 or higher
- React 18.0.0 or higher
- @react-native-async-storage/async-storage 1.21.0 or higher (optional)

## Platform Support

- ✅ iOS (React Native)
- ✅ Android (React Native)
- ✅ Expo
- ✅ Bare React Native

## License

MIT

## Support

- [Documentation](https://docs.appsidekit.com)
- [GitHub Issues](https://github.com/yourusername/sidekit-react-native/issues)
- [Email Support](mailto:support@appsidekit.com)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

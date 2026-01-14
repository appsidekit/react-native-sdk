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

### 1. Initialize the SDK

```typescript
import SideKit from '@sidekit/react-native';

// Configure SDK at app startup
await SideKit.shared.configure('your-api-key', {
  appVersion: '1.0.0',
  verbose: __DEV__,
  presentationMode: 'automatic', // or 'manual'
});
```

### 2. Add the Version Gate Component

```typescript
import { DefaultVersionGate } from '@sidekit/react-native';

function App() {
  return (
    <>
      {/* Your app content */}
      <YourAppContent />

      {/* Version gate modal (shows automatically when update available) */}
      <DefaultVersionGate />
    </>
  );
}
```

### 3. Track Events

```typescript
// Track event with key only
SideKit.shared.sendSignal('button_clicked');

// Track event with key and value
SideKit.shared.sendSignal('page_viewed', 'home_screen');
```

### 4. Subscribe to State Changes

```typescript
import { useSideKit } from '@sidekit/react-native';

function MyComponent() {
  const { showUpdateScreen, gateInformation, isAnalyticsEnabled } = useSideKit();

  return (
    <View>
      <Text>Update Available: {showUpdateScreen ? 'Yes' : 'No'}</Text>
      <Text>Analytics: {isAnalyticsEnabled ? 'Enabled' : 'Disabled'}</Text>
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
- SDK configuration
- Version gate with automatic presentation
- Analytics event tracking
- Analytics opt-in/opt-out
- Real-time state updates
- Debug information display

## API Reference

### `SideKit.shared.configure(apiKey, options?)`

Initialize the SDK with your API key and configuration options.

**Parameters:**
- `apiKey` (string, required): Your SideKit API key
- `options` (object, optional):
  - `appVersion` (string, required): Current app version (e.g., "1.0.0")
  - `verbose` (boolean): Enable debug logging (default: false)
  - `presentationMode` ('automatic' | 'manual'): How to present update gates (default: 'automatic')

**Example:**
```typescript
await SideKit.shared.configure('sk_abc123', {
  appVersion: '1.0.0',
  verbose: true,
  presentationMode: 'automatic',
});
```

### `SideKit.shared.sendSignal(key, value?)`

Track a custom analytics event.

**Parameters:**
- `key` (string, required): Event name
- `value` (string, optional): Event value

**Example:**
```typescript
SideKit.shared.sendSignal('button_clicked');
SideKit.shared.sendSignal('purchase_completed', '29.99');
```

### `useSideKit()` Hook

React hook for subscribing to SDK state changes.

**Returns:**
- `showUpdateScreen` (boolean): Whether to show update screen
- `gateInformation` (GateInformation | null): Current gate information
- `isAnalyticsEnabled` (boolean): Whether analytics is enabled

**Example:**
```typescript
const { showUpdateScreen, gateInformation } = useSideKit();
```

### `<DefaultVersionGate />` Component

Pre-built UI component for displaying update prompts.

**Props:**
- `dismissable` (boolean, optional): Override dismissable behavior
- `onSkip` (function, optional): Callback when user skips update

**Example:**
```typescript
<DefaultVersionGate
  onSkip={() => console.log('User skipped update')}
/>
```

### Properties

#### `SideKit.shared.showUpdateScreen`

Get whether update screen should be shown.

```typescript
const shouldShow = SideKit.shared.showUpdateScreen;
```

#### `SideKit.shared.gateInformation`

Get current gate information.

```typescript
const info = SideKit.shared.gateInformation;
console.log(info?.latestVersion); // "2.0.0"
console.log(info?.whatsNew); // "Bug fixes and improvements"
```

#### `SideKit.shared.isAnalyticsEnabled`

Get or set analytics enabled state.

```typescript
// Get
const enabled = SideKit.shared.isAnalyticsEnabled;

// Set
SideKit.shared.isAnalyticsEnabled = false;
```

## Version Gating

SideKit supports three types of version gates:

### Forced Updates

Users must update before continuing. No skip button is shown.

```typescript
// Configured in your SideKit dashboard
{
  minVersion: { version: "2.0.0", type: VersionGateType.Forced }
}
```

### Dismissable Updates

Users can skip the update. Gate is shown once per update.

```typescript
// Configured in your SideKit dashboard
{
  blockedVersions: [
    { version: "1.0.0", type: VersionGateType.Dismissable }
  ]
}
```

### Modal Updates

Similar to dismissable, but with modal presentation.

## Analytics

### Automatic Signals

SideKit automatically tracks these events:

- `_first_launch`: Sent once on first app launch
- `_app_open`: Sent on each app open (launch + foreground)
- `_gate_enforced`: Sent when version gate is triggered

### Custom Signals

Track your own events:

```typescript
// User interactions
SideKit.shared.sendSignal('button_clicked', 'signup');
SideKit.shared.sendSignal('screen_viewed', 'home');

// Business events
SideKit.shared.sendSignal('purchase_completed', '29.99');
SideKit.shared.sendSignal('subscription_started', 'premium');
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

Users can opt-out of analytics:

```typescript
SideKit.shared.isAnalyticsEnabled = false;
```

Note: Version gating continues to work even when analytics is disabled.

## Manual Presentation Mode

For custom UI, use manual presentation mode:

```typescript
await SideKit.shared.configure('your-api-key', {
  appVersion: '1.0.0',
  presentationMode: 'manual',
});

// Watch for updates
const { showUpdateScreen, gateInformation } = useSideKit();

if (showUpdateScreen && gateInformation) {
  // Show your custom UI
  showCustomUpdateScreen(gateInformation);
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
  SideKit: {
    shared: {
      configure: jest.fn(),
      sendSignal: jest.fn(),
      showUpdateScreen: false,
      gateInformation: null,
      isAnalyticsEnabled: true,
    },
  },
  useSideKit: jest.fn(() => ({
    showUpdateScreen: false,
    gateInformation: null,
    isAnalyticsEnabled: true,
  })),
  DefaultVersionGate: () => null,
}));
```

## Troubleshooting

### SDK not initializing

Ensure you're calling `configure()` before any other SDK methods:

```typescript
await SideKit.shared.configure('your-api-key', {
  appVersion: '1.0.0',
});
```

### Version gate not showing

1. Check that `presentationMode` is set to `'automatic'`
2. Verify your API key is correct
3. Enable verbose logging to see detailed logs
4. Check your SideKit dashboard configuration

### Analytics not working

1. Ensure analytics is enabled: `SideKit.shared.isAnalyticsEnabled = true`
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

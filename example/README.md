# SideKit React Native Example App

This example app demonstrates all features of the SideKit React Native SDK.

## Features Demonstrated

- ✅ SDK Configuration
- ✅ Version Gate (Automatic Presentation)
- ✅ Analytics Event Tracking
- ✅ Analytics Opt-in/Opt-out
- ✅ Real-time State Updates via `useSideKit()` hook
- ✅ Custom UI with DefaultVersionGate component

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Expo CLI (optional, but recommended)

### Installation

1. Install dependencies:

```bash
cd example
npm install
```

2. Start the development server:

```bash
npm start
```

3. Run on iOS:

```bash
npm run ios
```

4. Run on Android:

```bash
npm run android
```

## How It Works

### SDK Initialization

The app automatically initializes the SDK on mount:

```typescript
await SideKit.shared.configure(apiKey, {
  verbose: true,
  presentationMode: 'automatic',
});
```

### Version Gate

The `DefaultVersionGate` component is rendered at the root level and automatically shows when an update is available:

```typescript
<DefaultVersionGate
  onSkip={() => {
    console.log('User skipped update');
  }}
/>
```

### Analytics Tracking

Track custom events:

```typescript
// Track event with key only
SideKit.shared.sendSignal('button_clicked');

// Track event with key and value
SideKit.shared.sendSignal('page_viewed', 'home_screen');
```

### State Management

Subscribe to SDK state changes using the `useSideKit()` hook:

```typescript
const { showUpdateScreen, gateInformation, isAnalyticsEnabled } = useSideKit();
```

## Project Structure

```
example/
├── App.tsx                 # Main app component
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── metro.config.js        # Metro bundler config (watches SDK source)
```

## Development Notes

### Live SDK Development

The Metro bundler is configured to watch the SDK source files in the parent directory. Any changes you make to the SDK will automatically reload in the example app.

### Testing Version Gates

To test version gates, you'll need to:

1. Configure your SideKit dashboard to set version requirements
2. Use a valid API key

### Debugging

Enable verbose logging by setting `verbose: true` in the SDK configuration. Check the console for detailed logs.

## Learn More

- [SideKit Documentation](https://docs.appsidekit.com)
- [React Native Documentation](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)

# SideKit React Native Example App

This example app demonstrates all features of the SideKit React Native SDK:

- SDK Configuration
- Version Gating (automatic presentation & manual presentation with custom UI)
- Analytics Event Tracking
- Analytics Opt-in/Opt-out

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

## Development Notes

### Live SDK Development

The Metro bundler is configured to watch the SDK source files in the parent directory. Any changes you make to the SDK will automatically reload in the example app.

### Testing Version Gates

To test version gates, you'll need to:

1. Configure your SideKit dashboard to set version requirements
2. Use a valid API key

#### Testing Manual Presentation Mode

The example app includes a `CustomVersionGate.tsx` component that demonstrates how to build a custom version gate UI for manual presentation mode.

To test manual presentation mode, open `App.tsx` and update SideKitProvider to use manual presentation:

```tsx
import { CustomVersionGate } from './CustomVersionGate';

<SideKitProvider
  apiKey='your-api-key'
  presentationMode='manual' // Change from 'automatic' to 'manual'
>
  <YourAppContent />
  <CustomVersionGate /> {/* Add the custom gate component */}
</SideKitProvider>
```

### Debugging

Enable verbose logging by setting `verbose=true` in the SDK configuration. Check the console for detailed logs.

## Learn More

- [SideKit Documentation](https://docs.appsidekit.com)
- [React Native Documentation](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)

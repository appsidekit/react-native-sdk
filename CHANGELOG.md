# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-13

### Added

#### Core Features
- **Version Gating**: Complete version management system with forced, dismissable, and modal update types
- **Analytics**: Custom event tracking with automatic metadata enrichment (OS, app version, device, locale)
- **Offline Support**: Cached gate information for offline scenarios
- **React Integration**: `useSideKit()` hook for subscribing to SDK state changes

#### Components
- **DefaultVersionGate**: Beautiful full-screen modal component matching iOS SDK design
  - Gradient background (black to blue)
  - Version badge display
  - Primary and secondary action buttons
  - Automatic and manual presentation modes

#### SDK Architecture
- **SideKit Core**: Singleton SDK class with comprehensive API
  - `configure()`: Initialize SDK with API key and options
  - `sendSignal()`: Track custom analytics events
  - Observable state properties: `showUpdateScreen`, `gateInformation`, `isAnalyticsEnabled`
  - `subscribe()`: Listen to SDK state changes

#### Models & Logic
- **SemanticVersion**: Robust version parsing and comparison (supports "1.2.3", "2.0", "1.2.3.4.5")
- **GateInformation**: Version gate logic and blocking rules
- **Signal**: Analytics event models with metadata

#### Platform Support
- Pure JavaScript/TypeScript implementation (no native modules)
- iOS support via React Native
- Android support via React Native
- Expo compatibility
- Bare React Native compatibility

#### Storage & Network
- **SettingsStore**: AsyncStorage wrapper with in-memory fallback
- **AnalyticsAgent**: HTTP client for SideKit API communication
- Graceful degradation on network failures

#### Utilities
- Cross-platform utilities (iOS/Android detection, OS version, device model)
- Lifecycle tracking (app foreground/background with debouncing)
- Debug logging with verbose mode

#### Developer Experience
- **TypeScript**: Full type safety with strict mode
- **Testing**: 95 unit tests with 80%+ coverage
- **Example App**: Comprehensive Expo demo app showcasing all features
- **Documentation**: Complete API reference and usage guides

#### Automatic Signals
- `_first_launch`: Sent once on first app launch
- `_app_open`: Sent on each app open (launch + foreground)
- `_gate_enforced`: Sent when version gate is triggered

### Technical Details

#### Build System
- Multi-format output: CommonJS, ESM, TypeScript declarations
- react-native-builder-bob for optimal bundling
- Zero external runtime dependencies

#### API Compatibility
- Matches iOS SDK API for consistency
- Similar behavior to iOS implementation
- Cross-platform version gating logic

#### Requirements
- React Native 0.70.0 or higher
- React 18.0.0 or higher
- @react-native-async-storage/async-storage 1.21.0 or higher (optional)

### Notes

This is the initial release of the SideKit React Native SDK, providing feature parity with the iOS SDK for cross-platform React Native applications.

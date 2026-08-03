// Mock React Native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '17.0',
  },
  Linking: {
    openURL: jest.fn(() => Promise.resolve(true)),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
  StyleSheet: {
    create: (styles) => styles,
  },
  Modal: 'Modal',
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  SafeAreaView: 'SafeAreaView',
  StatusBar: 'StatusBar',
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock Expo Application
jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  ApplicationReleaseType: {
    UNKNOWN: 0,
    SIMULATOR: 1,
    ENTERPRISE: 2,
    DEVELOPMENT: 3,
    AD_HOC: 4,
    APP_STORE: 5,
  },
  getIosApplicationReleaseTypeAsync: jest.fn(async () => 3), // DEVELOPMENT
}));

// Mock Expo Device
jest.mock('expo-device', () => ({
  osVersion: '17.0',
  modelName: 'iPhone 15',
}));

// Mock Expo Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock Expo SecureStore (default session store)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  // Accessibility constants come from the native module, so they need explicit
  // mock values — otherwise code referencing them passes undefined in tests.
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
}));

// Mock fetch
global.fetch = jest.fn();

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

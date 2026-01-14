/**
 * Lifecycle utilities for AppState management
 */

import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';

// Debounce tracking
let lastEventTime = 0;
const DEBOUNCE_MS = 1000;

/**
 * Subscribe to app lifecycle events
 * @param onForeground Callback when app comes to foreground
 * @param onBackground Callback when app goes to background
 * @returns Unsubscribe function
 */
export function subscribeToLifecycle(
  onForeground: () => void,
  onBackground: () => void
): () => void {
  let previousAppState: AppStateStatus = AppState.currentState;

  const subscription: NativeEventSubscription = AppState.addEventListener(
    'change',
    (nextAppState: AppStateStatus) => {
      // Debounce rapid events
      const now = Date.now();
      if (now - lastEventTime < DEBOUNCE_MS) {
        return;
      }
      lastEventTime = now;

      // Detect foreground transition
      if (
        previousAppState.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onForeground();
      }

      // Detect background transition
      if (
        previousAppState === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        onBackground();
      }

      previousAppState = nextAppState;
    }
  );

  // Return unsubscribe function
  return () => {
    subscription.remove();
  };
}

/**
 * Get current app state
 * @returns Current app state
 */
export function getCurrentAppState(): AppStateStatus {
  return AppState.currentState;
}

/**
 * Check if app is currently in foreground
 * @returns true if app is active
 */
export function isAppActive(): boolean {
  return AppState.currentState === 'active';
}

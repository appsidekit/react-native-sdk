/**
 * SideKit React Native SDK
 *
 * Main entry point for the SDK
 */

import { useState, useEffect, useCallback } from 'react';
import { SideKit } from './core/SideKit';
import type { SideKitState } from './types';

// Export types
export * from './types';

// Export components
export { SideKitProvider, type SideKitProviderProps } from './components';

/**
 * React hook for subscribing to SideKit state changes and accessing SDK methods.
 *
 * This hook provides the complete public API for the SideKit SDK. It automatically
 * subscribes to state changes and provides methods for interacting with the SDK.
 *
 * @returns {SideKitState} Current SideKit state and methods:
 *   - showUpdateScreen: Whether the update screen should be shown
 *   - gateInformation: Current gate configuration from the API
 *   - isAnalyticsEnabled: Whether analytics tracking is enabled
 *   - sendSignal: Send a custom analytics event
 *   - dismissUpdateGate: Dismiss the update gate (for dismissable gates)
 *   - setAnalyticsEnabled: Enable or disable analytics tracking
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const {
 *     showUpdateScreen,
 *     gateInformation,
 *     isAnalyticsEnabled,
 *     sendSignal,
 *     dismissUpdateGate,
 *     setAnalyticsEnabled
 *   } = useSideKit();
 *
 *   return (
 *     <View>
 *       {showUpdateScreen && (
 *         <View>
 *           <Text>Update Available</Text>
 *           <Text>Latest Version: {gateInformation?.latestVersion}</Text>
 *         </View>
 *       )}
 *       <Button onPress={() => sendSignal('button_clicked')} title="Track Event" />
 *       <Button onPress={dismissUpdateGate} title="Dismiss Update" />
 *       {isAnalyticsEnabled && (
 *         <Switch
 *           value={isAnalyticsEnabled}
 *           onValueChange={setAnalyticsEnabled}
 *         />
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export function useSideKit(): SideKitState {
  const [state, setState] = useState({
    showUpdateScreen: SideKit.shared.showUpdateScreen,
    gateInformation: SideKit.shared.gateInformation,
    isAnalyticsEnabled: SideKit.shared.isAnalyticsEnabled,
  });

  useEffect(() => {
    // Subscribe to SDK state changes
    const unsubscribe = SideKit.shared.subscribe(() => {
      setState({
        showUpdateScreen: SideKit.shared.showUpdateScreen,
        gateInformation: SideKit.shared.gateInformation,
        isAnalyticsEnabled: SideKit.shared.isAnalyticsEnabled,
      });
    });

    // Return cleanup function
    return unsubscribe;
  }, []);

  // Memoize methods to prevent unnecessary re-renders
  const sendSignal = useCallback((key: string, value?: string) => {
    SideKit.shared.sendSignal(key, value);
  }, []);

  const dismissUpdateGate = useCallback(() => {
    SideKit.shared.dismissUpdateGate();
  }, []);

  const setAnalyticsEnabled = useCallback((enabled: boolean) => {
    SideKit.shared.isAnalyticsEnabled = enabled;
  }, []);

  return {
    ...state,
    sendSignal,
    dismissUpdateGate,
    setAnalyticsEnabled,
  };
}

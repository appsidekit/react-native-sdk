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
 *   - sendSignals: Send multiple custom analytics events at once
 *   - dismissUpdateGate: Dismiss the update gate (for dismissible gates)
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
    flags: SideKit.shared.flags,
    authUser: SideKit.shared.authUser,
    isAuthenticated: SideKit.shared.isAuthenticated,
    sessionToken: SideKit.shared.sessionToken,
  });

  useEffect(() => {
    // Subscribe to SDK state changes
    const unsubscribe = SideKit.shared.subscribe(() => {
      setState({
        showUpdateScreen: SideKit.shared.showUpdateScreen,
        gateInformation: SideKit.shared.gateInformation,
        isAnalyticsEnabled: SideKit.shared.isAnalyticsEnabled,
        flags: SideKit.shared.flags,
        authUser: SideKit.shared.authUser,
        isAuthenticated: SideKit.shared.isAuthenticated,
        sessionToken: SideKit.shared.sessionToken,
      });
    });

    // Return cleanup function
    return unsubscribe;
  }, []);

  // Memoize methods to prevent unnecessary re-renders
  const sendSignal = useCallback((key: string, value?: string) => {
    SideKit.shared.sendSignals([{ key, value }]);
  }, []);

  const sendSignals = useCallback(
    (signals: Array<{ key: string; value?: string }>) => {
      SideKit.shared.sendSignals(signals);
    },
    []
  );

  const sendFeedback = useCallback(
    (
      feedbackText: string,
      options?: Parameters<typeof SideKit.shared.sendFeedback>[1]
    ) => SideKit.shared.sendFeedback(feedbackText, options),
    []
  );

  const flag = useCallback(
    (key: string, defaultValue?: boolean) =>
      SideKit.shared.flag(key, defaultValue),
    []
  );

  const config = useCallback(
    (key: string, defaultValue?: string) =>
      SideKit.shared.config(key, defaultValue),
    []
  );

  const refreshFlags = useCallback(() => SideKit.shared.refreshFlags(), []);

  const dismissUpdateGate = useCallback(() => {
    SideKit.shared.dismissUpdateGate();
  }, []);

  const setAnalyticsEnabled = useCallback((enabled: boolean) => {
    SideKit.shared.isAnalyticsEnabled = enabled;
  }, []);

  // Auth methods (bound to the singleton; state updates arrive via subscribe)
  const requestOtp = useCallback(
    (
      phone: Parameters<typeof SideKit.shared.requestOtp>[0],
      options?: Parameters<typeof SideKit.shared.requestOtp>[1]
    ) => SideKit.shared.requestOtp(phone, options),
    []
  );

  const verifyOtp = useCallback(
    (params: Parameters<typeof SideKit.shared.verifyOtp>[0]) =>
      SideKit.shared.verifyOtp(params),
    []
  );

  const setHandle = useCallback(
    (handle: string) => SideKit.shared.setHandle(handle),
    []
  );

  const setRecoveryEmail = useCallback(
    (email: string) => SideKit.shared.setRecoveryEmail(email),
    []
  );

  const logout = useCallback(() => SideKit.shared.logout(), []);

  return {
    ...state,
    sendSignal,
    sendSignals,
    sendFeedback,
    flag,
    config,
    refreshFlags,
    dismissUpdateGate,
    setAnalyticsEnabled,
    requestOtp,
    verifyOtp,
    setHandle,
    setRecoveryEmail,
    logout,
  };
}

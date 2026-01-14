/**
 * SideKit React Native SDK
 *
 * Main entry point for the SDK
 */

import { useState, useEffect } from 'react';
import { SideKit } from './core/SideKit';
import type { SideKitState } from './types';

// Export types
export * from './types';

// Export core classes
export { SideKit } from './core/SideKit';

// Export components
export { DefaultVersionGate } from './components';
export type { DefaultVersionGateProps } from './components';

/**
 * React hook for subscribing to SideKit state changes.
 *
 * This hook allows React components to reactively update when the SDK state changes.
 * It automatically subscribes to state changes on mount and unsubscribes on unmount.
 *
 * @returns {SideKitState} Current SideKit state containing:
 *   - showUpdateScreen: Whether the update screen should be shown
 *   - gateInformation: Current gate configuration from the API
 *   - isAnalyticsEnabled: Whether analytics tracking is enabled
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { showUpdateScreen, gateInformation, isAnalyticsEnabled } = useSideKit();
 *
 *   return (
 *     <View>
 *       <Text>Update Available: {showUpdateScreen ? 'Yes' : 'No'}</Text>
 *       <Text>Latest Version: {gateInformation?.latestVersion}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useSideKit(): SideKitState {
  const [state, setState] = useState<SideKitState>({
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

  return state;
}

// Default export
export default SideKit;

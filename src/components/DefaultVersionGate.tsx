/**
 * DefaultVersionGate - Pre-built version gate UI component
 *
 * A beautiful full-screen modal that automatically displays when an app update
 * is available. Matches the iOS SDK design with gradient background, version badge,
 * and action buttons.
 *
 * @module DefaultVersionGate
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSideKit } from '../index';
import { openURL, getStoreURL } from '../utils/platform';
import { SideKit } from '../core/SideKit';
import { SemanticVersion } from '../models/SemanticVersion';
import { GateInformation } from '../models/GateInformation';

/**
 * Props for the DefaultVersionGate component.
 */
export interface DefaultVersionGateProps {
  /**
   * Override whether the gate is dismissable.
   *
   * If undefined, the dismissable state will be determined from the gate information
   * received from the SideKit API. Set to false for forced updates, true for dismissable.
   *
   * @default undefined (determined by gate configuration)
   */
  dismissable?: boolean;

  /**
   * Callback invoked when user taps "Skip for now" button.
   *
   * Only called for dismissable gates. Use this to perform additional actions
   * when the user chooses to skip the update.
   *
   * @example
   * ```typescript
   * <DefaultVersionGate
   *   onSkip={() => {
   *     console.log('User skipped update');
   *     analytics.track('update_skipped');
   *   }}
   * />
   * ```
   */
  onSkip?: () => void;
}

/**
 * DefaultVersionGate - Pre-built update prompt component.
 *
 * Displays a beautiful full-screen modal when an app update is available.
 * Automatically shows/hides based on SDK state. Works in both automatic
 * and manual presentation modes.
 *
 * Features:
 * - Gradient background (black to blue)
 * - Large bold title: "Update" / "Available"
 * - Version badge showing latest version
 * - Description text from gate information
 * - "Get the Update" primary button
 * - "Skip for now" secondary button (dismissable gates only)
 *
 * @param {DefaultVersionGateProps} props - Component props
 * @returns {JSX.Element | null} The modal component or null if no update available
 *
 * @example
 * ```typescript
 * import { DefaultVersionGate } from '@sidekit/react-native';
 *
 * function App() {
 *   return (
 *     <>
 *       <YourAppContent />
 *       <DefaultVersionGate
 *         onSkip={() => console.log('User skipped update')}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Force non-dismissable gate
 * <DefaultVersionGate dismissable={false} />
 *
 * // Force dismissable gate with callback
 * <DefaultVersionGate
 *   dismissable={true}
 *   onSkip={() => {
 *     console.log('User skipped');
 *     // Track in analytics, show reminder later, etc.
 *   }}
 * />
 * ```
 */
export function DefaultVersionGate({
  dismissable,
  onSkip,
}: DefaultVersionGateProps): JSX.Element | null {
  const { gateInformation, showUpdateScreen } = useSideKit();

  if (!showUpdateScreen || !gateInformation) {
    return null;
  }

  // Determine if dismissable
  const isDismissable =
    dismissable !== undefined
      ? dismissable
      : (gateInformation as GateInformation).isDismissable(
          new SemanticVersion(SideKit.shared['appVersion'] || '1.0.0')
        );

  const handleUpdate = async () => {
    // Try to get store URL
    const storeURL = getStoreURL(
      gateInformation.appStoreURL,
      gateInformation.appStoreURL // For now, use same URL for both platforms
    );

    if (storeURL) {
      const opened = await openURL(storeURL);
      if (!opened) {
        console.warn('[SideKit] Failed to open store URL');
      }
    } else {
      console.warn('[SideKit] No store URL available');
    }
  };

  const handleSkip = () => {
    if (isDismissable) {
      SideKit.shared.dismissUpdateGate();
      if (onSkip) {
        onSkip();
      }
    }
  };

  return (
    <Modal
      visible={showUpdateScreen}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000033" />
      <SafeAreaView style={styles.container}>
        {/* Gradient background simulation */}
        <View style={styles.gradientContainer}>
          <View style={styles.gradientTop} />
          <View style={styles.gradientBottom} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleLine}>Update</Text>
            <Text style={styles.titleLine}>Available</Text>
          </View>

          {/* Version Badge */}
          {gateInformation.latestVersion && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                v{gateInformation.latestVersion}
              </Text>
            </View>
          )}

          {/* Description */}
          {gateInformation.whatsNew && (
            <Text style={styles.description}>
              {gateInformation.whatsNew}
            </Text>
          )}

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Primary Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleUpdate}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get the Update</Text>
          </TouchableOpacity>

          {/* Secondary Button (only for dismissable gates) */}
          {isDismissable && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Skip for now</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000033',
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientTop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBottom: {
    flex: 2,
    backgroundColor: '#000066',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'flex-start',
  },
  titleContainer: {
    marginBottom: 32,
  },
  titleLine: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 72,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 32,
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

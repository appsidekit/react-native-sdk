/**
 * DefaultVersionGate - Pre-built version gate UI component
 *
 * A full-screen modal that automatically displays when an app update is available.
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
import { LinearGradient } from 'expo-linear-gradient';
import { useSideKit } from '../index';
import { openURL } from '../utils/platform';
import { warn } from '../utils/logger';

/**
 * Props for DefaultVersionGate component
 * Currently empty as the component uses no external props
 */
export interface DefaultVersionGateProps {}

/**
 * DefaultVersionGate - Pre-built update prompt component. Displays a full-screen modal when an app update is available.
 *
 * This component is automatically rendered by SideKitProvider when
 * presentationMode is 'automatic'. It should not be used directly.
 *
 * @returns {JSX.Element | null} The modal component or null if no update available
 *
 * @internal
 */
export function DefaultVersionGate(): JSX.Element | null {
  const { gateInformation, showUpdateScreen, dismissUpdateGate } = useSideKit();

  if (!showUpdateScreen || !gateInformation) {
    return null;
  }

  const isDismissable = gateInformation.isDismissable();

  const handleUpdate = async () => {
    const storeURL = gateInformation.storeUrl;

    if (storeURL) {
      const opened = await openURL(storeURL);
      if (!opened) {
        warn('Failed to open store URL');
      }
    } else {
      warn('No store URL available');
    }
  };

  const handleSkip = () => {
    dismissUpdateGate();
  };

  return (
    <Modal
      visible={showUpdateScreen}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <LinearGradient
        colors={['#000000', '#007AFF']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          {/* Content */}
          <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleLine}>Update</Text>
            <Text style={[styles.titleLine, styles.titleLineSecond]}>Available</Text>
          </View>

          {/* Version Badge */}
          {gateInformation.latestVersion && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {gateInformation.latestVersion}
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
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 40,
    justifyContent: 'flex-start',
  },
  titleContainer: {
    marginBottom: 40,
  },
  titleLine: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 64,
  },
  titleLineSecond: {
    marginTop: -12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
  },
  description: {
    fontSize: 17,
    lineHeight: 28,
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 10,
  },
  spacer: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
  },
});

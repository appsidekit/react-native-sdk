/**
 * CustomVersionGate - Example custom version gate UI component
 *
 * This is an example implementation showing how to create a custom
 * version gate component with manual presentation mode.
 *
 * @module CustomVersionGate
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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSideKit } from '@sidekit/react-native';
import MeerkatSvg from './assets/meerkat.svg';

/**
 * CustomVersionGate - Example custom update prompt component
 *
 * Use this component when presentationMode is set to 'manual'.
 *
 * @returns {JSX.Element | null} The modal component or null if no update available
 *
 * @example
 * ```tsx
 * <SideKitProvider config={{ presentationMode: 'manual', ... }}>
 *   <YourApp />
 *   <CustomVersionGate />
 * </SideKitProvider>
 * ```
 */
export function CustomVersionGate(): JSX.Element | null {
  const { gateInformation, showUpdateScreen, dismissUpdateGate } = useSideKit();

  if (!showUpdateScreen || !gateInformation) {
    return null;
  }

  const isDismissible = gateInformation.isDismissible();

  const handleUpdate = async () => {
    const storeURL = gateInformation.storeUrl;

    if (storeURL) {
      const opened = await Linking.openURL(storeURL);
      if (!opened) {
        console.warn('Failed to open store URL');
      }
    } else {
      console.warn('No store URL available');
    }
  };

  const handleSkip = () => {
    dismissUpdateGate();
  };

  return (
    <Modal
      visible={showUpdateScreen}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0A1828', '#178582', '#2EC4B6']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            {/* Icon/Emoji */}
            <View style={styles.iconContainer}>
              <MeerkatSvg width={72} height={72} color="#FFFFFF" />
            </View>

            {/* Title */}
            <Text style={styles.title}>New Version Available</Text>

            {/* Version Badge */}
            {gateInformation.latestVersion && (
              <View style={styles.badge}>
                <Text style={styles.badgeLabel}>Version </Text>
                <Text style={styles.badgeVersion}>
                  {gateInformation.latestVersion}
                </Text>
              </View>
            )}

            {/* Description */}
            {gateInformation.whatsNew && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>What's New:</Text>
                <Text style={styles.description}>
                  {gateInformation.whatsNew}
                </Text>
              </View>
            )}

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Buttons Container */}
            <View style={styles.buttonsContainer}>
              {/* Primary Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpdate}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryButtonText}>Update Now</Text>
              </TouchableOpacity>

              {/* Secondary Button (only for dismissible gates) */}
              {isDismissible && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSkip}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              )}
            </View>
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
    paddingHorizontal: 32,
    paddingTop: 100,
    paddingBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 72,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 32,
  },
  badgeLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  badgeVersion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  descriptionContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  spacer: {
    flex: 1,
  },
  buttonsContainer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A1828',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
});

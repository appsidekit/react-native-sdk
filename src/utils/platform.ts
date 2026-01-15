/**
 * Platform utilities for cross-platform support
 */

import { Platform, Linking } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';



/**
 * Get the current app version
 * @returns App version string
 */
export function getAppVersion(): string {
  // will only be null on web
  return Application.nativeApplicationVersion || '';
}

/**
 * Get current platform
 * @returns 'ios' or 'android'
 */
export function getPlatform(): 'ios' | 'android' {
  return Platform.OS as 'ios' | 'android';
}

/**
 * Get OS version
 * @returns OS version string
 */
export function getOSVersion(): string {
  const version = Platform.Version;
  return String(version);
}

/**
 * Get device model
 * @returns Device model string
 */
export function getDeviceModel(): string {
  return Device.modelName || '';
}

/**
 * Get country code from locale
 * @returns Country code (e.g., "US")
 */
export function getCountryCode(): string {
  try {
    // Try to get from Intl API
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parts = locale.split('-');
    if (parts.length > 1) {
      return parts[1].toUpperCase();
    }
  } catch (error) {
    // Fallback
  }
  return 'US';
}

/**
 * Get language code from locale
 * @returns Language code (e.g., "en")
 */
export function getLanguageCode(): string {
  try {
    // Try to get from Intl API
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parts = locale.split('-');
    return parts[0].toLowerCase();
  } catch (error) {
    // Fallback
  }
  return 'en';
}

/**
 * Open a URL in the system browser or app store
 * @param url URL to open
 * @returns Promise that resolves to true if successful
 */
export async function openURL(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get the appropriate store URL for the current platform
 * @param appStoreURL iOS App Store URL
 * @param playStoreURL Android Play Store URL
 * @returns Platform-specific store URL or null
 */
export function getStoreURL(
  appStoreURL?: string,
  playStoreURL?: string
): string | null {
  const platform = getPlatform();

  if (platform === 'ios' && appStoreURL) {
    return appStoreURL;
  }

  if (platform === 'android' && playStoreURL) {
    return playStoreURL;
  }

  // Fallback: try to use any available URL
  return appStoreURL || playStoreURL || null;
}

/**
 * SettingsStore - AsyncStorage wrapper for persistence
 *
 * Manages SDK settings with in-memory cache and AsyncStorage fallback
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { GateInformation } from '../models/GateInformation';
import { log, error } from '../utils/logger';
import type { AuthUser, FeatureFlag } from '../types';

// Storage keys
const KEYS = {
  ANALYTICS_ENABLED: 'sk_analytics_enabled',
  FIRST_LAUNCH: 'sk_first_launch',
  CACHED_GATE: 'sk_cached_gate_information',
  CACHED_FLAGS: 'sk_cached_flags',
  AUTH_SESSION: 'sk_auth_session',
};

/**
 * Persisted end-user session, kept so a signed-in user survives app restarts. Stored via
 * the secure store (see SettingsStore).
 */
export interface StoredAuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number; // Unix seconds
}

/**
 * SettingsStore class
 */
export class SettingsStore {
  private cache: Map<string, any> = new Map();
  private useMemoryOnly = false;
  constructor() {
    this.initializeCache();
  }

  // The session token is the one secret the SDK persists; it lives in the device Keychain /
  // Keystore via expo-secure-store, never in AsyncStorage.
  private readSession(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.AUTH_SESSION);
  }

  private writeSession(json: string): Promise<void> {
    return SecureStore.setItemAsync(KEYS.AUTH_SESSION, json);
  }

  private deleteSession(): Promise<void> {
    return SecureStore.deleteItemAsync(KEYS.AUTH_SESSION);
  }

  /**
   * Initialize in-memory cache
   */
  private async initializeCache(): Promise<void> {
    try {
      // Test if AsyncStorage is available
      await AsyncStorage.getItem('test');

      // Load initial values from AsyncStorage
      const analyticsEnabled = await this.getItem(KEYS.ANALYTICS_ENABLED);
      if (analyticsEnabled !== null) {
        this.cache.set(KEYS.ANALYTICS_ENABLED, analyticsEnabled === 'true');
      } else {
        this.cache.set(KEYS.ANALYTICS_ENABLED, true); // Default: enabled
      }

      const firstLaunch = await this.getItem(KEYS.FIRST_LAUNCH);
      if (firstLaunch !== null) {
        this.cache.set(KEYS.FIRST_LAUNCH, firstLaunch === 'true');
      } else {
        this.cache.set(KEYS.FIRST_LAUNCH, true); // Default: first launch
      }
    } catch (err) {
      error('AsyncStorage unavailable, using memory-only mode');
      this.useMemoryOnly = true;
      this.cache.set(KEYS.ANALYTICS_ENABLED, true);
      this.cache.set(KEYS.FIRST_LAUNCH, true);
    }
  }

  /**
   * Get item from AsyncStorage
   */
  private async getItem(key: string): Promise<string | null> {
    if (this.useMemoryOnly) {
      return null;
    }

    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      error(`Failed to get item from AsyncStorage: ${key}`, err);
      return null;
    }
  }

  /**
   * Set item in AsyncStorage
   */
  private async setItem(key: string, value: string): Promise<void> {
    if (this.useMemoryOnly) {
      return;
    }

    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      error(`Failed to set item in AsyncStorage: ${key}`, err);
    }
  }

  /**
   * Get analytics enabled state
   */
  async isAnalyticsEnabled(): Promise<boolean> {
    // Return from cache if available
    if (this.cache.has(KEYS.ANALYTICS_ENABLED)) {
      return this.cache.get(KEYS.ANALYTICS_ENABLED);
    }

    // Load from storage
    const value = await this.getItem(KEYS.ANALYTICS_ENABLED);
    const enabled = value !== null ? value === 'true' : true;
    this.cache.set(KEYS.ANALYTICS_ENABLED, enabled);
    return enabled;
  }

  /**
   * Set analytics enabled state
   */
  async setAnalyticsEnabled(enabled: boolean): Promise<void> {
    this.cache.set(KEYS.ANALYTICS_ENABLED, enabled);
    await this.setItem(KEYS.ANALYTICS_ENABLED, String(enabled));
    log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if this is the first launch
   */
  async isFirstLaunch(): Promise<boolean> {
    if (this.cache.has(KEYS.FIRST_LAUNCH)) {
      return this.cache.get(KEYS.FIRST_LAUNCH);
    }

    const value = await this.getItem(KEYS.FIRST_LAUNCH);
    const isFirst = value !== null ? value === 'true' : true;
    this.cache.set(KEYS.FIRST_LAUNCH, isFirst);
    return isFirst;
  }

  /**
   * Mark that the app has been launched
   */
  async markLaunched(): Promise<void> {
    this.cache.set(KEYS.FIRST_LAUNCH, false);
    await this.setItem(KEYS.FIRST_LAUNCH, 'false');
    log('Marked first launch complete');
  }

  /**
   * Get cached gate information
   */
  async getCachedGateInformation(): Promise<GateInformation | null> {
    if (this.cache.has(KEYS.CACHED_GATE)) {
      return this.cache.get(KEYS.CACHED_GATE);
    }

    try {
      const value = await this.getItem(KEYS.CACHED_GATE);
      if (value) {
        const data = JSON.parse(value);
        const gateInfo = new GateInformation(data);
        this.cache.set(KEYS.CACHED_GATE, gateInfo);
        return gateInfo;
      }
    } catch (err) {
      error('Failed to parse cached gate information', err);
    }

    return null;
  }

  /**
   * Set cached gate information
   */
  async setCachedGateInformation(
    gateInfo: GateInformation
  ): Promise<void> {
    this.cache.set(KEYS.CACHED_GATE, gateInfo);
    try {
      const json = JSON.stringify(gateInfo);
      await this.setItem(KEYS.CACHED_GATE, json);
      log('Cached gate information updated');
    } catch (err) {
      error('Failed to cache gate information', err);
    }
  }

  /**
   * Get cached feature flags, or null if none are stored or they're unparseable.
   */
  async getCachedFlags(): Promise<FeatureFlag[] | null> {
    if (this.cache.has(KEYS.CACHED_FLAGS)) {
      return this.cache.get(KEYS.CACHED_FLAGS);
    }

    try {
      const value = await this.getItem(KEYS.CACHED_FLAGS);
      if (value) {
        const flags = JSON.parse(value) as FeatureFlag[];
        this.cache.set(KEYS.CACHED_FLAGS, flags);
        return flags;
      }
    } catch (err) {
      error('Failed to parse cached flags', err);
    }

    return null;
  }

  /**
   * Cache feature flags for offline fallback.
   */
  async setCachedFlags(flags: FeatureFlag[]): Promise<void> {
    this.cache.set(KEYS.CACHED_FLAGS, flags);
    try {
      await this.setItem(KEYS.CACHED_FLAGS, JSON.stringify(flags));
      log(`Cached ${flags.length} feature flag(s)`);
    } catch (err) {
      error('Failed to cache flags', err);
    }
  }

  /**
   * Get the persisted end-user session, or null if none is stored or it's unparseable.
   * Expiry is the caller's concern (SideKit drops expired sessions on load).
   */
  async getAuthSession(): Promise<StoredAuthSession | null> {
    if (this.cache.has(KEYS.AUTH_SESSION)) {
      return this.cache.get(KEYS.AUTH_SESSION);
    }

    try {
      const value = await this.readSession();
      if (value) {
        const session = JSON.parse(value) as StoredAuthSession;
        this.cache.set(KEYS.AUTH_SESSION, session);
        return session;
      }
    } catch (err) {
      error('Failed to read stored auth session', err);
    }

    return null;
  }

  /**
   * Persist the end-user session (after a successful OTP verify). Always written to the
   * secure store (Keychain / Keystore), never AsyncStorage.
   */
  async setAuthSession(session: StoredAuthSession): Promise<void> {
    this.cache.set(KEYS.AUTH_SESSION, session);
    try {
      await this.writeSession(JSON.stringify(session));
      log('Auth session persisted');
    } catch (err) {
      error('Failed to persist auth session', err);
    }
  }

  /**
   * Remove the persisted end-user session (on logout or expiry).
   */
  async clearAuthSession(): Promise<void> {
    this.cache.delete(KEYS.AUTH_SESSION);
    try {
      await this.deleteSession();
      log('Auth session cleared');
    } catch (err) {
      error('Failed to clear auth session', err);
    }
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    this.cache.clear();
    // The session may live in the secure store, so clear it through the same path.
    await this.deleteSession().catch((err) =>
      error('Failed to clear auth session', err)
    );
    if (!this.useMemoryOnly) {
      try {
        await AsyncStorage.multiRemove([
          KEYS.ANALYTICS_ENABLED,
          KEYS.FIRST_LAUNCH,
          KEYS.CACHED_GATE,
          KEYS.CACHED_FLAGS,
        ]);
        log('Cleared all cached data');
      } catch (err) {
        error('Failed to clear cached data', err);
      }
    }
  }
}

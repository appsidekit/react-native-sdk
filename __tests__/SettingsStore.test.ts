import { SettingsStore } from '../src/core/SettingsStore';
import { GateInformation } from '../src/models/GateInformation';
import { VersionGateType } from '../src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    store = new SettingsStore();
  });

  describe('isAnalyticsEnabled', () => {
    it('should default to true', async () => {
      const enabled = await store.isAnalyticsEnabled();
      expect(enabled).toBe(true);
    });

    it('should return stored value', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('false');
      store = new SettingsStore();
      await new Promise((resolve) => setTimeout(resolve, 10)); // Wait for initialization

      const enabled = await store.isAnalyticsEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe('setAnalyticsEnabled', () => {
    it('should set analytics enabled state', async () => {
      await store.setAnalyticsEnabled(false);
      const enabled = await store.isAnalyticsEnabled();
      expect(enabled).toBe(false);
    });

    it('should persist to AsyncStorage', async () => {
      await store.setAnalyticsEnabled(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'sk_analytics_enabled',
        'false'
      );
    });
  });

  describe('isFirstLaunch', () => {
    it('should default to true', async () => {
      const isFirst = await store.isFirstLaunch();
      expect(isFirst).toBe(true);
    });

    it('should return stored value', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'sk_first_launch') return Promise.resolve('false');
        return Promise.resolve(null);
      });
      store = new SettingsStore();
      await new Promise((resolve) => setTimeout(resolve, 10));

      const isFirst = await store.isFirstLaunch();
      expect(isFirst).toBe(false);
    });
  });

  describe('markLaunched', () => {
    it('should mark first launch as complete', async () => {
      await store.markLaunched();
      const isFirst = await store.isFirstLaunch();
      expect(isFirst).toBe(false);
    });

    it('should persist to AsyncStorage', async () => {
      await store.markLaunched();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'sk_first_launch',
        'false'
      );
    });
  });

  describe('getCachedGateInformation', () => {
    it('should return null if no cache exists', async () => {
      const gateInfo = await store.getCachedGateInformation();
      expect(gateInfo).toBeNull();
    });

    it('should return cached gate information', async () => {
      const mockGateData = {
        gateType: VersionGateType.Forced,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update required',
        storeUrl: 'https://apps.apple.com/app/123',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockGateData)
      );

      const gateInfo = await store.getCachedGateInformation();
      expect(gateInfo).not.toBeNull();
      expect(gateInfo?.lastGateUpdate).toBe('2026-01-01T00:00:00Z');
    });

    it('should handle invalid JSON gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json');

      const gateInfo = await store.getCachedGateInformation();
      expect(gateInfo).toBeNull();
    });
  });

  describe('setCachedGateInformation', () => {
    it('should cache gate information', async () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Live,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: null,
        whatsNew: null,
        storeUrl: null,
      });

      await store.setCachedGateInformation(gateInfo);

      const cached = await store.getCachedGateInformation();
      expect(cached).not.toBeNull();
      expect(cached?.lastGateUpdate).toBe('2026-01-01T00:00:00Z');
    });

    it('should persist to AsyncStorage', async () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Live,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: null,
        whatsNew: null,
        storeUrl: null,
      });

      await store.setCachedGateInformation(gateInfo);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'sk_cached_gate_information',
        expect.any(String)
      );
    });
  });

  describe('clear', () => {
    it('should clear all cached data', async () => {
      await store.setAnalyticsEnabled(false);
      await store.markLaunched();

      await store.clear();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'sk_analytics_enabled',
        'sk_first_launch',
        'sk_cached_gate_information',
        'sk_cached_flags',
      ]);
      // The session lives in the secure store, so it's cleared through that path.
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sk_auth_session');
    });
  });

  describe('auth session (secure-by-default via expo-secure-store)', () => {
    const session = {
      token: 'tok_xyz',
      user: { id: 'u_1', handle: 'neo', createdAt: 100 },
      expiresAt: 9999,
    };

    it('returns null when no session is stored', async () => {
      expect(await store.getAuthSession()).toBeNull();
    });

    it('persists the session to the secure store, never AsyncStorage', async () => {
      await store.setAuthSession(session);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'sk_auth_session',
        JSON.stringify(session)
      );
      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
        'sk_auth_session',
        expect.any(String)
      );
      expect(await store.getAuthSession()).toEqual(session);
    });

    it('parses a session loaded from the secure store', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(
        JSON.stringify(session)
      );
      store = new SettingsStore();
      expect(await store.getAuthSession()).toEqual(session);
    });

    it('returns null on an unparseable stored session', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('not-json');
      store = new SettingsStore();
      expect(await store.getAuthSession()).toBeNull();
    });

    it('clears the session from the secure store', async () => {
      await store.setAuthSession(session);
      await store.clearAuthSession();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('sk_auth_session');
      expect(await store.getAuthSession()).toBeNull();
    });
  });


  describe('error handling', () => {
    it('should handle AsyncStorage.getItem errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      store = new SettingsStore();
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should default to true when error occurs
      const enabled = await store.isAnalyticsEnabled();
      expect(enabled).toBe(true);
    });

    it('should handle setAnalyticsEnabled errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(store.setAnalyticsEnabled(false)).resolves.not.toThrow();
    });

    it('should handle markLaunched errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(store.markLaunched()).resolves.not.toThrow();
    });

    it('should handle setCachedGateInformation errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const gateInfo = new GateInformation({
        gateType: VersionGateType.Live,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: null,
        whatsNew: null,
        storeUrl: null,
      });

      await expect(
        store.setCachedGateInformation(gateInfo)
      ).resolves.not.toThrow();
    });

    it('should handle clear errors gracefully', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(store.clear()).resolves.not.toThrow();
    });

    it('should handle getCachedGateInformation AsyncStorage errors', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const gateInfo = await store.getCachedGateInformation();
      expect(gateInfo).toBeNull();
    });
  });
});

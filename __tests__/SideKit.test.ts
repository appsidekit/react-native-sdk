import { SideKit } from '../src/core/SideKit';
import { SettingsStore } from '../src/core/SettingsStore';
import { Meerkat } from '../src/core/Meerkat';
import { AuthAgent } from '../src/core/AuthAgent';
import { GateInformation } from '../src/models/GateInformation';
import { VersionGateType } from '../src/types';

// Mock dependencies
jest.mock('../src/core/SettingsStore');
jest.mock('../src/core/Meerkat');
jest.mock('../src/core/AuthAgent');
jest.mock('../src/utils/lifecycle', () => ({
  subscribeToLifecycle: jest.fn(() => jest.fn()),
}));

describe('SideKit', () => {
  let sideKit: SideKit;

  beforeEach(() => {
    jest.clearAllMocks();
    sideKit = SideKit.shared;
    sideKit.reset();
  });

  describe('configure', () => {
    it('should configure SDK successfully', async () => {
      await sideKit.configure('test-api-key', {
        verbose: true,
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should throw error if API key is missing', async () => {
      await expect(
        sideKit.configure('')
      ).rejects.toThrow('API key is required');
    });

    it('should initialize SettingsStore', async () => {
      await sideKit.configure('test-api-key');
      expect(SettingsStore).toHaveBeenCalled();
    });

    it('should initialize Meerkat with API key', async () => {
      await sideKit.configure('test-api-key');
      expect(Meerkat).toHaveBeenCalledWith('test-api-key');
    });

    it('should check for first launch', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(true),
        markLaunched: jest.fn().mockResolvedValue(undefined),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      expect(mockSettingsStore.isFirstLaunch).toHaveBeenCalled();
      expect(mockSettingsStore.markLaunched).toHaveBeenCalled();
    });
  });

  describe('sendSignals', () => {
    beforeEach(async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');
    });

    it('should send single signal with key only', () => {
      sideKit.sendSignals([{ key: 'button_clicked' }]);

      const mockInstance = (Meerkat as jest.Mock).mock.results[0]
        .value;
      expect(mockInstance.sendSignals).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'button_clicked' }),
        ])
      );
    });

    it('should send single signal with key and value', () => {
      sideKit.sendSignals([{ key: 'button_clicked', value: 'signup' }]);

      const mockInstance = (Meerkat as jest.Mock).mock.results[0]
        .value;
      expect(mockInstance.sendSignals).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'button_clicked',
            value: 'signup',
          }),
        ])
      );
    });

    it('should send multiple signals at once', () => {
      sideKit.sendSignals([
        { key: 'page_view', value: 'home' },
        { key: 'button_clicked', value: 'signup' },
        { key: 'feature_used' },
      ]);

      const mockInstance = (Meerkat as jest.Mock).mock.results[0]
        .value;
      expect(mockInstance.sendSignals).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'page_view', value: 'home' }),
          expect.objectContaining({ name: 'button_clicked', value: 'signup' }),
          expect.objectContaining({ name: 'feature_used' }),
        ])
      );
    });

    it('should not send signals if analytics is disabled', () => {
      sideKit.isAnalyticsEnabled = false;
      sideKit.sendSignals([{ key: 'test_event' }]);

      const mockInstance = (Meerkat as jest.Mock).mock.results[0]
        .value;
      const calls = mockInstance.sendSignals.mock.calls;

      // Should only have the initial calls from configure (_app_open)
      // but not the test_event
      const hasTestEvent = calls.some((call: any[]) =>
        call[0].some((signal: any) => signal.name === 'test_event')
      );
      expect(hasTestEvent).toBe(false);
    });

    it('should handle empty signals array', () => {
      sideKit.sendSignals([]);

      const mockInstance = (Meerkat as jest.Mock).mock.results[0]
        .value;
      expect(mockInstance.sendSignals).toHaveBeenCalledWith([]);
    });
  });

  describe('isAnalyticsEnabled', () => {
    beforeEach(async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');
    });

    it('should get analytics enabled state', () => {
      expect(sideKit.isAnalyticsEnabled).toBe(true);
    });

    it('should set analytics enabled state', () => {
      sideKit.isAnalyticsEnabled = false;
      expect(sideKit.isAnalyticsEnabled).toBe(false);

      const mockInstance = (SettingsStore as jest.Mock).mock.results[0].value;
      expect(mockInstance.setAnalyticsEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on state change', async () => {
      const listener = jest.fn();

      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      const unsubscribe = sideKit.subscribe(listener);

      // Change analytics state
      sideKit.isAnalyticsEnabled = false;

      expect(listener).toHaveBeenCalled();

      // Unsubscribe
      unsubscribe();
      listener.mockClear();

      // Change state again
      sideKit.isAnalyticsEnabled = true;

      // Listener should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('version compliance', () => {
    it('should show forced update gate', async () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Forced,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update required',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(gateInfo),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      // Wait for version check
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sideKit.showUpdateScreen).toBe(true);
      expect(sideKit.gateInformation).not.toBeNull();
    });

    it('should not show gate for compliant version', async () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Live,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: null,
        whatsNew: null,
        storeUrl: null,
      });

      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(gateInfo),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      // Wait for version check
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sideKit.showUpdateScreen).toBe(false);
    });
  });

  describe('dismissUpdateGate', () => {
    it('should dismiss dismissible gate', async () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Dismissible,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(gateInfo),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      // Wait for version check
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sideKit.showUpdateScreen).toBe(true);

      sideKit.dismissUpdateGate();

      expect(sideKit.showUpdateScreen).toBe(false);
    });

    it('should not dismiss forced gate', async () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Forced,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update required',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(gateInfo),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sideKit.showUpdateScreen).toBe(true);

      sideKit.dismissUpdateGate();

      // Should still be showing because it's forced
      expect(sideKit.showUpdateScreen).toBe(true);
    });

    it('should handle dismissUpdateGate when not configured', () => {
      const result = sideKit.dismissUpdateGate();
      expect(result).toBeUndefined();
    });

    it('should handle dismissUpdateGate when update screen not shown', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      expect(sideKit.showUpdateScreen).toBe(false);

      sideKit.dismissUpdateGate();

      expect(sideKit.showUpdateScreen).toBe(false);
    });
  });

  describe('sendSignals when not configured', () => {
    it('should handle sendSignals when not configured', () => {
      const result = sideKit.sendSignals([{ key: 'test_event' }]);
      expect(result).toBeUndefined();
    });
  });

  describe('isAnalyticsEnabled setter', () => {
    it('should handle isAnalyticsEnabled setter when not configured', () => {
      sideKit.isAnalyticsEnabled = false;
      // Should not throw, just log error
      expect(true).toBe(true);
    });

    it('should handle settingsStore error when setting analytics', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockRejectedValue(new Error('Storage error')),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      sideKit.isAnalyticsEnabled = false;

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSettingsStore.setAnalyticsEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('reconfiguration', () => {
    it('should handle reconfiguration', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      // Configure again
      await sideKit.configure('test-api-key-2');

      expect(Meerkat).toHaveBeenCalledWith('test-api-key-2');
    });
  });

  describe('subscribe error handling', () => {
    it('should handle listener errors', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      sideKit.subscribe(errorListener);

      // Trigger state change
      sideKit.isAnalyticsEnabled = false;

      // Should not throw
      expect(errorListener).toHaveBeenCalled();
    });
  });

  describe('version compliance with cache fallback', () => {
    it('should use cached gate when API fails', async () => {
      const cachedGate = new GateInformation({
        gateType: VersionGateType.Forced,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Cached update',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(cachedGate),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null), // API returns null
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sideKit.showUpdateScreen).toBe(true);
      expect(sideKit.gateInformation?.whatsNew).toBe('Cached update');
    });
  });

  describe('lifecycle integration', () => {
    it('should trigger foreground handler on app foreground', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      const subscribeToLifecycle = require('../src/utils/lifecycle').subscribeToLifecycle;

      let onForegroundCallback: any;

      (subscribeToLifecycle as jest.Mock).mockImplementation(
        (onForeground: any) => {
          onForegroundCallback = onForeground;
          return jest.fn();
        }
      );

      await sideKit.configure('test-api-key');

      // Clear previous sendSignals calls
      mockMeerkat.sendSignals.mockClear();

      // Trigger foreground
      onForegroundCallback();

      // Should send _app_open signal
      expect(mockMeerkat.sendSignals).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: '_app_open' }),
        ])
      );

      // Wait for version check
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockMeerkat.getGateInformation).toHaveBeenCalled();
    });

    it('should trigger background handler on app background', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      const subscribeToLifecycle = require('../src/utils/lifecycle').subscribeToLifecycle;

      let onBackgroundCallback: any;

      (subscribeToLifecycle as jest.Mock).mockImplementation(
        (_onForeground: any, onBackground: any) => {
          onBackgroundCallback = onBackground;
          return jest.fn();
        }
      );

      await sideKit.configure('test-api-key');

      // Trigger background
      onBackgroundCallback();

      // Background handler currently just logs, so verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('error handling in sendSignals', () => {
    it('should handle sendSignals rejection', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockMeerkat = {
        sendSignals: jest.fn().mockRejectedValue(new Error('Network error')),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };

      (Meerkat as jest.Mock).mockImplementation(
        () => mockMeerkat
      );

      await sideKit.configure('test-api-key');

      // Send signals that will fail
      sideKit.sendSignals([{ key: 'test_event' }]);

      // Wait for async rejection
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not throw, error should be caught
      expect(true).toBe(true);
    });
  });

  describe('auth', () => {
    const PHONE = '+15555550100';
    const user = { id: 'u_1', handle: null, createdAt: 100 };

    // Build SettingsStore + AuthAgent mocks, wire them in, and configure. Returns the
    // mocks so each test can assert/override behavior.
    async function setupAuth(overrides?: {
      authAgent?: Partial<Record<string, jest.Mock>>;
      storedSession?: unknown;
    }) {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        markLaunched: jest.fn().mockResolvedValue(undefined),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        getCachedFlags: jest.fn().mockResolvedValue(null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(overrides?.storedSession ?? null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };
      (SettingsStore as jest.Mock).mockImplementation(() => mockSettingsStore);

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(null),
      };
      (Meerkat as jest.Mock).mockImplementation(() => mockMeerkat);

      const mockAuthAgent = {
        signIn: jest.fn(),
        verifyOtp: jest.fn(),
        setHandle: jest.fn(),
        logout: jest.fn().mockResolvedValue({ ok: true, data: {} }),
        ...overrides?.authAgent,
      };
      (AuthAgent as jest.Mock).mockImplementation(() => mockAuthAgent);

      await sideKit.configure('test-api-key');
      return { mockSettingsStore, mockAuthAgent };
    }

    it('initializes AuthAgent with the API key', async () => {
      await setupAuth();
      expect(AuthAgent).toHaveBeenCalledWith('test-api-key');
    });

    it('starts signed out', async () => {
      await setupAuth();
      expect(sideKit.isAuthenticated).toBe(false);
      expect(sideKit.authUser).toBeNull();
      expect(sideKit.sessionToken).toBeNull();
    });

    it('verifyOtp persists the session and updates auth state', async () => {
      const { mockSettingsStore } = await setupAuth({
        authAgent: {
          verifyOtp: jest
            .fn()
            .mockResolvedValue({ ok: true, data: { sessionToken: 'tok_xyz', expiresAt: 9999, user, newUser: true } }),
        },
      });

      const res = await sideKit.verifyOtp({ requestId: 'otp_1', identifier: PHONE, code: '123456' });

      expect(res).toEqual({ ok: true, data: { user, isNewUser: true } });
      expect(sideKit.isAuthenticated).toBe(true);
      expect(sideKit.sessionToken).toBe('tok_xyz');
      expect(sideKit.authUser).toEqual(user);
      expect(mockSettingsStore.setAuthSession).toHaveBeenCalledWith({
        token: 'tok_xyz',
        user,
        expiresAt: 9999,
      });
    });

    it('verifyOtp leaves state signed out on failure', async () => {
      await setupAuth({
        authAgent: {
          verifyOtp: jest.fn().mockResolvedValue({ ok: false, error: 'invalid_code', status: 401 }),
        },
      });

      const res = await sideKit.verifyOtp({ requestId: 'otp_1', identifier: PHONE, code: '000000' });

      expect(res).toEqual({ ok: false, error: 'invalid_code', status: 401 });
      expect(sideKit.isAuthenticated).toBe(false);
    });

    it('restores a valid persisted session on configure', async () => {
      await setupAuth({ storedSession: { token: 'tok_old', user, expiresAt: 9999999999 } });
      expect(sideKit.isAuthenticated).toBe(true);
      expect(sideKit.sessionToken).toBe('tok_old');
    });

    it('drops an expired persisted session on configure', async () => {
      const { mockSettingsStore } = await setupAuth({
        storedSession: { token: 'tok_old', user, expiresAt: 1 },
      });
      expect(sideKit.isAuthenticated).toBe(false);
      expect(mockSettingsStore.clearAuthSession).toHaveBeenCalled();
    });

    it('setHandle updates the local user on success', async () => {
      const { mockAuthAgent } = await setupAuth({
        authAgent: {
          verifyOtp: jest
            .fn()
            .mockResolvedValue({ ok: true, data: { sessionToken: 'tok_xyz', expiresAt: 9999, user, newUser: true } }),
          setHandle: jest.fn().mockResolvedValue({ ok: true, data: { handle: 'neo' } }),
        },
      });
      await sideKit.verifyOtp({ requestId: 'otp_1', identifier: PHONE, code: '123456' });

      const res = await sideKit.setHandle('neo');

      expect(res).toEqual({ ok: true, data: { handle: 'neo' } });
      expect(mockAuthAgent.setHandle).toHaveBeenCalledWith('tok_xyz', 'neo');
      expect(sideKit.authUser?.handle).toBe('neo');
    });

    it('setHandle returns unauthorized when signed out', async () => {
      const { mockAuthAgent } = await setupAuth();
      const res = await sideKit.setHandle('neo');
      expect(res).toEqual({ ok: false, error: 'unauthorized', status: 401 });
      expect(mockAuthAgent.setHandle).not.toHaveBeenCalled();
    });

    it('logout revokes server-side and clears local state', async () => {
      const { mockSettingsStore, mockAuthAgent } = await setupAuth({
        authAgent: {
          verifyOtp: jest
            .fn()
            .mockResolvedValue({ ok: true, data: { sessionToken: 'tok_xyz', expiresAt: 9999, user, newUser: true } }),
        },
      });
      await sideKit.verifyOtp({ requestId: 'otp_1', identifier: PHONE, code: '123456' });

      await sideKit.logout();

      expect(mockAuthAgent.logout).toHaveBeenCalledWith('tok_xyz');
      expect(mockSettingsStore.clearAuthSession).toHaveBeenCalled();
      expect(sideKit.isAuthenticated).toBe(false);
      expect(sideKit.authUser).toBeNull();
    });
  });

  describe('feature flags', () => {
    const FLAGS = [
      { key: 'dark_mode', value: true, isFlag: true, updatedAt: '2026-01-01T00:00:00Z' },
      { key: 'beta', value: false, isFlag: true, updatedAt: '2026-01-01T00:00:00Z' },
      { key: 'welcome_msg', value: 'Hi there', isFlag: false, updatedAt: '2026-01-01T00:00:00Z' },
    ];

    // Wire mocks where getFlags resolves to `serverFlags` and the cache to `cachedFlags`,
    // then configure. Returns the mocks for assertions.
    async function setupFlags(opts?: {
      serverFlags?: unknown;
      cachedFlags?: unknown;
    }) {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        markLaunched: jest.fn().mockResolvedValue(undefined),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
        getCachedFlags: jest.fn().mockResolvedValue(opts?.cachedFlags ?? null),
        setCachedFlags: jest.fn().mockResolvedValue(undefined),
        getAuthSession: jest.fn().mockResolvedValue(null),
        setAuthSession: jest.fn().mockResolvedValue(undefined),
        clearAuthSession: jest.fn().mockResolvedValue(undefined),
      };
      (SettingsStore as jest.Mock).mockImplementation(() => mockSettingsStore);

      const mockMeerkat = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
        getFlags: jest.fn().mockResolvedValue(opts?.serverFlags ?? null),
      };
      (Meerkat as jest.Mock).mockImplementation(() => mockMeerkat);

      await sideKit.configure('test-api-key');
      return { mockSettingsStore, mockMeerkat };
    }

    it('populates flags from the server on configure and caches them', async () => {
      const { mockSettingsStore } = await setupFlags({ serverFlags: FLAGS });
      expect(sideKit.flags).toEqual(FLAGS);
      expect(mockSettingsStore.setCachedFlags).toHaveBeenCalledWith(FLAGS);
    });

    it('falls back to cached flags when the server is unavailable', async () => {
      await setupFlags({ serverFlags: null, cachedFlags: FLAGS });
      expect(sideKit.flags).toEqual(FLAGS);
    });

    it('flag() returns the boolean value for a boolean flag', async () => {
      await setupFlags({ serverFlags: FLAGS });
      expect(sideKit.flag('dark_mode')).toBe(true);
      expect(sideKit.flag('beta')).toBe(false);
    });

    it('flag() returns the default for missing keys or non-boolean entries', async () => {
      await setupFlags({ serverFlags: FLAGS });
      expect(sideKit.flag('missing')).toBe(false);
      expect(sideKit.flag('missing', true)).toBe(true);
      // welcome_msg is a string config, not a boolean flag
      expect(sideKit.flag('welcome_msg', true)).toBe(true);
    });

    it('config() returns the string value for a config entry', async () => {
      await setupFlags({ serverFlags: FLAGS });
      expect(sideKit.config('welcome_msg')).toBe('Hi there');
    });

    it('config() returns the default for missing keys or boolean flags', async () => {
      await setupFlags({ serverFlags: FLAGS });
      expect(sideKit.config('missing')).toBe('');
      expect(sideKit.config('missing', 'fallback')).toBe('fallback');
      // dark_mode is a boolean flag, not a string config
      expect(sideKit.config('dark_mode', 'fallback')).toBe('fallback');
    });

    it('refreshFlags() updates flags and notifies listeners', async () => {
      const { mockMeerkat } = await setupFlags({ serverFlags: [] });
      const listener = jest.fn();
      sideKit.subscribe(listener);

      mockMeerkat.getFlags.mockResolvedValueOnce(FLAGS);
      await sideKit.refreshFlags();

      expect(sideKit.flags).toEqual(FLAGS);
      expect(listener).toHaveBeenCalled();
    });
  });
});

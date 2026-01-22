import { SideKit } from '../src/core/SideKit';
import { SettingsStore } from '../src/core/SettingsStore';
import { AnalyticsAgent } from '../src/core/AnalyticsAgent';
import { GateInformation } from '../src/models/GateInformation';
import { VersionGateType } from '../src/types';

// Mock dependencies
jest.mock('../src/core/SettingsStore');
jest.mock('../src/core/AnalyticsAgent');
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

    it('should initialize AnalyticsAgent with API key', async () => {
      await sideKit.configure('test-api-key');
      expect(AnalyticsAgent).toHaveBeenCalledWith('test-api-key');
    });

    it('should check for first launch', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(true),
        markLaunched: jest.fn().mockResolvedValue(undefined),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
      );

      await sideKit.configure('test-api-key');

      expect(mockSettingsStore.isFirstLaunch).toHaveBeenCalled();
      expect(mockSettingsStore.markLaunched).toHaveBeenCalled();
    });
  });

  describe('sendSignal', () => {
    beforeEach(async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
      );

      await sideKit.configure('test-api-key');
    });

    it('should send signal with key only', () => {
      sideKit.sendSignal('button_clicked');

      const mockInstance = (AnalyticsAgent as jest.Mock).mock.results[0]
        .value;
      expect(mockInstance.sendSignals).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'button_clicked' }),
        ])
      );
    });

    it('should send signal with key and value', () => {
      sideKit.sendSignal('button_clicked', 'signup');

      const mockInstance = (AnalyticsAgent as jest.Mock).mock.results[0]
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

    it('should not send signal if analytics is disabled', () => {
      sideKit.isAnalyticsEnabled = false;
      sideKit.sendSignal('test_event');

      const mockInstance = (AnalyticsAgent as jest.Mock).mock.results[0]
        .value;
      const calls = mockInstance.sendSignals.mock.calls;

      // Should only have the initial calls from configure (_app_open)
      // but not the test_event
      const hasTestEvent = calls.some((call: any[]) =>
        call[0].some((signal: any) => signal.name === 'test_event')
      );
      expect(hasTestEvent).toBe(false);
    });
  });

  describe('isAnalyticsEnabled', () => {
    beforeEach(async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(gateInfo),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(gateInfo),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
      );

      await sideKit.configure('test-api-key');

      // Wait for version check
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sideKit.showUpdateScreen).toBe(false);
    });
  });

  describe('dismissUpdateGate', () => {
    it('should dismiss dismissable gate', async () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Dismissable,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(gateInfo),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(gateInfo),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
      );

      await sideKit.configure('test-api-key');

      expect(sideKit.showUpdateScreen).toBe(false);

      sideKit.dismissUpdateGate();

      expect(sideKit.showUpdateScreen).toBe(false);
    });
  });

  describe('sendSignal', () => {
    it('should handle sendSignal when not configured', () => {
      const result = sideKit.sendSignal('test_event');
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
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
      );

      await sideKit.configure('test-api-key');

      // Configure again
      await sideKit.configure('test-api-key-2');

      expect(AnalyticsAgent).toHaveBeenCalledWith('test-api-key-2');
    });
  });

  describe('subscribe error handling', () => {
    it('should handle listener errors', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        setAnalyticsEnabled: jest.fn().mockResolvedValue(undefined),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null), // API returns null
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
        setCachedGateInformation: jest.fn().mockResolvedValue(undefined),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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
      mockAnalyticsAgent.sendSignals.mockClear();

      // Trigger foreground
      onForegroundCallback();

      // Should send _app_open signal
      expect(mockAnalyticsAgent.sendSignals).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: '_app_open' }),
        ])
      );

      // Wait for version check
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockAnalyticsAgent.getGateInformation).toHaveBeenCalled();
    });

    it('should trigger background handler on app background', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockResolvedValue(undefined),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
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

  describe('error handling in sendSignal', () => {
    it('should handle sendSignals rejection', async () => {
      const mockSettingsStore = {
        isAnalyticsEnabled: jest.fn().mockResolvedValue(true),
        isFirstLaunch: jest.fn().mockResolvedValue(false),
        getCachedGateInformation: jest.fn().mockResolvedValue(null),
      };

      (SettingsStore as jest.Mock).mockImplementation(
        () => mockSettingsStore
      );

      const mockAnalyticsAgent = {
        sendSignals: jest.fn().mockRejectedValue(new Error('Network error')),
        getGateInformation: jest.fn().mockResolvedValue(null),
      };

      (AnalyticsAgent as jest.Mock).mockImplementation(
        () => mockAnalyticsAgent
      );

      await sideKit.configure('test-api-key');

      // Send signal that will fail
      sideKit.sendSignal('test_event');

      // Wait for async rejection
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not throw, error should be caught
      expect(true).toBe(true);
    });
  });
});

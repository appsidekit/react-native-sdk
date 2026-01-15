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
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: { version: '2.0.0', type: VersionGateType.Forced },
        blockedVersions: [],
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
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: { version: '1.0.0', type: VersionGateType.Forced },
        blockedVersions: [],
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
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.0.0', type: VersionGateType.Dismissable },
        ],
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
  });
});

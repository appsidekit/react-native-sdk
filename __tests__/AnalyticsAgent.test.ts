import { AnalyticsAgent } from '../src/core/AnalyticsAgent';
import { VersionGateType } from '../src/types';

// Mock fetch
global.fetch = jest.fn();

describe('AnalyticsAgent', () => {
  let agent: AnalyticsAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new AnalyticsAgent('test-api-key', '1.0.0');
  });

  describe('getGateInformation', () => {
    it('should fetch gate information successfully', async () => {
      const mockGateData = {
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: { version: '2.0.0', type: VersionGateType.Forced },
        blockedVersions: [],
        latestVersion: '2.1.0',
        whatsNew: 'Bug fixes',
        appStoreURL: 'https://apps.apple.com/app/123',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockGateData,
      });

      const gateInfo = await agent.getGateInformation();

      expect(gateInfo).not.toBeNull();
      expect(gateInfo?.lastGateUpdate).toBe('2026-01-01T00:00:00Z');
      expect(gateInfo?.latestVersion).toBe('2.1.0');

      // Verify request
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.appsidekit.com/v1/version',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'API-Key': 'test-api-key',
          }),
        })
      );
    });

    it('should return null on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const gateInfo = await agent.getGateInformation();
      expect(gateInfo).toBeNull();
    });

    it('should return null on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const gateInfo = await agent.getGateInformation();
      expect(gateInfo).toBeNull();
    });

    it('should include correct headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          lastGateUpdate: '2026-01-01T00:00:00Z',
          blockedVersions: [],
        }),
      });

      await agent.getGateInformation();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'API-Key': 'test-api-key',
          },
        })
      );
    });
  });

  describe('sendSignals', () => {
    it('should send signals successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
      });

      const signals = [
        { name: 'button_clicked', value: 'signup' },
        { name: 'page_view', value: '/home' },
      ];

      await agent.sendSignals(signals);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.appsidekit.com/v1',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'API-Key': 'test-api-key',
          }),
        })
      );
    });

    it('should include metadata in payload', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
      });

      const signals = [{ name: 'test_event', value: 'test_value' }];

      await agent.sendSignals(signals);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toHaveProperty('osVersion');
      expect(body).toHaveProperty('appVersion', '1.0.0');
      expect(body).toHaveProperty('country');
      expect(body).toHaveProperty('language');
      expect(body).toHaveProperty('platform');
      expect(body).toHaveProperty('deviceModel');
      expect(body).toHaveProperty('signals');
      expect(body.signals).toHaveLength(1);
      expect(body.signals[0]).toEqual({
        name: 'test_event',
        value: 'test_value',
      });
    });

    it('should not throw on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const signals = [{ name: 'test', value: '' }];

      // Should not throw
      await expect(agent.sendSignals(signals)).resolves.not.toThrow();
    });

    it('should not throw on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const signals = [{ name: 'test', value: '' }];

      // Should not throw
      await expect(agent.sendSignals(signals)).resolves.not.toThrow();
    });

    it('should handle empty signals array', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
      });

      await agent.sendSignals([]);

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

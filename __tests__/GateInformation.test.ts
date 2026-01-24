import { GateInformation } from '../src/models/GateInformation';
import { VersionGateType } from '../src/types';

describe('GateInformation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBlocked', () => {
    it('should return true when gateType is Forced', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Forced,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update required',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isBlocked()).toBe(true);
    });

    it('should return true when gateType is Dismissible', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Dismissible,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isBlocked()).toBe(true);
    });

    it('should return true when gateType is Modal', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Modal,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isBlocked()).toBe(true);
    });

    it('should return false when gateType is Live', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Live,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: null,
        whatsNew: null,
        storeUrl: null,
      });

      expect(gateInfo.isBlocked()).toBe(false);
    });
  });

  describe('blockingGateType', () => {
    it('should return Forced when gateType is Forced', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Forced,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update required',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.blockingGateType()).toBe(VersionGateType.Forced);
    });

    it('should return Dismissible when gateType is Dismissible', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Dismissible,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.blockingGateType()).toBe(VersionGateType.Dismissible);
    });

    it('should return Modal when gateType is Modal', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Modal,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.blockingGateType()).toBe(VersionGateType.Modal);
    });

    it('should return null when gateType is Live', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Live,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: null,
        whatsNew: null,
        storeUrl: null,
      });

      expect(gateInfo.blockingGateType()).toBe(null);
    });
  });

  describe('isDismissible', () => {
    it('should return true for Dismissible gate type', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Dismissible,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isDismissible()).toBe(true);
    });

    it('should return true for Modal gate type', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Modal,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isDismissible()).toBe(true);
    });

    it('should return false for Forced gate type', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Forced,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update required',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isDismissible()).toBe(false);
    });

    it('should return false for Live gate type', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Live,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: null,
        whatsNew: null,
        storeUrl: null,
      });

      expect(gateInfo.isDismissible()).toBe(false);
    });
  });

  describe('isForced', () => {
    it('should return true for Forced gate type', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Forced,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update required',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isForced()).toBe(true);
    });

    it('should return false for Dismissible gate type', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Dismissible,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isForced()).toBe(false);
    });

    it('should return false for Modal gate type', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Modal,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: '2.0.0',
        whatsNew: 'Update available',
        storeUrl: 'https://apps.apple.com/app/123',
      });

      expect(gateInfo.isForced()).toBe(false);
    });

    it('should return false for Live gate type', () => {
      const gateInfo = new GateInformation({
        gateType: VersionGateType.Live,
        lastGateUpdate: '2026-01-01T00:00:00Z',
        latestVersion: null,
        whatsNew: null,
        storeUrl: null,
      });

      expect(gateInfo.isForced()).toBe(false);
    });
  });
});

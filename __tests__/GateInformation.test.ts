import { GateInformation } from '../src/models/GateInformation';
import { SemanticVersion } from '../src/models/SemanticVersion';
import { VersionGateType } from '../src/types';

describe('GateInformation', () => {
  describe('isBlocked', () => {
    it('should return true if current version < minVersion', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: {
          version: '2.0.0',
          type: VersionGateType.Forced,
        },
        blockedVersions: [],
      });

      const currentVersion = new SemanticVersion('1.0.0');
      expect(gateInfo.isBlocked(currentVersion)).toBe(true);
    });

    it('should return false if current version >= minVersion', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: {
          version: '2.0.0',
          type: VersionGateType.Forced,
        },
        blockedVersions: [],
      });

      const currentVersion = new SemanticVersion('2.0.0');
      expect(gateInfo.isBlocked(currentVersion)).toBe(false);

      const higherVersion = new SemanticVersion('2.1.0');
      expect(gateInfo.isBlocked(higherVersion)).toBe(false);
    });

    it('should return true if current version is in blockedVersions', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.2.3', type: VersionGateType.Forced },
          { version: '1.2.4', type: VersionGateType.Dismissable },
        ],
      });

      const blockedVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.isBlocked(blockedVersion)).toBe(true);

      const anotherBlockedVersion = new SemanticVersion('1.2.4');
      expect(gateInfo.isBlocked(anotherBlockedVersion)).toBe(true);
    });

    it('should return false if current version is not in blockedVersions', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.2.3', type: VersionGateType.Forced },
        ],
      });

      const unblockedVersion = new SemanticVersion('1.2.5');
      expect(gateInfo.isBlocked(unblockedVersion)).toBe(false);
    });

    it('should check both minVersion and blockedVersions', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: {
          version: '2.0.0',
          type: VersionGateType.Forced,
        },
        blockedVersions: [
          { version: '2.1.0', type: VersionGateType.Dismissable },
        ],
      });

      // Blocked by minVersion
      const belowMin = new SemanticVersion('1.5.0');
      expect(gateInfo.isBlocked(belowMin)).toBe(true);

      // Blocked by blockedVersions
      const explicitlyBlocked = new SemanticVersion('2.1.0');
      expect(gateInfo.isBlocked(explicitlyBlocked)).toBe(true);

      // Not blocked
      const validVersion = new SemanticVersion('2.2.0');
      expect(gateInfo.isBlocked(validVersion)).toBe(false);
    });

    it('should return false if no requirements set', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [],
      });

      const anyVersion = new SemanticVersion('1.0.0');
      expect(gateInfo.isBlocked(anyVersion)).toBe(false);
    });

    it('should handle invalid version formats gracefully', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: {
          version: 'invalid',
          type: VersionGateType.Forced,
        },
        blockedVersions: [
          { version: 'also-invalid', type: VersionGateType.Dismissable },
        ],
      });

      const currentVersion = new SemanticVersion('1.0.0');
      // Should not crash and return false when versions are invalid
      expect(gateInfo.isBlocked(currentVersion)).toBe(false);
    });
  });

  describe('blockingGateType', () => {
    it('should return minVersion type if blocked by minVersion', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: {
          version: '2.0.0',
          type: VersionGateType.Forced,
        },
        blockedVersions: [],
      });

      const currentVersion = new SemanticVersion('1.0.0');
      expect(gateInfo.blockingGateType(currentVersion)).toBe(
        VersionGateType.Forced
      );
    });

    it('should return blockedVersion type if blocked by blockedVersions', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.2.3', type: VersionGateType.Dismissable },
        ],
      });

      const currentVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.blockingGateType(currentVersion)).toBe(
        VersionGateType.Dismissable
      );
    });

    it('should return null if not blocked', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: {
          version: '1.0.0',
          type: VersionGateType.Forced,
        },
        blockedVersions: [],
      });

      const currentVersion = new SemanticVersion('2.0.0');
      expect(gateInfo.blockingGateType(currentVersion)).toBe(null);
    });

    it('should prioritize minVersion over blockedVersions', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        minVersion: {
          version: '2.0.0',
          type: VersionGateType.Forced,
        },
        blockedVersions: [
          { version: '1.5.0', type: VersionGateType.Dismissable },
        ],
      });

      // This version matches blockedVersions but is also below minVersion
      // Should return minVersion type
      const currentVersion = new SemanticVersion('1.5.0');
      expect(gateInfo.blockingGateType(currentVersion)).toBe(
        VersionGateType.Forced
      );
    });
  });

  describe('isDismissable', () => {
    it('should return true for Dismissable gate type', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.2.3', type: VersionGateType.Dismissable },
        ],
      });

      const currentVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.isDismissable(currentVersion)).toBe(true);
    });

    it('should return true for Modal gate type', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.2.3', type: VersionGateType.Modal },
        ],
      });

      const currentVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.isDismissable(currentVersion)).toBe(true);
    });

    it('should return false for Forced gate type', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.2.3', type: VersionGateType.Forced },
        ],
      });

      const currentVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.isDismissable(currentVersion)).toBe(false);
    });

    it('should return false if not blocked', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [],
      });

      const currentVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.isDismissable(currentVersion)).toBe(false);
    });
  });

  describe('isForced', () => {
    it('should return true for Forced gate type', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.2.3', type: VersionGateType.Forced },
        ],
      });

      const currentVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.isForced(currentVersion)).toBe(true);
    });

    it('should return false for Dismissable gate type', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [
          { version: '1.2.3', type: VersionGateType.Dismissable },
        ],
      });

      const currentVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.isForced(currentVersion)).toBe(false);
    });

    it('should return false if not blocked', () => {
      const gateInfo = new GateInformation({
        lastGateUpdate: '2026-01-01T00:00:00Z',
        blockedVersions: [],
      });

      const currentVersion = new SemanticVersion('1.2.3');
      expect(gateInfo.isForced(currentVersion)).toBe(false);
    });
  });
});

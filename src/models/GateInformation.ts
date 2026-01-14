import { SemanticVersion } from './SemanticVersion';
import { VersionGateType, Gate, GateInformation as GateInfo } from '../types';

/**
 * GateInformation class with blocking logic
 *
 * Determines if a given version is blocked and what type of gate to show
 */
export class GateInformation implements GateInfo {
  lastGateUpdate: string;
  minVersion?: Gate;
  blockedVersions: Gate[];
  latestVersion?: string;
  whatsNew?: string;
  appStoreURL?: string;

  constructor(data: GateInfo) {
    this.lastGateUpdate = data.lastGateUpdate;
    this.minVersion = data.minVersion;
    this.blockedVersions = data.blockedVersions || [];
    this.latestVersion = data.latestVersion;
    this.whatsNew = data.whatsNew;
    this.appStoreURL = data.appStoreURL;
  }

  /**
   * Check if a version is blocked
   * @param currentVersion Current app version
   * @returns true if version is blocked
   */
  isBlocked(currentVersion: SemanticVersion): boolean {
    // Check if current version < minVersion
    if (this.minVersion) {
      try {
        const minSemanticVersion = new SemanticVersion(this.minVersion.version);
        if (currentVersion.lessThan(minSemanticVersion)) {
          return true;
        }
      } catch (error) {
        // Invalid minVersion format, skip check
      }
    }

    // Check if current version is in blockedVersions array
    for (const blockedGate of this.blockedVersions) {
      try {
        const blockedVersion = new SemanticVersion(blockedGate.version);
        if (currentVersion.equals(blockedVersion)) {
          return true;
        }
      } catch (error) {
        // Invalid blocked version format, skip
      }
    }

    return false;
  }

  /**
   * Get the gate type for a blocked version
   * @param currentVersion Current app version
   * @returns Gate type or null if not blocked
   */
  blockingGateType(currentVersion: SemanticVersion): VersionGateType | null {
    // Check if blocked by minVersion
    if (this.minVersion) {
      try {
        const minSemanticVersion = new SemanticVersion(this.minVersion.version);
        if (currentVersion.lessThan(minSemanticVersion)) {
          return this.minVersion.type;
        }
      } catch (error) {
        // Invalid minVersion format, skip
      }
    }

    // Check if blocked by blockedVersions array
    for (const blockedGate of this.blockedVersions) {
      try {
        const blockedVersion = new SemanticVersion(blockedGate.version);
        if (currentVersion.equals(blockedVersion)) {
          return blockedGate.type;
        }
      } catch (error) {
        // Invalid blocked version format, skip
      }
    }

    return null;
  }

  /**
   * Check if the gate is dismissable
   * @param currentVersion Current app version
   * @returns true if gate is dismissable
   */
  isDismissable(currentVersion: SemanticVersion): boolean {
    const gateType = this.blockingGateType(currentVersion);
    return (
      gateType === VersionGateType.Dismissable ||
      gateType === VersionGateType.Modal
    );
  }

  /**
   * Check if the gate is forced (non-dismissable)
   * @param currentVersion Current app version
   * @returns true if gate is forced
   */
  isForced(currentVersion: SemanticVersion): boolean {
    const gateType = this.blockingGateType(currentVersion);
    return gateType === VersionGateType.Forced;
  }
}

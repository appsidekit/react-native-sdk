import { VersionGateType } from '../types';

/**
 * Raw gate information data from API
 */
export interface GateInformationData {
  gateType: VersionGateType;
  lastGateUpdate: string;
  latestVersion: string | null;
  whatsNew: string | null;
  storeUrl: string | null;
}

/**
 * GateInformation class
 *
 * Contains version gate information returned from the API
 */
export class GateInformation {
  /** Gate type determined by server */
  private readonly gateType: VersionGateType;
  /** ISO 8601 timestamp of last gate update */
  readonly lastGateUpdate: string;
  /** Latest available version */
  readonly latestVersion: string | null;
  /** Description of the update */
  readonly whatsNew: string | null;
  /** Store URL */
  readonly storeUrl: string | null;

  constructor(data: GateInformationData) {
    this.gateType = data.gateType;
    this.lastGateUpdate = data.lastGateUpdate;
    this.latestVersion = data.latestVersion;
    this.whatsNew = data.whatsNew;
    this.storeUrl = data.storeUrl;
  }

  /**
   * Get the gate type for the current version
   * @returns Gate type or null if not blocked
   */
  blockingGateType(): VersionGateType | null {
    return this.gateType === VersionGateType.Live ? null : this.gateType;
  }

  /**
   * Check if the current app version is blocked
   * @returns true if version is blocked
   */
  isBlocked(): boolean {
    return this.gateType !== VersionGateType.Live;
  }

  /**
   * Check if the gate is dismissible for the current app version
   * @returns true if gate is dismissible
   */
  isDismissible(): boolean {
    return (
      this.gateType === VersionGateType.Dismissible ||
      this.gateType === VersionGateType.Modal
    );
  }

  /**
   * Check if the gate is forced (non-dismissible) for the current app version
   * @returns true if gate is forced
   */
  isForced(): boolean {
    return this.gateType === VersionGateType.Forced;
  }
}

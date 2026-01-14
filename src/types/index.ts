/**
 * Configuration options for SideKit SDK
 */
export interface ConfigOptions {
  /**
   * Presentation mode for update gates
   * - automatic: SDK automatically shows update screen
   * - manual: Developer controls when to show update screen
   */
  readonly presentationMode?: UpdatePresentationMode;

  /**
   * Enable verbose logging for debugging
   * @default false
   */
  readonly verbose?: boolean;

  /**
   * Current app version (required)
   * Should match the version in your app's package.json or info.plist
   */
  readonly appVersion?: string;
}

/**
 * Presentation mode for update gates
 */
export type UpdatePresentationMode = 'automatic' | 'manual';

/**
 * Version gate type
 */
export enum VersionGateType {
  /** User must update (no skip button) */
  Forced = 0,
  /** User can skip update */
  Dismissable = 1,
  /** Modal presentation */
  Modal = 2,
}

/**
 * Gate configuration
 */
export interface Gate {
  /** Version string (e.g., "1.2.3") */
  version: string;
  /** Gate type (forced, dismissable, modal) */
  type: VersionGateType;
}

/**
 * Gate information from API
 */
export interface GateInformation {
  /** ISO 8601 timestamp of last gate update */
  lastGateUpdate: string;
  /** Minimum required version */
  minVersion?: Gate;
  /** Array of blocked versions */
  blockedVersions: Gate[];
  /** Latest available version */
  latestVersion?: string;
  /** Update description */
  whatsNew?: string;
  /** App Store URL */
  appStoreURL?: string;
}

/**
 * Analytics signal
 */
export interface Signal {
  /** Signal name */
  name: string;
  /** Signal value */
  value: string;
}

/**
 * Signal payload sent to API
 */
export interface SignalPayload {
  osVersion: string;
  appVersion: string;
  country: string;
  language: string;
  platform: string;
  deviceModel: string;
  signals: Signal[];
}

/**
 * SideKit state exposed via useSideKit hook
 */
export interface SideKitState {
  /** Whether to show update screen */
  showUpdateScreen: boolean;
  /** Current gate information */
  gateInformation: GateInformation | null;
  /** Whether analytics is enabled */
  isAnalyticsEnabled: boolean;
}

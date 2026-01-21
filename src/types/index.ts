import type { GateInformation } from '../models/GateInformation';

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
}

/**
 * Presentation mode for update gates
 */
export type UpdatePresentationMode = 'automatic' | 'manual';

/**
 * Version gate type
 */
export enum VersionGateType {
  /** Current version is not blocked */
  Live = -1,
  /** User must update (no skip button) */
  Forced = 0,
  /** User can skip update */
  Dismissable = 1,
  /** Modal presentation */
  Modal = 2,
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
  osVersion?: string;
  appVersion?: string;
  country?: string;
  language?: string;
  platform?: string;
  deviceModel?: string;
  signals: Signal[];
}

/**
 * SideKit state and methods exposed via useSideKit hook
 */
export interface SideKitState {
  /** Whether to show update screen */
  showUpdateScreen: boolean;

  /** Current gate information */
  gateInformation: GateInformation | null;

  /**
   * Get whether analytics tracking is currently enabled.
   *
   * @returns {boolean} True if analytics is enabled, false otherwise
   *
   * @example
   * ```typescript
   * const enabled = SideKit.shared.isAnalyticsEnabled;
   * console.log('Analytics:', enabled ? 'Enabled' : 'Disabled');
   * ```
   */
  isAnalyticsEnabled: boolean;

  /**
   * Track a custom analytics event.
   *
   * Sends a signal to the SideKit API with automatic metadata enrichment
   * (OS version, app version, device model, country, language, platform).
   * Signals are only sent if analytics is enabled.
   *
   * @param {string} key - The event name (e.g., "button_clicked", "purchase_completed")
   * @param {string} [value] - Optional event value (e.g., "signup", "29.99")
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Track event with key only
   * sendSignal('button_clicked');
   *
   * // Track event with key and value
   * sendSignal('button_clicked', 'signup');
   * sendSignal('purchase_completed', '29.99');
   * sendSignal('screen_viewed', 'home');
   * ```
   */
  sendSignal: (key: string, value?: string) => void;

  /** Dismiss the update gate (for dismissable gates only) */
  dismissUpdateGate: () => void;

  /**
   * Enable or disable analytics tracking.
   *
   * When disabled, no analytics events (including automatic signals) will be sent.
   * The setting is persisted to local storage and survives app restarts.
   * Version gating functionality continues to work when analytics is disabled.
   *
   * @param {boolean} enabled - True to enable analytics, false to disable
   *
   * @example
   * ```typescript
   * // Disable analytics
   * SideKit.shared.isAnalyticsEnabled = false;
   *
   * // Enable analytics
   * SideKit.shared.isAnalyticsEnabled = true;
   *
   * // Toggle analytics
   * SideKit.shared.isAnalyticsEnabled = !SideKit.shared.isAnalyticsEnabled;
   * ```
   */
  setAnalyticsEnabled: (enabled: boolean) => void;
}

/**
 * SideKit - Main SDK class
 *
 * Singleton class that manages version gating and analytics
 */

import { SettingsStore } from './SettingsStore';
import { AnalyticsAgent } from './AnalyticsAgent';
import { GateInformation } from '../models/GateInformation';
import { SemanticVersion } from '../models/SemanticVersion';
import { Signal } from '../models/Signal';
import { subscribeToLifecycle } from '../utils/lifecycle';
import { log, error, setVerbose } from '../utils/logger';
import type { ConfigOptions } from '../types';

/**
 * SideKit singleton class
 */
export class SideKit {
  private static instance: SideKit;

  // Configuration
  private appVersion?: string;
  private isConfigured = false;

  // Dependencies
  private settingsStore?: SettingsStore;
  private analyticsAgent?: AnalyticsAgent;

  // State
  public showUpdateScreen = false;
  public gateInformation: GateInformation | null = null;
  private _isAnalyticsEnabled = true;

  // Lifecycle
  private lifecycleUnsubscribe?: () => void;

  // Listeners for state changes
  private listeners = new Set<() => void>();

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance of SideKit.
   *
   * @returns {SideKit} The shared SideKit instance
   *
   * @example
   * ```typescript
   * import SideKit from '@sidekit/react-native';
   *
   * // Access the singleton
   * const sdk = SideKit.shared;
   * ```
   */
  static get shared(): SideKit {
    if (!SideKit.instance) {
      SideKit.instance = new SideKit();
    }
    return SideKit.instance;
  }

  /**
   * Configure the SideKit SDK with your API key and options.
   *
   * This method must be called before using any other SDK features. It initializes
   * the SDK, loads cached settings, checks version compliance, and sets up lifecycle tracking.
   *
   * @param {string} apiKey - Your SideKit API key (required)
   * @param {ConfigOptions} [options] - Configuration options
   * @param {string} options.appVersion - Current app version (e.g., "1.0.0") - REQUIRED
   * @param {boolean} [options.verbose=false] - Enable debug logging
   * @param {'automatic' | 'manual'} [options.presentationMode='automatic'] - How to present update gates
   *
   * @throws {Error} If API key is missing or empty
   * @throws {Error} If appVersion is missing or empty
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * import SideKit from '@sidekit/react-native';
   *
   * // Basic configuration
   * await SideKit.shared.configure('sk_your_api_key', {
   *   appVersion: '1.0.0',
   * });
   *
   * // With verbose logging
   * await SideKit.shared.configure('sk_your_api_key', {
   *   appVersion: '1.0.0',
   *   verbose: __DEV__,
   *   presentationMode: 'automatic',
   * });
   * ```
   */
  async configure(apiKey: string, options?: ConfigOptions): Promise<void> {
    if (this.isConfigured) {
      log('SDK already configured, reconfiguring...');
      this.cleanup();
    }

    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    // Validate app version
    if (!options?.appVersion || options.appVersion.trim().length === 0) {
      throw new Error('appVersion is required in configuration options');
    }

    // Store configuration
    this.appVersion = options.appVersion;

    // Set verbose logging
    if (options.verbose !== undefined) {
      setVerbose(options.verbose);
    }

    log(`Configuring SideKit SDK v${this.appVersion}`);

    // Initialize dependencies
    this.settingsStore = new SettingsStore();
    this.analyticsAgent = new AnalyticsAgent(apiKey, this.appVersion);

    // Load analytics enabled state
    this._isAnalyticsEnabled = await this.settingsStore.isAnalyticsEnabled();

    // Check for first launch
    const isFirstLaunch = await this.settingsStore.isFirstLaunch();
    if (isFirstLaunch) {
      log('First launch detected');
      this.sendSignal('_first_launch');
      await this.settingsStore.markLaunched();
    }

    // Subscribe to lifecycle events
    this.lifecycleUnsubscribe = subscribeToLifecycle(
      () => this.handleForeground(),
      () => this.handleBackground()
    );

    // Mark as configured
    this.isConfigured = true;

    // Perform initial version check
    await this.checkVersionCompliance();

    // Send app open signal
    this.sendSignal('_app_open');

    log('SDK configuration complete');
  }

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
   * SideKit.shared.sendSignal('button_clicked');
   *
   * // Track event with key and value
   * SideKit.shared.sendSignal('button_clicked', 'signup');
   * SideKit.shared.sendSignal('purchase_completed', '29.99');
   * SideKit.shared.sendSignal('screen_viewed', 'home');
   * ```
   *
   * @see {@link isAnalyticsEnabled} To check or toggle analytics
   */
  sendSignal(key: string, value?: string): void {
    if (!this.isConfigured) {
      error('SDK not configured. Call configure() first.');
      return;
    }

    if (!this._isAnalyticsEnabled) {
      log(`Analytics disabled, skipping signal: ${key}`);
      return;
    }

    if (!this.analyticsAgent) {
      error('Analytics agent not initialized');
      return;
    }

    const signal = new Signal(key, value || '');
    log(`Sending signal: ${key}${value ? ` = ${value}` : ''}`);

    // Send signal asynchronously (fire and forget)
    this.analyticsAgent.sendSignals([signal.toJSON()]).catch((err) => {
      error('Failed to send signal', err);
    });
  }

  /**
   * Get whether analytics tracking is currently enabled.
   *
   * Note: Version gating functionality works regardless of this setting.
   *
   * @returns {boolean} True if analytics is enabled, false otherwise
   *
   * @example
   * ```typescript
   * const enabled = SideKit.shared.isAnalyticsEnabled;
   * console.log('Analytics:', enabled ? 'Enabled' : 'Disabled');
   * ```
   */
  get isAnalyticsEnabled(): boolean {
    return this._isAnalyticsEnabled;
  }

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
  set isAnalyticsEnabled(enabled: boolean) {
    if (!this.isConfigured) {
      error('SDK not configured. Call configure() first.');
      return;
    }

    this._isAnalyticsEnabled = enabled;

    if (this.settingsStore) {
      this.settingsStore.setAnalyticsEnabled(enabled).catch((err) => {
        error('Failed to persist analytics enabled state', err);
      });
    }

    log(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
    this.notifyListeners();
  }

  /**
   * Subscribe to SDK state changes.
   *
   * The listener will be called whenever SDK state changes (e.g., when update
   * screen state changes, gate information is updated, or analytics is toggled).
   * Use this for manual state tracking or building custom UI.
   *
   * For React components, use the `useSideKit()` hook instead.
   *
   * @param {Function} listener - Callback function invoked on state changes
   * @returns {Function} Unsubscribe function to remove the listener
   *
   * @example
   * ```typescript
   * // Subscribe to state changes
   * const unsubscribe = SideKit.shared.subscribe(() => {
   *   console.log('SDK state changed');
   *   console.log('Show update:', SideKit.shared.showUpdateScreen);
   *   console.log('Gate info:', SideKit.shared.gateInformation);
   * });
   *
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   *
   * @see {@link useSideKit} For React component integration
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        error('Error in state change listener', err);
      }
    });
  }

  /**
   * Handle app foreground event
   */
  private handleForeground(): void {
    if (!this.isConfigured) {
      return;
    }

    log('App foregrounded');
    this.sendSignal('_app_open');
    this.checkVersionCompliance().catch((err) => {
      error('Version compliance check failed', err);
    });
  }

  /**
   * Handle app background event
   */
  private handleBackground(): void {
    if (!this.isConfigured) {
      return;
    }

    log('App backgrounded');
    // Note: iOS SDK doesn't flush on background, but we could add it here
  }

  /**
   * Check version compliance
   */
  private async checkVersionCompliance(): Promise<void> {
    if (!this.appVersion || !this.analyticsAgent || !this.settingsStore) {
      return;
    }

    log('Checking version compliance...');

    // Fetch gate information (network + cache fallback)
    const gateInfo = await this.fetchGateInformation();
    if (!gateInfo) {
      log('No gate information available');
      return;
    }

    // Parse current version
    let currentVersion: SemanticVersion;
    try {
      currentVersion = new SemanticVersion(this.appVersion);
    } catch (err) {
      error(`Invalid app version format: ${this.appVersion}`, err);
      return;
    }

    // Check if current version is blocked
    const isBlocked = gateInfo.isBlocked(currentVersion);

    if (!isBlocked) {
      // Not blocked - update state and return
      log('Version is compliant');
      this.showUpdateScreen = false;
      this.gateInformation = gateInfo;
      this.notifyListeners();
      return;
    }

    // Determine gate type
    const gateType = gateInfo.blockingGateType(currentVersion);
    log(`Version is blocked (gate type: ${gateType})`);

    // Check if this is a new gate (lastGateUpdate changed)
    const cachedGate = await this.settingsStore.getCachedGateInformation();
    const isNewGate =
      !cachedGate || cachedGate.lastGateUpdate !== gateInfo.lastGateUpdate;

    // Apply presentation logic
    if (gateType === 0) {
      // Forced gates: always show
      log('Showing forced update gate');
      this.showGate(gateInfo);
    } else if (isNewGate) {
      // Dismissable/modal gates: show only if new
      log('Showing dismissable/modal update gate (new gate)');
      this.showGate(gateInfo);
    } else {
      // Already shown this dismissable gate, don't show again
      log('Dismissable gate already shown, skipping');
      this.showUpdateScreen = false;
      this.gateInformation = gateInfo;
      this.notifyListeners();
    }
  }

  /**
   * Show update gate
   */
  private showGate(gateInfo: GateInformation): void {
    this.showUpdateScreen = true;
    this.gateInformation = gateInfo;
    this.notifyListeners();

    // Send _gate_enforced signal
    this.sendSignal('_gate_enforced', this.appVersion);

    // Cache gate information
    if (this.settingsStore) {
      this.settingsStore.setCachedGateInformation(gateInfo).catch((err) => {
        error('Failed to cache gate information', err);
      });
    }
  }

  /**
   * Fetch gate information (network + cache fallback)
   */
  private async fetchGateInformation(): Promise<GateInformation | null> {
    if (!this.analyticsAgent || !this.settingsStore) {
      return null;
    }

    // Try to fetch from API
    const gateInfo = await this.analyticsAgent.getGateInformation();

    if (gateInfo) {
      // Cache successful response
      await this.settingsStore.setCachedGateInformation(gateInfo);
      return gateInfo;
    }

    // Fallback to cache
    log('API fetch failed, falling back to cache');
    return await this.settingsStore.getCachedGateInformation();
  }

  /**
   * Manually dismiss the update gate (for dismissable gates)
   */
  dismissUpdateGate(): void {
    if (!this.isConfigured) {
      error('SDK not configured');
      return;
    }

    if (!this.showUpdateScreen) {
      log('Update gate not shown');
      return;
    }

    // Only allow dismissing dismissable/modal gates
    if (this.gateInformation && this.appVersion) {
      const currentVersion = new SemanticVersion(this.appVersion);
      if (this.gateInformation.isDismissable(currentVersion)) {
        log('Dismissing update gate');
        this.showUpdateScreen = false;
        this.notifyListeners();
      } else {
        log('Cannot dismiss forced update gate');
      }
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.lifecycleUnsubscribe) {
      this.lifecycleUnsubscribe();
      this.lifecycleUnsubscribe = undefined;
    }
  }

  /**
   * Reset SDK (for testing)
   */
  reset(): void {
    this.cleanup();
    this.isConfigured = false;
    this.appVersion = undefined;
    this.settingsStore = undefined;
    this.analyticsAgent = undefined;
    this.showUpdateScreen = false;
    this.gateInformation = null;
    this._isAnalyticsEnabled = true;
    this.listeners.clear();
    log('SDK reset');
  }
}

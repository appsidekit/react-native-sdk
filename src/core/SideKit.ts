/**
 * SideKit - Main SDK class
 *
 * Singleton class that manages version gating and analytics
 */

import { SettingsStore } from './SettingsStore';
import { AnalyticsAgent } from './AnalyticsAgent';
import { GateInformation } from '../models/GateInformation';
import { Signal } from '../models/Signal';
import { subscribeToLifecycle } from '../utils/lifecycle';
import { getAppVersion } from '../utils/platform';
import { log, error, setVerbose } from '../utils/logger';
import type { ConfigOptions } from '../types';

/**
 * SideKit singleton class
 */
export class SideKit {
  private static instance: SideKit;

  // Configuration
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
   * Get the singleton instance of SideKit
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

    // Set verbose logging
    if (options?.verbose !== undefined) {
      setVerbose(options.verbose);
    }

    log(`Configuring SideKit SDK`);

    // Initialize dependencies
    this.settingsStore = new SettingsStore();
    this.analyticsAgent = new AnalyticsAgent(apiKey);

    // Load analytics enabled state
    this._isAnalyticsEnabled = await this.settingsStore.isAnalyticsEnabled();

    // Check for first launch
    const isFirstLaunch = await this.settingsStore.isFirstLaunch();
    if (isFirstLaunch) {
      log('First launch detected');
    }

    // Subscribe to lifecycle events
    this.lifecycleUnsubscribe = subscribeToLifecycle(
      () => this.handleForeground(),
      () => this.handleBackground()
    );

    // Mark as configured
    this.isConfigured = true;

    // Send first launch signal after configuration is complete
    if (isFirstLaunch) {
      this.sendSignals([{ key: '_first_launch' }]);
      await this.settingsStore.markLaunched();
    }

    // Perform initial version check
    await this.checkVersionCompliance();

    // Send app open signal
    this.sendSignals([{ key: '_app_open' }]);

    log('SDK configuration complete');
  }

  /**
   * Send custom analytics events.
   */
  sendSignals(signals: Array<{ key: string; value?: string }>): void {
    if (!this.isConfigured) {
      error('SDK not configured. Call configure() first.');
      return;
    }

    if (!this._isAnalyticsEnabled) {
      log(`Analytics disabled, skipping ${signals.length} signal(s)`);
      return;
    }

    if (!this.analyticsAgent) {
      error('Analytics agent not initialized');
      return;
    }

    const signalObjects = signals.map(
      (s) => new Signal(s.key, s.value || '').toJSON()
    );

    signals.forEach((s) => {
      log(`Sending signal: ${s.key}${s.value ? ` = ${s.value}` : ''}`);
    });

    // Send signals asynchronously (fire and forget)
    this.analyticsAgent.sendSignals(signalObjects).catch((err) => {
      error('Failed to send signals', err);
    });
  }

  /**
   * Get whether analytics tracking is currently enabled
   */
  get isAnalyticsEnabled(): boolean {
    return this._isAnalyticsEnabled;
  }

  /**
   * Enable or disable analytics tracking
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
    this.sendSignals([{ key: '_app_open' }]);
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
    if (!this.analyticsAgent || !this.settingsStore) {
      return;
    }

    log('Checking version compliance...');

    // Get old cached gate BEFORE fetching new one (to detect if gate has changed)
    const oldCachedGate = await this.settingsStore.getCachedGateInformation();

    // Fetch gate information (network + cache fallback)
    const gateInfo = await this.fetchGateInformation();
    if (!gateInfo) {
      log('No gate information available');
      return;
    }

    // Check if current version is blocked
    const isBlocked = gateInfo.isBlocked();

    if (!isBlocked) {
      // Not blocked - update state and return
      log('Version is compliant');
      this.showUpdateScreen = false;
      this.gateInformation = gateInfo;
      this.notifyListeners();
      return;
    }

    // Determine gate type
    const gateType = gateInfo.blockingGateType();
    log(`Version is blocked (gate type: ${gateType})`);

    // Check if this is a new gate (lastGateUpdate changed)
    const isNewGate =
      !oldCachedGate || oldCachedGate.lastGateUpdate !== gateInfo.lastGateUpdate;

    // Apply presentation logic
    if (gateType === 0) {
      // Forced gates: always show
      log('Showing forced update gate');
      this.showGate(gateInfo);
    } else if (isNewGate) {
      // Dismissible/modal gates: show only if new
      log('Showing dismissible/modal update gate (new gate)');
      this.showGate(gateInfo);
    } else {
      // Already shown this dismissible gate, don't show again
      log('Dismissible gate already shown, skipping');
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
    this.sendSignals([
      { key: '_gate_enforced', value: getAppVersion() || undefined },
    ]);

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
   * Manually dismiss the update gate (for dismissible gates)
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

    // Only allow dismissing dismissible/modal gates
    if (this.gateInformation) {
      if (this.gateInformation.isDismissible()) {
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
    this.settingsStore = undefined;
    this.analyticsAgent = undefined;
    this.showUpdateScreen = false;
    this.gateInformation = null;
    this._isAnalyticsEnabled = true;
    this.listeners.clear();
    log('SDK reset');
  }
}

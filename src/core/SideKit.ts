/**
 * SideKit - Main SDK class
 *
 * Singleton class that manages version gating and analytics
 */

import { SettingsStore } from './SettingsStore';
import { Meerkat } from './Meerkat';
import { AuthAgent } from './AuthAgent';
import { GateInformation } from '../models/GateInformation';
import { Signal } from '../models/Signal';
import { subscribeToLifecycle } from '../utils/lifecycle';
import { getAppVersion } from '../utils/platform';
import { log, error, setVerbose } from '../utils/logger';
import type {
  ConfigOptions,
  AuthResult,
  AuthUser,
  AuthOtpResponse,
  FeatureFlag,
} from '../types';

/** Current Unix time in seconds. */
const nowSeconds = (): number => Math.floor(Date.now() / 1000);

/**
 * SideKit singleton class
 */
export class SideKit {
  private static instance: SideKit;

  // Configuration
  private isConfigured = false;

  // Dependencies
  private settingsStore?: SettingsStore;
  private meerkat?: Meerkat;
  private authAgent?: AuthAgent;

  // State
  public showUpdateScreen = false;
  public gateInformation: GateInformation | null = null;
  private _isAnalyticsEnabled = true;
  private _flags: FeatureFlag[] = [];

  // Auth state
  private _authUser: AuthUser | null = null;
  private _sessionToken: string | null = null;
  private _sessionExpiresAt: number | null = null;

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
    this.meerkat = new Meerkat(apiKey);
    this.authAgent = new AuthAgent(apiKey);

    // Load analytics enabled state
    this._isAnalyticsEnabled = await this.settingsStore.isAnalyticsEnabled();

    // Restore a persisted end-user session, dropping it if it has expired.
    await this.restoreAuthSession();

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

    // Fetch feature flags (network + cache fallback)
    await this.refreshFlags();

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

    if (!this.meerkat) {
      error('Meerkat (API client) not initialized');
      return;
    }

    const signalObjects = signals.map(
      (s) => new Signal(s.key, s.value || '').toJSON()
    );

    signals.forEach((s) => {
      log(`Sending signal: ${s.key}${s.value ? ` = ${s.value}` : ''}`);
    });

    // Send signals asynchronously (fire and forget)
    this.meerkat.sendSignals(signalObjects).catch((err) => {
      error('Failed to send signals', err);
    });
  }

  /**
   * Submit user feedback to SideKit. Device metadata (OS, app version, locale, device
   * model) is attached automatically.
   *
   * If `endUserId` is omitted it defaults to the signed-in user's id (when authenticated),
   * so feedback is attributed to the current user without extra wiring. Unlike analytics
   * signals, feedback is sent regardless of the analytics-enabled setting.
   *
   * Resolves to true when the feedback was accepted, false otherwise (never throws).
   */
  async sendFeedback(
    feedbackText: string,
    options?: { endUserId?: string; userAttributes?: Record<string, string> }
  ): Promise<boolean> {
    if (!this.isConfigured || !this.meerkat) {
      error('SDK not configured. Call configure() first.');
      return false;
    }

    const endUserId = options?.endUserId ?? this._authUser?.id ?? undefined;
    return this.meerkat.sendFeedback(
      feedbackText,
      endUserId,
      options?.userAttributes
    );
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

  // ------------- //
  // FEATURE FLAGS //
  // ------------- //

  /**
   * All feature flags and config entries fetched from the server. Populated on
   * configure() and refreshFlags().
   */
  get flags(): FeatureFlag[] {
    return this._flags;
  }

  /**
   * Get the boolean value of a feature flag, or `defaultValue` if the key doesn't exist
   * or isn't a boolean flag.
   */
  flag(key: string, defaultValue = false): boolean {
    const found = this._flags.find((f) => f.key === key);
    if (!found || !found.isFlag || typeof found.value !== 'boolean') {
      return defaultValue;
    }
    return found.value;
  }

  /**
   * Get the string value of a config entry, or `defaultValue` if the key doesn't exist
   * or isn't a string config entry.
   */
  config(key: string, defaultValue = ''): string {
    const found = this._flags.find((f) => f.key === key);
    if (!found || found.isFlag || typeof found.value !== 'string') {
      return defaultValue;
    }
    return found.value;
  }

  /**
   * Fetch the latest feature flags from the server, falling back to the cached set on
   * failure. Updates `flags` and notifies listeners.
   */
  async refreshFlags(): Promise<void> {
    if (!this.meerkat || !this.settingsStore) {
      error('SDK not configured. Call configure() first.');
      return;
    }

    const fetched = await this.meerkat.getFlags();
    if (fetched) {
      this._flags = fetched;
      await this.settingsStore.setCachedFlags(fetched);
      log(`Fetched ${fetched.length} flags from server`);
      this.notifyListeners();
      return;
    }

    // Network/API failure — fall back to cached flags.
    const cached = await this.settingsStore.getCachedFlags();
    if (cached) {
      this._flags = cached;
      log(`Using ${cached.length} cached flags (server unavailable)`);
      this.notifyListeners();
    }
  }

  // ---- //
  // AUTH //
  // ---- //

  /** The currently signed-in end user, or null when signed out. */
  get authUser(): AuthUser | null {
    return this._authUser;
  }

  /** True when an end user is signed in (and the session hasn't expired). */
  get isAuthenticated(): boolean {
    return this._sessionToken !== null;
  }

  /** The opaque session token for the signed-in user, or null. Treat as a credential. */
  get sessionToken(): string | null {
    return this._sessionToken;
  }

  /**
   * Request a one-time passcode for a phone number (E.164). Returns the requestId to pass
   * to verifyOtp, or an error code ('rate_limited', 'invalid_phone', etc.).
   */
  async requestOtp(
    phone: string,
    options?: { inviteCode?: string }
  ): Promise<AuthResult<AuthOtpResponse>> {
    if (!this.authAgent) {
      error('SDK not configured. Call configure() first.');
      return { ok: false, error: 'not_configured', status: 0 };
    }
    return this.authAgent.otpSend(phone, options?.inviteCode);
  }

  /**
   * Verify an OTP code. On success the session + user are persisted, auth state is
   * updated, and listeners are notified; the signed-in AuthUser is returned.
   */
  async verifyOtp(params: {
    requestId: string;
    phone: string;
    code: string;
  }): Promise<AuthResult<AuthUser>> {
    if (!this.authAgent || !this.settingsStore) {
      error('SDK not configured. Call configure() first.');
      return { ok: false, error: 'not_configured', status: 0 };
    }

    const result = await this.authAgent.otpVerify(params);
    if (!result.ok) {
      return result;
    }

    const { sessionToken, expiresAt, user } = result.data;
    await this.applyAuthSession(sessionToken, user, expiresAt);
    log(`Signed in as ${user.id}`);
    return { ok: true, data: user };
  }

  /**
   * Set the signed-in user's handle. On success the local user is updated and listeners
   * notified. Returns 'handle_taken' (409) on conflict, 'unauthorized' if signed out.
   */
  async setHandle(handle: string): Promise<AuthResult<{ handle: string }>> {
    if (!this.authAgent) {
      error('SDK not configured. Call configure() first.');
      return { ok: false, error: 'not_configured', status: 0 };
    }
    if (!this._sessionToken) {
      return { ok: false, error: 'unauthorized', status: 401 };
    }

    const result = await this.authAgent.setHandle(this._sessionToken, handle);
    if (result.ok && this._authUser) {
      this._authUser = { ...this._authUser, handle: result.data.handle };
      await this.persistCurrentSession();
      this.notifyListeners();
    }
    return result;
  }

  /**
   * Attach a recovery email to the signed-in user. Returns 'email_taken' (409) on
   * conflict, 'unauthorized' if signed out.
   */
  async setRecoveryEmail(
    email: string
  ): Promise<AuthResult<{ email: string }>> {
    if (!this.authAgent) {
      error('SDK not configured. Call configure() first.');
      return { ok: false, error: 'not_configured', status: 0 };
    }
    if (!this._sessionToken) {
      return { ok: false, error: 'unauthorized', status: 401 };
    }
    return this.authAgent.setEmail(this._sessionToken, email);
  }

  /**
   * Sign out. Revokes the session server-side (best-effort) and always clears local auth
   * state — a network failure still signs the user out locally.
   */
  async logout(): Promise<void> {
    const token = this._sessionToken;
    if (token && this.authAgent) {
      await this.authAgent.logout(token); // best-effort; revoke is idempotent
    }
    this._authUser = null;
    this._sessionToken = null;
    this._sessionExpiresAt = null;
    if (this.settingsStore) {
      await this.settingsStore.clearAuthSession();
    }
    log('Signed out');
    this.notifyListeners();
  }

  /**
   * Restore a persisted session on configure. An expired session is dropped.
   */
  private async restoreAuthSession(): Promise<void> {
    if (!this.settingsStore) {
      return;
    }
    const session = await this.settingsStore.getAuthSession();
    if (!session) {
      return;
    }
    if (session.expiresAt <= nowSeconds()) {
      log('Stored session expired, clearing');
      await this.settingsStore.clearAuthSession();
      return;
    }
    this._sessionToken = session.token;
    this._authUser = session.user;
    this._sessionExpiresAt = session.expiresAt;
    log(`Restored session for ${session.user.id}`);
  }

  /**
   * Set the in-memory session, persist it, and notify listeners.
   */
  private async applyAuthSession(
    token: string,
    user: AuthUser,
    expiresAt: number
  ): Promise<void> {
    this._sessionToken = token;
    this._authUser = user;
    this._sessionExpiresAt = expiresAt;
    if (this.settingsStore) {
      await this.settingsStore.setAuthSession({ token, user, expiresAt });
    }
    this.notifyListeners();
  }

  /**
   * Re-persist the current session (e.g. after the handle changes).
   */
  private async persistCurrentSession(): Promise<void> {
    if (
      this.settingsStore &&
      this._sessionToken &&
      this._authUser &&
      this._sessionExpiresAt !== null
    ) {
      await this.settingsStore.setAuthSession({
        token: this._sessionToken,
        user: this._authUser,
        expiresAt: this._sessionExpiresAt,
      });
    }
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
    if (!this.meerkat || !this.settingsStore) {
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
    if (!this.meerkat || !this.settingsStore) {
      return null;
    }

    // Try to fetch from API
    const gateInfo = await this.meerkat.getGateInformation();

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
    this.meerkat = undefined;
    this.authAgent = undefined;
    this.showUpdateScreen = false;
    this.gateInformation = null;
    this._isAnalyticsEnabled = true;
    this._flags = [];
    this._authUser = null;
    this._sessionToken = null;
    this._sessionExpiresAt = null;
    this.listeners.clear();
    log('SDK reset');
  }
}

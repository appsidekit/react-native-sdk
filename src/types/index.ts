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
  Dismissible = 1,
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
 * An authenticated end user of your app
 */
export interface AuthUser {
  /** Stable per-app user id (`u_…`); the id your backend keys end-user data on. */
  id: string;
  /** The user's chosen handle, or null if they haven't set one yet. */
  handle: string | null;
  /** Account creation time, Unix seconds. */
  createdAt: number;
}

/**
 * Result of an auth call. On success, `data` holds the payload; on failure, `error` is
 * the short code surfaced by the API (e.g. 'invalid_code', 'rate_limited',
 * 'handle_taken', 'network_error') alongside the HTTP `status` and, for rate limits,
 * `retryAfter` in seconds.
 */
export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; retryAfter?: number };

/** Response from requesting an OTP. */
export interface AuthOtpResponse {
  /** Pass back to `verifyOtp` to complete the flow. */
  requestId: string;
  /** When the code expires, Unix seconds. */
  expiresAt: number;
}

/** Response from verifying an OTP (internal — `verifyOtp` returns the `AuthUser`). */
export interface AuthVerifyResponse {
  sessionToken: string;
  expiresAt: number;
  user: AuthUser;
}

/**
 * A feature flag value — boolean for flags, string for config entries.
 */
export type FeatureFlagValue = boolean | string;

/**
 * A feature flag or config entry fetched from the SideKit dashboard.
 */
export interface FeatureFlag {
  /** The flag key (e.g. "dark_mode_enabled"). */
  key: string;
  /** `true`/`false` for boolean flags, or a string for config entries. */
  value: FeatureFlagValue;
  /** Whether this entry is a boolean flag (`true`) or a string config (`false`). */
  isFlag: boolean;
  /** When this flag was last updated on the server (ISO 8601). */
  updatedAt: string;
}

/**
 * SideKit state and methods exposed via useSideKit hook
 */
export interface SideKitState {
  /** Whether to show update screen */
  showUpdateScreen: boolean;

  /** Current gate information */
  gateInformation: GateInformation | null;

  /** The currently signed-in end user, or null when signed out. */
  authUser: AuthUser | null;

  /** Convenience flag: true when an end user is signed in. */
  isAuthenticated: boolean;

  /**
   * The opaque session token for the signed-in user, or null. Send this to your own
   * backend (e.g. as a Bearer header) and verify it server-side via the SideKit
   * `/v1/auth/introspect` endpoint. Treat it as a credential.
   */
  sessionToken: string | null;

  /**
   * Request a one-time passcode for a phone number (E.164, e.g. "+15555550100").
   *
   * @example
   * ```typescript
   * const res = await requestOtp('+15555550100');
   * if (res.ok) setRequestId(res.data.requestId);
   * else if (res.error === 'rate_limited') showRetry(res.retryAfter);
   * ```
   */
  requestOtp: (
    phone: string,
    options?: { inviteCode?: string }
  ) => Promise<AuthResult<AuthOtpResponse>>;

  /**
   * Verify the OTP code sent to a phone. On success the SDK persists the session and
   * updates auth state.
   *
   * @example
   * ```typescript
   * const res = await verifyOtp({ requestId, phone: '+15555550100', code: '123456' });
   * if (res.ok) console.log('signed in as', res.data.id);
   * else if (res.error === 'invalid_code') showError();
   * ```
   */
  verifyOtp: (params: {
    requestId: string;
    phone: string;
    code: string;
  }) => Promise<AuthResult<AuthUser>>;

  /** Set the signed-in user's handle. Returns 'handle_taken' on conflict. */
  setHandle: (handle: string) => Promise<AuthResult<{ handle: string }>>;

  /** Attach a recovery email to the signed-in user. Returns 'email_taken' on conflict. */
  setRecoveryEmail: (email: string) => Promise<AuthResult<{ email: string }>>;

  /** Sign out: revoke the session server-side (best-effort) and clear local auth state. */
  logout: () => Promise<void>;

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

  /**
   * Track multiple custom analytics events at once.
   *
   * Sends multiple signals to the SideKit API with automatic metadata enrichment.
   * This is more efficient than calling sendSignal multiple times as it batches
   * the events into a single API request.
   *
   * @param {Array<{key: string, value?: string}>} signals - Array of signals to send
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Send multiple signals at once
   * sendSignals([
   *   { key: 'page_view', value: 'home' },
   *   { key: 'button_clicked', value: 'signup' },
   *   { key: 'feature_used', value: 'dark_mode' }
   * ]);
   * ```
   */
  sendSignals: (signals: Array<{ key: string; value?: string }>) => void;

  /**
   * Submit user feedback to SideKit.
   *
   * Device metadata (OS version, app version, device model, country, language, platform)
   * is attached automatically. When signed in, feedback is attributed to the current user
   * unless you pass an explicit `endUserId`. Feedback is sent regardless of whether
   * analytics is enabled. Resolves to true when accepted, false otherwise.
   *
   * @param {string} feedbackText - The user's feedback message
   * @param {object} [options] - Optional attribution
   * @param {string} [options.endUserId] - Override the user id (defaults to the signed-in user)
   * @param {Record<string, string>} [options.userAttributes] - Custom key/value attributes
   *
   * @example
   * ```typescript
   * const ok = await sendFeedback('Love the app! Could use dark mode.', {
   *   userAttributes: { screen: 'settings', plan: 'pro' },
   * });
   * if (ok) showThankYou();
   * ```
   */
  sendFeedback: (
    feedbackText: string,
    options?: { endUserId?: string; userAttributes?: Record<string, string> }
  ) => Promise<boolean>;

  /**
   * All feature flags and config entries fetched from the server.
   *
   * Populated on `configure()` and refreshed by `refreshFlags()`. Prefer the `flag()` and
   * `config()` helpers for typed lookups with defaults.
   */
  flags: FeatureFlag[];

  /**
   * Get the boolean value of a feature flag.
   *
   * Returns `defaultValue` if the key doesn't exist or isn't a boolean flag.
   *
   * @param {string} key - The flag key (e.g. "dark_mode_enabled")
   * @param {boolean} [defaultValue=false] - Value to return when the flag is missing
   *
   * @example
   * ```typescript
   * if (flag('new_onboarding')) showNewOnboarding();
   * ```
   */
  flag: (key: string, defaultValue?: boolean) => boolean;

  /**
   * Get the string value of a config entry.
   *
   * Returns `defaultValue` if the key doesn't exist or isn't a string config entry.
   *
   * @param {string} key - The config key (e.g. "welcome_message")
   * @param {string} [defaultValue=''] - Value to return when the config is missing
   *
   * @example
   * ```typescript
   * const msg = config('welcome_message', 'Welcome!');
   * ```
   */
  config: (key: string, defaultValue?: string) => string;

  /**
   * Fetch the latest feature flags from the server, falling back to the cached set on
   * failure. Updates `flags` and notifies subscribers.
   */
  refreshFlags: () => Promise<void>;

  /** Dismiss the update gate (for dismissible gates only) */
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

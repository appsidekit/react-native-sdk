/**
 * Meerkat — the HTTP client for the SideKit API.
 *
 * Named for the SideKit mascot. Handles all network calls (version gating, analytics
 * signals, feature flags, feedback) to api.appsidekit.com. Internal to the SDK — not
 * part of the public API.
 */

import { GateInformation } from '../models/GateInformation';
import { SignalPayload } from '../models/Signal';
import { log, error } from '../utils/logger';
import type { FeatureFlag } from '../types';
import {
  getAppVersion,
  getPlatform,
  getLocale,
  getTimezone,
  collectDeviceMetadata,
} from '../utils/platform';

// API configuration
const API_BASE_URL = 'https://api.appsidekit.com';
const API_VERSION_ENDPOINT = '/v1/version';
const API_SIGNALS_ENDPOINT = '/v1';
const API_FEEDBACK_ENDPOINT = '/v1/feedback';
const API_FLAGS_ENDPOINT = '/v1/flags';
const API_PUSH_REGISTER_ENDPOINT = '/v1/push/register';

/**
 * Meerkat — SideKit's API client. See file header.
 */
export class Meerkat {
  private apiKey: string | null;

  constructor(apiKey: string | null = null) {
    this.apiKey = apiKey;
  }

  /**
   * The API key, or null with a clear error when constructed unconfigured. Every
   * public method calls this first, so a call that lands before SideKit.configure()
   * fails loudly in one place instead of needing a null check at each call site.
   */
  private requireApiKey(): string | null {
    if (!this.apiKey) {
      error(
        'SideKit is not configured — call SideKit.shared.configure(apiKey) first'
      );
    }
    return this.apiKey;
  }

  /**
   * Get gate information from API
   */
  async getGateInformation(): Promise<GateInformation | null> {
    const apiKey = this.requireApiKey();
    if (!apiKey) {
      return null;
    }
    try {
      const platform = getPlatform();
      const appVersion = getAppVersion();

      if (!appVersion) {
        error('Failed to get app version');
        return null;
      }
      if (!platform) {
        error('Failed to get platform');
        return null;
      }

      const storeType = platform === 'ios' ? 0 : 1;
      const url = `${API_BASE_URL}${API_VERSION_ENDPOINT}?storeType=${storeType}&appVersion=${encodeURIComponent(appVersion)}`;
      log(`Fetching gate information from ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': apiKey,
        },
      });

      if (!response.ok) {
        error(
          `Failed to fetch gate information: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      log('Gate information received', data);

      return new GateInformation(data);
    } catch (err) {
      error('Failed to fetch gate information', err);
      return null;
    }
  }

  /**
   * Get feature flags from API. Returns null on network/API error so the caller can
   * fall back to cached flags.
   */
  async getFlags(): Promise<FeatureFlag[] | null> {
    const apiKey = this.requireApiKey();
    if (!apiKey) {
      return null;
    }
    try {
      const url = `${API_BASE_URL}${API_FLAGS_ENDPOINT}`;
      log(`Fetching feature flags from ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': apiKey,
        },
      });

      if (!response.ok) {
        error(
          `Failed to fetch flags: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        error('Unexpected flags response (expected an array)');
        return null;
      }

      log(`Received ${data.length} feature flag(s)`);
      return data as FeatureFlag[];
    } catch (err) {
      error('Failed to fetch flags', err);
      return null;
    }
  }

  /**
   * Send analytics signals to API
   */
  async sendSignals(signals: Array<{ name: string; value: string }>): Promise<void> {
    const apiKey = this.requireApiKey();
    if (!apiKey) {
      return;
    }
    try {
      const payload = new SignalPayload(collectDeviceMetadata(), signals);

      const url = `${API_BASE_URL}${API_SIGNALS_ENDPOINT}`;
      log(`Sending ${signals.length} signal(s) to ${url}`, signals);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': apiKey,
        },
        body: JSON.stringify(payload.toJSON()),
      });

      if (response.ok) {
        log(`Signals sent successfully (${response.status})`);
      } else {
        error(
          `Failed to send signals: ${response.status} ${response.statusText}`
        );
      }
    } catch (err) {
      error('Failed to send signals', err);
    }
  }

  /**
   * Send user feedback to API. Device metadata is enriched automatically.
   *
   * Resolves to true when the feedback was accepted (HTTP 2xx), false otherwise.
   * Never throws — network/API failures resolve to false.
   */
  async sendFeedback(
    feedbackText: string,
    endUserId?: string,
    userAttributes?: Record<string, string>
  ): Promise<boolean> {
    const apiKey = this.requireApiKey();
    if (!apiKey) {
      return false;
    }
    try {
      const payload = {
        feedbackText,
        endUserId: endUserId || undefined,
        userAttributes: userAttributes || undefined,
        ...collectDeviceMetadata(),
      };

      const url = `${API_BASE_URL}${API_FEEDBACK_ENDPOINT}`;
      log(`Sending feedback to ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        log(`Feedback sent successfully (${response.status})`);
        return true;
      }

      error(
        `Failed to send feedback: ${response.status} ${response.statusText}`
      );
      return false;
    } catch (err) {
      error('Failed to send feedback', err);
      return false;
    }
  }

  /**
   * Register this device for push (POST /v1/push/register). Locale/timezone are
   * attached automatically; a session token (when provided) binds the registration
   * to the signed-in end user for targeted sends.
   *
   * Resolves to true when registered (HTTP 2xx), false otherwise. Never throws.
   */
  async registerPushDevice(params: {
    deviceToken: string;
    environment: 'production' | 'sandbox';
    sessionToken?: string | null;
  }): Promise<boolean> {
    const apiKey = this.requireApiKey();
    if (!apiKey) {
      return false;
    }
    try {
      const platform = getPlatform();
      if (!platform) {
        error('Push registration is not supported on this platform');
        return false;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'API-Key': apiKey,
      };
      if (params.sessionToken) {
        headers.Authorization = `Bearer ${params.sessionToken}`;
      }

      const url = `${API_BASE_URL}${API_PUSH_REGISTER_ENDPOINT}`;
      log(`Registering push device (${params.environment}) at ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          deviceToken: params.deviceToken,
          storeType: platform === 'ios' ? 0 : 1,
          environment: params.environment,
          locale: getLocale() || undefined,
          timezone: getTimezone() || undefined,
        }),
      });

      if (response.ok) {
        log(`Push device registered (${response.status})`);
        return true;
      }
      error(
        `Failed to register push device: ${response.status} ${response.statusText}`
      );
      return false;
    } catch (err) {
      error('Failed to register push device', err);
      return false;
    }
  }

  /**
   * Unbind the signed-in user from this device (DELETE /v1/push/register), called on
   * logout. The device stays registered for broadcasts; a later signed-in
   * registration re-binds it.
   *
   * Resolves to true on HTTP 2xx, false otherwise. Never throws.
   */
  async unregisterPushDevice(deviceToken: string): Promise<boolean> {
    const apiKey = this.requireApiKey();
    if (!apiKey) {
      return false;
    }
    try {
      const url = `${API_BASE_URL}${API_PUSH_REGISTER_ENDPOINT}`;
      log(`Unbinding push device at ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': apiKey,
        },
        body: JSON.stringify({ deviceToken }),
      });

      if (response.ok) {
        log(`Push device unbound (${response.status})`);
        return true;
      }
      error(
        `Failed to unbind push device: ${response.status} ${response.statusText}`
      );
      return false;
    } catch (err) {
      error('Failed to unbind push device', err);
      return false;
    }
  }
}

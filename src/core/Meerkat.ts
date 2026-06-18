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
  getOSVersion,
  getDeviceModel,
  getCountryCode,
  getLanguageCode,
} from '../utils/platform';

// API configuration
const API_BASE_URL = 'https://api.appsidekit.com';
const API_VERSION_ENDPOINT = '/v1/version';
const API_SIGNALS_ENDPOINT = '/v1';
const API_FEEDBACK_ENDPOINT = '/v1/feedback';
const API_FLAGS_ENDPOINT = '/v1/flags';

/**
 * Meerkat — SideKit's API client. See file header.
 */
export class Meerkat {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get gate information from API
   */
  async getGateInformation(): Promise<GateInformation | null> {
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
          'API-Key': this.apiKey,
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
    try {
      const url = `${API_BASE_URL}${API_FLAGS_ENDPOINT}`;
      log(`Fetching feature flags from ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': this.apiKey,
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
    try {
      const metadata = {
        osVersion: getOSVersion() || undefined,
        appVersion: getAppVersion() || undefined,
        country: getCountryCode() || undefined,
        language: getLanguageCode() || undefined,
        platform: getPlatform() || undefined,
        deviceModel: getDeviceModel() || undefined,
      };

      const payload = new SignalPayload(metadata, signals);

      const url = `${API_BASE_URL}${API_SIGNALS_ENDPOINT}`;
      log(`Sending ${signals.length} signal(s) to ${url}`, signals);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': this.apiKey,
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
    try {
      const payload = {
        feedbackText,
        endUserId: endUserId || undefined,
        userAttributes: userAttributes || undefined,
        platform: getPlatform() || undefined,
        appVersion: getAppVersion() || undefined,
        osVersion: getOSVersion() || undefined,
        country: getCountryCode() || undefined,
        language: getLanguageCode() || undefined,
        deviceModel: getDeviceModel() || undefined,
      };

      const url = `${API_BASE_URL}${API_FEEDBACK_ENDPOINT}`;
      log(`Sending feedback to ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': this.apiKey,
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
}

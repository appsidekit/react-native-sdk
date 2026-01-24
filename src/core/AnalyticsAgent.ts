/**
 * AnalyticsAgent - HTTP client for SideKit API
 *
 * Handles GET/POST requests to the SideKit backend
 */

import { GateInformation } from '../models/GateInformation';
import { SignalPayload } from '../models/Signal';
import { log, error } from '../utils/logger';
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

/**
 * AnalyticsAgent class
 */
export class AnalyticsAgent {
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
}

import { Signal as SignalType, SignalPayload as SignalPayloadType } from '../types';

/**
 * Analytics signal
 */
export class Signal implements SignalType {
  name: string;
  value: string;

  constructor(name: string, value: string = '') {
    this.name = name;
    this.value = value;
  }

  /**
   * Convert to plain object
   */
  toJSON(): SignalType {
    return {
      name: this.name,
      value: this.value,
    };
  }
}

/**
 * Signal payload with metadata
 */
export class SignalPayload implements SignalPayloadType {
  osVersion: string;
  appVersion: string;
  country: string;
  language: string;
  platform: string;
  deviceModel: string;
  signals: SignalType[];

  constructor(
    metadata: {
      osVersion: string;
      appVersion: string;
      country: string;
      language: string;
      platform: string;
      deviceModel: string;
    },
    signals: SignalType[]
  ) {
    this.osVersion = metadata.osVersion;
    this.appVersion = metadata.appVersion;
    this.country = metadata.country;
    this.language = metadata.language;
    this.platform = metadata.platform;
    this.deviceModel = metadata.deviceModel;
    this.signals = signals;
  }

  /**
   * Convert to plain object for JSON serialization
   */
  toJSON(): SignalPayloadType {
    return {
      osVersion: this.osVersion,
      appVersion: this.appVersion,
      country: this.country,
      language: this.language,
      platform: this.platform,
      deviceModel: this.deviceModel,
      signals: this.signals,
    };
  }
}

import {
  getPlatform,
  getOSVersion,
  getDeviceModel,
  getCountryCode,
  getLanguageCode,
  openURL,
  getStoreURL,
} from '../src/utils/platform';
import { Platform, Linking } from 'react-native';

describe('platform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlatform', () => {
    it('should return ios for iOS platform', () => {
      (Platform as any).OS = 'ios';
      expect(getPlatform()).toBe('ios');
    });

    it('should return android for Android platform', () => {
      (Platform as any).OS = 'android';
      expect(getPlatform()).toBe('android');
    });
  });

  describe('getOSVersion', () => {
    it('should return OS version as string', () => {
      (Platform as any).Version = '17.0';
      const version = getOSVersion();
      expect(typeof version).toBe('string');
      expect(version).toBe('17.0');
    });

    it('should handle numeric version', () => {
      (Platform as any).Version = 33;
      const version = getOSVersion();
      expect(typeof version).toBe('string');
      expect(version).toBe('33');
    });
  });

  describe('getDeviceModel', () => {
    it('should return device model for iOS', () => {
      (Platform as any).OS = 'ios';
      const model = getDeviceModel();
      expect(model).toBe('iPhone');
    });

    it('should return device model for Android', () => {
      (Platform as any).OS = 'android';
      const model = getDeviceModel();
      expect(model).toBe('Android');
    });

    it('should return unknown for unsupported platform', () => {
      (Platform as any).OS = 'web';
      const model = getDeviceModel();
      expect(model).toBe('unknown');
    });
  });

  describe('getCountryCode', () => {
    it('should return country code', () => {
      const code = getCountryCode();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });
  });

  describe('getLanguageCode', () => {
    it('should return language code', () => {
      const code = getLanguageCode();
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    });
  });

  describe('openURL', () => {
    it('should call Linking.openURL with URL', async () => {
      const mockOpenURL = Linking.openURL as jest.Mock;
      mockOpenURL.mockResolvedValue(true);

      const result = await openURL('https://example.com');

      expect(mockOpenURL).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      const mockOpenURL = Linking.openURL as jest.Mock;
      mockOpenURL.mockRejectedValue(new Error('Failed to open'));

      const result = await openURL('https://example.com');

      expect(result).toBe(false);
    });

    it('should handle empty URL', async () => {
      const result = await openURL('');
      expect(result).toBe(false);
    });
  });

  describe('getStoreURL', () => {
    it('should return iOS URL on iOS platform', () => {
      (Platform as any).OS = 'ios';
      const iosURL = 'https://apps.apple.com/app/123';
      const androidURL = 'https://play.google.com/store/apps/details?id=com.example';

      const result = getStoreURL(iosURL, androidURL);

      expect(result).toBe(iosURL);
    });

    it('should return Android URL on Android platform', () => {
      (Platform as any).OS = 'android';
      const iosURL = 'https://apps.apple.com/app/123';
      const androidURL = 'https://play.google.com/store/apps/details?id=com.example';

      const result = getStoreURL(iosURL, androidURL);

      expect(result).toBe(androidURL);
    });

    it('should return null when both URLs are undefined', () => {
      const result = getStoreURL(undefined, undefined);
      expect(result).toBeNull();
    });

    it('should return iOS URL when Android URL is undefined', () => {
      (Platform as any).OS = 'android';
      const iosURL = 'https://apps.apple.com/app/123';

      const result = getStoreURL(iosURL, undefined);

      expect(result).toBe(iosURL);
    });

    it('should return Android URL when iOS URL is undefined', () => {
      (Platform as any).OS = 'ios';
      const androidURL = 'https://play.google.com/store/apps/details?id=com.example';

      const result = getStoreURL(undefined, androidURL);

      expect(result).toBe(androidURL);
    });
  });
});

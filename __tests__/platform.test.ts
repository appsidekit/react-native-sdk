import {
  getPlatform,
  getOSVersion,
  getDeviceModel,
  getCountryCode,
  getLanguageCode,
  openURL,
  getAppVersion,
} from '../src/utils/platform';
import { Platform, Linking } from 'react-native';

describe('platform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAppVersion', () => {
    it('should return app version', () => {
      expect(getAppVersion()).toBe('1.0.0');
    });
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
      const version = getOSVersion();
      expect(typeof version).toBe('string');
      expect(version).toBe('17.0');
    });
  });

  describe('getDeviceModel', () => {
    it('should return device model', () => {
      const model = getDeviceModel();
      expect(model).toBe('iPhone 15');
    });
  });

  describe('getCountryCode', () => {
    it('should return country code', () => {
      const code = getCountryCode();
      expect(typeof code).toBe('string');
      expect(code!.length).toBeGreaterThan(0);
    });
  });

  describe('getLanguageCode', () => {
    it('should return language code', () => {
      const code = getLanguageCode();
      expect(typeof code).toBe('string');
      expect(code!.length).toBeGreaterThan(0);
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

});

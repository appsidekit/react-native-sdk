import { setVerbose, log, error, warn, getVerbose } from '../src/utils/logger';

describe('logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    setVerbose(false); // Reset to default
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('setVerbose', () => {
    it('should enable verbose logging', () => {
      setVerbose(true);
      expect(getVerbose()).toBe(true);
    });

    it('should disable verbose logging', () => {
      setVerbose(false);
      expect(getVerbose()).toBe(false);
    });
  });

  describe('log', () => {
    it('should not log when verbose is false', () => {
      setVerbose(false);
      log('test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log when verbose is true', () => {
      setVerbose(true);
      log('test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[SideKit] test message');
    });

    it('should log with additional arguments', () => {
      setVerbose(true);
      log('test', 'arg1', 'arg2');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[SideKit] test',
        'arg1',
        'arg2'
      );
    });
  });

  describe('error', () => {
    it('should not log errors when verbose is false', () => {
      setVerbose(false);
      error('error message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log errors when verbose is true', () => {
      setVerbose(true);
      error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[SideKit] error message');
    });
  });

  describe('warn', () => {
    it('should not log warnings when verbose is false', () => {
      setVerbose(false);
      warn('warning message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should log warnings when verbose is true', () => {
      setVerbose(true);
      warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[SideKit] warning message');
    });
  });
});

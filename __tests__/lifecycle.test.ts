import { subscribeToLifecycle, getCurrentAppState, isAppActive } from '../src/utils/lifecycle';
import { AppState } from 'react-native';

describe('lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should subscribe to app state changes', () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();

    const unsubscribe = subscribeToLifecycle(onForeground, onBackground);

    expect(typeof unsubscribe).toBe('function');

    // Clean up
    unsubscribe();
  });

  it('should return unsubscribe function', () => {
    const onForeground = jest.fn();
    const onBackground = jest.fn();

    const unsubscribe = subscribeToLifecycle(onForeground, onBackground);

    expect(typeof unsubscribe).toBe('function');

    // Should not throw when called
    expect(() => unsubscribe()).not.toThrow();
  });

  it('should handle multiple subscriptions', () => {
    const onForeground1 = jest.fn();
    const onBackground1 = jest.fn();
    const onForeground2 = jest.fn();
    const onBackground2 = jest.fn();

    const unsubscribe1 = subscribeToLifecycle(onForeground1, onBackground1);
    const unsubscribe2 = subscribeToLifecycle(onForeground2, onBackground2);

    expect(typeof unsubscribe1).toBe('function');
    expect(typeof unsubscribe2).toBe('function');

    // Clean up
    unsubscribe1();
    unsubscribe2();
  });


  describe('getCurrentAppState', () => {
    it('should return current app state', () => {
      const state = getCurrentAppState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
    });

    it('should return active state', () => {
      (AppState as any).currentState = 'active';
      const state = getCurrentAppState();
      expect(state).toBe('active');
    });

    it('should return background state', () => {
      (AppState as any).currentState = 'background';
      const state = getCurrentAppState();
      expect(state).toBe('background');
    });

    it('should return inactive state', () => {
      (AppState as any).currentState = 'inactive';
      const state = getCurrentAppState();
      expect(state).toBe('inactive');
    });
  });

  describe('isAppActive', () => {
    it('should return true when app is active', () => {
      (AppState as any).currentState = 'active';
      expect(isAppActive()).toBe(true);
    });

    it('should return false when app is in background', () => {
      (AppState as any).currentState = 'background';
      expect(isAppActive()).toBe(false);
    });

    it('should return false when app is inactive', () => {
      (AppState as any).currentState = 'inactive';
      expect(isAppActive()).toBe(false);
    });
  });
});

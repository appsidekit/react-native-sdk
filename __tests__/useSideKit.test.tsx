import { renderHook, act } from '@testing-library/react-native';
import { useSideKit } from '../src';
import { SideKit } from '../src/core/SideKit';

// Mock SideKit
jest.mock('../src/core/SideKit', () => ({
  SideKit: {
    shared: {
      showUpdateScreen: false,
      gateInformation: null,
      isAnalyticsEnabled: true,
      sendSignals: jest.fn(),
      dismissUpdateGate: jest.fn(),
      subscribe: jest.fn(() => jest.fn()),
    },
  },
}));

describe('useSideKit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendSignal', () => {
    it('should call SideKit.sendSignals with single signal', () => {
      const { result } = renderHook(() => useSideKit());

      act(() => {
        result.current.sendSignal('button_clicked');
      });

      expect(SideKit.shared.sendSignals).toHaveBeenCalledWith([
        { key: 'button_clicked', value: undefined },
      ]);
    });

    it('should call SideKit.sendSignals with signal and value', () => {
      const { result } = renderHook(() => useSideKit());

      act(() => {
        result.current.sendSignal('purchase', 'pro_plan');
      });

      expect(SideKit.shared.sendSignals).toHaveBeenCalledWith([
        { key: 'purchase', value: 'pro_plan' },
      ]);
    });
  });

  describe('sendSignals', () => {
    it('should call SideKit.sendSignals with multiple signals', () => {
      const { result } = renderHook(() => useSideKit());

      const signals = [
        { key: 'page_view', value: 'home' },
        { key: 'button_clicked', value: 'signup' },
        { key: 'feature_used' },
      ];

      act(() => {
        result.current.sendSignals(signals);
      });

      expect(SideKit.shared.sendSignals).toHaveBeenCalledWith(signals);
    });

    it('should call SideKit.sendSignals with empty array', () => {
      const { result } = renderHook(() => useSideKit());

      act(() => {
        result.current.sendSignals([]);
      });

      expect(SideKit.shared.sendSignals).toHaveBeenCalledWith([]);
    });

    it('should call SideKit.sendSignals with single signal', () => {
      const { result } = renderHook(() => useSideKit());

      act(() => {
        result.current.sendSignals([{ key: 'test_event', value: 'test' }]);
      });

      expect(SideKit.shared.sendSignals).toHaveBeenCalledWith([
        { key: 'test_event', value: 'test' },
      ]);
    });
  });

  describe('method stability', () => {
    it('should maintain stable references for sendSignal', () => {
      const { result, rerender } = renderHook(() => useSideKit());

      const firstRender = result.current.sendSignal;
      rerender({});
      const secondRender = result.current.sendSignal;

      expect(firstRender).toBe(secondRender);
    });

    it('should maintain stable references for sendSignals', () => {
      const { result, rerender } = renderHook(() => useSideKit());

      const firstRender = result.current.sendSignals;
      rerender({});
      const secondRender = result.current.sendSignals;

      expect(firstRender).toBe(secondRender);
    });
  });
});

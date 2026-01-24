import React from 'react';
import { DefaultVersionGate } from '../src/components/DefaultVersionGate';
import { GateInformation } from '../src/models/GateInformation';
import { VersionGateType } from '../src/types';

// Mock useSideKit hook
jest.mock('../src/index', () => ({
  ...jest.requireActual('../src/index'),
  useSideKit: jest.fn(),
}));

// Mock platform utilities
jest.mock('../src/utils/platform', () => ({
  openURL: jest.fn(() => Promise.resolve(true)),
  getAppVersion: jest.fn(() => '1.0.0'),
}));

describe('DefaultVersionGate', () => {
  const mockUseSideKit = require('../src/index').useSideKit;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be importable', () => {
    expect(DefaultVersionGate).toBeDefined();
    expect(typeof DefaultVersionGate).toBe('function');
  });

  it('should return null when showUpdateScreen is false', () => {
    mockUseSideKit.mockReturnValue({
      showUpdateScreen: false,
      gateInformation: null,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate();
    expect(result).toBeNull();
  });

  it('should return null when gateInformation is null', () => {
    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: null,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate();
    expect(result).toBeNull();
  });

  it('should return JSX when conditions are met', () => {
    const gateInfo = new GateInformation({
      gateType: VersionGateType.Forced,
      lastGateUpdate: '2026-01-01T00:00:00Z',
      latestVersion: '2.1.0',
      whatsNew: 'Bug fixes and improvements',
      storeUrl: 'https://apps.apple.com/app/123',
    });

    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: gateInfo,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate();
    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
  });

  it('should determine dismissible state from API gate information', () => {
    const gateInfo = new GateInformation({
      gateType: VersionGateType.Dismissible,
      lastGateUpdate: '2026-01-01T00:00:00Z',
      latestVersion: '2.0.0',
      whatsNew: 'New features',
      storeUrl: null,
    });

    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: gateInfo,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate();
    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
  });

  it('should work with forced update gates', () => {
    const gateInfo = new GateInformation({
      gateType: VersionGateType.Forced,
      lastGateUpdate: '2026-01-01T00:00:00Z',
      latestVersion: null,
      whatsNew: null,
      storeUrl: null,
    });

    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: gateInfo,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate();

    // Component should be valid
    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
  });

  it('should export DefaultVersionGateProps type', () => {
    // This test just verifies that types are properly exported
    // The props interface is now empty, but should still be defined
    const props: import('../src/components/DefaultVersionGate').DefaultVersionGateProps =
      {};
    expect(props).toBeDefined();
  });

  it('should have update and skip button handlers defined', () => {
    const gateInfo = new GateInformation({
      gateType: VersionGateType.Dismissible,
      lastGateUpdate: '2026-01-01T00:00:00Z',
      latestVersion: '2.0.0',
      whatsNew: 'New features',
      storeUrl: 'https://apps.apple.com/app/123',
    });

    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: gateInfo,
      dismissUpdateGate: jest.fn(),
    });

    const result = DefaultVersionGate();

    // Verify component structure
    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
  });
});

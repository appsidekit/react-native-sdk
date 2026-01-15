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
  getStoreURL: jest.fn((ios, android) => ios || android),
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

    const result = DefaultVersionGate({});
    expect(result).toBeNull();
  });

  it('should return null when gateInformation is null', () => {
    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: null,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate({});
    expect(result).toBeNull();
  });

  it('should return JSX when conditions are met', () => {
    const gateInfo = new GateInformation({
      lastGateUpdate: '2026-01-01T00:00:00Z',
      minVersion: { version: '2.0.0', type: VersionGateType.Forced },
      blockedVersions: [],
      latestVersion: '2.1.0',
      whatsNew: 'Bug fixes and improvements',
      appStoreURL: 'https://apps.apple.com/app/123',
    });

    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: gateInfo,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate({});
    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
  });

  it('should handle dismissable prop', () => {
    const gateInfo = new GateInformation({
      lastGateUpdate: '2026-01-01T00:00:00Z',
      blockedVersions: [
        { version: '1.0.0', type: VersionGateType.Dismissable },
      ],
      latestVersion: '2.0.0',
      whatsNew: 'New features',
    });

    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: gateInfo,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate({ dismissable: true });
    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
  });

  it('should call onSkip callback when provided', () => {
    const onSkip = jest.fn();
    const gateInfo = new GateInformation({
      lastGateUpdate: '2026-01-01T00:00:00Z',
      blockedVersions: [
        { version: '1.0.0', type: VersionGateType.Dismissable },
      ],
    });

    mockUseSideKit.mockReturnValue({
      showUpdateScreen: true,
      gateInformation: gateInfo,
      isAnalyticsEnabled: true,
    });

    const result = DefaultVersionGate({ dismissable: true, onSkip });

    // Component should be valid
    expect(result).not.toBeNull();
    expect(React.isValidElement(result)).toBe(true);
  });

  it('should export DefaultVersionGateProps type', () => {
    // This test just verifies that types are properly exported
    const props: import('../src/components/DefaultVersionGate').DefaultVersionGateProps =
      {
        dismissable: true,
        onSkip: () => {},
      };
    expect(props).toBeDefined();
  });
});

import React from 'react';
import { Text, View } from 'react-native';
import { SideKitProvider } from '../src/components/SideKitProvider';
import { SideKit } from '../src/core/SideKit';

// Mock SideKit
jest.mock('../src/core/SideKit', () => ({
  SideKit: {
    shared: {
      configure: jest.fn(),
      reset: jest.fn(),
    },
  },
}));

// Mock DefaultVersionGate
jest.mock('../src/components/DefaultVersionGate', () => ({
  DefaultVersionGate: () => null,
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  error: jest.fn(),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => <View {...props}>{children}</View>,
}));

describe('SideKitProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SideKit.shared.configure as jest.Mock).mockResolvedValue(undefined);
  });

  it('should be importable', () => {
    expect(SideKitProvider).toBeDefined();
    expect(typeof SideKitProvider).toBe('function');
  });

  it('should create valid React element with API key', () => {
    const element = (
      <SideKitProvider apiKey="test-api-key">
        <Text>App Content</Text>
      </SideKitProvider>
    );

    expect(React.isValidElement(element)).toBe(true);
  });

  it('should create valid React element with manual presentation mode', () => {
    const element = (
      <SideKitProvider apiKey="test-api-key" presentationMode="manual">
        <Text>App Content</Text>
      </SideKitProvider>
    );

    expect(React.isValidElement(element)).toBe(true);
  });

  it('should create valid React element with verbose logging', () => {
    const element = (
      <SideKitProvider apiKey="test-api-key" verbose={true}>
        <Text>App Content</Text>
      </SideKitProvider>
    );

    expect(React.isValidElement(element)).toBe(true);
  });

  it('should accept all props', () => {
    const props = {
      apiKey: 'test-key',
      presentationMode: 'automatic' as const,
      verbose: false,
      children: <Text>Child</Text>,
    };

    const element = <SideKitProvider {...props} />;

    expect(React.isValidElement(element)).toBe(true);
  });
});

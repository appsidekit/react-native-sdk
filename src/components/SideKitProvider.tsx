/**
 * SideKitProvider - Main provider component for SideKit SDK
 *
 * Wraps your app and automatically configures the SDK with your API key.
 * Handles automatic version gate presentation when configured.
 *
 * @module SideKitProvider
 */

import React, { useEffect, useState } from 'react';
import { SideKit } from '../core/SideKit';
import { DefaultVersionGate } from './DefaultVersionGate';
import type { UpdatePresentationMode } from '../types';
import { error } from '../utils/logger';

/**
 * Props for the SideKitProvider component.
 */
export interface SideKitProviderProps {
  /**
   * Your SideKit API key (required)
   */
  apiKey: string;

  /**
   * How to present update gates
   * - 'automatic': SDK automatically shows update screen (default)
   * - 'manual': Developer controls when to show update screen
   *
   * @default 'automatic'
   */
  presentationMode?: UpdatePresentationMode;

  /**
   * Enable verbose logging for debugging
   *
   * @default false
   */
  verbose?: boolean;

  /**
   * Your app content
   */
  children: React.ReactNode;
}

/**
 * SideKitProvider - Main provider component for SideKit SDK.
 *
 * This component wraps your entire app and handles SDK configuration automatically.
 *
 * When `presentationMode` is set to 'automatic' (default), the provider will
 * automatically render a DefaultVersionGate component to show update prompts.
 *
 * @param {SideKitProviderProps} props - Component props
 * @returns {JSX.Element} The provider component wrapping your app
 *
 * @example
 * ```typescript
 * import { SideKitProvider } from '@sidekit/react-native';
 *
 * function App() {
 *   return (
 *     <SideKitProvider apiKey="sk_your_api_key">
 *       <YourAppContent />
 *     </SideKitProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With verbose logging and manual presentation
 * <SideKitProvider
 *   apiKey="sk_your_api_key"
 *   presentationMode="manual"
 *   verbose={__DEV__}
 * >
 *   <YourAppContent />
 * </SideKitProvider>
 * ```
 */
export function SideKitProvider({
  apiKey,
  presentationMode = 'automatic',
  verbose = false,
  children,
}: SideKitProviderProps): JSX.Element {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const configure = async () => {
      try {
        await SideKit.shared.configure(apiKey, {
          presentationMode,
          verbose,
        });
        setIsConfigured(true);
      } catch (err) {
        error('Failed to configure SideKit SDK:', err);
        // Don't block rendering, just log the error
      }
    };

    configure();

    // Cleanup on unmount
    return () => {
      // Optional: could call SideKit.shared.reset() here if needed
    };
  }, [apiKey, presentationMode, verbose]);

  return (
    <>
      {children}
      {isConfigured && presentationMode === 'automatic' && <DefaultVersionGate />}
    </>
  );
}

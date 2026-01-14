/**
 * Logger utility for conditional debug logging
 */

let isVerbose = false;

/**
 * Enable or disable verbose logging
 * @param enabled Whether to enable verbose logging
 */
export function setVerbose(enabled: boolean): void {
  isVerbose = enabled;
}

/**
 * Log a message with [SideKit] prefix (only if verbose mode is enabled)
 * @param message Message to log
 * @param args Additional arguments to log
 */
export function log(message: string, ...args: any[]): void {
  if (isVerbose) {
    console.log(`[SideKit] ${message}`, ...args);
  }
}

/**
 * Log an error message with [SideKit] prefix (only if verbose mode is enabled)
 * @param message Error message to log
 * @param args Additional arguments to log
 */
export function error(message: string, ...args: any[]): void {
  if (isVerbose) {
    console.error(`[SideKit] ${message}`, ...args);
  }
}

/**
 * Log a warning message with [SideKit] prefix (only if verbose mode is enabled)
 * @param message Warning message to log
 * @param args Additional arguments to log
 */
export function warn(message: string, ...args: any[]): void {
  if (isVerbose) {
    console.warn(`[SideKit] ${message}`, ...args);
  }
}

/**
 * Get current verbose state
 * @returns Whether verbose logging is enabled
 */
export function getVerbose(): boolean {
  return isVerbose;
}

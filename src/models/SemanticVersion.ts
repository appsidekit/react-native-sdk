/**
 * SemanticVersion - Version string parsing and comparison
 *
 * Parses version strings like "1.2.3", "2.0", "1", "1.2.3.4.5"
 * and provides comparison methods that match iOS SDK behavior.
 */
export class SemanticVersion {
  private components: number[];

  /**
   * Create a SemanticVersion from a version string
   * @param versionString Version string (e.g., "1.2.3")
   * @throws Error if version string is invalid
   */
  constructor(versionString: string) {
    this.components = versionString
      .split('.')
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));

    if (this.components.length === 0) {
      throw new Error(`Invalid version string: ${versionString}`);
    }
  }

  /**
   * Compare if this version is less than another
   * @param other Version to compare against
   * @returns true if this < other
   */
  lessThan(other: SemanticVersion): boolean {
    const maxLength = Math.max(this.components.length, other.components.length);

    for (let i = 0; i < maxLength; i++) {
      const a = this.components[i] ?? 0; // Zero-pad missing components
      const b = other.components[i] ?? 0;

      if (a < b) return true;
      if (a > b) return false;
    }

    return false; // Equal
  }

  /**
   * Compare if this version equals another
   * @param other Version to compare against
   * @returns true if this == other
   */
  equals(other: SemanticVersion): boolean {
    return !this.lessThan(other) && !other.lessThan(this);
  }

  /**
   * Compare if this version is greater than another
   * @param other Version to compare against
   * @returns true if this > other
   */
  greaterThan(other: SemanticVersion): boolean {
    return other.lessThan(this);
  }

  /**
   * Compare if this version is less than or equal to another
   * @param other Version to compare against
   * @returns true if this <= other
   */
  lessThanOrEqual(other: SemanticVersion): boolean {
    return this.lessThan(other) || this.equals(other);
  }

  /**
   * Compare if this version is greater than or equal to another
   * @param other Version to compare against
   * @returns true if this >= other
   */
  greaterThanOrEqual(other: SemanticVersion): boolean {
    return this.greaterThan(other) || this.equals(other);
  }

  /**
   * Get string representation
   * @returns Version string (e.g., "1.2.3")
   */
  toString(): string {
    return this.components.join('.');
  }

  /**
   * Get the version components
   * @returns Array of version components
   */
  getComponents(): number[] {
    return [...this.components];
  }
}

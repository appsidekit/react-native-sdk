import { SemanticVersion } from '../src/models/SemanticVersion';

describe('SemanticVersion', () => {
  describe('constructor', () => {
    it('should parse simple version strings', () => {
      const v1 = new SemanticVersion('1.2.3');
      expect(v1.toString()).toBe('1.2.3');
      expect(v1.getComponents()).toEqual([1, 2, 3]);
    });

    it('should parse short version strings', () => {
      const v1 = new SemanticVersion('2.0');
      expect(v1.toString()).toBe('2.0');
      expect(v1.getComponents()).toEqual([2, 0]);
    });

    it('should parse single component versions', () => {
      const v1 = new SemanticVersion('5');
      expect(v1.toString()).toBe('5');
      expect(v1.getComponents()).toEqual([5]);
    });

    it('should parse long version strings', () => {
      const v1 = new SemanticVersion('1.2.3.4.5');
      expect(v1.toString()).toBe('1.2.3.4.5');
      expect(v1.getComponents()).toEqual([1, 2, 3, 4, 5]);
    });

    it('should throw error for invalid version strings', () => {
      expect(() => new SemanticVersion('')).toThrow('Invalid version string');
      expect(() => new SemanticVersion('abc')).toThrow('Invalid version string');
      expect(() => new SemanticVersion('...')).toThrow('Invalid version string');
    });

    it('should handle version strings with non-numeric parts', () => {
      // Filters out non-numeric parts
      const v1 = new SemanticVersion('1.2.beta');
      expect(v1.getComponents()).toEqual([1, 2]);
    });
  });

  describe('lessThan', () => {
    it('should compare versions correctly', () => {
      const v1_0_0 = new SemanticVersion('1.0.0');
      const v2_0_0 = new SemanticVersion('2.0.0');
      expect(v1_0_0.lessThan(v2_0_0)).toBe(true);
      expect(v2_0_0.lessThan(v1_0_0)).toBe(false);
    });

    it('should handle minor version differences', () => {
      const v1_2_0 = new SemanticVersion('1.2.0');
      const v1_3_0 = new SemanticVersion('1.3.0');
      expect(v1_2_0.lessThan(v1_3_0)).toBe(true);
      expect(v1_3_0.lessThan(v1_2_0)).toBe(false);
    });

    it('should handle patch version differences', () => {
      const v1_2_3 = new SemanticVersion('1.2.3');
      const v1_2_4 = new SemanticVersion('1.2.4');
      expect(v1_2_3.lessThan(v1_2_4)).toBe(true);
      expect(v1_2_4.lessThan(v1_2_3)).toBe(false);
    });

    it('should zero-pad shorter versions', () => {
      const v1_2 = new SemanticVersion('1.2');
      const v1_2_0 = new SemanticVersion('1.2.0');
      expect(v1_2.lessThan(v1_2_0)).toBe(false);
      expect(v1_2_0.lessThan(v1_2)).toBe(false);
    });

    it('should handle different component counts', () => {
      const v1 = new SemanticVersion('1');
      const v1_0_0 = new SemanticVersion('1.0.0');
      expect(v1.lessThan(v1_0_0)).toBe(false);
      expect(v1_0_0.lessThan(v1)).toBe(false);
    });

    it('should handle regression case: 2.0.0 > 1.9.0', () => {
      const v1_9_0 = new SemanticVersion('1.9.0');
      const v2_0_0 = new SemanticVersion('2.0.0');
      expect(v1_9_0.lessThan(v2_0_0)).toBe(true);
      expect(v2_0_0.lessThan(v1_9_0)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for identical versions', () => {
      const v1 = new SemanticVersion('1.2.3');
      const v2 = new SemanticVersion('1.2.3');
      expect(v1.equals(v2)).toBe(true);
    });

    it('should return true for equivalent versions with different lengths', () => {
      const v1_2 = new SemanticVersion('1.2');
      const v1_2_0 = new SemanticVersion('1.2.0');
      expect(v1_2.equals(v1_2_0)).toBe(true);
    });

    it('should return false for different versions', () => {
      const v1_2_3 = new SemanticVersion('1.2.3');
      const v1_2_4 = new SemanticVersion('1.2.4');
      expect(v1_2_3.equals(v1_2_4)).toBe(false);
    });
  });

  describe('greaterThan', () => {
    it('should compare versions correctly', () => {
      const v1_0_0 = new SemanticVersion('1.0.0');
      const v2_0_0 = new SemanticVersion('2.0.0');
      expect(v2_0_0.greaterThan(v1_0_0)).toBe(true);
      expect(v1_0_0.greaterThan(v2_0_0)).toBe(false);
    });

    it('should return false for equal versions', () => {
      const v1 = new SemanticVersion('1.2.3');
      const v2 = new SemanticVersion('1.2.3');
      expect(v1.greaterThan(v2)).toBe(false);
    });
  });

  describe('lessThanOrEqual', () => {
    it('should return true for less than', () => {
      const v1 = new SemanticVersion('1.0.0');
      const v2 = new SemanticVersion('2.0.0');
      expect(v1.lessThanOrEqual(v2)).toBe(true);
    });

    it('should return true for equal', () => {
      const v1 = new SemanticVersion('1.2.3');
      const v2 = new SemanticVersion('1.2.3');
      expect(v1.lessThanOrEqual(v2)).toBe(true);
    });

    it('should return false for greater than', () => {
      const v1 = new SemanticVersion('2.0.0');
      const v2 = new SemanticVersion('1.0.0');
      expect(v1.lessThanOrEqual(v2)).toBe(false);
    });
  });

  describe('greaterThanOrEqual', () => {
    it('should return true for greater than', () => {
      const v1 = new SemanticVersion('2.0.0');
      const v2 = new SemanticVersion('1.0.0');
      expect(v1.greaterThanOrEqual(v2)).toBe(true);
    });

    it('should return true for equal', () => {
      const v1 = new SemanticVersion('1.2.3');
      const v2 = new SemanticVersion('1.2.3');
      expect(v1.greaterThanOrEqual(v2)).toBe(true);
    });

    it('should return false for less than', () => {
      const v1 = new SemanticVersion('1.0.0');
      const v2 = new SemanticVersion('2.0.0');
      expect(v1.greaterThanOrEqual(v2)).toBe(false);
    });
  });
});

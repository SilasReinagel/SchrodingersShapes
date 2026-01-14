import { describe, it, expect } from 'vitest';
import { 
  encodeLevelNumber, 
  decodeLevelNumber, 
  getNextLevelNumber,
  getStartingLevelNumber,
  formatLevelNumber
} from './LevelNumber';

describe('LevelNumber', () => {
  describe('encodeLevelNumber', () => {
    it('should encode level1 seed 0 as 10000', () => {
      expect(encodeLevelNumber('level1', 0)).toBe(10000);
    });

    it('should encode level2 seed 1005 as 21005', () => {
      expect(encodeLevelNumber('level2', 1005)).toBe(21005);
    });

    it('should encode level3 seed 5000 as 35000', () => {
      expect(encodeLevelNumber('level3', 5000)).toBe(35000);
    });

    it('should encode level4 seed 9999 as 49999', () => {
      expect(encodeLevelNumber('level4', 9999)).toBe(49999);
    });

    it('should encode level5 seed 0 as 50000', () => {
      expect(encodeLevelNumber('level5', 0)).toBe(50000);
    });

    it('should clamp seed to valid range', () => {
      expect(encodeLevelNumber('level1', -1)).toBe(10000);
      expect(encodeLevelNumber('level1', 10000)).toBe(19999);
    });
  });

  describe('decodeLevelNumber', () => {
    it('should decode 10000 as level1 seed 0', () => {
      expect(decodeLevelNumber(10000)).toEqual({ difficulty: 'level1', seed: 0 });
    });

    it('should decode 21005 as level2 seed 1005', () => {
      expect(decodeLevelNumber(21005)).toEqual({ difficulty: 'level2', seed: 1005 });
    });

    it('should decode 35000 as level3 seed 5000', () => {
      expect(decodeLevelNumber(35000)).toEqual({ difficulty: 'level3', seed: 5000 });
    });

    it('should decode 49999 as level4 seed 9999', () => {
      expect(decodeLevelNumber(49999)).toEqual({ difficulty: 'level4', seed: 9999 });
    });

    it('should decode 50000 as level5 seed 0', () => {
      expect(decodeLevelNumber(50000)).toEqual({ difficulty: 'level5', seed: 0 });
    });

    it('should clamp out of range difficulty numbers', () => {
      expect(decodeLevelNumber(0)).toEqual({ difficulty: 'level1', seed: 0 });
      expect(decodeLevelNumber(60000)).toEqual({ difficulty: 'level5', seed: 0 });
    });
  });

  describe('getNextLevelNumber', () => {
    it('should increment by 1 within same difficulty', () => {
      expect(getNextLevelNumber(10000)).toBe(10001);
      expect(getNextLevelNumber(21005)).toBe(21006);
    });

    it('should wrap to next difficulty when seed reaches 9999', () => {
      expect(getNextLevelNumber(19999)).toBe(20000);
      expect(getNextLevelNumber(29999)).toBe(30000);
    });

    it('should wrap from level5 back to level1', () => {
      expect(getNextLevelNumber(59999)).toBe(10000);
    });
  });

  describe('getStartingLevelNumber', () => {
    it('should return starting level for each difficulty', () => {
      expect(getStartingLevelNumber('level1')).toBe(10000);
      expect(getStartingLevelNumber('level2')).toBe(20000);
      expect(getStartingLevelNumber('level3')).toBe(30000);
      expect(getStartingLevelNumber('level4')).toBe(40000);
      expect(getStartingLevelNumber('level5')).toBe(50000);
    });
  });

  describe('formatLevelNumber', () => {
    it('should format level number as string', () => {
      expect(formatLevelNumber(10000)).toBe('10000');
      expect(formatLevelNumber(21005)).toBe('21005');
    });
  });

  describe('encode/decode roundtrip', () => {
    it('should be reversible', () => {
      const testCases: Array<{ difficulty: 'level1' | 'level2' | 'level3' | 'level4' | 'level5'; seed: number }> = [
        { difficulty: 'level1', seed: 0 },
        { difficulty: 'level2', seed: 1005 },
        { difficulty: 'level3', seed: 5000 },
        { difficulty: 'level4', seed: 9999 },
        { difficulty: 'level5', seed: 42 },
      ];

      for (const { difficulty, seed } of testCases) {
        const encoded = encodeLevelNumber(difficulty, seed);
        const decoded = decodeLevelNumber(encoded);
        expect(decoded).toEqual({ difficulty, seed });
      }
    });
  });
});



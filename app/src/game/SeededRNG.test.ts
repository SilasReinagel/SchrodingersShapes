import { describe, it, expect } from 'vitest';
import { SeededRNG } from './SeededRNG';

describe('SeededRNG', () => {
  describe('constructor', () => {
    it('should create an instance with numeric seed', () => {
      const rng = new SeededRNG(12345);
      expect(rng).toBeDefined();
    });

    it('should create an instance with string seed', () => {
      const rng = new SeededRNG('test-seed');
      expect(rng).toBeDefined();
    });

    it('should handle zero seed by converting to 1', () => {
      const rng = new SeededRNG(0);
      // Should not produce all zeros
      const value = rng.random();
      expect(value).toBeGreaterThan(0);
    });
  });

  describe('random()', () => {
    it('should return values between 0 and 1', () => {
      const rng = new SeededRNG(12345);
      
      for (let i = 0; i < 100; i++) {
        const value = rng.random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('should produce deterministic sequence with same seed', () => {
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(12345);
      
      const sequence1: number[] = [];
      const sequence2: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        sequence1.push(rng1.random());
        sequence2.push(rng2.random());
      }
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(67890);
      
      const sequence1: number[] = [];
      const sequence2: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        sequence1.push(rng1.random());
        sequence2.push(rng2.random());
      }
      
      expect(sequence1).not.toEqual(sequence2);
    });

    it('should produce deterministic sequence with string seed', () => {
      const rng1 = new SeededRNG('test-seed');
      const rng2 = new SeededRNG('test-seed');
      
      const sequence1: number[] = [];
      const sequence2: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        sequence1.push(rng1.random());
        sequence2.push(rng2.random());
      }
      
      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different string seeds', () => {
      const rng1 = new SeededRNG('seed1');
      const rng2 = new SeededRNG('seed2');
      
      const sequence1: number[] = [];
      const sequence2: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        sequence1.push(rng1.random());
        sequence2.push(rng2.random());
      }
      
      expect(sequence1).not.toEqual(sequence2);
    });

    it('should produce uniform distribution over many samples', () => {
      const rng = new SeededRNG(12345);
      const buckets = new Array(10).fill(0);
      const samples = 10000;
      
      for (let i = 0; i < samples; i++) {
        const value = rng.random();
        const bucket = Math.floor(value * 10);
        buckets[bucket]++;
      }
      
      // Each bucket should have roughly 1000 samples (within 20% tolerance)
      buckets.forEach(count => {
        expect(count).toBeGreaterThan(samples / 10 * 0.8);
        expect(count).toBeLessThan(samples / 10 * 1.2);
      });
    });
  });

  describe('nextInt()', () => {
    it('should return integers between 0 and max-1', () => {
      const rng = new SeededRNG(12345);
      const max = 10;
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(max);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(max);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should produce deterministic sequence', () => {
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(12345);
      
      for (let i = 0; i < 10; i++) {
        expect(rng1.nextInt(10)).toBe(rng2.nextInt(10));
      }
    });

    it('should handle max of 1', () => {
      const rng = new SeededRNG(12345);
      const value = rng.nextInt(1);
      expect(value).toBe(0);
    });
  });

  describe('nextIntRange()', () => {
    it('should return integers between min and max (inclusive)', () => {
      const rng = new SeededRNG(12345);
      const min = 5;
      const max = 15;
      
      for (let i = 0; i < 100; i++) {
        const value = rng.nextIntRange(min, max);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('should produce deterministic sequence', () => {
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(12345);
      
      for (let i = 0; i < 10; i++) {
        expect(rng1.nextIntRange(5, 15)).toBe(rng2.nextIntRange(5, 15));
      }
    });

    it('should handle same min and max', () => {
      const rng = new SeededRNG(12345);
      const value = rng.nextIntRange(10, 10);
      expect(value).toBe(10);
    });
  });

  describe('getSeed()', () => {
    it('should return the current seed value', () => {
      const seed = 12345;
      const rng = new SeededRNG(seed);
      expect(rng.getSeed()).toBe(seed);
    });

    it('should return updated seed after random() calls', () => {
      const rng = new SeededRNG(12345);
      const initialSeed = rng.getSeed();
      rng.random();
      const newSeed = rng.getSeed();
      expect(newSeed).not.toBe(initialSeed);
    });
  });

  describe('setSeed()', () => {
    it('should update the seed', () => {
      const rng = new SeededRNG(12345);
      rng.setSeed(67890);
      expect(rng.getSeed()).toBe(67890);
    });

    it('should reset sequence with new seed', () => {
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(12345);
      
      // Generate some values
      rng1.random();
      rng1.random();
      
      // Reset rng1 to original seed
      rng1.setSeed(12345);
      
      // Both should now produce same sequence
      expect(rng1.random()).toBe(rng2.random());
    });

    it('should accept string seed', () => {
      const rng = new SeededRNG(12345);
      rng.setSeed('new-seed');
      const value1 = rng.random();
      
      const rng2 = new SeededRNG('new-seed');
      const value2 = rng2.random();
      
      expect(value1).toBe(value2);
    });
  });

  describe('API compatibility with Math.random()', () => {
    it('should have similar usage pattern', () => {
      const rng = new SeededRNG(12345);
      
      // Math.random() usage: const value = Math.random();
      // SeededRNG usage: const value = rng.random();
      const value = rng.random();
      
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });

    it('should work in same contexts as Math.random()', () => {
      const rng = new SeededRNG(12345);
      
      // Common Math.random() patterns
      const randomIndex = Math.floor(rng.random() * 10);
      const randomBoolean = rng.random() < 0.5;
      const randomInRange = rng.random() * (100 - 50) + 50;
      
      expect(randomIndex).toBeGreaterThanOrEqual(0);
      expect(randomIndex).toBeLessThan(10);
      expect(typeof randomBoolean).toBe('boolean');
      expect(randomInRange).toBeGreaterThanOrEqual(50);
      expect(randomInRange).toBeLessThan(100);
    });
  });
});



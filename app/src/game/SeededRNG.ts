/**
 * Seeded Random Number Generator
 * 
 * Provides deterministic random number generation using a Linear Congruential Generator (LCG).
 * Similar API to Math.random() but with seed-based determinism.
 * 
 * @example
 * const rng = new SeededRNG(12345);
 * const value = rng.random(); // Returns a number between 0 and 1
 * 
 * @example
 * const rng = new SeededRNG("my-seed-string");
 * const value = rng.random(); // Deterministic based on string hash
 */
export class SeededRNG {
  private seed: number;

  /**
   * Creates a new SeededRNG instance
   * @param seed - Numeric seed or string seed (will be hashed to number)
   */
  constructor(seed: number | string) {
    this.seed = typeof seed === 'string' ? this.hashString(seed) : seed;
    // Ensure seed is a valid 32-bit unsigned integer
    this.seed = (this.seed >>> 0) || 1; // Avoid 0 seed (would produce all zeros)
  }

  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive)
   * Similar to Math.random()
   * 
   * @returns A pseudo-random number between 0 and 1
   */
  public random(): number {
    // Linear Congruential Generator (LCG)
    // Using constants from Numerical Recipes
    // seed = (seed * 1664525 + 1013904223) mod 2^32
    this.seed = ((this.seed * 1664525 + 1013904223) >>> 0);
    // Convert to float in range [0, 1)
    return (this.seed >>> 0) / 0xFFFFFFFF;
  }

  /**
   * Returns a random integer between 0 (inclusive) and max (exclusive)
   * 
   * @param max - Maximum value (exclusive)
   * @returns A random integer between 0 and max-1
   */
  public nextInt(max: number): number {
    return Math.floor(this.random() * max);
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * 
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   * @returns A random integer between min and max
   */
  public nextIntRange(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Gets the current seed value
   * 
   * @returns The current seed
   */
  public getSeed(): number {
    return this.seed;
  }

  /**
   * Sets a new seed value
   * 
   * @param seed - New seed (number or string)
   */
  public setSeed(seed: number | string): void {
    this.seed = typeof seed === 'string' ? this.hashString(seed) : seed;
    this.seed = (this.seed >>> 0) || 1;
  }

  /**
   * Hashes a string to a 32-bit unsigned integer
   * Uses a simple but effective hash function (djb2 variant)
   * 
   * @param str - String to hash
   * @returns 32-bit unsigned integer hash
   */
  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash >>> 0; // Convert to unsigned 32-bit
    }
    return hash;
  }
}


# Seed-Based Deterministic Puzzle Generation

## Executive Summary

This report analyzes the requirements for implementing seed-based, deterministic puzzle generation in the Schrodinger's Shapes game. Currently, puzzle generation uses `Math.random()` throughout, making puzzles non-reproducible. Implementing seeded generation will enable puzzle sharing, replayability, and consistent testing.

## Current State Analysis

### Random Number Usage

The `PuzzleGenerator` class uses `Math.random()` in the following locations:

1. **Line 33**: Number of constraints selection
   ```typescript
   Math.random() * (config.maxConstraints - config.minConstraints + 1) + config.minConstraints
   ```

2. **Line 54**: Shape selection for level1 difficulty
   ```typescript
   this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)]
   ```

3. **Line 57**: Count calculation for level1
   ```typescript
   Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount
   ```

4. **Line 76**: Shape selection for level2/level3
   ```typescript
   this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)]
   ```

5. **Line 77**: Complementary shape selection
   ```typescript
   this.SHAPES.filter(s => s !== shape1)[Math.floor(Math.random() * (this.SHAPES.length - 1))]
   ```

6. **Lines 82-83**: Count calculations for level2/level3
   ```typescript
   Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount
   ```

7. **Line 116**: Shape shuffling for hard levels
   ```typescript
   [...this.SHAPES].sort(() => Math.random() - 0.5)
   ```

8. **Line 121**: Count calculation for hard levels
   ```typescript
   Math.floor(totalCells / 4) + 1
   ```

9. **Line 146**: Constraint type selection (row vs column)
   ```typescript
   Math.random() < 0.5 ? 'row' : 'column'
   ```

10. **Line 147**: Index selection for row/column constraints
    ```typescript
    Math.floor(Math.random() * (type === 'row' ? height : width))
    ```

11. **Line 148**: Shape selection for random constraints
    ```typescript
    this.SHAPES[Math.floor(Math.random() * this.SHAPES.length)]
    ```

12. **Line 159**: Count calculation for "at_most" operator
    ```typescript
    Math.floor(Math.random() * maxCount) + 1
    ```

13. **Line 192**: Operator selection
    ```typescript
    operators[Math.floor(Math.random() * operators.length)]
    ```

### Current API Surface

The `PuzzleGenerator.generate()` method currently accepts:
```typescript
generate(config: Partial<PuzzleConfig> = {}): PuzzleDefinition
```

Where `PuzzleConfig` includes:
- `width`, `height`, `difficulty`
- `minConstraints`, `maxConstraints`
- `requiredSuperpositions`

## Requirements for Seed-Based Generation

### 1. Seeded Random Number Generator

**Requirement**: Implement a deterministic PRNG (Pseudo-Random Number Generator) that can be seeded.

**Options**:
- **Option A**: Implement a simple Linear Congruential Generator (LCG)
  - Fast and simple
  - Good enough for game purposes
  - Example: `seed = (seed * 1664525 + 1013904223) % 2^32`
  
- **Option B**: Use a library like `seedrandom` or `prng`
  - More robust
  - Better statistical properties
  - Additional dependency

**Recommendation**: Option A (custom LCG) for simplicity and no external dependencies.

### 2. API Changes

**Requirement**: Extend `PuzzleConfig` to include an optional `seed` parameter.

**Proposed Change**:
```typescript
export type PuzzleConfig = {
  width: number;
  height: number;
  difficulty: Difficulty;
  minConstraints?: number;
  maxConstraints?: number;
  requiredSuperpositions?: number;
  seed?: number | string; // New: seed for deterministic generation
};
```

**Backward Compatibility**: 
- If `seed` is not provided, generate a random seed (non-deterministic)
- This maintains backward compatibility with existing code

### 3. Internal Refactoring

**Requirement**: Replace all `Math.random()` calls with seeded RNG calls.

**Changes Needed**:
1. Create a `SeededRNG` class or utility function
2. Pass RNG instance through all generation methods
3. Replace all `Math.random()` calls with `rng.next()` or similar

**Example Structure**:
```typescript
class SeededRNG {
  private seed: number;
  
  constructor(seed: number | string) {
    this.seed = typeof seed === 'string' ? this.hashString(seed) : seed;
  }
  
  next(): number {
    // LCG implementation
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return (this.seed >>> 0) / 0xFFFFFFFF;
  }
  
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
  
  private hashString(str: string): number {
    // Simple string hash function
  }
}
```

### 4. Seed Generation Strategy

**Requirement**: Provide mechanisms for seed generation and storage.

**Options**:
1. **Automatic**: Generate random seed if not provided (current behavior)
2. **Manual**: Allow user to specify seed (for sharing/replay)
3. **Derived**: Generate seed from difficulty + level number (for consistent progression)

**Recommendation**: Support all three approaches:
- No seed → random seed
- Numeric seed → use directly
- String seed → hash to number (enables human-readable seeds like "level-1-puzzle-5")

### 5. Testing Considerations

**Requirement**: Ensure deterministic behavior can be verified.

**Test Cases Needed**:
1. Same seed produces identical puzzles
2. Different seeds produce different puzzles
3. String seeds are deterministic
4. Backward compatibility (no seed = random)

### 6. Integration Points

**Files That Need Updates**:

1. **`PuzzleGenerator.ts`** (Primary changes)
   - Add `SeededRNG` class or import utility
   - Modify `generate()` to accept/create RNG
   - Replace all `Math.random()` calls
   - Update all helper methods to accept RNG parameter

2. **`types.ts`** (API changes)
   - Add `seed?: number | string` to `PuzzleConfig`

3. **`GameContext.tsx`** (Optional enhancement)
   - Could store/display seed for puzzle sharing
   - Could generate seeds from level progression

4. **`analysisWorker.ts`** (May need seed passing)
   - If worker needs deterministic generation

5. **`PuzzleGenerator.test.ts`** (Test updates)
   - Add tests for deterministic behavior
   - Verify seed-based generation

## Implementation Plan

### Phase 1: Core Infrastructure
1. Create `SeededRNG` class in `PuzzleGenerator.ts` or separate utility file
2. Add `seed` parameter to `PuzzleConfig` type
3. Update `PuzzleGenerator.generate()` to handle seed parameter

### Phase 2: Refactoring
1. Replace `Math.random()` in `generateConstraints()`
2. Replace `Math.random()` in `generateRandomConstraint()`
3. Replace `Math.random()` in `getRandomOperator()`
4. Update all helper methods to accept RNG instance

### Phase 3: Testing & Validation
1. Add unit tests for deterministic generation
2. Verify same seed produces same puzzle
3. Verify backward compatibility (no seed = random)
4. Test string seed hashing

### Phase 4: Integration (Optional)
1. Add seed display/storage in UI
2. Add puzzle sharing via seed
3. Implement seed-based level progression

## Technical Considerations

### Seed Format
- **Numeric seeds**: Direct use, simple and fast
- **String seeds**: More user-friendly (e.g., "level1-puzzle3"), requires hashing
- **Recommendation**: Support both, hash strings to 32-bit integers

### Seed Range
- Use 32-bit unsigned integers (0 to 2^32 - 1)
- String seeds should hash to this range
- Default random seed generation should use `Math.random() * 0xFFFFFFFF`

### Determinism Guarantees
- Same seed + same config = same puzzle
- Different seeds = different puzzles (high probability)
- Platform-independent (no floating-point precision issues)

### Performance Impact
- Seeded RNG should be as fast or faster than `Math.random()`
- LCG is typically faster than `Math.random()`
- Minimal overhead expected

## Potential Issues & Solutions

### Issue 1: Array.sort() with Random Comparator
**Location**: Line 116
```typescript
[...this.SHAPES].sort(() => Math.random() - 0.5)
```

**Problem**: This is not a proper shuffle and doesn't work well with seeded RNG.

**Solution**: Implement Fisher-Yates shuffle using seeded RNG:
```typescript
private shuffleArray<T>(array: T[], rng: SeededRNG): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### Issue 2: Retry Loops
**Location**: Lines 68-73, 104-109, 134-139

**Problem**: The `while` loops that retry constraint generation could potentially run indefinitely with certain seeds.

**Solution**: Add maximum retry limit or ensure seed space doesn't create impossible scenarios.

### Issue 3: Backward Compatibility
**Problem**: Existing code expects non-deterministic behavior.

**Solution**: Default to random seed generation when seed is not provided, maintaining current behavior.

## Success Criteria

1. ✅ Same seed + same config produces identical puzzle
2. ✅ Different seeds produce different puzzles
3. ✅ String seeds work correctly
4. ✅ Backward compatible (no seed = random)
5. ✅ All existing tests pass
6. ✅ New tests verify deterministic behavior
7. ✅ No performance regression

## Estimated Effort

- **Core Infrastructure**: 2-3 hours
- **Refactoring**: 3-4 hours
- **Testing**: 2-3 hours
- **Integration (optional)**: 2-4 hours

**Total**: ~7-10 hours for core implementation, +2-4 hours for optional features

## Conclusion

Implementing seed-based deterministic puzzle generation is straightforward and will significantly enhance the game's capabilities. The main work involves:
1. Creating a seeded RNG utility
2. Replacing all `Math.random()` calls
3. Adding seed parameter to the API
4. Ensuring backward compatibility

The implementation can be done incrementally, maintaining backward compatibility throughout, and will enable features like puzzle sharing, replayability, and consistent testing.



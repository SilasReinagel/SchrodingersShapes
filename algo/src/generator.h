/**
 * Schrödinger's Shapes - Puzzle Generator
 * 
 * Solution-first approach:
 * 1. Generate a valid solution board
 * 2. Extract facts (true statements) about the solution
 * 3. Select constraints that uniquely identify the solution
 * 4. Return puzzle with all-cats initial board
 */

#ifndef GENERATOR_H
#define GENERATOR_H

#include "types.h"
#include "rng.h"

/**
 * Generator configuration
 */
typedef struct {
    int width;
    int height;
    Difficulty difficulty;
    int min_constraints;
    int max_constraints;
    int required_cats;    // Number of cat cells in solution
    int max_locked_cells; // Max cells to pre-reveal (locked)
} GeneratorConfig;

/**
 * Get default configuration for a difficulty level
 */
GeneratorConfig generator_default_config(Difficulty level);

/**
 * Generate a puzzle with the given configuration and seed
 * 
 * @param config  Generator configuration
 * @param seed    Random seed for reproducibility
 * @param puzzle  Output puzzle (will be initialized)
 * @return        true if puzzle was generated successfully
 */
bool generator_generate(const GeneratorConfig* config, uint64_t seed, Puzzle* puzzle);

/**
 * Quick generate with difficulty and seed only
 */
bool generator_quick(Difficulty level, uint64_t seed, Puzzle* puzzle);

/**
 * Validate that generated puzzle has exactly one solution
 */
bool generator_validate_unique(Puzzle* puzzle);

/**
 * Enable/disable debug output for generator
 */
void generator_set_debug(bool enable);

#endif // GENERATOR_H


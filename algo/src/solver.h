/**
 * Schrödinger's Shapes - High Performance Solver
 * 
 * Backtracking solver with aggressive optimizations:
 * - Flat array board representation
 * - Bitmask-based constraint checking
 * - Early pruning on constraint violations
 * - State caching with efficient hashing
 */

#ifndef SOLVER_H
#define SOLVER_H

#include "types.h"

/**
 * Solve the puzzle and count solutions
 * 
 * @param puzzle     The puzzle to solve (board will be modified during solve)
 * @param find_first If true, stop after finding first solution
 * @return           Solver result with solution count and statistics
 */
SolverResult solver_solve(Puzzle* puzzle, bool find_first);

/**
 * Check if puzzle is solvable (fast mode)
 */
bool solver_is_solvable(Puzzle* puzzle);

/**
 * Check if puzzle has exactly one solution
 */
bool solver_has_unique_solution(Puzzle* puzzle);

/**
 * Count total solutions (may be slow for large puzzles)
 */
uint64_t solver_count_solutions(Puzzle* puzzle);

/**
 * Validate that current board state satisfies all constraints
 */
bool solver_validate(const Puzzle* puzzle);

/**
 * Pre-compute constraint cell masks (call after setting up puzzle)
 */
void solver_precompute_masks(Puzzle* puzzle);

#endif // SOLVER_H


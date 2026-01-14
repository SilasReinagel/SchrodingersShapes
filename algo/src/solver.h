/**
 * Schrödinger's Shapes - High Performance Solver
 * 
 * Backtracking solver with aggressive optimizations:
 * - Flat array board representation
 * - Bitmask-based constraint checking
 * - Early pruning on constraint violations
 * - State caching with efficient hashing
 * - Reusable solver context (avoids repeated allocations)
 * - Constraint propagation (arc consistency)
 * - Domain reduction for faster pruning
 */

#ifndef SOLVER_H
#define SOLVER_H

#include "types.h"

// Forward declaration
typedef struct SolverContext SolverContext;

/**
 * Create a reusable solver context
 * This avoids repeated memory allocation for the cache
 */
SolverContext* solver_context_create(void);

/**
 * Destroy a solver context
 */
void solver_context_destroy(SolverContext* ctx);

/**
 * Reset solver context for a new solve (clears cache)
 */
void solver_context_reset(SolverContext* ctx);

/**
 * Solve the puzzle with a reusable context
 * 
 * @param ctx          Reusable solver context (or NULL to allocate internally)
 * @param puzzle       The puzzle to solve (board will be modified during solve)
 * @param max_solutions Stop after finding this many solutions (0 = find all)
 * @return             Solver result with solution count and statistics
 */
SolverResult solver_solve_ex(SolverContext* ctx, Puzzle* puzzle, uint64_t max_solutions);

/**
 * Solve the puzzle and count solutions (legacy API)
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
 * Uses optimized early-exit when solution_count > 1
 */
bool solver_has_unique_solution(Puzzle* puzzle);

/**
 * Check if puzzle has exactly one solution using provided context
 */
bool solver_has_unique_solution_ex(SolverContext* ctx, Puzzle* puzzle);

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

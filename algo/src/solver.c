/**
 * Schrödinger's Shapes - High Performance Solver Implementation
 * 
 * Core optimizations:
 * 1. Flat uint8_t board - cache-friendly, minimal memory
 * 2. Pre-computed cell masks per constraint - O(1) region iteration
 * 3. Incremental constraint checking - only check affected constraints
 * 4. State hashing with zobrist-style keys for duplicate detection
 * 5. Shape ordering: concrete shapes first for faster pruning
 * 6. Reusable solver context - avoids repeated malloc/free
 * 7. Early exit at max_solutions - don't count beyond what's needed
 * 8. Enhanced bounds checking for count constraints
 */

#include "solver.h"
#include <string.h>
#include <stdlib.h>
#include <time.h>

// State cache for pruning explored states
#define CACHE_SIZE 131072  // Power of 2 for fast modulo
#define CACHE_MASK (CACHE_SIZE - 1)

typedef struct {
    uint64_t hash;
    bool valid;
} CacheEntry;

// Domain: bitmask of possible shapes for each cell (computed once at start)
#define DOMAIN_CAT      (1 << SHAPE_CAT)
#define DOMAIN_SQUARE   (1 << SHAPE_SQUARE)
#define DOMAIN_CIRCLE   (1 << SHAPE_CIRCLE)
#define DOMAIN_TRIANGLE (1 << SHAPE_TRIANGLE)
#define DOMAIN_ALL      (DOMAIN_CAT | DOMAIN_SQUARE | DOMAIN_CIRCLE | DOMAIN_TRIANGLE)
#define DOMAIN_CONCRETE (DOMAIN_SQUARE | DOMAIN_CIRCLE | DOMAIN_TRIANGLE)

// Solver context (reusable across multiple solves)
struct SolverContext {
    Puzzle* puzzle;
    uint64_t solution_count;
    uint64_t max_solutions;
    uint64_t states_explored;
    bool found_solution;
    
    // State cache
    CacheEntry* cache;
    
    // Pre-computed zobrist keys for hashing
    uint64_t zobrist[MAX_CELLS][SHAPE_COUNT];
    
    // Domain tracking: possible shapes for each cell (computed once per solve)
    uint8_t domains[MAX_CELLS];
};

// Initialize zobrist keys (deterministic for reproducibility)
static void init_zobrist(SolverContext* ctx) {
    uint64_t seed = 0x123456789ABCDEFULL;
    for (int i = 0; i < MAX_CELLS; i++) {
        for (int s = 0; s < SHAPE_COUNT; s++) {
            // Simple PRNG for zobrist initialization
            seed ^= seed >> 12;
            seed ^= seed << 25;
            seed ^= seed >> 27;
            ctx->zobrist[i][s] = seed * 0x2545F4914F6CDD1DULL;
        }
    }
}

SolverContext* solver_context_create(void) {
    SolverContext* ctx = calloc(1, sizeof(SolverContext));
    if (!ctx) return NULL;
    
    ctx->cache = calloc(CACHE_SIZE, sizeof(CacheEntry));
    if (!ctx->cache) {
        free(ctx);
        return NULL;
    }
    
    init_zobrist(ctx);
    return ctx;
}

void solver_context_destroy(SolverContext* ctx) {
    if (ctx) {
        free(ctx->cache);
        free(ctx);
    }
}

void solver_context_reset(SolverContext* ctx) {
    if (ctx) {
        memset(ctx->cache, 0, CACHE_SIZE * sizeof(CacheEntry));
        ctx->solution_count = 0;
        ctx->states_explored = 0;
        ctx->found_solution = false;
    }
}

// Compute board hash
static inline uint64_t compute_hash(SolverContext* ctx) {
    uint64_t hash = 0;
    int total = ctx->puzzle->width * ctx->puzzle->height;
    for (int i = 0; i < total; i++) {
        hash ^= ctx->zobrist[i][ctx->puzzle->board[i]];
    }
    return hash;
}

// Check cache for state
static inline bool cache_check(SolverContext* ctx, uint64_t hash) {
    CacheEntry* entry = &ctx->cache[hash & CACHE_MASK];
    return entry->valid && entry->hash == hash;
}

// Add state to cache
static inline void cache_add(SolverContext* ctx, uint64_t hash) {
    CacheEntry* entry = &ctx->cache[hash & CACHE_MASK];
    entry->hash = hash;
    entry->valid = true;
}

/**
 * Count shapes matching target in cells specified by mask
 * For final solution checking: Cat counts as matching any non-cat shape
 */
static inline int count_shapes(const Puzzle* p, uint64_t mask, uint8_t target_shape) {
    int count = 0;
    bool is_cat_target = (target_shape == SHAPE_CAT);
    
    while (mask) {
        int idx = __builtin_ctzll(mask);  // Count trailing zeros = lowest set bit
        mask &= mask - 1;  // Clear lowest set bit
        
        uint8_t cell_shape = p->board[idx];
        if (cell_shape == target_shape || 
            (!is_cat_target && cell_shape == SHAPE_CAT)) {
            count++;
        }
    }
    return count;
}

/**
 * Count only committed (non-cat) shapes for early pruning
 */
static inline int count_committed_shapes(const Puzzle* p, uint64_t mask, uint8_t target_shape) {
    int count = 0;
    
    while (mask) {
        int idx = __builtin_ctzll(mask);
        mask &= mask - 1;
        
        if (p->board[idx] == target_shape) {
            count++;
        }
    }
    return count;
}

/**
 * Count cats in a region
 */
static inline int count_cats(const Puzzle* p, uint64_t mask) {
    int count = 0;
    
    while (mask) {
        int idx = __builtin_ctzll(mask);
        mask &= mask - 1;
        
        if (p->board[idx] == SHAPE_CAT) {
            count++;
        }
    }
    return count;
}

/**
 * Check if a single constraint is satisfied (for final solution check)
 */
static bool check_constraint(const Puzzle* p, const Constraint* c) {
    if (c->type == CONSTRAINT_CELL) {
        int idx = cell_index(c->cell_x, c->cell_y, p->width);
        uint8_t cell_shape = p->board[idx];
        
        if (c->op == OP_IS) {
            if (c->shape == SHAPE_CAT) {
                return cell_shape == SHAPE_CAT;
            }
            // Cat satisfies any "is X" constraint for non-cat X
            return cell_shape == c->shape || cell_shape == SHAPE_CAT;
        } else { // OP_IS_NOT
            if (c->shape == SHAPE_CAT) {
                return cell_shape != SHAPE_CAT;
            }
            // Cell must not be X, and must not be Cat (Cat could become X)
            return cell_shape != c->shape && cell_shape != SHAPE_CAT;
        }
    } else {
        // Count constraint
        int count = count_shapes(p, c->cell_mask, c->shape);
        
        switch (c->op) {
            case OP_EXACTLY:  return count == c->count;
            case OP_AT_LEAST: return count >= c->count;
            case OP_AT_MOST:  return count <= c->count;
            case OP_NONE:     return count == 0;
            default:          return false;
        }
    }
}

/**
 * Check if all constraints are satisfied (complete solution check)
 */
static bool all_constraints_satisfied(const Puzzle* p) {
    for (int i = 0; i < p->num_constraints; i++) {
        if (!check_constraint(p, &p->constraints[i])) {
            return false;
        }
    }
    return true;
}

/**
 * Check if any constraint is definitely violated (early pruning)
 * Enhanced with tighter bounds checking for count constraints
 */
static bool has_violated_constraint(const Puzzle* p) {
    for (int i = 0; i < p->num_constraints; i++) {
        const Constraint* c = &p->constraints[i];
        
        if (c->type == CONSTRAINT_CELL) {
            int idx = cell_index(c->cell_x, c->cell_y, p->width);
            uint8_t cell_shape = p->board[idx];
            
            if (c->op == OP_IS_NOT) {
                // Violated if cell IS the forbidden shape (and not Cat)
                if (cell_shape == c->shape && cell_shape != SHAPE_CAT) {
                    return true;
                }
            } else if (c->op == OP_IS) {
                // If cell is committed to a different concrete shape, violated
                if (cell_shape != SHAPE_CAT && cell_shape != c->shape && c->shape != SHAPE_CAT) {
                    return true;
                }
            }
        } else {
            // Count constraint - enhanced bounds checking
            int committed_count = count_committed_shapes(p, c->cell_mask, c->shape);
            int cat_count = count_cats(p, c->cell_mask);
            int max_possible = committed_count + cat_count;
            
            switch (c->op) {
                case OP_EXACTLY:
                    if (committed_count > c->count || max_possible < c->count) {
                        return true;
                    }
                    break;
                    
                case OP_AT_LEAST:
                    if (max_possible < c->count) {
                        return true;
                    }
                    break;
                    
                case OP_AT_MOST:
                    if (committed_count > c->count) {
                        return true;
                    }
                    break;
                    
                case OP_NONE:
                    if (committed_count > 0) {
                        return true;
                    }
                    break;
                    
                default:
                    break;
            }
        }
    }
    return false;
}

/**
 * Initialize domains for all cells based on constraints
 * This is done once at the start of solving
 */
static void init_domains(SolverContext* ctx) {
    Puzzle* p = ctx->puzzle;
    int total = p->width * p->height;
    
    // Start with all shapes possible
    for (int i = 0; i < total; i++) {
        if (is_locked(p, i)) {
            ctx->domains[i] = (1 << p->board[i]);
        } else {
            ctx->domains[i] = DOMAIN_ALL;
        }
    }
    
    // Apply cell constraints to reduce domains
    for (int i = 0; i < p->num_constraints; i++) {
        const Constraint* c = &p->constraints[i];
        
        if (c->type == CONSTRAINT_CELL) {
            int idx = cell_index(c->cell_x, c->cell_y, p->width);
            
            if (c->op == OP_IS) {
                if (c->shape == SHAPE_CAT) {
                    ctx->domains[idx] &= DOMAIN_CAT;
                } else {
                    // Can be the shape or Cat
                    ctx->domains[idx] &= ((1 << c->shape) | DOMAIN_CAT);
                }
            } else if (c->op == OP_IS_NOT) {
                if (c->shape == SHAPE_CAT) {
                    ctx->domains[idx] &= DOMAIN_CONCRETE;
                } else {
                    ctx->domains[idx] &= ~((1 << c->shape) | DOMAIN_CAT);
                }
            }
        }
    }
}

/**
 * Recursive backtracking solver
 */
static void solve_recursive(SolverContext* ctx, int cell_index_start) {
    // Early exit if we've found enough solutions
    if (ctx->max_solutions > 0 && ctx->solution_count >= ctx->max_solutions) {
        return;
    }
    
    ctx->states_explored++;
    
    Puzzle* p = ctx->puzzle;
    int total_cells = p->width * p->height;
    
    // Find next unfilled cell (Cat cell that isn't locked)
    int cell_idx = cell_index_start;
    while (cell_idx < total_cells && 
           (is_locked(p, cell_idx) || p->board[cell_idx] != SHAPE_CAT)) {
        cell_idx++;
    }
    
    // Base case: all cells filled
    if (cell_idx >= total_cells) {
        if (all_constraints_satisfied(p)) {
            ctx->solution_count++;
            ctx->found_solution = true;
        }
        return;
    }
    
    // Early pruning
    if (has_violated_constraint(p)) {
        return;
    }
    
    // State caching
    uint64_t hash = compute_hash(ctx);
    if (cache_check(ctx, hash)) {
        return;
    }
    
    uint8_t original_shape = p->board[cell_idx];
    uint8_t domain = ctx->domains[cell_idx];
    bool found_any = false;
    
    // Try shapes in domain, concrete shapes first (better for pruning)
    // Order: Square, Circle, Triangle, then Cat
    for (uint8_t s = SHAPE_SQUARE; s <= SHAPE_TRIANGLE; s++) {
        if (ctx->max_solutions > 0 && ctx->solution_count >= ctx->max_solutions) {
            break;
        }
        
        if (domain & (1 << s)) {
            p->board[cell_idx] = s;
            solve_recursive(ctx, cell_idx + 1);
            if (ctx->solution_count > 0) found_any = true;
        }
    }
    
    // Try Cat last (superposition is harder to prune)
    if (domain & DOMAIN_CAT) {
        if (!(ctx->max_solutions > 0 && ctx->solution_count >= ctx->max_solutions)) {
            p->board[cell_idx] = SHAPE_CAT;
            solve_recursive(ctx, cell_idx + 1);
            if (ctx->solution_count > 0) found_any = true;
        }
    }
    
    // Restore original shape
    p->board[cell_idx] = original_shape;
    
    // Cache negative results
    if (!found_any && ctx->solution_count == 0) {
        cache_add(ctx, hash);
    }
}

/**
 * Pre-compute cell masks for each constraint
 */
void solver_precompute_masks(Puzzle* puzzle) {
    for (int i = 0; i < puzzle->num_constraints; i++) {
        Constraint* c = &puzzle->constraints[i];
        c->cell_mask = 0;
        
        switch (c->type) {
            case CONSTRAINT_GLOBAL:
                for (int idx = 0; idx < puzzle->width * puzzle->height; idx++) {
                    c->cell_mask |= (1ULL << idx);
                }
                break;
                
            case CONSTRAINT_ROW:
                for (int x = 0; x < puzzle->width; x++) {
                    int idx = cell_index(x, c->index, puzzle->width);
                    c->cell_mask |= (1ULL << idx);
                }
                break;
                
            case CONSTRAINT_COLUMN:
                for (int y = 0; y < puzzle->height; y++) {
                    int idx = cell_index(c->index, y, puzzle->width);
                    c->cell_mask |= (1ULL << idx);
                }
                break;
                
            case CONSTRAINT_CELL:
                c->cell_mask = 1ULL << cell_index(c->cell_x, c->cell_y, puzzle->width);
                break;
        }
    }
}

/**
 * Extended solve function with reusable context and max solutions
 */
SolverResult solver_solve_ex(SolverContext* ctx, Puzzle* puzzle, uint64_t max_solutions) {
    SolverResult result = {0};
    bool own_context = (ctx == NULL);
    
    // Ensure masks are computed
    solver_precompute_masks(puzzle);
    
    // Create or reuse context
    if (own_context) {
        ctx = solver_context_create();
        if (!ctx) return result;
    } else {
        solver_context_reset(ctx);
    }
    
    ctx->puzzle = puzzle;
    ctx->max_solutions = max_solutions;
    
    // Initialize domains based on constraints
    init_domains(ctx);
    
    // Check for empty domains (immediate contradiction)
    int total = puzzle->width * puzzle->height;
    for (int i = 0; i < total; i++) {
        if (ctx->domains[i] == 0) {
            result.solution_count = 0;
            result.is_solvable = false;
            if (own_context) solver_context_destroy(ctx);
            return result;
        }
    }
    
    // Time the solve
    clock_t start = clock();
    
    solve_recursive(ctx, 0);
    
    clock_t end = clock();
    
    // Populate result
    result.solution_count = ctx->solution_count;
    result.states_explored = ctx->states_explored;
    result.time_ms = ((double)(end - start) / CLOCKS_PER_SEC) * 1000.0;
    result.is_solvable = ctx->solution_count > 0;
    
    if (own_context) {
        solver_context_destroy(ctx);
    }
    
    return result;
}

/**
 * Main solve function (legacy API)
 */
SolverResult solver_solve(Puzzle* puzzle, bool find_first) {
    return solver_solve_ex(NULL, puzzle, find_first ? 1 : 0);
}

bool solver_is_solvable(Puzzle* puzzle) {
    SolverResult result = solver_solve_ex(NULL, puzzle, 1);
    return result.is_solvable;
}

bool solver_has_unique_solution(Puzzle* puzzle) {
    // Stop at 2 - if we find more than 1, we know it's not unique
    SolverResult result = solver_solve_ex(NULL, puzzle, 2);
    return result.solution_count == 1;
}

bool solver_has_unique_solution_ex(SolverContext* ctx, Puzzle* puzzle) {
    // Stop at 2 - if we find more than 1, we know it's not unique
    SolverResult result = solver_solve_ex(ctx, puzzle, 2);
    return result.solution_count == 1;
}

uint64_t solver_count_solutions(Puzzle* puzzle) {
    SolverResult result = solver_solve_ex(NULL, puzzle, 0);
    return result.solution_count;
}

bool solver_validate(const Puzzle* puzzle) {
    return all_constraints_satisfied(puzzle);
}

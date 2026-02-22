/**
 * Schrödinger's Shapes - Puzzle Generator Implementation
 * 
 * Solution-first generation ensures all puzzles are solvable by construction.
 * 
 * Optimizations:
 * 1. Reusable solver context (avoids repeated malloc/free)
 * 2. Early exit at 2 solutions (don't count beyond what's needed)
 * 3. Parallel generation (try multiple solution boards concurrently)
 */

#include "generator.h"
#include "solver.h"
#include <string.h>
#include <stdio.h>
#include <pthread.h>
#include <time.h>

// Fact types for constraint selection
typedef enum {
    FACT_ROW_COUNT,
    FACT_COL_COUNT,
    FACT_GLOBAL_COUNT,
    FACT_CELL_IS,
    FACT_CELL_IS_NOT
} FactType;

typedef struct {
    FactType type;
    uint8_t shape;
    uint8_t count;
    uint8_t index;  // row/col index
    uint8_t x, y;   // cell position
} Fact;

#define MAX_FACTS 256

// Level configurations
// Note: max_constraints needs to be high enough to achieve unique solutions
// Rule: Cats must be >= 1 and <= 20% of total cells
//
// Constraint quotas control difficulty by limiting direct assignments:
// - max_cell_is: Direct "A1 = Square" constraints (lower = harder)
// - max_cell_is_not_cat: "A1 ≠ Cat" constraints (max 1 per puzzle to reduce spam)
// - min_count_constraints: Row/col/global counts force deduction
static const struct {
    int width;
    int height;
    int min_constraints;
    int max_constraints;
    int required_cats;    // Must be >= 1 and <= 20% of width*height
    int max_locked_cells;
    // Constraint quotas for difficulty progression
    int max_cell_is;         // Max direct cell assignments
    int max_cell_is_not_cat; // Max "cell ≠ cat" constraints
    int min_count_constraints; // Min count constraints required
} LEVEL_CONFIGS[] = {
    // Placeholder for index 0
    {0, 0, 0, 0, 0, 0, 0, 0, 0},
    // Level 1: Tutorial - allow some hand-holding
    // 2x2 (4 cells), 1 cat, up to 2 direct assignments, 1 "≠ cat", at least 1 count, max 4 constraints
    {2, 2, 2, 4, 1, 0, 2, 1, 1},
    // Level 2: Easy - reduce hand-holding
    // 2x3 (6 cells), 1 cat, up to 1 direct assignment, 1 "≠ cat", at least 2 counts
    {2, 3, 3, 12, 1, 0, 1, 1, 2},
    // Level 3: Medium - no direct assignments, must deduce
    // 3x3 (9 cells), 1 cat, 0 direct assignments, 1 "≠ cat", at least 3 counts
    {3, 3, 4, 20, 1, 1, 0, 1, 3},
    // Level 4: Hard - pure deduction required
    // 3x4 (12 cells), 1 cat, 0 direct assignments, 0 "≠ cat", at least 4 counts
    {3, 4, 5, 25, 1, 2, 0, 0, 4},
    // Level 5: Expert - complex deduction chains
    // 4x4 (16 cells), 2 cats, 0 direct assignments, 0 "≠ cat", at least 5 counts
    {4, 4, 6, 30, 2, 3, 0, 0, 5},
};

// Number of parallel workers for generation
#define NUM_WORKERS 4

GeneratorConfig generator_default_config(Difficulty level) {
    GeneratorConfig config = {0};
    
    if (level >= LEVEL_1 && level <= LEVEL_5) {
        config.width = LEVEL_CONFIGS[level].width;
        config.height = LEVEL_CONFIGS[level].height;
        config.min_constraints = LEVEL_CONFIGS[level].min_constraints;
        config.max_constraints = LEVEL_CONFIGS[level].max_constraints;
        config.required_cats = LEVEL_CONFIGS[level].required_cats;
        config.max_locked_cells = LEVEL_CONFIGS[level].max_locked_cells;
        config.difficulty = level;
        // Constraint quotas for difficulty tuning
        config.max_cell_is = LEVEL_CONFIGS[level].max_cell_is;
        config.max_cell_is_not_cat = LEVEL_CONFIGS[level].max_cell_is_not_cat;
        config.min_count_constraints = LEVEL_CONFIGS[level].min_count_constraints;
    }
    
    return config;
}

/**
 * Generate a random solution board
 */
static void generate_solution_board(const GeneratorConfig* config, RNG* rng, uint8_t* board) {
    int total = config->width * config->height;
    
    // Fill with random concrete shapes (not cat)
    for (int i = 0; i < total; i++) {
        board[i] = SHAPE_SQUARE + rng_int(rng, 3);  // Square, Circle, or Triangle
    }
    
    // Place required cats randomly
    if (config->required_cats > 0) {
        // Create array of cell indices and shuffle
        int indices[MAX_CELLS];
        for (int i = 0; i < total; i++) {
            indices[i] = i;
        }
        rng_shuffle_int(rng, indices, total);
        
        // Place cats at first N shuffled positions
        for (int i = 0; i < config->required_cats && i < total; i++) {
            board[indices[i]] = SHAPE_CAT;
        }
    }
}

/**
 * Extract all facts from a solution board
 */
static int extract_facts(const GeneratorConfig* config, const uint8_t* board, Fact* facts) {
    int num_facts = 0;
    int width = config->width;
    int height = config->height;
    
    // Global count facts for each shape
    for (uint8_t shape = SHAPE_CAT; shape <= SHAPE_TRIANGLE; shape++) {
        int count = 0;
        for (int i = 0; i < width * height; i++) {
            if (board[i] == shape) count++;
        }
        
        facts[num_facts++] = (Fact){
            .type = FACT_GLOBAL_COUNT,
            .shape = shape,
            .count = count
        };
    }
    
    // Row count facts
    for (int y = 0; y < height; y++) {
        for (uint8_t shape = SHAPE_CAT; shape <= SHAPE_TRIANGLE; shape++) {
            int count = 0;
            for (int x = 0; x < width; x++) {
                if (board[y * width + x] == shape) count++;
            }
            
            facts[num_facts++] = (Fact){
                .type = FACT_ROW_COUNT,
                .shape = shape,
                .count = count,
                .index = y
            };
        }
    }
    
    // Column count facts
    for (int x = 0; x < width; x++) {
        for (uint8_t shape = SHAPE_CAT; shape <= SHAPE_TRIANGLE; shape++) {
            int count = 0;
            for (int y = 0; y < height; y++) {
                if (board[y * width + x] == shape) count++;
            }
            
            facts[num_facts++] = (Fact){
                .type = FACT_COL_COUNT,
                .shape = shape,
                .count = count,
                .index = x
            };
        }
    }
    
    // Cell facts (both is and is_not)
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            uint8_t cell_shape = board[y * width + x];
            
            // "Cell is X" fact
            facts[num_facts++] = (Fact){
                .type = FACT_CELL_IS,
                .shape = cell_shape,
                .x = x,
                .y = y
            };
            
            // "Cell is not X" facts for other shapes
            for (uint8_t shape = SHAPE_CAT; shape <= SHAPE_TRIANGLE; shape++) {
                if (shape != cell_shape) {
                    facts[num_facts++] = (Fact){
                        .type = FACT_CELL_IS_NOT,
                        .shape = shape,
                        .x = x,
                        .y = y
                    };
                }
            }
        }
    }
    
    return num_facts;
}

/**
 * Convert a fact to a constraint
 */
static Constraint fact_to_constraint(const Fact* fact, int width) {
    (void)width; // May be used in future
    Constraint c = {0};
    
    switch (fact->type) {
        case FACT_ROW_COUNT:
            c.type = CONSTRAINT_ROW;
            c.op = OP_EXACTLY;
            c.shape = fact->shape;
            c.count = fact->count;
            c.index = fact->index;
            break;
            
        case FACT_COL_COUNT:
            c.type = CONSTRAINT_COLUMN;
            c.op = OP_EXACTLY;
            c.shape = fact->shape;
            c.count = fact->count;
            c.index = fact->index;
            break;
            
        case FACT_GLOBAL_COUNT:
            c.type = CONSTRAINT_GLOBAL;
            c.op = OP_EXACTLY;
            c.shape = fact->shape;
            c.count = fact->count;
            break;
            
        case FACT_CELL_IS:
            c.type = CONSTRAINT_CELL;
            c.op = OP_IS;
            c.shape = fact->shape;
            c.cell_x = fact->x;
            c.cell_y = fact->y;
            break;
            
        case FACT_CELL_IS_NOT:
            c.type = CONSTRAINT_CELL;
            c.op = OP_IS_NOT;
            c.shape = fact->shape;
            c.cell_x = fact->x;
            c.cell_y = fact->y;
            break;
    }
    
    return c;
}

/**
 * Check if adding a constraint would be redundant or conflicting
 */
static bool is_redundant_or_conflicting(const Puzzle* puzzle, const Constraint* new_c) {
    // Check if constraint conflicts with a locked cell
    if (new_c->type == CONSTRAINT_CELL) {
        int idx = cell_index(new_c->cell_x, new_c->cell_y, puzzle->width);
        if (is_locked(puzzle, idx)) {
            uint8_t locked_shape = puzzle->board[idx];
            
            // "is not X" where X is the locked shape = conflict!
            if (new_c->op == OP_IS_NOT && new_c->shape == locked_shape) {
                return true;
            }
            // "is X" where X isn't the locked shape = conflict!
            if (new_c->op == OP_IS && new_c->shape != locked_shape) {
                return true;
            }
            // Any cell constraint on a locked cell is redundant (already determined)
            return true;
        }
    }
    
    // Check for duplicate constraints
    for (int i = 0; i < puzzle->num_constraints; i++) {
        const Constraint* c = &puzzle->constraints[i];
        
        // Same type and target
        if (c->type == new_c->type && c->shape == new_c->shape) {
            if (c->type == CONSTRAINT_CELL) {
                if (c->cell_x == new_c->cell_x && c->cell_y == new_c->cell_y) {
                    return true;
                }
            } else if (c->type == CONSTRAINT_GLOBAL) {
                return true;
            } else if (c->index == new_c->index) {
                return true;
            }
        }
    }
    return false;
}

// Debug flag - set to true to enable debug output
static bool g_debug = false;

// Profiling counters
static int g_solver_calls = 0;
static double g_solver_time_ms = 0;

void generator_set_debug(bool enable) {
    g_debug = enable;
    if (enable) {
        g_solver_calls = 0;
        g_solver_time_ms = 0;
    }
}

void generator_get_profile_stats(int* solver_calls, double* solver_time_ms) {
    if (solver_calls) *solver_calls = g_solver_calls;
    if (solver_time_ms) *solver_time_ms = g_solver_time_ms;
}

/**
 * Quota tracking for constraint selection
 * Ensures difficulty-appropriate constraint mix
 */
typedef struct {
    int cell_is_count;         // Current "cell = shape" constraints
    int cell_is_not_cat_count; // Current "cell ≠ cat" constraints  
    int count_constraint_count; // Current row/col/global count constraints
} ConstraintQuotas;

/**
 * Score a fact for selection priority
 * 
 * DESIGN PRINCIPLE: Reward constraints that require DEDUCTION, not direct answers.
 * 
 * The old scoring prioritized "informativeness" (how much is revealed).
 * The new scoring prioritizes "deductive necessity" (how much thinking is required).
 * 
 * Key changes:
 * - Row/column counts are now HIGHEST priority (force cross-referencing)
 * - "Cell = Shape" is now LOWEST priority (removes puzzle element)
 * - "Cell ≠ Cat" is limited (mostly redundant information)
 * - Quotas are enforced by returning -1000 when limits exceeded
 */
static int score_fact(const Fact* fact, const GeneratorConfig* config, ConstraintQuotas* quotas) {
    int score = 0;
    
    switch (fact->type) {
        case FACT_CELL_IS:
            // Direct assignments should be RARE - they remove the puzzle element
            // Only allow up to max_cell_is per puzzle (based on difficulty)
            if (quotas->cell_is_count >= config->max_cell_is) {
                return -1000;  // Quota exceeded - skip this constraint
            }
            // Low base score - these are the "answer key" constraints
            score = 20;
            // Cat reveals are less useful (superposition state)
            if (fact->shape == SHAPE_CAT) score -= 10;
            break;
            
        case FACT_CELL_IS_NOT:
            if (fact->shape == SHAPE_CAT) {
                // "Cell ≠ Cat" constraints are mostly redundant
                // Limit to 1 per puzzle as per design doc
                if (quotas->cell_is_not_cat_count >= config->max_cell_is_not_cat) {
                    return -1000;  // Quota exceeded - skip
                }
                score = 30;  // Low priority - often obvious
            } else {
                // "Cell ≠ [concrete shape]" is more interesting
                // Forces elimination reasoning: "not square, not circle, must be triangle"
                score = 60;
            }
            break;
            
        case FACT_ROW_COUNT:
        case FACT_COL_COUNT:
            // ROW/COLUMN COUNTS ARE THE HEART OF THE PUZZLE
            // These force players to cross-reference and deduce
            score = 100;  // Highest base priority!
            
            // Boundary counts (0 or full) are especially powerful
            // "Row has exactly 0 triangles" eliminates an option from all cells in row
            if (fact->count == 0) {
                score += 30;  // Very powerful for elimination
            }
            // Full count means all cells in row/col are that shape
            int dimension = (fact->type == FACT_ROW_COUNT) ? config->width : config->height;
            if (fact->count == dimension) {
                score += 20;  // Powerful but more obvious
            }
            // Middle counts (e.g., "exactly 2 triangles in row of 4") force counting
            if (fact->count > 0 && fact->count < dimension) {
                score += 15;  // Requires careful tracking
            }
            break;
            
        case FACT_GLOBAL_COUNT:
            // Global counts are good for overall constraint
            score = 70;
            // Zero counts are very constraining (shape doesn't appear)
            if (fact->count == 0) score += 40;
            // Full counts are interesting (all cells are one shape - rare)
            int total = config->width * config->height;
            if (fact->count == total) score += 30;
            break;
    }
    
    return score;
}

/**
 * Update quota counters when a constraint is added
 */
static void update_quotas_for_constraint(const Constraint* c, ConstraintQuotas* quotas) {
    if (c->type == CONSTRAINT_CELL) {
        if (c->op == OP_IS) {
            quotas->cell_is_count++;
        } else if (c->op == OP_IS_NOT && c->shape == SHAPE_CAT) {
            quotas->cell_is_not_cat_count++;
        }
    } else {
        // Row, column, or global count constraint
        quotas->count_constraint_count++;
    }
}

/**
 * Check if adding this constraint would exceed quotas
 */
static bool would_exceed_quota(const Constraint* c, const ConstraintQuotas* quotas,
                               const GeneratorConfig* config) {
    if (c->type == CONSTRAINT_CELL) {
        if (c->op == OP_IS && quotas->cell_is_count >= config->max_cell_is) {
            return true;
        }
        if (c->op == OP_IS_NOT && c->shape == SHAPE_CAT && 
            quotas->cell_is_not_cat_count >= config->max_cell_is_not_cat) {
            return true;
        }
    }
    return false;
}

/**
 * Select constraints to create a uniquely solvable puzzle
 * Uses reusable solver context for efficiency
 * 
 * DESIGN: Enforces constraint quotas to ensure appropriate difficulty:
 * - Limits direct "cell = shape" assignments (easier puzzles allow more)
 * - Limits "cell ≠ cat" spam (max 1 per puzzle)
 * - Requires minimum count constraints (forces deduction)
 */
static bool select_constraints(const GeneratorConfig* config, RNG* rng, 
                              const uint8_t* solution_board, Fact* facts, 
                              int num_facts, Puzzle* puzzle,
                              SolverContext* solver_ctx) {
    // Initialize quota tracking
    ConstraintQuotas quotas = {0, 0, 0};
    
    // Count actual cats in solution board
    int cat_count = 0;
    int total_cells = config->width * config->height;
    for (int i = 0; i < total_cells; i++) {
        if (solution_board[i] == SHAPE_CAT) {
            cat_count++;
        }
    }
    
    // ALWAYS add global cat count constraint first (when cats > 0)
    // This tells the player exactly how many cats are in the puzzle
    puzzle->num_constraints = 0;
    if (cat_count > 0) {
        puzzle->constraints[puzzle->num_constraints++] = (Constraint){
            .type = CONSTRAINT_GLOBAL,
            .op = OP_EXACTLY,
            .shape = SHAPE_CAT,
            .count = cat_count
        };
        quotas.count_constraint_count++;  // This counts as a count constraint
        
        if (g_debug) {
            printf("    [DEBUG] Added mandatory constraint: exactly %d cat(s)\n", cat_count);
        }
    }
    
    // Score facts with quota awareness
    int indices[MAX_FACTS];
    int scores[MAX_FACTS];
    
    // We need a temporary quota tracker to properly score all facts
    // Each fact type gets scored assuming it might be selected
    for (int i = 0; i < num_facts; i++) {
        indices[i] = i;
        
        // Create temp quotas to check if this fact would exceed limits
        ConstraintQuotas temp_quotas = quotas;
        int base_score = score_fact(&facts[i], config, &temp_quotas);
        
        // Add randomness (but not enough to overcome -1000 penalty)
        scores[i] = base_score + rng_int(rng, 40);
    }
    
    // Simple insertion sort by score (descending)
    for (int i = 1; i < num_facts; i++) {
        int j = i;
        while (j > 0 && scores[j] > scores[j-1]) {
            int tmp_idx = indices[j];
            indices[j] = indices[j-1];
            indices[j-1] = tmp_idx;
            
            int tmp_score = scores[j];
            scores[j] = scores[j-1];
            scores[j-1] = tmp_score;
            
            j--;
        }
    }
    
    if (g_debug) {
        printf("    [DEBUG] Quotas: max_cell_is=%d, max_is_not_cat=%d, min_counts=%d\n",
               config->max_cell_is, config->max_cell_is_not_cat, config->min_count_constraints);
    }
    
    // PHASE 1: Add constraints aggressively without checking
    // Scale initial batch based on board size - larger boards need more constraints
    int board_size = total_cells;
    int batch_bonus = (board_size >= 12) ? 8 : (board_size >= 9) ? 4 : 2;
    int target_constraints = config->min_constraints + batch_bonus;
    if (target_constraints > config->max_constraints) {
        target_constraints = config->max_constraints;
    }
    
    for (int i = 0; i < num_facts && puzzle->num_constraints < target_constraints; i++) {
        // Skip facts with negative scores (quota exceeded during scoring)
        if (scores[i] < 0) continue;
        
        Fact* fact = &facts[indices[i]];
        Constraint c = fact_to_constraint(fact, config->width);
        
        if (is_redundant_or_conflicting(puzzle, &c)) {
            continue;
        }
        
        // Check quotas before adding (double-check since scoring was predictive)
        if (would_exceed_quota(&c, &quotas, config)) {
            continue;
        }
        
        puzzle->constraints[puzzle->num_constraints++] = c;
        update_quotas_for_constraint(&c, &quotas);
    }
    
    // PHASE 2: Check if we have unique solution
    solver_precompute_masks(puzzle);
    for (int j = 0; j < total_cells; j++) {
        if (!is_locked(puzzle, j)) puzzle->board[j] = SHAPE_CAT;
    }
    
    clock_t solve_start = clock();
    SolverResult result = solver_solve_ex(solver_ctx, puzzle, 2);
    clock_t solve_end = clock();
    
    if (g_debug) {
        g_solver_calls++;
        g_solver_time_ms += ((double)(solve_end - solve_start) / CLOCKS_PER_SEC) * 1000.0;
        printf("    [DEBUG] After %d constraints: %llu solutions\n", 
               puzzle->num_constraints, (unsigned long long)result.solution_count);
    }
    
    if (result.solution_count == 1) {
        return true;  // Success!
    }
    
    if (result.solution_count == 0) {
        return false;  // Conflict - try different solution board
    }
    
    // PHASE 3: Multiple solutions - add more constraints one by one
    // Continue to enforce quotas during this phase
    int fact_start = 0;
    // Find where we left off
    for (int i = 0; i < num_facts; i++) {
        Fact* fact = &facts[indices[i]];
        Constraint c = fact_to_constraint(fact, config->width);
        if (!is_redundant_or_conflicting(puzzle, &c) && !would_exceed_quota(&c, &quotas, config)) {
            // This constraint wasn't added yet and won't exceed quotas
            fact_start = i;
            break;
        }
    }
    
    for (int i = fact_start; i < num_facts && puzzle->num_constraints < config->max_constraints; i++) {
        // Skip facts with negative scores (quota exceeded)
        if (scores[i] < 0) continue;
        
        Fact* fact = &facts[indices[i]];
        Constraint c = fact_to_constraint(fact, config->width);
        
        if (is_redundant_or_conflicting(puzzle, &c)) {
            continue;
        }
        
        // Enforce quotas in phase 3 as well
        if (would_exceed_quota(&c, &quotas, config)) {
            continue;
        }
        
        int prev_count = puzzle->num_constraints;
        puzzle->constraints[puzzle->num_constraints++] = c;
        update_quotas_for_constraint(&c, &quotas);
        solver_precompute_masks(puzzle);
        
        for (int j = 0; j < total_cells; j++) {
            if (!is_locked(puzzle, j)) puzzle->board[j] = SHAPE_CAT;
        }
        
        clock_t start = clock();
        result = solver_solve_ex(solver_ctx, puzzle, 2);
        clock_t end = clock();
        
        if (g_debug) {
            g_solver_calls++;
            g_solver_time_ms += ((double)(end - start) / CLOCKS_PER_SEC) * 1000.0;
        }
        
        if (result.solution_count == 1) {
            if (g_debug) {
                printf("    [DEBUG] Final quotas: cell_is=%d, is_not_cat=%d, counts=%d\n",
                       quotas.cell_is_count, quotas.cell_is_not_cat_count, 
                       quotas.count_constraint_count);
            }
            return true;
        } else if (result.solution_count == 0) {
            // Roll back constraint and quota tracking
            puzzle->num_constraints = prev_count;
            // Decrement the appropriate quota counter
            if (c.type == CONSTRAINT_CELL) {
                if (c.op == OP_IS) {
                    quotas.cell_is_count--;
                } else if (c.op == OP_IS_NOT && c.shape == SHAPE_CAT) {
                    quotas.cell_is_not_cat_count--;
                }
            } else {
                quotas.count_constraint_count--;
            }
        }
    }
    
    // Final check
    for (int j = 0; j < total_cells; j++) {
        if (!is_locked(puzzle, j)) puzzle->board[j] = SHAPE_CAT;
    }
    solver_precompute_masks(puzzle);
    
    clock_t final_start = clock();
    result = solver_solve_ex(solver_ctx, puzzle, 2);
    clock_t final_end = clock();
    
    if (g_debug) {
        g_solver_calls++;
        g_solver_time_ms += ((double)(final_end - final_start) / CLOCKS_PER_SEC) * 1000.0;
    }
    
    return result.solution_count == 1;
}

/**
 * Add locked cells to puzzle (pre-revealed from solution)
 * Locked cells show the solution value and cannot be changed
 */
static void add_locked_cells(const GeneratorConfig* config, RNG* rng,
                            const uint8_t* solution_board, Puzzle* puzzle) {
    if (config->max_locked_cells <= 0) return;
    
    int total = config->width * config->height;
    
    // Create shuffled indices of non-cat cells (prefer revealing concrete shapes)
    int candidates[MAX_CELLS];
    int num_candidates = 0;
    
    for (int i = 0; i < total; i++) {
        // Only lock non-cat cells (revealing cats is less interesting)
        if (solution_board[i] != SHAPE_CAT) {
            candidates[num_candidates++] = i;
        }
    }
    
    rng_shuffle_int(rng, candidates, num_candidates);
    
    // Lock up to max_locked_cells
    int to_lock = config->max_locked_cells;
    if (to_lock > num_candidates) to_lock = num_candidates;
    
    for (int i = 0; i < to_lock; i++) {
        int idx = candidates[i];
        puzzle->board[idx] = solution_board[idx];
        set_locked(puzzle, idx, true);
    }
    
    if (g_debug && to_lock > 0) {
        printf("  [DEBUG] Locked %d cells\n", to_lock);
    }
}

// =============================================================================
// Parallel Generation Support
// =============================================================================

typedef struct {
    const GeneratorConfig* config;
    uint64_t seed;
    int attempt_offset;
    Puzzle result_puzzle;
    bool success;
    bool done;
} WorkerArgs;

// Shared state for parallel workers
typedef struct {
    pthread_mutex_t mutex;
    bool found_solution;
    Puzzle* result;
} SharedState;

static SharedState* g_shared_state = NULL;

/**
 * Worker thread function for parallel generation
 */
static void* generation_worker(void* arg) {
    WorkerArgs* args = (WorkerArgs*)arg;
    const GeneratorConfig* config = args->config;
    
    // Each worker gets its own RNG with a different seed offset
    RNG rng;
    rng_init(&rng, args->seed + args->attempt_offset * 1000);
    
    // Each worker gets its own solver context for efficiency
    SolverContext* solver_ctx = solver_context_create();
    if (!solver_ctx) {
        args->success = false;
        args->done = true;
        return NULL;
    }
    
    // Initialize puzzle
    Puzzle puzzle = {0};
    puzzle.width = config->width;
    puzzle.height = config->height;
    
    // Try multiple solution boards
    const int MAX_ATTEMPTS = 15;  // Each worker tries this many boards
    
    for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // Check if another worker already found a solution
        if (g_shared_state) {
            pthread_mutex_lock(&g_shared_state->mutex);
            bool already_found = g_shared_state->found_solution;
            pthread_mutex_unlock(&g_shared_state->mutex);
            if (already_found) break;
        }
        
        // Generate solution board
        uint8_t solution_board[MAX_CELLS];
        generate_solution_board(config, &rng, solution_board);
        
        // Reset puzzle
        puzzle.num_constraints = 0;
        puzzle.locked_mask = 0;
        for (int i = 0; i < config->width * config->height; i++) {
            puzzle.board[i] = SHAPE_CAT;
        }
        
        // Add locked cells
        add_locked_cells(config, &rng, solution_board, &puzzle);
        
        // Extract facts and try to select constraints
        Fact facts[MAX_FACTS];
        int num_facts = extract_facts(config, solution_board, facts);
        
        bool success = select_constraints(config, &rng, solution_board, facts, 
                                          num_facts, &puzzle, solver_ctx);
        
        if (success) {
            // Found a valid puzzle!
            args->result_puzzle = puzzle;
            args->success = true;
            
            // Signal other workers to stop
            if (g_shared_state) {
                pthread_mutex_lock(&g_shared_state->mutex);
                if (!g_shared_state->found_solution) {
                    g_shared_state->found_solution = true;
                    *g_shared_state->result = puzzle;
                }
                pthread_mutex_unlock(&g_shared_state->mutex);
            }
            
            break;
        }
    }
    
    solver_context_destroy(solver_ctx);
    args->done = true;
    return NULL;
}

/**
 * Generate puzzle using parallel workers
 */
static bool generator_generate_parallel(const GeneratorConfig* config, uint64_t seed, Puzzle* puzzle) {
    // Initialize shared state
    SharedState shared = {
        .found_solution = false,
        .result = puzzle
    };
    pthread_mutex_init(&shared.mutex, NULL);
    g_shared_state = &shared;
    
    // Create worker threads
    pthread_t threads[NUM_WORKERS];
    WorkerArgs args[NUM_WORKERS];
    
    for (int i = 0; i < NUM_WORKERS; i++) {
        args[i] = (WorkerArgs){
            .config = config,
            .seed = seed,
            .attempt_offset = i,
            .success = false,
            .done = false
        };
        pthread_create(&threads[i], NULL, generation_worker, &args[i]);
    }
    
    // Wait for all workers
    for (int i = 0; i < NUM_WORKERS; i++) {
        pthread_join(threads[i], NULL);
    }
    
    g_shared_state = NULL;
    pthread_mutex_destroy(&shared.mutex);
    
    return shared.found_solution;
}

/**
 * Generate puzzle - single threaded implementation
 */
static bool generator_generate_single(const GeneratorConfig* config, uint64_t seed, Puzzle* puzzle) {
    RNG rng;
    rng_init(&rng, seed);
    
    // Initialize puzzle
    memset(puzzle, 0, sizeof(Puzzle));
    puzzle->width = config->width;
    puzzle->height = config->height;
    
    // Create reusable solver context
    SolverContext* solver_ctx = solver_context_create();
    if (!solver_ctx) return false;
    
    // Generate solution board
    uint8_t solution_board[MAX_CELLS];
    generate_solution_board(config, &rng, solution_board);
    
    if (g_debug) {
        printf("  [DEBUG] Solution board: ");
        for (int i = 0; i < config->width * config->height; i++) {
            printf("%d ", solution_board[i]);
        }
        printf("\n");
    }
    
    // Extract facts from solution
    Fact facts[MAX_FACTS];
    int num_facts = extract_facts(config, solution_board, facts);
    
    if (g_debug) {
        printf("  [DEBUG] Extracted %d facts\n", num_facts);
    }
    
    // Initialize puzzle board with all cats
    for (int i = 0; i < config->width * config->height; i++) {
        puzzle->board[i] = SHAPE_CAT;
    }
    
    // Add locked cells (pre-revealed from solution)
    add_locked_cells(config, &rng, solution_board, puzzle);
    
    // Select constraints for unique solution
    bool success = select_constraints(config, &rng, solution_board, facts, num_facts, puzzle, solver_ctx);
    
    if (g_debug) {
        printf("  [DEBUG] First attempt: %s, constraints=%d\n", 
               success ? "success" : "failed", puzzle->num_constraints);
    }
    
    if (!success) {
        // Retry with different solution board (up to 50 attempts)
        for (int attempt = 0; attempt < 50 && !success; attempt++) {
            generate_solution_board(config, &rng, solution_board);
            num_facts = extract_facts(config, solution_board, facts);
            
            puzzle->num_constraints = 0;
            puzzle->locked_mask = 0;  // Reset locked cells
            for (int i = 0; i < config->width * config->height; i++) {
                puzzle->board[i] = SHAPE_CAT;
            }
            
            // Add locked cells for this attempt
            add_locked_cells(config, &rng, solution_board, puzzle);
            
            success = select_constraints(config, &rng, solution_board, facts, num_facts, puzzle, solver_ctx);
            
            if (g_debug) {
                printf("  [DEBUG] Attempt %d: %s, constraints=%d\n", 
                       attempt + 1, success ? "success" : "failed", puzzle->num_constraints);
            }
        }
    }
    
    solver_context_destroy(solver_ctx);
    
    return success;
}

bool generator_generate(const GeneratorConfig* config, uint64_t seed, Puzzle* puzzle) {
    if (!config || !puzzle) return false;
    if (config->width > MAX_WIDTH || config->height > MAX_HEIGHT) return false;
    
    // Use parallel generation for harder levels (4x4 and up)
    bool use_parallel = (config->width * config->height >= 12);
    
    if (use_parallel) {
        return generator_generate_parallel(config, seed, puzzle);
    } else {
        return generator_generate_single(config, seed, puzzle);
    }
}

bool generator_quick(Difficulty level, uint64_t seed, Puzzle* puzzle) {
    GeneratorConfig config = generator_default_config(level);
    return generator_generate(&config, seed, puzzle);
}

bool generator_validate_unique(Puzzle* puzzle) {
    return solver_has_unique_solution(puzzle);
}

// =============================================================================
// Constraint Optimization for User Display
// =============================================================================

/**
 * Check if a cell constraint is implied by row/column count constraints
 * 
 * Examples:
 * - "Row 0 has exactly 0 Circles" implies "Cell(0,0) is not Circle"
 * - "Column 1 has exactly 2 Squares" with only 2 cells implies both are Squares
 */
static bool cell_constraint_implied_by_count(const Puzzle* puzzle, const Constraint* cell_c) {
    if (cell_c->type != CONSTRAINT_CELL) return false;
    
    int cx = cell_c->cell_x;
    int cy = cell_c->cell_y;
    
    for (int i = 0; i < puzzle->num_constraints; i++) {
        const Constraint* c = &puzzle->constraints[i];
        
        // Check row constraints
        if (c->type == CONSTRAINT_ROW && c->index == cy) {
            // "Row has exactly 0 of shape" implies "cell is not that shape"
            if (c->op == OP_EXACTLY && c->count == 0 && c->shape == cell_c->shape) {
                if (cell_c->op == OP_IS_NOT) {
                    return true;  // Redundant: row says 0 of this shape
                }
            }
            // "Row has exactly N of shape" where N = row width implies all cells are that shape
            if (c->op == OP_EXACTLY && c->count == puzzle->width && c->shape == cell_c->shape) {
                if (cell_c->op == OP_IS) {
                    return true;  // Redundant: row says all cells are this shape
                }
            }
        }
        
        // Check column constraints
        if (c->type == CONSTRAINT_COLUMN && c->index == cx) {
            // "Column has exactly 0 of shape" implies "cell is not that shape"
            if (c->op == OP_EXACTLY && c->count == 0 && c->shape == cell_c->shape) {
                if (cell_c->op == OP_IS_NOT) {
                    return true;  // Redundant: column says 0 of this shape
                }
            }
            // "Column has exactly N of shape" where N = column height implies all cells are that shape
            if (c->op == OP_EXACTLY && c->count == puzzle->height && c->shape == cell_c->shape) {
                if (cell_c->op == OP_IS) {
                    return true;  // Redundant: column says all cells are this shape
                }
            }
        }
        
        // Check global constraints
        if (c->type == CONSTRAINT_GLOBAL) {
            int total_cells = puzzle->width * puzzle->height;
            // "Global has exactly 0 of shape" implies no cell is that shape
            if (c->op == OP_EXACTLY && c->count == 0 && c->shape == cell_c->shape) {
                if (cell_c->op == OP_IS_NOT) {
                    return true;  // Redundant: global says 0 of this shape
                }
            }
            // "Global has exactly N of shape" where N = total cells implies all cells are that shape
            if (c->op == OP_EXACTLY && c->count == total_cells && c->shape == cell_c->shape) {
                if (cell_c->op == OP_IS) {
                    return true;  // Redundant: global says all cells are this shape
                }
            }
        }
    }
    
    return false;
}

/**
 * Check if a "is not X" constraint is redundant given a "is Y" constraint
 * If we know cell IS Square, we don't need "is not Cat", "is not Circle", "is not Triangle"
 */
static bool is_not_implied_by_is(const Puzzle* puzzle, const Constraint* is_not_c) {
    if (is_not_c->type != CONSTRAINT_CELL || is_not_c->op != OP_IS_NOT) return false;
    
    int cx = is_not_c->cell_x;
    int cy = is_not_c->cell_y;
    
    for (int i = 0; i < puzzle->num_constraints; i++) {
        const Constraint* c = &puzzle->constraints[i];
        
        // Look for "is X" constraint on same cell
        if (c->type == CONSTRAINT_CELL && c->op == OP_IS &&
            c->cell_x == cx && c->cell_y == cy) {
            // If "is X" where X != the forbidden shape, the "is not" is redundant
            if (c->shape != is_not_c->shape) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Check if constraint is about a locked cell (redundant - locked cells are already shown)
 */
static bool constraint_on_locked_cell(const Puzzle* puzzle, const Constraint* c) {
    if (c->type != CONSTRAINT_CELL) return false;
    
    int idx = cell_index(c->cell_x, c->cell_y, puzzle->width);
    return is_locked(puzzle, idx);
}

/**
 * Check if a constraint is redundant given the current set
 */
static bool is_constraint_redundant(const Puzzle* puzzle, const Constraint* c, 
                                     const Constraint* kept, int num_kept) {
    // Check if already in kept set (duplicate)
    for (int i = 0; i < num_kept; i++) {
        const Constraint* k = &kept[i];
        if (k->type == c->type && k->op == c->op && k->shape == c->shape) {
            if (c->type == CONSTRAINT_CELL) {
                if (k->cell_x == c->cell_x && k->cell_y == c->cell_y) {
                    return true;  // Exact duplicate
                }
            } else if (c->type == CONSTRAINT_GLOBAL) {
                return true;  // Duplicate global constraint for same shape
            } else if (k->index == c->index) {
                return true;  // Duplicate row/column constraint
            }
        }
    }
    
    // Check if constraint is on a locked cell
    if (constraint_on_locked_cell(puzzle, c)) {
        return true;
    }
    
    // Check if "is not X" is implied by "is Y"
    if (is_not_implied_by_is(puzzle, c)) {
        return true;
    }
    
    // Check if cell constraint is implied by row/column count
    if (cell_constraint_implied_by_count(puzzle, c)) {
        return true;
    }
    
    return false;
}

/**
 * Try to consolidate cell constraints into row/column count constraints
 * Returns true if consolidation was performed
 */
static bool try_consolidate_row_column(const Puzzle* puzzle, 
                                        Constraint* display, int* num_display) {
    bool did_consolidate = false;
    
    // For each row, check if we can consolidate
    for (int y = 0; y < puzzle->height; y++) {
        for (uint8_t shape = SHAPE_CAT; shape <= SHAPE_TRIANGLE; shape++) {
            // Count "is X" constraints for this shape in this row
            int is_count = 0;
            bool all_specified = true;
            
            for (int x = 0; x < puzzle->width; x++) {
                bool found_is = false;
                for (int i = 0; i < *num_display; i++) {
                    if (display[i].type == CONSTRAINT_CELL &&
                        display[i].op == OP_IS &&
                        display[i].cell_x == x && display[i].cell_y == y &&
                        display[i].shape == shape) {
                        found_is = true;
                        is_count++;
                        break;
                    }
                }
                if (!found_is) {
                    // Check if locked cell has this shape
                    int idx = cell_index(x, y, puzzle->width);
                    if (is_locked(puzzle, idx) && puzzle->board[idx] == shape) {
                        is_count++;
                    } else {
                        all_specified = false;
                    }
                }
            }
            
            // If we have 2+ "is X" constraints in a row, consider consolidating
            if (is_count >= 2 && all_specified) {
                // Check if we already have a row constraint for this
                bool has_row_constraint = false;
                for (int i = 0; i < *num_display; i++) {
                    if (display[i].type == CONSTRAINT_ROW &&
                        display[i].index == y &&
                        display[i].shape == shape) {
                        has_row_constraint = true;
                        break;
                    }
                }
                
                if (!has_row_constraint) {
                    // Remove individual cell constraints and add row constraint
                    int new_count = 0;
                    for (int i = 0; i < *num_display; i++) {
                        bool remove = (display[i].type == CONSTRAINT_CELL &&
                                      display[i].op == OP_IS &&
                                      display[i].cell_y == y &&
                                      display[i].shape == shape);
                        if (!remove) {
                            display[new_count++] = display[i];
                        }
                    }
                    
                    // Add row count constraint
                    display[new_count++] = (Constraint){
                        .type = CONSTRAINT_ROW,
                        .op = OP_EXACTLY,
                        .shape = shape,
                        .count = is_count,
                        .index = y
                    };
                    
                    *num_display = new_count;
                    did_consolidate = true;
                }
            }
        }
    }
    
    // Similar logic for columns
    for (int x = 0; x < puzzle->width; x++) {
        for (uint8_t shape = SHAPE_CAT; shape <= SHAPE_TRIANGLE; shape++) {
            int is_count = 0;
            bool all_specified = true;
            
            for (int y = 0; y < puzzle->height; y++) {
                bool found_is = false;
                for (int i = 0; i < *num_display; i++) {
                    if (display[i].type == CONSTRAINT_CELL &&
                        display[i].op == OP_IS &&
                        display[i].cell_x == x && display[i].cell_y == y &&
                        display[i].shape == shape) {
                        found_is = true;
                        is_count++;
                        break;
                    }
                }
                if (!found_is) {
                    int idx = cell_index(x, y, puzzle->width);
                    if (is_locked(puzzle, idx) && puzzle->board[idx] == shape) {
                        is_count++;
                    } else {
                        all_specified = false;
                    }
                }
            }
            
            if (is_count >= 2 && all_specified) {
                bool has_col_constraint = false;
                for (int i = 0; i < *num_display; i++) {
                    if (display[i].type == CONSTRAINT_COLUMN &&
                        display[i].index == x &&
                        display[i].shape == shape) {
                        has_col_constraint = true;
                        break;
                    }
                }
                
                if (!has_col_constraint) {
                    int new_count = 0;
                    for (int i = 0; i < *num_display; i++) {
                        bool remove = (display[i].type == CONSTRAINT_CELL &&
                                      display[i].op == OP_IS &&
                                      display[i].cell_x == x &&
                                      display[i].shape == shape);
                        if (!remove) {
                            display[new_count++] = display[i];
                        }
                    }
                    
                    display[new_count++] = (Constraint){
                        .type = CONSTRAINT_COLUMN,
                        .op = OP_EXACTLY,
                        .shape = shape,
                        .count = is_count,
                        .index = x
                    };
                    
                    *num_display = new_count;
                    did_consolidate = true;
                }
            }
        }
    }
    
    return did_consolidate;
}

/**
 * Shuffle constraints using Fisher-Yates algorithm with seeded RNG
 */
static void shuffle_constraints(Constraint* constraints, int count, RNG* rng) {
    for (int i = count - 1; i > 0; i--) {
        int j = rng_int(rng, i + 1);
        Constraint tmp = constraints[i];
        constraints[i] = constraints[j];
        constraints[j] = tmp;
    }
}

void generator_optimize_constraints(Puzzle* puzzle, uint64_t seed) {
    if (!puzzle || puzzle->num_constraints == 0) {
        puzzle->num_display_constraints = 0;
        return;
    }
    
    // Start with copy of raw constraints, filtering redundant ones
    Constraint kept[MAX_DISPLAY_CONSTRAINTS];
    int num_kept = 0;
    
    // First pass: keep the global cat count constraint (always first and important)
    for (int i = 0; i < puzzle->num_constraints && num_kept < MAX_DISPLAY_CONSTRAINTS; i++) {
        const Constraint* c = &puzzle->constraints[i];
        if (c->type == CONSTRAINT_GLOBAL && c->shape == SHAPE_CAT) {
            kept[num_kept++] = *c;
            break;
        }
    }
    
    // Second pass: add non-redundant constraints
    for (int i = 0; i < puzzle->num_constraints && num_kept < MAX_DISPLAY_CONSTRAINTS; i++) {
        const Constraint* c = &puzzle->constraints[i];
        
        // Skip global cat count (already added)
        if (c->type == CONSTRAINT_GLOBAL && c->shape == SHAPE_CAT) {
            continue;
        }
        
        if (!is_constraint_redundant(puzzle, c, kept, num_kept)) {
            kept[num_kept++] = *c;
        }
    }
    
    // Copy to display array
    for (int i = 0; i < num_kept; i++) {
        puzzle->display_constraints[i] = kept[i];
    }
    int num_display = num_kept;
    
    // Try to consolidate cell constraints into row/column counts
    // Run multiple passes until no more consolidation is possible
    while (try_consolidate_row_column(puzzle, puzzle->display_constraints, &num_display)) {
        // Keep trying
    }
    
    // Shuffle all constraints except the first one (global cat count)
    if (num_display > 1) {
        RNG rng;
        rng_init(&rng, seed);
        shuffle_constraints(puzzle->display_constraints + 1, num_display - 1, &rng);
    }
    
    puzzle->num_display_constraints = num_display;
    
    if (g_debug) {
        printf("  [DEBUG] Optimized: %d raw -> %d display constraints\n",
               puzzle->num_constraints, puzzle->num_display_constraints);
    }
}

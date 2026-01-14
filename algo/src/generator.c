/**
 * Schrödinger's Shapes - Puzzle Generator Implementation
 * 
 * Solution-first generation ensures all puzzles are solvable by construction.
 */

#include "generator.h"
#include "solver.h"
#include <string.h>
#include <stdio.h>

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
static const struct {
    int width;
    int height;
    int min_constraints;
    int max_constraints;
    int required_cats;
    int max_locked_cells;
} LEVEL_CONFIGS[] = {
    {0, 0, 0, 0, 0, 0},  // Placeholder for index 0
    {2, 2, 2, 10, 0, 0}, // Level 1: 2x2, simple
    {2, 3, 3, 12, 0, 0}, // Level 2: 2x3
    {3, 3, 4, 20, 1, 1}, // Level 3: 3x3, 1 cat, 1 locked
    {3, 4, 5, 25, 1, 2}, // Level 4: 3x4, 1 cat, 2 locked
    {4, 4, 6, 30, 2, 3}, // Level 5: 4x4, 2 cats, 3 locked
};

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

void generator_set_debug(bool enable) {
    g_debug = enable;
}

/**
 * Score a fact for selection priority
 * Higher scores = more informative constraints
 */
static int score_fact(const Fact* fact, const GeneratorConfig* config) {
    int score = 0;
    
    switch (fact->type) {
        case FACT_CELL_IS:
            // Cell facts are very constraining
            score = 100;
            // Prefer non-cat reveals (more informative)
            if (fact->shape != SHAPE_CAT) score += 20;
            break;
            
        case FACT_CELL_IS_NOT:
            // "Is not" constraints are now highly valued!
            // "Is not Cat" is especially powerful - forces concrete shape
            if (fact->shape == SHAPE_CAT) {
                score = 120;  // Very constraining - eliminates superposition
            } else {
                score = 80;   // Still good - eliminates one concrete option
            }
            break;
            
        case FACT_ROW_COUNT:
        case FACT_COL_COUNT:
            // Row/column constraints are moderately constraining
            score = 70;
            // Zero or full counts are more constraining
            if (fact->count == 0 || fact->count == config->width) {
                score += 30;
            }
            break;
            
        case FACT_GLOBAL_COUNT:
            // Global constraints are less constraining
            score = 40;
            // Zero counts (none) are very constraining
            if (fact->count == 0) score += 50;
            break;
    }
    
    return score;
}

/**
 * Select constraints to create a uniquely solvable puzzle
 */
static bool select_constraints(const GeneratorConfig* config, RNG* rng, 
                              const uint8_t* solution_board, Fact* facts, 
                              int num_facts, Puzzle* puzzle) {
    (void)solution_board; // Unused for now
    
    // Shuffle facts with weighted selection
    // Simple approach: sort by score + random factor
    int indices[MAX_FACTS];
    int scores[MAX_FACTS];
    
    for (int i = 0; i < num_facts; i++) {
        indices[i] = i;
        scores[i] = score_fact(&facts[i], config) + rng_int(rng, 50);
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
    
    // Try adding constraints until puzzle has unique solution
    puzzle->num_constraints = 0;
    int total_cells = config->width * config->height;
    
    for (int i = 0; i < num_facts && puzzle->num_constraints < config->max_constraints; i++) {
        Fact* fact = &facts[indices[i]];
        Constraint c = fact_to_constraint(fact, config->width);
        
        if (is_redundant_or_conflicting(puzzle, &c)) {
            continue;
        }
        
        // Tentatively add constraint
        int prev_count = puzzle->num_constraints;
        puzzle->constraints[puzzle->num_constraints++] = c;
        solver_precompute_masks(puzzle);
        
        // Reset board to all cats for solve check
        for (int j = 0; j < total_cells; j++) {
            puzzle->board[j] = SHAPE_CAT;
        }
        
        // Check solution count
        SolverResult result = solver_solve(puzzle, false);
        
        if (g_debug && puzzle->num_constraints <= 5) {
            printf("    [DEBUG] After constraint %d: %llu solutions\n", 
                   puzzle->num_constraints, (unsigned long long)result.solution_count);
        }
        
        if (result.solution_count == 1) {
            // Found unique solution! Make sure we have minimum constraints
            if (puzzle->num_constraints >= config->min_constraints) {
                // Reset board for return
                for (int j = 0; j < total_cells; j++) {
                    puzzle->board[j] = SHAPE_CAT;
                }
                return true;
            }
            // Continue adding constraints for variety
        } else if (result.solution_count == 0) {
            // Constraint made puzzle unsolvable, remove it
            puzzle->num_constraints = prev_count;
            if (g_debug) {
                printf("    [DEBUG] Removed constraint (unsolvable)\n");
            }
        }
        // Multiple solutions: keep constraint and continue
    }
    
    // Final check - reset board first
    for (int j = 0; j < total_cells; j++) {
        puzzle->board[j] = SHAPE_CAT;
    }
    solver_precompute_masks(puzzle);
    
    SolverResult result = solver_solve(puzzle, false);
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

bool generator_generate(const GeneratorConfig* config, uint64_t seed, Puzzle* puzzle) {
    if (!config || !puzzle) return false;
    if (config->width > MAX_WIDTH || config->height > MAX_HEIGHT) return false;
    
    RNG rng;
    rng_init(&rng, seed);
    
    // Initialize puzzle
    memset(puzzle, 0, sizeof(Puzzle));
    puzzle->width = config->width;
    puzzle->height = config->height;
    
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
    bool success = select_constraints(config, &rng, solution_board, facts, num_facts, puzzle);
    
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
            
            success = select_constraints(config, &rng, solution_board, facts, num_facts, puzzle);
            
            if (g_debug) {
                printf("  [DEBUG] Attempt %d: %s, constraints=%d\n", 
                       attempt + 1, success ? "success" : "failed", puzzle->num_constraints);
            }
        }
    }
    
    return success;
}

bool generator_quick(Difficulty level, uint64_t seed, Puzzle* puzzle) {
    GeneratorConfig config = generator_default_config(level);
    return generator_generate(&config, seed, puzzle);
}

bool generator_validate_unique(Puzzle* puzzle) {
    return solver_has_unique_solution(puzzle);
}


/**
 * Schrödinger's Shapes - Core Types
 * 
 * High-performance data structures for puzzle solving.
 * Optimized for cache efficiency and minimal memory footprint.
 */

#ifndef TYPES_H
#define TYPES_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

// Shape IDs (2 bits each, fits in nibble)
#define SHAPE_CAT      0
#define SHAPE_SQUARE   1
#define SHAPE_CIRCLE   2
#define SHAPE_TRIANGLE 3
#define SHAPE_COUNT    4

// Maximum board dimensions
#define MAX_WIDTH  6
#define MAX_HEIGHT 6
#define MAX_CELLS  (MAX_WIDTH * MAX_HEIGHT)

// Maximum constraints
#define MAX_CONSTRAINTS 32
#define MAX_DISPLAY_CONSTRAINTS 32

// Constraint types
typedef enum {
    CONSTRAINT_ROW,
    CONSTRAINT_COLUMN,
    CONSTRAINT_GLOBAL,
    CONSTRAINT_CELL
} ConstraintType;

// Constraint operators
typedef enum {
    OP_EXACTLY,
    OP_AT_LEAST,
    OP_AT_MOST,
    OP_NONE,
    OP_IS,
    OP_IS_NOT
} ConstraintOperator;

/**
 * Compact constraint representation (16 bytes)
 * For count constraints: checks shape count in region
 * For cell constraints: checks specific cell value
 */
typedef struct {
    uint8_t type;       // ConstraintType
    uint8_t op;         // ConstraintOperator
    uint8_t shape;      // Target shape
    uint8_t count;      // Target count (for count constraints)
    uint8_t index;      // Row/column index (for row/column constraints)
    uint8_t cell_x;     // Cell X (for cell constraints)
    uint8_t cell_y;     // Cell Y (for cell constraints)
    uint8_t _pad;       // Padding for alignment
    // Pre-computed cell mask for fast counting (64 bits = max 64 cells)
    uint64_t cell_mask;
} Constraint;

/**
 * Puzzle definition
 * Contains board dimensions, initial state, and constraints
 */
typedef struct {
    uint8_t width;
    uint8_t height;
    uint8_t num_constraints;
    uint8_t num_display_constraints;  // Optimized constraints for user display
    
    // Flat board: board[y * width + x] = shape
    uint8_t board[MAX_CELLS];
    
    // Locked cells bitmask (1 = locked)
    uint64_t locked_mask;
    
    // Raw constraints (used by solver)
    Constraint constraints[MAX_CONSTRAINTS];
    
    // Optimized display constraints (shown to user, shuffled)
    Constraint display_constraints[MAX_DISPLAY_CONSTRAINTS];
} Puzzle;

/**
 * Solver result
 */
typedef struct {
    uint64_t solution_count;
    uint64_t states_explored;
    double time_ms;
    bool is_solvable;
} SolverResult;

/**
 * Difficulty levels
 */
typedef enum {
    LEVEL_1 = 1,
    LEVEL_2 = 2,
    LEVEL_3 = 3,
    LEVEL_4 = 4,
    LEVEL_5 = 5
} Difficulty;

// Utility functions
static inline int cell_index(int x, int y, int width) {
    return y * width + x;
}

static inline int cell_x(int index, int width) {
    return index % width;
}

static inline int cell_y(int index, int width) {
    return index / width;
}

static inline bool is_locked(const Puzzle* p, int index) {
    return (p->locked_mask >> index) & 1;
}

static inline void set_locked(Puzzle* p, int index, bool locked) {
    if (locked) {
        p->locked_mask |= (1ULL << index);
    } else {
        p->locked_mask &= ~(1ULL << index);
    }
}

// Shape name lookup
const char* shape_name(uint8_t shape);

// Print puzzle state
void puzzle_print(const Puzzle* p);

// Print constraint
void constraint_print(const Constraint* c);

#endif // TYPES_H


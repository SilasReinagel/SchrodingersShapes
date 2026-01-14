/**
 * Schrödinger's Shapes - Core Types Implementation
 */

#include "types.h"
#include <stdio.h>

static const char* SHAPE_NAMES[] = {
    "Cat", "Square", "Circle", "Triangle"
};

static const char SHAPE_CHARS[] = {
    '?', '#', 'O', '^'
};

const char* shape_name(uint8_t shape) {
    if (shape < SHAPE_COUNT) {
        return SHAPE_NAMES[shape];
    }
    return "Unknown";
}

void puzzle_print(const Puzzle* p) {
    printf("Puzzle %dx%d:\n", p->width, p->height);
    
    // Print board
    printf("  ");
    for (int x = 0; x < p->width; x++) {
        printf("%d ", x);
    }
    printf("\n");
    
    for (int y = 0; y < p->height; y++) {
        printf("%d ", y);
        for (int x = 0; x < p->width; x++) {
            int idx = cell_index(x, y, p->width);
            char c = SHAPE_CHARS[p->board[idx]];
            if (is_locked(p, idx)) {
                printf("[%c]", c);
            } else {
                printf(" %c ", c);
            }
        }
        printf("\n");
    }
    
    // Print constraints
    printf("\nConstraints (%d):\n", p->num_constraints);
    for (int i = 0; i < p->num_constraints; i++) {
        printf("  %d. ", i + 1);
        constraint_print(&p->constraints[i]);
    }
}

static const char* OP_NAMES[] = {
    "exactly", "at least", "at most", "none", "is", "is not"
};

void constraint_print(const Constraint* c) {
    const char* shape = shape_name(c->shape);
    const char* op = OP_NAMES[c->op];
    
    switch (c->type) {
        case CONSTRAINT_ROW:
            printf("Row %d: %s %d %s(s)\n", c->index, op, c->count, shape);
            break;
        case CONSTRAINT_COLUMN:
            printf("Column %d: %s %d %s(s)\n", c->index, op, c->count, shape);
            break;
        case CONSTRAINT_GLOBAL:
            printf("Global: %s %d %s(s)\n", op, c->count, shape);
            break;
        case CONSTRAINT_CELL:
            printf("Cell (%d,%d) %s %s\n", c->cell_x, c->cell_y, op, shape);
            break;
    }
}


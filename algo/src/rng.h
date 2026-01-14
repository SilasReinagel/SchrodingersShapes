/**
 * Schrödinger's Shapes - Fast Seeded RNG
 * 
 * xorshift64* - Fast, high-quality PRNG with seedable state.
 * Period: 2^64-1, passes BigCrush statistical tests.
 */

#ifndef RNG_H
#define RNG_H

#include <stdint.h>

typedef struct {
    uint64_t state;
} RNG;

// Initialize RNG with seed
void rng_init(RNG* rng, uint64_t seed);

// Get next random uint64
uint64_t rng_next(RNG* rng);

// Get random int in range [0, max)
int rng_int(RNG* rng, int max);

// Get random float in [0, 1)
double rng_float(RNG* rng);

// Shuffle array of uint8_t
void rng_shuffle_u8(RNG* rng, uint8_t* arr, int n);

// Shuffle array of int
void rng_shuffle_int(RNG* rng, int* arr, int n);

#endif // RNG_H


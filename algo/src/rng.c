/**
 * Schrödinger's Shapes - Fast Seeded RNG Implementation
 * 
 * Uses xorshift64* algorithm for speed and quality.
 */

#include "rng.h"

void rng_init(RNG* rng, uint64_t seed) {
    // Ensure non-zero state (xorshift requirement)
    rng->state = seed ? seed : 0x853c49e6748fea9bULL;
    
    // Warm up the generator
    for (int i = 0; i < 10; i++) {
        rng_next(rng);
    }
}

uint64_t rng_next(RNG* rng) {
    // xorshift64* algorithm
    uint64_t x = rng->state;
    x ^= x >> 12;
    x ^= x << 25;
    x ^= x >> 27;
    rng->state = x;
    return x * 0x2545f4914f6cdd1dULL;
}

int rng_int(RNG* rng, int max) {
    if (max <= 0) return 0;
    
    // Unbiased bounded random using rejection sampling
    uint64_t threshold = -((uint64_t)max) % (uint64_t)max;
    uint64_t r;
    do {
        r = rng_next(rng);
    } while (r < threshold);
    
    return (int)(r % (uint64_t)max);
}

double rng_float(RNG* rng) {
    // Use 53 bits for full double precision
    return (rng_next(rng) >> 11) * (1.0 / 9007199254740992.0);
}

void rng_shuffle_u8(RNG* rng, uint8_t* arr, int n) {
    for (int i = n - 1; i > 0; i--) {
        int j = rng_int(rng, i + 1);
        uint8_t tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
}

void rng_shuffle_int(RNG* rng, int* arr, int n) {
    for (int i = n - 1; i > 0; i--) {
        int j = rng_int(rng, i + 1);
        int tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
}


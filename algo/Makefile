# Schrödinger's Shapes - High Performance Solver/Generator
# Optimized C implementation

CC = clang
CFLAGS = -O3 -march=native -flto -Wall -Wextra -std=c11
LDFLAGS = -flto -lpthread

# Debug build
DEBUG_CFLAGS = -g -O0 -Wall -Wextra -std=c11 -fsanitize=address,undefined
DEBUG_LDFLAGS = -fsanitize=address,undefined -lpthread

SRC = src
BUILD = build
BIN = bin

SOURCES = $(SRC)/types.c $(SRC)/solver.c $(SRC)/generator.c $(SRC)/rng.c $(SRC)/main.c
HEADERS = $(SRC)/types.h $(SRC)/solver.h $(SRC)/generator.h $(SRC)/rng.h
OBJECTS = $(patsubst $(SRC)/%.c,$(BUILD)/%.o,$(SOURCES))

TARGET = $(BIN)/puzzle

.PHONY: all clean debug test benchmark

all: dirs $(TARGET)

dirs:
	@mkdir -p $(BUILD) $(BIN)

$(BUILD)/%.o: $(SRC)/%.c $(HEADERS)
	$(CC) $(CFLAGS) -c $< -o $@

$(TARGET): $(OBJECTS)
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@

debug: CFLAGS = $(DEBUG_CFLAGS)
debug: LDFLAGS = $(DEBUG_LDFLAGS)
debug: clean all

test: all
	./$(TARGET) --test

benchmark: all
	./$(TARGET) --benchmark

clean:
	rm -rf $(BUILD) $(BIN)

# Run solver on a specific seed
run: all
	./$(TARGET) --solve --level 3 --seed 42

# Generate and count solutions for multiple seeds
batch: all
	./$(TARGET) --batch --level 3 --count 100


import { describe, expect, it } from "vitest";
import { gridFor, layout } from "../src/wall.ts";

// How the wall is built, on its own.
//
// The wall is a picture, so most of what matters about it is only visible in a
// browser. These two questions are the exception: they are about the numbers
// layout() hands to CSS, and getting them wrong produces a wall that renders
// fine and moves wrong.

const grid = gridFor(1440, 900);

describe("the wall empties differently every time", () => {
  it("gives each hold its own fall", () => {
    // One shared timing and the holds slide off together, which reads as the
    // page scrolling rather than as a wall coming apart. The fix was three
    // numbers per hold, so the thing worth pinning is that they vary.
    const holds = layout(grid, Math.random);
    for (const key of ["drift", "tumble", "lag"] as const) {
      const values = new Set(holds.map((hold) => hold[key]));
      expect(values.size, `every hold falls with the same ${key}`).toBeGreaterThan(
        holds.length / 2,
      );
    }
  });

  it("turns every hold at least half a rotation on the way down", () => {
    // A hold that drops without turning looks like it was deleted rather than
    // knocked off. The range is wide on purpose; only the worst case matters.
    const holds = layout(grid, Math.random);
    const turns = holds.map((hold) => Math.abs(hold.tumble));
    expect(Math.max(...turns)).toBeGreaterThan(180);
  });
});

describe("the same dice build the same wall", () => {
  it("is reproducible, so a wall can be reasoned about twice", () => {
    const roll = () => {
      let seed = 1;
      return () => {
        seed = (seed * 48271) % 2147483647;
        return seed / 2147483647;
      };
    };
    expect(layout(grid, roll())).toEqual(layout(grid, roll()));
  });
});

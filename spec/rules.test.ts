import { describe, expect, it } from "vitest";
import {
  extend,
  handOver,
  height,
  isOver,
  press,
  START,
  TOP_OUT,
  type Game,
} from "../src/rules.ts";
import { ascent } from "../src/wall.ts";

// The rule, on its own.
//
// This is the spec's "one game rule covered by a focused automated test", and
// the reason src/rules.ts holds no DOM is so that this file can ask the
// question directly: given a route and a press, is the player still on the
// wall? Driving thirty buttons to find that out would test the wiring, and the
// wiring is not the rule.
//
// What a test cannot ask is whether falling on hold seven of eight feels fair.
// That one is settled by watching somebody do it.

/** A route mid-climb: three holds shown, none of them matched yet. */
function climbing(sequence: number[]): Game {
  return { phase: "climbing", sequence, matched: 0 };
}

describe("a wrong move ends the round in a loss", () => {
  it("falls on a hold that is not the next one", () => {
    const after = press(climbing([4, 9, 2]), 9);
    expect(after.phase).toBe("fallen");
    expect(isOver(after)).toBe(true);
  });

  it("falls part-way through a route, not just at the start", () => {
    const half = { phase: "climbing", sequence: [4, 9, 2], matched: 2 } as const;
    expect(press(half, 4).phase).toBe("fallen");
  });

  it("is a real risk and not a formality: most holds are wrong", () => {
    // If pressing almost anything were survivable there would be no wrong move
    // to make, which is C4's brief rather than this one. On a wall of thirty,
    // twenty-nine presses end the round.
    const route = climbing([7]);
    const survivable = [...Array(30).keys()].filter(
      (hold) => press(route, hold).phase !== "fallen",
    );
    expect(survivable).toEqual([7]);
  });

  it("stays fallen once fallen", () => {
    const fallen = press(climbing([1, 2]), 5);
    expect(press(fallen, 1)).toEqual(fallen);
    expect(extend(fallen, 3)).toEqual(fallen);
  });
});

describe("play reaches an ending rather than running forever", () => {
  it("tops out after TOP_OUT correct rounds", () => {
    // Climb the whole route the way a player would: the wall adds a hold, plays
    // it back, and the player repeats every hold from the bottom.
    let game: Game = START;
    let rounds = 0;

    while (!isOver(game)) {
      game = handOver(extend(game, rounds));
      rounds += 1;
      for (const hold of game.sequence) {
        game = press(game, hold);
      }
      if (game.phase === "cleared") continue;
      break;
    }

    expect(game.phase).toBe("topped");
    expect(rounds).toBe(TOP_OUT);
    expect(isOver(game)).toBe(true);
  });

  it("never runs past the top", () => {
    // The loop above terminates because `cleared` stops being reachable, not
    // because the test counted. Guard that directly.
    const last: Game = {
      phase: "climbing",
      sequence: [...Array(TOP_OUT).keys()],
      matched: TOP_OUT - 1,
    };
    expect(press(last, TOP_OUT - 1).phase).toBe("topped");
  });

  it("has exactly two ways to end, and they are the two the spec names", () => {
    const fallen = press(climbing([0, 1]), 1);
    const topped: Game = {
      phase: "climbing",
      sequence: [...Array(TOP_OUT).keys()],
      matched: TOP_OUT - 1,
    };
    expect([fallen.phase, press(topped, TOP_OUT - 1).phase].sort()).toEqual([
      "fallen",
      "topped",
    ]);
  });
});

describe("the route replays from the bottom every round", () => {
  it("wants the whole sequence, not just the new hold", () => {
    let game = handOver(extend(handOver(extend(START, 3)), 8));
    expect(game.sequence).toEqual([3, 8]);
    game = press(game, 8);
    expect(game.phase, "pressing the newest hold first is a fall").toBe(
      "fallen",
    );
  });

  it("clears the round only once every hold is matched in order", () => {
    let game = handOver(extend(handOver(extend(START, 3)), 8));
    game = press(game, 3);
    expect(game.phase).toBe("climbing");
    game = press(game, 8);
    expect(game.phase).toBe("cleared");
  });
});

describe("a press while the wall is showing is not a move", () => {
  it("ignores it rather than falling for it", () => {
    // Touching the wall during playback is misreading the turn, not making a
    // mistake. Falling for it would teach the wrong lesson at the exact moment
    // the player is working the rules out.
    const showing: Game = { phase: "showing", sequence: [4], matched: 0 };
    expect(press(showing, 11)).toEqual(showing);
    expect(press(START, 11)).toEqual(START);
  });
});

describe("the height gauge", () => {
  it("reads empty before the first hold and full at the top", () => {
    expect(height(START)).toBe(0);
    expect(
      height({ phase: "topped", sequence: [1], matched: 1 }),
    ).toBe(1);
  });

  it("rises once per cleared round and never leaves 0..1", () => {
    let game: Game = START;
    const seen: number[] = [];
    for (let round = 0; round < TOP_OUT; round += 1) {
      game = extend(game, round);
      seen.push(height(game));
    }
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
    for (const value of seen) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("the player's voice climbs", () => {
  it("rises with every press of a round, all the way to the top", () => {
    // The reward for a clean round is meant to be audible before the wall says
    // anything, and that only works if the line never doubles back. A pitch
    // table with a wrapped octave would sound fine for four holds and collapse
    // on the fifth --- which is exactly where a player starts needing the cue.
    const notes = Array.from({ length: TOP_OUT }, (_, step) => ascent(step));
    for (let step = 1; step < notes.length; step += 1) {
      expect(notes[step]!, `press ${step + 1} did not rise`).toBeGreaterThan(
        notes[step - 1]!,
      );
    }
  });

  it("stays in a range a small speaker can actually make", () => {
    expect(ascent(0)).toBeGreaterThan(100);
    expect(ascent(TOP_OUT - 1)).toBeLessThan(1600);
  });
});

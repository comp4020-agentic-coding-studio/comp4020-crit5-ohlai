// The route, as a state machine. No DOM, no audio, no clock --- so the rule
// that decides a fall can be tested by calling it, rather than by driving a
// wall of buttons and hoping.
//
// The shape is Simon's: a sequence that grows by one hold each round, replayed
// from the bottom every time. What climbing adds is the reason the sequence
// replays from the bottom --- that is what a boulder problem is. You do not get
// to start halfway up because you got halfway up last go.

/** Rounds to the top. Eight holds is past most people's spatial span. */
export const TOP_OUT = 8;

export type Phase =
  /** Nothing has started. The wall is waiting to be touched. */
  | "ready"
  /** The wall is playing the route back. Presses are ignored. */
  | "showing"
  /** The player's turn. Presses are the game. */
  | "climbing"
  /** The round is matched and the route wants its next hold. */
  | "cleared"
  /** A wrong hold. Play is over. */
  | "fallen"
  /** The last round is matched. Play is over. */
  | "topped";

export interface Game {
  readonly phase: Phase;
  /** Hold indices, bottom of the route first. */
  readonly sequence: readonly number[];
  /** How much of the sequence the player has matched this round. */
  readonly matched: number;
}

export const START: Game = { phase: "ready", sequence: [], matched: 0 };

/** Play is over, whichever way it ended. */
export function isOver(game: Game): boolean {
  return game.phase === "fallen" || game.phase === "topped";
}

/**
 * Add a hold to the route and play it back. The caller picks the hold, because
 * choosing one is a dice roll and this module does not own the dice.
 */
export function extend(game: Game, hold: number): Game {
  if (isOver(game)) return game;
  return {
    phase: "showing",
    sequence: [...game.sequence, hold],
    matched: 0,
  };
}

/** The playback finished. The wall hands the route back to the player. */
export function handOver(game: Game): Game {
  if (game.phase !== "showing") return game;
  return { ...game, phase: "climbing" };
}

/**
 * The rule. A press either matches the next hold in the route or it does not,
 * and there is no third option --- which is the whole of "a wrong move is
 * possible".
 */
export function press(game: Game, hold: number): Game {
  // Presses during playback are not moves. Ignoring them rather than counting
  // them is deliberate: a player who touches the wall while it is showing has
  // not made a mistake, they have misread the turn, and falling for that
  // teaches the wrong lesson.
  if (game.phase !== "climbing") return game;

  if (hold !== game.sequence[game.matched]) {
    return { ...game, phase: "fallen" };
  }

  const matched = game.matched + 1;
  if (matched < game.sequence.length) {
    return { ...game, matched };
  }
  if (game.sequence.length >= TOP_OUT) {
    return { ...game, matched, phase: "topped" };
  }
  return { ...game, matched, phase: "cleared" };
}

/** How far up the route the player has climbed, from 0 to 1. */
export function height(game: Game): number {
  const done = game.phase === "topped" ? TOP_OUT : game.sequence.length - 1;
  return Math.min(1, Math.max(0, done / TOP_OUT));
}

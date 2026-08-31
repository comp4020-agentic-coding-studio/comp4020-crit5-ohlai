// Where the holds go.
//
// A real bouldering wall is not a grid, but it is not white noise either: a
// setter spaces holds so that any two are reachable and no two are in each
// other's way. Uniform random placement gives clumps and voids, and a clump of
// holds is unplayable here for the same reason it is unclimbable there --- you
// cannot tell which one lit up.
//
// So: a grid, jittered hard enough to stop reading as a grid. Every cell gets
// exactly one hold, and the jitter is capped short of the cell edge, which
// bounds the worst case rather than hoping for it.

/** The four holds that were photographed. */
export const KINDS = ["green", "red", "yellow", "orange"] as const;
export type Kind = (typeof KINDS)[number];

export interface Hold {
  /** Fraction across the wall, 0 to 1. */
  readonly x: number;
  /** Fraction down the wall, 0 to 1. Bottom of the wall is 1. */
  readonly y: number;
  readonly kind: Kind;
  /** Degrees. A hold bolted on at an angle is the normal case, not a glitch. */
  readonly spin: number;
  /** Multiplier on the base size. */
  readonly scale: number;
  /** Whether to mirror it, so four photographs read as eight shapes. */
  readonly flipped: boolean;
  /** Sideways travel when the hold comes off the wall, -1 to 1. */
  readonly drift: number;
  /** Degrees the hold turns through on the way down. */
  readonly tumble: number;
  /** Where this hold sits in the stagger, 0 to 1. */
  readonly lag: number;
}

/** How far a hold may wander from its cell centre, as a fraction of the cell. */
const JITTER = 0.34;

export interface Grid {
  readonly columns: number;
  readonly rows: number;
}

/**
 * A grid that fills the viewport with roughly square cells. Portrait phones get
 * fewer, larger holds, because a hold too small to hit with a thumb is not a
 * hold.
 */
export function gridFor(width: number, height: number): Grid {
  const aspect = width / Math.max(1, height);
  const columns = aspect > 1.1 ? 7 : aspect > 0.75 ? 5 : 4;
  const rows = Math.max(4, Math.round(columns / Math.max(0.35, aspect)));
  return { columns, rows };
}

/**
 * Lay out one hold per cell. `random` is injected so a test can hand it a
 * counter and get the same wall twice.
 */
export function layout(grid: Grid, random: () => number): Hold[] {
  const holds: Hold[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let column = 0; column < grid.columns; column += 1) {
      const cellX = (column + 0.5) / grid.columns;
      const cellY = (row + 0.5) / grid.rows;
      const wanderX = ((random() - 0.5) * 2 * JITTER) / grid.columns;
      const wanderY = ((random() - 0.5) * 2 * JITTER) / grid.rows;
      holds.push({
        x: cellX + wanderX,
        y: cellY + wanderY,
        kind: KINDS[Math.floor(random() * KINDS.length)] ?? KINDS[0],
        spin: Math.round((random() - 0.5) * 120),
        scale: 0.82 + random() * 0.36,
        flipped: random() < 0.5,
        // A fall needs thirty different falls. One shared timing and the wall
        // slides off in one piece, which reads as the page scrolling.
        drift: (random() - 0.5) * 2,
        tumble: Math.round((random() - 0.5) * 1200),
        lag: random(),
      });
    }
  }
  return holds;
}

/**
 * A pitch for a hold, in hertz. Low on the wall is low, so climbing the route
 * plays a rising line and a fall is audibly a drop. Snapped to a minor
 * pentatonic, because a stranger at a crit gets about ten seconds to decide
 * whether this sounds like an instrument or like a smoke alarm.
 */
const PENTATONIC = [0, 3, 5, 7, 10];
const ROOT_HZ = 146.83; // D3

export function pitchOf(hold: Hold): number {
  // y runs downwards, so invert it: the top of the wall is the top of the range.
  const up = 1 - hold.y;
  const step = Math.round(up * (PENTATONIC.length * 2 - 1));
  const octave = Math.floor(step / PENTATONIC.length);
  const degree = PENTATONIC[step % PENTATONIC.length] ?? 0;
  return ROOT_HZ * 2 ** ((degree + octave * 12) / 12);
}

/** Pick a hold index that is not the one just used, so a route never stutters. */
export function nextHold(
  count: number,
  previous: number | undefined,
  random: () => number,
): number {
  if (count <= 1) return 0;
  let pick = Math.floor(random() * count);
  if (pick === previous) {
    pick = (pick + 1 + Math.floor(random() * (count - 1))) % count;
  }
  return pick;
}

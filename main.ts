import { Voice } from "./src/audio.ts";
import {
  extend,
  handOver,
  height,
  isOver,
  press,
  START,
  type Game,
} from "./src/rules.ts";
import { gridFor, layout, nextHold, pitchOf, type Hold } from "./src/wall.ts";

// Wiring. Everything that decides anything lives in src/rules.ts; this file
// turns state into a wall and presses into state, and owns the clock.

const wall = document.querySelector<HTMLElement>("[data-wall]");
const gauge = document.querySelector<HTMLElement>("[data-gauge]");

const voice = new Voice();
const holds: Hold[] = layout(
  gridFor(window.innerWidth, window.innerHeight),
  Math.random,
);
const buttons: HTMLButtonElement[] = [];

let game: Game = START;
/** Round one's hold, breathing on the opening screen until it is answered. */
let opening = 0;
/** Timers for the playback, kept so a fall can cancel a route mid-flight. */
let pending: number[] = [];

function clearPending(): void {
  for (const timer of pending) window.clearTimeout(timer);
  pending = [];
}

function later(run: () => void, delay: number): void {
  pending.push(window.setTimeout(run, delay));
}

// --- the wall -------------------------------------------------------------

function build(): void {
  if (!wall) return;
  holds.forEach((hold, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hold";
    button.dataset.index = String(index);
    // The kind drives the per-photograph dormant gain in the stylesheet.
    button.dataset.kind = hold.kind;
    // A name, not a nudge. Screen readers get what the hold is, never what to
    // do with it --- off screen still counts as off screen.
    button.setAttribute("aria-label", `${hold.kind} hold`);
    button.style.left = `${hold.x * 100}%`;
    button.style.top = `${hold.y * 100}%`;
    button.style.setProperty("--spin", `${hold.spin}deg`);
    button.style.setProperty("--scale", String(hold.scale));
    button.style.setProperty("--flip", hold.flipped ? "-1" : "1");
    // How this one comes off the wall when the climb ends.
    button.style.setProperty("--drift", String(hold.drift));
    button.style.setProperty("--tumble", `${hold.tumble}deg`);
    button.style.setProperty("--lag", String(hold.lag));

    const image = document.createElement("img");
    image.src = `./holds/${hold.kind}.png`;
    image.alt = "";
    image.draggable = false;
    button.append(image);

    button.addEventListener("click", () => touched(index));
    wall.append(button);
    buttons.push(button);
  });
}

/**
 * The wall's voice: light a hold for a beat. Only ever called for holds the
 * wall is showing, never for holds the player pressed --- see grip().
 */
function flash(index: number, duration = 420): void {
  const button = buttons[index];
  const hold = holds[index];
  if (!button || !hold) return;
  button.classList.add("lit");
  voice.strike(pitchOf(hold));
  later(() => button.classList.remove("lit"), duration);
}

/**
 * The player's voice. A press has to be answered visibly --- otherwise the
 * opening hold is a button that does nothing --- but it must not be answered
 * in the wall's language. Playing the first round exposed why: press the
 * breathing hold and it lit exactly like a route hold, then the real route hold
 * lit a second later, so the round read as a two-hold route. Copy back what you
 * were shown and you fall on move one, having done nothing wrong. A grip takes
 * the colour and pushes the hold in; a flash lifts it and puts a halo round it.
 */
function grip(index: number, duration = 300): void {
  const button = buttons[index];
  const hold = holds[index];
  if (!button || !hold) return;
  button.classList.add("held");
  // The same pitch the wall used to show this hold. The two voices differ in
  // the eye and never in the ear: a hold's note is how the player recognises
  // it, so a press that answers in a different pitch than the one it was shown
  // in is not a second voice, it is the memory aid contradicting itself.
  voice.strike(pitchOf(hold));
  later(() => button.classList.remove("held"), duration);
}

/**
 * A correct move. The press animation passes, but the colour stays: the holds
 * matched so far are the part of the route the player has already climbed, and
 * leaving them lit turns "which one is next" from a memory question into a
 * reading one halfway through a long round. The trail is cleared by show(),
 * when the next round replays the route from the bottom --- so it lasts exactly
 * as long as the round it belongs to.
 */
function climb(index: number): void {
  grip(index);
  buttons[index]?.classList.add("done");
}

function paint(): void {
  document.body.dataset.phase = game.phase;
  if (gauge) gauge.style.setProperty("--height", String(height(game)));
}

// --- the loop -------------------------------------------------------------

/** Play the route back, then hand the wall to the player. */
function show(): void {
  // Everything from the previous round has already fired by the time a new
  // hold is added; dropping the handles keeps `pending` from growing for the
  // whole climb.
  clearPending();
  // The new round starts from the bottom, so last round's trail goes with it.
  for (const button of buttons) button.classList.remove("done");
  paint();
  const beat = game.sequence.length > 5 ? 460 : 560;
  game.sequence.forEach((index, position) => {
    later(() => flash(index), position * beat + 420);
  });
  later(() => {
    game = handOver(game);
    paint();
  }, game.sequence.length * beat + 420);
}

function addHold(): void {
  const previous = game.sequence.at(-1);
  game = extend(game, nextHold(holds.length, previous, Math.random));
  show();
}

function fall(index: number): void {
  clearPending();
  const hold = holds[index];
  if (hold) voice.fall(pitchOf(hold));
  buttons[index]?.classList.add("wrong");
  paint();
  // Long enough to register as an ending, short enough that the next go feels
  // available rather than offered. The whole wall empties inside it.
  later(() => reset(true), 1900);
}

function topOut(): void {
  clearPending();
  paint();
  voice.fanfare(game.sequence.map((index) => pitchOf(holds[index]!)));
  // The whole wall lights, bottom to top: the route was the point, and now
  // there is nothing left of it to climb.
  const order = [...buttons.keys()].sort(
    (a, b) => (holds[b]?.y ?? 0) - (holds[a]?.y ?? 0),
  );
  order.forEach((index, position) => {
    later(() => buttons[index]?.classList.add("lit"), position * 45);
  });
  later(reset, order.length * 45 + 2600);
}

/** How long the wall takes to fill back up. Matches the `land` animation. */
const LANDING_MS = 760;

function reset(fell = false): void {
  clearPending();
  for (const button of buttons) {
    button.classList.remove("lit", "held", "wrong", "done", "start");
  }
  game = START;
  paint();

  if (!fell) {
    arm();
    return;
  }

  // The holds are off the wall, so they have to come back on before one of them
  // can invite a press. Land first, breathe after. Doing it in this order also
  // keeps the pop and the pulse from animating the same image at once, which
  // the pulse would win.
  for (const button of buttons) button.classList.add("landing");
  later(() => {
    for (const button of buttons) button.classList.remove("landing");
    arm();
  }, LANDING_MS);
}

/**
 * Arm the opening screen. Round one is not announced by a separate "press to
 * begin" hold that then hands over to the wall --- the wall shows round one by
 * breathing its first hold, and keeps breathing it until it is answered. So the
 * opening press is a real move on a real route rather than a doorbell, and the
 * player has learned the whole loop by the time the second hold arrives.
 */
function arm(): void {
  opening = nextHold(holds.length, undefined, Math.random);
  buttons[opening]?.classList.add("start");
}

function touched(index: number): void {
  // Every path in here starts with a real press, which is the only moment the
  // browser will let audio begin.
  voice.unlock();

  if (isOver(game)) return;

  if (game.phase === "ready") {
    // A press somewhere else on the opening screen is not a fall. The wall is
    // still showing round one --- it has not taken the hold away yet --- and
    // rules.press() already says a press during showing is a misread turn, not
    // a mistake. It still answers in the player's voice, because a wall that
    // does nothing when touched reads as a picture.
    if (index !== opening) {
      grip(index);
      return;
    }
    buttons[opening]?.classList.remove("start");
    // The breathing was the playback. Catch the state up to it, then let the
    // press fall through to the ordinary climbing path below.
    game = handOver(extend(game, opening));
    paint();
  }

  if (game.phase !== "climbing") return;

  const before = game;
  game = press(game, index);

  if (game.phase === "fallen") {
    fall(index);
    return;
  }

  // A correct press: the hold answers in the player's voice, not the wall's,
  // and then stays lit for the rest of the round.
  climb(index);

  if (game.phase === "topped") {
    later(topOut, 380);
    return;
  }
  if (game.phase === "cleared") {
    later(addHold, 780);
    return;
  }
  if (before.matched !== game.matched) paint();
}

// --- start ----------------------------------------------------------------

build();
paint();
// One hold breathes on the opening screen: the first hold of the route. It is
// the only colour on a grey wall and the only thing that moves, which is the
// whole of the tutorial.
arm();

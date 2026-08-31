# CLAUDE.md

Project rules for this repository. Read this before writing or changing any
code.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec (C5, "A game"), and
`spec/game.test.ts` is that spec turned into tests. The deployed site is what
gets marked, not this repo.

## What this is

**Beta** --- a bouldering wall you climb from memory. Thirty-odd holds scatter a
dark wall, every one of them grey. One breathes: that is round one. Press it and
the wall adds a hold; press the route back from the bottom and it adds another,
until you top out at eight.

- **What the player does:** watch a route, then repeat it in order from the
  first hold. One press per hold, no timer, no undo.
- **The one mechanic:** the route grows by exactly one hold per round, and is
  always replayed from the bottom. That is the whole rule set; everything else
  is dressing on it. In particular there is no separate start control --- the
  opening screen shows round one by *breathing* its first hold until the player
  answers it, so the first press is already a move on a real route.
- **Failing:** a press that is not the next hold in the route. The wall shakes,
  goes dark, and the climb is over --- back to a fresh wall. On a wall of thirty
  exactly one press is right, so falling is real rather than ceremonial.
- **Ending:** topping out at `TOP_OUT` (eight holds), which lights the whole
  wall bottom to top. Both endings return to the opening screen without asking.
- **Point of view:** the wall is a physical surface being *shown* to you, not a
  menu. It has one voice for showing and the player has another --- the wall
  **lights** a hold (lifted, haloed, pitched by where it is on the wall); the
  player **grips** one (full colour, pushed in, no halo, pitched by how far up
  the route they are, so a matched round is a rising line). These never look or
  sound alike, because a player who cannot tell the wall's move from their own
  falls without having made a mistake. A gripped hold then stays in colour for
  the rest of the round --- the route keeps a record of itself, so a long round
  asks the player to remember the route and not also their place in it.
- **The tradeoff rule:** when depth and legibility pull against each other,
  legibility wins, because the brief forbids explaining and the affordance is
  the only teacher left. Colour on this page is a scarce resource: the wall is
  dark and the holds are grey so that anything bright is *the game speaking*.
  A feature that needs a new bright thing on screen has to justify spending from
  that budget or it does not ship.

## Hard constraints

These are not negotiable. If a change would break one, stop and say so instead
of working around it.

- Static and client side throughout. No build server, no backend, and **no
  request to any third-party origin at runtime**. Everything ships as files to
  GitHub Pages. Same-origin fetches of assets vendored into this repo are fine.
- No frameworks. Plain HTML, CSS and JavaScript. (TypeScript compiled by the
  template's Vite build is fine --- it erases to plain JS and ships no runtime.)
- No runtime dependencies. Adding one is a decision to raise, not to make.
- **No instructions, anywhere.** Not a how-to modal, not an instructions page,
  not a line of hint text, not a README standing in for one. The first screen
  teaches the opening move by affordance or it does not teach it. This is C5's
  central constraint and the one thing four people at the keyboard resolve
  immediately, so a change that adds explanatory copy breaks the deliverable's
  spec, not just this rule.
- **Losing must be possible.** A wrong move exists, and play concludes --- win,
  loss or finish. A toy you cannot fail is C4's brief, not this one.
- A newcomer reaches an ending inside five minutes, and the thing still holds
  their attention for those five minutes.
- Must work at both marking viewports, desktop and phone.
- The starter's invariant checks must pass before any commit.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- **Play it.** A test can confirm a collision ends the round; only playing tells
  you whether that feels fair. The spec asks for one change that came from
  playing rather than from reading code --- make that change real, and cite the
  commit.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them (`pnpm check:evidence` is the extra gate before you
ship); CI runs the same plus links, secrets and the deploy. Read the failure.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for. `spec/README.md` draws the line between a **contract
test**, which retires with the brief it answers, and a **sensor**, which is
harness and comes with you into next week's repo.

When something breaks, fix the check or add a new one. Do not retry until it
passes by chance.

### Facts about this stack that are easy to get wrong

- The invariants run against the **built** site in `dist/`, not the source, so
  `pnpm build` must run before them. `pnpm check` does this in order.
- The invariants require a `<nav>` landmark and **exactly one** `<h1>` on every
  built page. A single-page prototype still needs both. This collides with the
  no-instructions rule head on: the page is obliged to carry a heading and a
  navigation landmark while being forbidden to explain itself. A title is not an
  instruction and a landmark need not be visible chrome --- but resolve it
  deliberately, and say how in `PROCESS.md`.
- CI (`check` and `deploy`) is gated on the repo being public. While it is
  private, pushing runs nothing --- local `pnpm check` is the only feedback
  loop.
- `tsconfig.json`'s `include` glob is **not recursive at the root**, so a new
  top-level directory is invisible to `tsc` unless something already checked
  imports it. Add the directory rather than relying on the import graph.
- A spec test that evals the built entry chunk does so as a **classic script**.
  Top-level `import`/`export` and the token `import.meta` are both a
  `SyntaxError` there. `import.meta.env.BASE_URL` is safe because Vite erases it
  at build time; `import.meta.url` is not. Keep the eval loop pointed at the
  entry chunk that `index.html` names --- never at every `.js` in `dist/`.
- **Never write a `function` declaration directly inside an `if` block.** In
  source it is block scoped; the minifier hoists it to the top level and its
  renamer does not check for a name already there. In C4 this gave `main.ts`'s
  `frame` the same one-letter name as `scale.ts`'s `fromSemitone`, so
  `toFrequency` called `frame`, every note came out `undefined`, and Web Audio
  silently ignored it --- no throw, no console line, no sound. Put the body in a
  real function and call it. Nothing here catches this yet: the sensor that did
  (`nonsense()` in C4's `spec/fake-audio.ts`) was audio-shaped and stayed
  behind. If this build grows a path where a wrong value fails silently, wire a
  sensor for it rather than trusting the rule.
- Audio can only start on a **user activation**: a click, tap or keydown.
  `pointermove` is not one. The `AudioContext` starts suspended, so the opening
  screen has to ask for a press before it can ask for anything else --- which,
  under the no-instructions rule, it has to ask for without words.
- Set audio parameters with `setTargetAtTime`, not `setValueAtTime`. Web Audio
  renders on its own thread, so a value set as a target keeps gliding through a
  main-thread stall instead of stepping when the thread recovers.
- `var()` inside a **custom property** is substituted where that property is
  *declared*, not where it is used. `--dormant: brightness(var(--gain))` on
  `:root` resolves `--gain` against `:root`, so every element inherits the
  already-substituted fallback and the per-element override is silently ignored
  --- no warning, no invalid declaration, just the wrong picture. Declare the
  composed property on the same element that sets its inputs (here, `.hold`).
  Nothing in `check` catches this; the rendered page is the only witness, which
  is why the "open it and look at it" rule earns its place.
- Filters do not compose across a `filter:` value the way you would guess:
  `filter: none drop-shadow(...)` is invalid outright, and a `brightness()`
  applied to a photograph is relative to *that photograph*. Four holds shot
  under different light need four gains, measured from the files, or one
  `brightness()` reads correctly for one of them and wrongly for three.
- In jsdom `getBoundingClientRect()` returns zeros. Normalise pointer position
  with `rect.width || window.innerWidth` or every value becomes `NaN`.
- `oxlint --ignore-path .gitignore` lints anything committed under `public/`.
  Vendored third-party code belongs in a gitignored directory written by a build
  step, not in a commit.

## Working style

- One change per commit, with a message saying what changed and why.
- When a failure has a root cause, fix the cause and add a check for it. Do not
  patch the symptom and move on.
- When an approach is abandoned, say so in the commit message rather than
  quietly deleting it.
- If a requested change conflicts with anything in this file, stop and raise it
  before making the change.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. As you learn what your prototype needs --- a convention the
work has to hold to, a sensor that keeps catching you out, a fact about the
stack that is easy to get wrong --- write it down here and wire it into `check`.
Growing this file is the work.

This file and the sensors you wire into `check` carry across the course --- both
come with you into next week's repo. The prototype doesn't: source, and the
tests answering this week's published spec, stay behind. `spec/README.md` draws
the line.

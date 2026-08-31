# Process overview

## What I built

**Beta**, a bouldering wall you climb from memory. Thirty-odd grey holds on a
dark wall. One breathes, and that one is round one. Press it and the wall adds a
hold; repeat the route from the bottom and it adds another, until you top out at
eight or fall. The invariants want a `<nav>` and one `<h1>` on a page forbidden
to explain itself, so the `<h1>` is the route's name, screen-reader only, and
the `<nav>` is the height gauge, hidden until you are on a route.

![The opening screen: one hold breathing on a wall of grey](docs/opening.png)

## The moments that mattered

**1. The bug only playing could find.** Every test passed, so I played the built
page and printed what the wall did. Round one lit two holds. The wall
acknowledged my press in the treatment it used to show a hold, so copying back
both is a fall on move one for doing what you were taught. The fix is a grammar,
not a timing tweak. The wall **lights** holds; the player **grips** them
([`67421f4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/67421f4)).
Then I cut the start press, so there is nothing to acknowledge
([`8d0abc8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/8d0abc8)).

**2. A feature that tested green and still had to go.** I gave the player's
presses a rising pitch. It sounded like a climb, and it was wrong in the ear. A
hold's note is how you tell it from the other twenty-nine, so answering in a
pitch the wall never used breaks the game's only memory aid. Someone played it
and heard that in a minute. I deleted it and put the rule in `CLAUDE.md`, naming
the abandoned version, since nothing in `check` can hear a wrong note
([`2ebaac2`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/2ebaac2)).

**3. Two corrections that landed in the harness.** A spec test asked whether the
page gives the player something to act on, and failed. The built `index.html` is
an empty `<main>` until the script runs. Relaxing the selector would have
deleted the question, so I booted the real bundle in jsdom and asked the live
DOM
([`9cc6d73`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/9cc6d73)).
Same call with colour. `var()` inside a custom property resolves where it is
declared, which silently killed my per-hold brightness, so the fact went into
`CLAUDE.md` rather than into a retry
([`5f1da57`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/5f1da57)).

![Topping out: the whole wall in colour, bottom to top](docs/topped-out.png)

## What the tests leave to the crit

`spec/wall.test.ts` proves the thirty holds fall on their own clocks, failing
the version where the wall reads as a page scrolling
([`121a7a6`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/121a7a6)).
No test says whether the breathing hold teaches the opening move, or whether
falling on hold seven of eight feels fair. Four people at a keyboard settle that
while I stay quiet.

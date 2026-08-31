# Process overview

## What I built

**Beta**, a bouldering wall you climb from memory. Thirty-odd holds scatter a
dark wall, all of them grey. One breathes, and that one is round one. Press it
and the wall adds a hold; repeat the route from the bottom and it adds another,
until you top out at eight or fall. The brief forbids instructions, so all the teaching comes out of
one budget. The wall is dark, the holds are grey, and the only colour on the
opening screen is the single hold that moves.

![The opening screen: one hold breathing on a wall of grey](docs/opening.png)

The invariants require a `<nav>` landmark and exactly one `<h1>`, which runs
straight into a brief that forbids the page explaining itself. A decorative
heading would have satisfied the check and taught nothing, so I made both carry
weight. The `<h1>` is the route's name, screen-reader only. The `<nav>` holds
the height gauge, which is about position on the route, and it stays hidden
until there is a route to be positioned on. `index.html` carries a comment
saying so, where the next change would land.

## The moments that mattered

**1. A test that was right about the wrong thing.** My own spec test asked
whether the page "gives the player a surface to act on", and it failed. The
entry chunk builds every hold at load, so the shipped `index.html` is an empty
`<main>`. I could have relaxed the selector until the implementation passed,
which would have deleted the question. Instead I moved the test somewhere it
could answer honestly, booting the real built bundle in jsdom and asking the
live DOM. That catches the one failure nothing else in the suite can see: the
page loads and nothing happens. It is also the first thing a stranger at a crit
would meet.
[`9cc6d73`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/9cc6d73)

**2. The bug that only playing could find.** Every test passed, so I drove a
real route through the built page and printed what the wall did. Round one lit
*two* holds. First it acknowledged my own press on the start hold, then a
second later it showed the actual route hold, both with the same treatment.
Copy back what you were shown and you fall on move one having done nothing
wrong. For a game that has to teach itself, that is the worst first lesson
available. The rule tests were all correct. The wall was showing the player the
wrong move. The fix is a grammar rather than a tweak. The wall **lights** holds,
lifted and haloed; the player **grips** them, pushed in with no halo.
[`67421f4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/67421f4)

**3. A correction that landed in `CLAUDE.md`, not the code.** The holds are four
photographs shot under different light. Green averages a third of yellow's
luminance, so one `brightness()` cannot be right for all four, and half the wall
vanished into the background. Measuring the files and setting a gain per hold
fixed it. My first attempt did nothing, and said nothing about it. `var()`
inside a custom property resolves where that property is *declared*, so
`--dormant` on `:root` resolved `--gain` against `:root` and every hold
inherited the fallback. No warning, no invalid declaration, just a wrong
picture. Both facts went into `CLAUDE.md` instead of into a retry, under a note
that nothing in `check` catches either and the rendered page is the only
witness.
[`5f1da57`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-ohlai/commit/5f1da57)

![Topping out: the whole wall in colour, bottom to top](docs/topped-out.png)

## What the tests leave to the crit

`spec/game.test.ts` greps for the tutorial I might have written at 2am, a how-to
modal, hint text, "click to start". Passing it proves only that I did not give
up and explain. Four people at the keyboard settle the rest while I stay quiet:
whether the breathing hold teaches the opening move, whether falling on hold
seven of eight feels fair, whether five minutes still holds attention.
`spec/rules.test.ts` covers the one rule I can pin down. On a wall of thirty,
exactly one press survives, so losing is a real risk rather than a formality.

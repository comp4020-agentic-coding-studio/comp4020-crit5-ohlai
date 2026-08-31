# Crit 5, a game

## What was the breakthrough that moved the work forward?

Playing it instead of testing it. Every test was green, the rules, the
invariants, the no-instructions grep, and the game was still broken in the one
place it could not afford to be. On round one it lit two holds, because the
acknowledgement of the player's press used the same treatment as the wall
showing a route. A newcomer would copy back both and fall on their first move,
having done exactly what the page taught them.

Nothing in the suite could see that. The rules tests were correct about the
rules. The fault was that the wall spoke to the player in one voice for two
different things. Naming it that way turned the fix from a timing tweak into a
grammar. The wall **lights** holds, the player **grips** them, and the two never
look alike. I found it by driving a real route through the built page and
printing what happened, a far cruder tool than the tests and the only one that
could have caught it.

## What did this work change about who I want to be as a software developer?

It made me stricter about where a correction lands. Twice this week I hit
something no check could catch. A CSS substitution rule silently ignored my
per-hold colour correction, and `brightness()` on a photograph turned out to be
relative to that photograph. The cheap response was to fix the line and move on.
Instead I wrote the fact into `CLAUDE.md`, next to a note saying nothing in
`check` can catch it and the rendered page is the only witness. That is the
habit I want to keep. The harness is the part of this week that survives it.

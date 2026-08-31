# Crit 5, a game

## What was the breakthrough that moved the work forward?

Playing it instead of testing it. Every test was green, the rules, the
invariants, the no-instructions grep, and the game was broken where it could
least afford to be. On round one it lit two holds, because the acknowledgement
of the player's press wore the same treatment as the wall showing a route. A
newcomer copies back both and falls on move one, having done what the page
taught.

Nothing in the suite could see it. The wall was using one voice for two
different things. Naming it that way turned the fix from a timing tweak into a
grammar. The wall **lights** holds, the player
**grips** them, and the two never look alike.

Then the same lesson arrived through my ears. I gave the player's presses a
rising pitch, so a clean round sounded like a climb. It tested green and it was
wrong. A hold's note is how you recognise the hold, so answering in a pitch the
wall never used breaks the only memory aid the game has. Someone played it and
heard that in a minute. I deleted the feature.

## What did this work change about who I want to be as a software developer?

It made me stricter about where a correction lands. Three times this week I hit
something no check could catch. A CSS substitution rule silently ignored my
per-hold colour correction, `brightness()` on a photograph turned out to be
relative to that photograph, and one pitch per hold is a rule only ears enforce.
The cheap response was to fix the line and move on. Instead each fact went into
`CLAUDE.md`, next to a note saying nothing in `check` catches it and the page
itself is the only witness. That is the habit I want to keep. The harness is the
part of this week that survives it.

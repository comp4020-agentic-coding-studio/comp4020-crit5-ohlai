# Crit 5 --- A game

## What was the breakthrough that moved the work forward?

Playing it instead of testing it. Every test was green --- the rules, the
invariants, the no-instructions grep --- and the game was still broken in the
one place it could not afford to be: on round one it lit two holds, because the
acknowledgement of the player's press used the same treatment as the wall
showing a route. A newcomer would copy back both and fall on their first move,
having done exactly what the page taught them.

Nothing in the suite could see that. The rules tests were correct about the
rules; the fault was that the wall spoke to the player in one voice for two
different things. Naming it that way turned the fix from a timing tweak into a
grammar: the wall **lights** holds, the player **grips** them, and the two never
look alike. I found it by driving a real route through the built page and
printing what happened --- a far cruder tool than the tests, and the only one
that could have caught it.

## What did this work change about who I want to be as a software developer?

It made me stricter about where a correction lands. Twice this week I hit
something that no check could catch --- a CSS substitution rule that silently
ignored my per-hold colour correction, and the fact that `brightness()` on a
photograph is relative to that photograph. The cheap response was to fix the
line and move on. What I want to be in the habit of doing is what I did instead:
write the fact into `CLAUDE.md`, next to a note saying nothing in `check` can
catch it and the rendered page is the only witness. The harness is the part of
this week that survives it.

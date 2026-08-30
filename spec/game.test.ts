import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// C5 "A game" — https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/05-game/
//
// Contract tests. These answer this week's published spec and retire with it;
// they do not come forward into next week's repo. The spec lines they assert,
// in the site's own words:
//
//   - it teaches itself: no instructions on screen or off, and the first screen
//     prompts the opening move
//   - a wrong move is possible, and play concludes in a win, a loss or a finish
//   - a newcomer reaches an ending inside five minutes
//   - one game rule is covered by a focused automated test
//
// The lines no test can hold — whether the opening screen actually teaches the
// move, whether five minutes still holds attention, whether losing feels fair —
// are settled by four people at the keyboard while you stay silent. They are
// not absent from the spec; they are absent from this file on purpose.

const DIST = resolve("dist");

function files(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const shipped = files().map((path) => relative(DIST, path).split(sep).join("/"));

const pages = shipped
  .filter((name) => name.endsWith(".html"))
  .map((name) => ({
    name,
    html: readFileSync(join(DIST, name), "utf8"),
  }));

/** Every word the player can actually read, with markup and code stripped out. */
function visibleText(html: string): string {
  const doc = new JSDOM(html).window.document;
  for (const el of doc.querySelectorAll("script, style, template")) {
    el.remove();
  }
  return (doc.body?.textContent ?? "").replace(/\s+/g, " ").trim();
}

describe("it teaches itself", () => {
  // The brief's hardest line, and the one it says you "can't put under test and
  // can't fake". True — a grep cannot tell whether the first screen teaches the
  // opening move. What it can tell you is whether you gave up and explained,
  // which is the specific failure the brief names: a how-to modal, an
  // instructions page, a line of hint text, a README standing in for one.
  //
  // So this is a floor, not a ceiling. Passing it means you did not write the
  // tutorial. Whether the game teaches itself is still decided at the crit.
  const EXPLAINING = [
    /\bhow to play\b/i,
    /\binstructions?\b/i,
    /\btutorial\b/i,
    /\bcontrols?:/i,
    /\bobjective\b/i,
    /\bthe goal\b/i,
    /\byour (?:goal|aim|job|task)\b/i,
    /\buse the (?:arrow|mouse|keyboard)/i,
    /\b(?:press|click|tap|hit) (?:the )?(?:space|enter|arrow|wasd|[a-z] key)/i,
    /\bwasd\b/i,
    /\bclick (?:here )?to (?:start|play|begin)\b/i,
    /\bdrag (?:the|to)\b/i,
    /\bavoid the\b/i,
    /\bcollect the\b/i,
  ];

  for (const { name, html } of pages) {
    describe(name, () => {
      const text = visibleText(html);

      for (const pattern of EXPLAINING) {
        it(`does not explain itself with ${pattern.source}`, () => {
          expect(
            text,
            `"${text.match(pattern)?.[0] ?? ""}" is the tutorial the brief rules out — ` +
              `the affordance has to carry it instead`,
          ).not.toMatch(pattern);
        });
      }

      it("does not hide a tutorial in a title or aria-label", () => {
        // Off screen still counts as "off screen". A screen-reader user gets
        // the instructions a sighted player is denied, which is not the
        // accessible version of this brief — it is a different game.
        const doc = new JSDOM(html).window.document;
        const hidden = [...doc.querySelectorAll("[title], [aria-label]")]
          .map(
            (el) =>
              `${el.getAttribute("title") ?? ""} ${el.getAttribute("aria-label") ?? ""}`,
          )
          .join(" ");
        for (const pattern of EXPLAINING) {
          expect(hidden).not.toMatch(pattern);
        }
      });

      it("keeps its visible copy short enough to be affordance, not prose", () => {
        // A game that teaches by affordance has very little to say. This is a
        // blunt instrument and the number is arguable — raise it if the game
        // has a real reason for words, and say so in PROCESS.md. What it
        // catches is the paragraph that creeps in at 2am.
        expect(
          text.split(/\s+/).filter(Boolean).length,
          `the page reads: "${text.slice(0, 200)}"`,
        ).toBeLessThan(40);
      });
    });
  }
});

describe("it is a game, not a document", () => {
  it("ships a script", () => {
    // Rules, stakes and an ending need something running. A page that ships no
    // JavaScript at all has not got as far as a wrong move being possible.
    expect(shipped.some((name) => name.endsWith(".js"))).toBe(true);
  });

  // Whether the player has a surface to act on is a question about the page
  // AFTER the entry chunk runs, since every hold is made at load. spec/boot.test.ts
  // asks it there, against the built bundle.
});

// "a wrong move is possible, and play concludes" is the other half of this
// spec, and it lives in spec/rules.test.ts. It is not here because it is not a
// question about the built page: the rule is a pure function in src/rules.ts,
// and testing it through thirty rendered buttons would test the wiring instead
// of the rule.

// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

// Does the built game actually start?
//
// The shipped index.html is an empty wall --- every hold is made by the entry
// chunk at load. So the interesting failure is not "the page 404s", which the
// invariants would catch, but "the page loads and nothing happens", which
// nothing else in the suite can see. A stranger at the crit meets a blank dark
// rectangle and no amount of green elsewhere would have warned me.
//
// This runs the real built chunk rather than the source, so it also fails if a
// build or minifier step breaks something that worked in dev. C4 lost an
// evening to exactly that: source that was correct, output that was silent.

const DIST = resolve("dist");
const html = readFileSync(join(DIST, "index.html"), "utf8");

function bodyOf(page: string): string {
  return page.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
}

function entryChunk(page: string): string {
  const src = page.match(/<script[^>]+src="([^"]+)"[^>]*>/i)?.[1];
  if (!src) throw new Error("index.html names no script: the game cannot start");
  return join(DIST, src.replace(/^\.?\//, ""));
}

beforeAll(async () => {
  document.body.innerHTML = bodyOf(html);
  await import(pathToFileURL(entryChunk(html)).href);
});

describe("the built game boots", () => {
  it("puts holds on the wall", () => {
    const holds = document.querySelectorAll(".hold");
    expect(
      holds.length,
      "the entry chunk ran and left the wall empty",
    ).toBeGreaterThan(8);
  });

  it("gives the player a surface to act on", () => {
    // The spec's opening move has to land on something a player can hit. Every
    // hold is a real button, so a pointer, a thumb and a keyboard all reach it.
    const holds = [...document.querySelectorAll(".hold")];
    expect(holds.every((hold) => hold.tagName === "BUTTON")).toBe(true);
  });

  it("shows every hold an image that the build emitted", () => {
    const sources = [...document.querySelectorAll<HTMLImageElement>(".hold img")]
      .map((img) => img.getAttribute("src") ?? "")
      .filter(Boolean);
    expect(sources.length).toBeGreaterThan(8);
    for (const src of new Set(sources)) {
      const path = join(DIST, src.replace(/^\.?\//, ""));
      expect(() => readFileSync(path), `${src} is not in dist/`).not.toThrow();
    }
  });

  it("opens on a wall the player is invited into, not one already playing", () => {
    // The opening screen is the whole tutorial, so it has a shape worth
    // pinning: nothing lit, and exactly one hold marked as the way in.
    expect(document.body.dataset.phase).toBe("ready");
    expect(document.querySelectorAll(".hold.lit")).toHaveLength(0);
    expect(document.querySelectorAll(".hold.start")).toHaveLength(1);
  });

  it("starts the route on the first press, and not before", () => {
    const start = document.querySelector<HTMLButtonElement>(".hold.start");
    expect(start).toBeTruthy();
    start?.click();
    expect(
      document.body.dataset.phase,
      "pressing the one hold that moves has to do something, or the invitation was a lie",
    ).not.toBe("ready");
  });
});

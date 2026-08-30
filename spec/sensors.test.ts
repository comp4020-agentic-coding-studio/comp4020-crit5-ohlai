import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Sensors, not contract tests. Nothing here answers C5's brief; each one
// asserts a standard held to the agent whatever the brief is, so these come
// forward into next week's repo the way a rule in CLAUDE.md does. spec/README.md
// draws the line.
//
// The one that matters most is the third-party origin check. It was a hard
// constraint in C4 as prose only, enforced by a test that named MediaPipe's
// filenames and so stayed behind with the instrument. The constraint outlived
// the instrument; this is it made checkable in a shape that does not care what
// the prototype is.

const DIST = resolve("dist");

function files(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const shipped = files().map((path) => relative(DIST, path).split(sep).join("/"));

const sources = shipped
  .filter((name) => /\.(html|js|css)$/.test(name))
  .map((name) => ({ name, text: readFileSync(join(DIST, name), "utf8") }));

describe("nothing loads from a third-party origin at runtime", () => {
  // The failure this exists to catch is deploy-only: everything green locally,
  // and the site reaching out to a CDN the moment a stranger opens it at the
  // crit. Nothing else in the suite would notice, because a fetch that works on
  // your machine works in CI too.
  const OWN_ORIGINS = [
    /^https:\/\/comp\.anu\.edu\.au\//,
    /^https:\/\/ohlai\.github\.io\//,
    /^https:\/\/github\.com\/comp4020-agentic-coding-studio\//,
    /^https:\/\/www\.w3\.org\//, // SVG and XHTML namespaces, never fetched
  ];

  for (const { name, text } of sources) {
    it(`${name} names no foreign host`, () => {
      const urls = text.match(/https?:\/\/[^\s"'`)>\\]+/g) ?? [];
      const foreign = urls.filter(
        (url) => !OWN_ORIGINS.some((allowed) => allowed.test(url)),
      );
      expect(
        foreign,
        "vendor it into this repo and load it same-origin, or drop it",
      ).toEqual([]);
    });
  }
});

describe("the build ships what the page asks for", () => {
  // A 404 on Pages for an asset the HTML names is invisible until someone
  // opens the deployed site. Cheap to check here, expensive to find at a crit.
  const home = sources.find(({ name }) => name === "index.html");

  it("built a home page", () => {
    expect(home).toBeTruthy();
  });

  it("every local asset the home page names was emitted", () => {
    const refs = [...(home?.text.matchAll(/(?:src|href)="([^"]+)"/g) ?? [])]
      .map((match) => match[1])
      .filter((ref) => !/^(?:https?:|data:|mailto:|#)/.test(ref))
      .map((ref) => ref.replace(/^\.?\//, "").replace(/[?#].*$/, ""))
      .filter(Boolean);

    for (const ref of refs) {
      const found = shipped.some((name) => name === ref || name.endsWith(`/${ref}`));
      expect(found, `index.html names ${ref}, which the build did not emit`).toBe(
        true,
      );
    }
  });
});

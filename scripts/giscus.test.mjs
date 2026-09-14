import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { getCommentMapping, getCommentTheme } from "../src/utils/giscus-utils.ts";

const redirects = JSON.parse(readFileSync(new URL("../src/data/legacy-redirects.json", import.meta.url)));
const discussions = JSON.parse(readFileSync(new URL("../src/data/giscus-discussions.json", import.meta.url)));

test("existing discussions retain their verified GitHub numbers", () => {
  for (const [slug, number] of Object.entries(discussions)) {
    assert.ok(existsSync(new URL(`../src/content/posts/${slug}.md`, import.meta.url)));
    assert.deepEqual(getCommentMapping(slug, redirects, discussions), { mapping: "number", term: String(number) });
  }
  assert.deepEqual(getCommentMapping("cc-codex", redirects, discussions), { mapping: "number", term: "1" });
});

test("migrated articles preserve the VuePress pathname mapping", () => {
  assert.deepEqual(getCommentMapping("1-docker", redirects, discussions), {
    mapping: "specific", term: "nas/basic/1-docker",
  });
  assert.deepEqual(getCommentMapping("nas-guide", redirects, {}), {
    mapping: "specific", term: "nas/",
  });
});

test("new articles use a stable explicit pathname, including the trailing slash", () => {
  assert.deepEqual(getCommentMapping("architecture-demo", redirects, discussions), {
    mapping: "specific", term: "posts/architecture-demo/",
  });
});

test("frontmatter can select a discussion or a custom term", () => {
  assert.deepEqual(getCommentMapping("cc-codex", redirects, discussions, 10), { mapping: "number", term: "10" });
  assert.deepEqual(getCommentMapping("new", redirects, discussions, undefined, "stable-key"), {
    mapping: "specific", term: "stable-key",
  });
});

test("custom themes select the same mode as the blog and contain no external imports", () => {
  for (const dark of [false, true]) {
    const mode = dark ? "dark" : "light";
    assert.equal(getCommentTheme("https://example.com/giscus", dark), `https://example.com/giscus/${mode}.css`);
    const css = readFileSync(new URL(`../public/giscus/${mode}.css`, import.meta.url), "utf8");
    assert.match(css, new RegExp(`color-scheme: ${mode}`));
    assert.match(css, /html,\s*body\s*\{\s*background: transparent;/);
    assert.match(css, /--color-accent-fg: var\(--blog-primary\)/);
    assert.doesNotMatch(css, /@import|url\(/);
  }
});

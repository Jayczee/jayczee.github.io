import assert from "node:assert/strict";
import test from "node:test";
import { checkMarkdown } from "./check-content.mjs";

test("accepts Fuwari admonitions with nested code and lists", () => {
  const source = '1. Example\n\n   :::tip[Note]\n   ```yaml title="compose.yaml"\n   services: {}\n   ```\n   :::\n';
  assert.deepEqual(checkMarkdown(source), []);
});

test("ignores VuePress examples inside Markdown code fences", () => {
  assert.deepEqual(checkMarkdown("````markdown\n::: tabs\n@tab Demo\n```js\n1\n```\n:::\n````\n"), []);
});

test("reports legacy containers and titles at the original file line", () => {
  const issues = checkMarkdown("---\ntitle: Example\n---\n\n::: tip Note\nContent\n:::\n");
  assert.equal(issues.length, 1);
  assert.equal(issues[0].line, 5);
  assert.match(issues[0].message, /Use :::tip/);
  assert.match(checkMarkdown(":::tabs\nContent\n:::\n")[0].message, /Unsupported container/);
});

test("reports unterminated code and admonitions, including a stray final fence", () => {
  assert.match(checkMarkdown("```java\nint n = 1;\n")[0].message, /Unclosed code fence/);
  assert.match(checkMarkdown("```\n")[0].message, /Unclosed code fence/);
  assert.match(checkMarkdown(":::tip[Note]\nContent\n")[0].message, /Unclosed admonition/);
  assert.match(checkMarkdown(":::tip\nContent\n::::\n")[0].message, /does not match/);
});

test("supports longer nested directives and blockquote code fences", () => {
  assert.deepEqual(checkMarkdown("::::note[Outer]\n:::tip[Inner]\nContent\n:::\n::::\n"), []);
  assert.deepEqual(checkMarkdown("> ```text\n> example\n> ```\n"), []);
});

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: true });
const admonitions = new Set(["note", "tip", "important", "warning", "caution"]);

export function checkMarkdown(source) {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0] || "";
  const offset = frontmatter.split("\n").length - 1;
  const body = source.slice(frontmatter.length);
  const lines = body.split(/\r?\n/);
  const ignored = new Set();
  const issues = [];
  const report = (line, message) => issues.push({ line: line + offset + 1, message });

  // Markdown examples inside fenced code are literal text, not legacy syntax.
  for (const token of markdown.parse(body, {})) {
    if (!["fence", "code_block"].includes(token.type)) continue;
    const [start, end] = token.map;
    for (let i = start; i < end; i++) ignored.add(i);
    if (token.type !== "fence") continue;
    const closing = new RegExp(`^(?:\\s*> ?)*\\s*${token.markup[0]}{${token.markup.length},}\\s*$`);
    if (end <= start + 1 || !closing.test(lines[end - 1])) {
      report(start, "Unclosed code fence.");
    }
  }

  const containers = [];
  lines.forEach((line, index) => {
    if (ignored.has(index)) return;
    const opening = line.match(/^\s*(:{3,})\s*([\w-]+)(.*)$/);
    const closing = line.match(/^\s*(:{3,})\s*$/);
    if (opening) {
      const [, fence, name, suffix] = opening;
      containers.push({ line: index, length: fence.length });
      if (!admonitions.has(name)) {
        report(index, `Unsupported container "${name}". Use a supported admonition or standard Markdown/HTML.`);
      } else if (!new RegExp(`^\\s*${fence}${name}(?:\\[[^\\]]*\\])?\\s*$`).test(line)) {
        report(index, `Use ${fence}${name}[Title], without a space before the type or a trailing plain-text title.`);
      }
    } else if (closing) {
      if (!containers.length || closing[1].length !== containers.at(-1).length) {
        report(index, "Admonition closing fence does not match its opening fence.");
      } else {
        containers.pop();
      }
    } else if (/^\s*(?:\[\[toc\]\]|\[toc\]|@tab\b|@include\b|@\[(?:code|include)\])/i.test(line)) {
      report(index, "VuePress-only directive. Use the Fuwari table of contents, headings, or fenced code.");
    }
  });
  for (const container of containers) report(container.line, "Unclosed admonition.");
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = "src/content";
  const files = fs.readdirSync(root, { recursive: true }).filter(file => file.endsWith(".md"));
  let count = 0;
  for (const file of files) {
    const filename = path.join(root, file);
    for (const issue of checkMarkdown(fs.readFileSync(filename, "utf8"))) {
      console.error(`${filename}:${issue.line}: ${issue.message}`);
      count++;
    }
  }
  if (count) process.exitCode = 1;
  else console.log(`Markdown compatibility check passed (${files.length} files).`);
}

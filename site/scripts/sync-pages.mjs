// Copies the repository's own docs (pages.json) into the Starlight content
// folder, so ARCHITECTURE.md and docs/*.md stay the only source, the way the
// engine docs site does it. Run before every build (`npm run build` and
// `npm run dev` do). Each page becomes src/content/docs/docs/<slug>.md with
// front matter and its own top heading dropped (Starlight prints the title).
// A link to another of these pages stays on the site, written relative so a
// pull request's preview folder keeps working; any other repository link
// points at GitHub. A mermaid block becomes a <pre class="mermaid"> the page
// draws in the browser (src/components/Mermaid.ts).
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(site, "..");
const GITHUB = "https://github.com/Verticopolis/components";
const SECTION = "docs";
const { pages } = JSON.parse(readFileSync(join(site, "pages.json"), "utf8"));

/** Repository path to its page's slug. */
const pageFor = new Map(pages.map((page) => [page.source, page.slug]));

function githubLink(repoPath, anchor) {
  let kind = "blob";
  try {
    if (statSync(join(repo, repoPath)).isDirectory()) kind = "tree";
  } catch {
    // A path that does not exist still gets a link; the review catches it.
  }
  return `${GITHUB}/${kind}/main/${repoPath.replace(/\/$/, "")}${anchor}`;
}

/** Rewrites one link target found in `source` (a repository path), for the page at `fromSlug`. */
export function rewriteTarget(target, source, fromSlug) {
  const hash = target.indexOf("#");
  const path = hash === -1 ? target : target.slice(0, hash);
  const anchor = hash === -1 ? "" : target.slice(hash);
  if (path === "") return target;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("/")) return target;
  const repoPath = posix.normalize(posix.join(posix.dirname(source), path));
  const slug = pageFor.get(repoPath);
  if (slug === undefined) return githubLink(repoPath, anchor);
  return slug === fromSlug ? anchor || "./" : `../${slug}/${anchor}`;
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** The page body: links rewritten and mermaid blocks marked outside code fences, top heading dropped. */
export function convert(markdown, source, slug) {
  const out = [];
  let fence = null; // the fence that opened the current code block
  let mermaid = null; // the lines of the mermaid block being read
  for (const line of markdown.split("\n")) {
    const marker = line.match(/^\s*(```+|~~~+)\s*(\S*)/);
    if (mermaid) {
      if (marker && marker[1] === fence) {
        out.push(`<pre class="mermaid">${escapeHtml(mermaid.join("\n"))}</pre>`);
        mermaid = null;
        fence = null;
      } else mermaid.push(line);
      continue;
    }
    if (fence) {
      if (marker && marker[1] === fence) fence = null;
      out.push(line);
      continue;
    }
    if (marker) {
      fence = marker[1];
      if (marker[2] === "mermaid") mermaid = [];
      else out.push(line);
      continue;
    }
    out.push(
      line
        .replace(/\]\(([^)\s]+)\)/g, (_, target) => `](${rewriteTarget(target, source, slug)})`)
        .replace(/^(\s*\[[^\]]+\]:\s*)(\S+)/, (_, label, target) => label + rewriteTarget(target, source, slug)),
    );
  }
  const top = out.findIndex((line) => line.trim() !== "");
  if (top !== -1 && out[top].startsWith("# ")) out.splice(0, top + 1);
  return out.join("\n").replace(/^\n+/, "");
}

function frontMatter(page) {
  const quote = (text) => JSON.stringify(text);
  // The gallery pages turn the contents list off; a long doc wants it back.
  return `---\ntitle: ${quote(page.title)}\ndescription: ${quote(page.description)}\ntableOfContents: true\n---\n\n`;
}

function main() {
  const docs = join(site, "src/content/docs", SECTION);
  rmSync(docs, { recursive: true, force: true });
  mkdirSync(docs, { recursive: true });
  for (const page of pages) {
    const markdown = readFileSync(join(repo, page.source), "utf8");
    writeFileSync(join(docs, `${page.slug}.md`), frontMatter(page) + convert(markdown, page.source, page.slug));
  }
  console.log(`synced ${pages.length} pages`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

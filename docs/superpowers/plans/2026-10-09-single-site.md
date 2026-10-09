# houlahop.com single site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve every public page and install file for siteio, agentio, pagerio and the Copycat utility from one site, `houlahop.com`, built from the `houlahop` repo, and retire the `siteio.houlahop.com` and `agentio.houlahop.com` sites.

**Architecture:** The `houlahop` repo gets a small Bun build: one layout, five page bodies and a folder of static files (CSS, icons, install scripts, `skill.md`). The build writes `site/dist`, checks it (no old domains, no broken internal links) and CI deploys it as the siteio site `www`. Tool repos keep only their code; their binaries and docs point to the new URLs. Cloudflare sends the old subdomains to the new paths with a 301.

**Tech Stack:** Bun 1.3+ (build script and `bun test`), plain HTML and CSS, GitHub Actions, siteio (`siteio sites deploy`), Cloudflare redirect rules.

**Spec:** `docs/design/swatch-v4.html` (approved mockup: homepage, agentio page, Utilities list, Copycat page) and `docs/design/icons/` (siteio, agentio, pagerio and Copycat icons). The decisions below come from the design review on 2026-10-09.

## Global Constraints

- New URLs: `https://houlahop.com/`, `/siteio/`, `/agentio/`, `/pagerio/`, `/copycat/`.
- Install files: `/siteio/install`, `/siteio/install.ps1`, `/siteio/skill.md`, `/agentio/install`, `/agentio/install.ps1`, `/agentio/skill.md`.
- `siteio.houlahop.com` and `agentio.houlahop.com` are removed. Cloudflare redirects them with 301 to `https://houlahop.com/siteio…` and `https://houlahop.com/agentio…`, keeping the path and query.
- No agentio reference pages (services, commands, changelog) on the website.
- pagerio's app stays at `https://pagerio.chuut.com`. Only its marketing page moves.
- falcio is removed everywhere. mdio is not part of this site (its own `mdio.houlahop.com` stays as it is).
- The AgentIO Companion Mac app is a section of the agentio page, not a separate tool.
- The main install path is a prompt to paste into an agent. Terminal commands sit behind "Install by hand".
- Two tiers. **Tools** (siteio, agentio, pagerio): large icon, tool tint, install prompt. **Utilities** (Copycat, and later others): apps that aren't for agents, shown as grey rows under the tools, a "Utilities" link in the header (`/#utilities`), and a lighter page with a Download button and no agent prompt.
- Copycat downloads from `https://github.com/plosson/copycat/releases/latest`. The Mac app downloads from `https://github.com/plosson/agentio-app/releases/latest`.
- Copy is in the first person: the site shows the tools the author uses ("my agents", "I sign in"). No pitch to visitors. Install prompts say "Paste into an agent".
- Design: Swatch v4 from the spec. Light only, no dark mode. Font Inter (Google Fonts) and JetBrains Mono for code. Buttons are pills; primary buttons are ink `#1d1d1f`, not blue.
- Tints: siteio `#e4f6ec` / `#0b8a4f`, agentio `#e8eeff` / `#2f5bd8`, pagerio `#fff0e5` / `#e2560c`, Copycat `#ffebf3` / `#c42d6c` (on its own page only).
- Copy follows ISO 24495-1 (plain language): short sentences, no marketing words.
- Use Bun, not Node or npm.
- siteio's working branch `feat/tenant-apps` has uncommitted work. All siteio changes go on a new branch from `main` in a separate worktree. Never touch `feat/tenant-apps`.
- houlahop has uncommitted edits in `BRIEF.md`, `README.md`, `site/index.html` (falcio renames, mdio card). Ask the user before committing or discarding them (Task 1, step 1).

## Review Focus

1. **A wrong install path returns HTML, not a 404.** The site server answers unknown paths with `200 text/html` (checked on 2026-10-09). `curl -LsSf …/instal | sh` would pipe HTML into `sh`. Expected: every documented install URL returns `text/plain`. Covered by the smoke test in Task 5 and the link check in Task 1.
2. **Old domain left in a shipped file.** One stale `siteio.houlahop.com` inside `skill.md` or an install script sends agents to a dead name. Expected: the build fails. Covered by `checkOutput` in Task 1.
3. **`/siteio` without the trailing slash.** People type it. Expected: a 301 to `/siteio/` and then the page. Covered by the smoke test in Task 5.
4. **Old URL after the switch.** `curl -LsSf https://siteio.houlahop.com/install | sh` in an old README. Expected: a 301 to `https://houlahop.com/siteio/install`, and the script runs. Covered by Task 10 checks.
5. **Copy button without clipboard access** (for example a non-secure preview or a denied permission). Expected: the prompt text stays visible and selectable, and the button says "Select and copy" instead of failing silently. Covered by Task 2, step 4.

---

## File structure (houlahop repo)

```
houlahop/
  package.json                    build and test scripts
  scripts/build.ts                render pages, copy static files, check output
  tests/build.test.ts             adversarial tests for build.ts
  scripts/smoke.sh                checks the deployed site with curl
  site/src/_layout.html           shared <head>, header, footer
  site/src/pages/index.html       homepage body
  site/src/pages/siteio/index.html
  site/src/pages/agentio/index.html
  site/src/pages/pagerio/index.html
  site/src/pages/copycat/index.html
  site/src/static/assets/site.css     Swatch CSS
  site/src/static/assets/copy.js      Copy buttons
  site/src/static/assets/icons/{siteio.svg,agentio.png,pagerio.png,copycat.svg}
  site/src/static/favicon.svg
  site/src/static/siteio/{install,install.ps1,skill.md}
  site/src/static/agentio/{install,install.ps1,skill.md}
  site/dist/                      build output (git-ignored)
```

Removed from houlahop: `site/index.html`, `site/brand/`, `site/assets/logos/`, `site/favicon.svg` (moved to `site/src/static/`).

---

### Task 1: Build script with output checks

**Files:**
- Create: `package.json`, `scripts/build.ts`, `tests/build.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces:
  - `parsePage(source: string, file: string): { meta: PageMeta; body: string }`
  - `renderNav(active: string): string`
  - `renderPage(layout: string, meta: PageMeta, body: string): string`
  - `checkOutput(dist: string): Promise<string[]>` (returns a list of problems; empty means OK)
  - `build(srcDir: string, distDir: string): Promise<void>` (throws if `checkOutput` finds problems)
  - `type PageMeta = { title: string; description: string; active: "home" | "siteio" | "agentio" | "pagerio" | "utilities" }`
  - The header lists the three tools, then a divider and a "Utilities" link to `/#utilities`. Utility pages use `active: utilities`.
  - Page files start with a metadata comment:
    ```html
    <!--
    title: siteio · houlahop
    description: My agents put websites and apps online, on my own server.
    active: siteio
    -->
    ```
  - The layout uses `{{title}}`, `{{description}}`, `{{nav}}`, `{{content}}`.

- [ ] **Step 1: Check the uncommitted houlahop changes with the user**

Run: `git -C ~/devel/projects/personal/houlahop status --short && git -C ~/devel/projects/personal/houlahop diff`
Show the output to the user and ask: commit, keep aside (`git stash`), or discard. Do what they say. Don't continue with a dirty tree.

- [ ] **Step 2: Create a branch**

```bash
cd ~/devel/projects/personal/houlahop
git checkout -b feat/single-site
```

- [ ] **Step 3: Add `package.json` and ignore the build output**

`package.json`:
```json
{
  "name": "houlahop-site",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "bun scripts/build.ts",
    "test": "bun test",
    "smoke": "sh scripts/smoke.sh"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

Append to `.gitignore`:
```
node_modules
site/dist
```

Run: `bun install`

- [ ] **Step 4: Write the failing tests**

`tests/build.test.ts`:
```ts
import { describe, expect, test, beforeEach, afterEach } from "bun:test"
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parsePage, renderNav, renderPage, checkOutput, build } from "../scripts/build"

const META = "<!--\ntitle: T\ndescription: D\nactive: siteio\n-->\n"

describe("parsePage", () => {
  test("rejects a page without the metadata comment and names the file", () => {
    expect(() => parsePage("<h1>Hi</h1>", "pages/x.html")).toThrow("pages/x.html")
  })
  test("rejects a missing field", () => {
    expect(() => parsePage("<!--\ntitle: T\nactive: home\n-->\n<p></p>", "a.html")).toThrow('missing "description"')
  })
  test("rejects an empty field", () => {
    expect(() => parsePage("<!--\ntitle: \ndescription: D\nactive: home\n-->\n", "a.html")).toThrow('missing "title"')
  })
  test("rejects an unknown active tool, such as the removed falcio", () => {
    expect(() => parsePage("<!--\ntitle: T\ndescription: D\nactive: falcio\n-->\n", "a.html")).toThrow("falcio")
  })
  test("rejects a metadata line without a colon", () => {
    expect(() => parsePage("<!--\ntitle T\ndescription: D\nactive: home\n-->\n", "a.html")).toThrow("title T")
  })
  test("keeps colons inside a value", () => {
    const { meta } = parsePage("<!--\ntitle: a: b\ndescription: D\nactive: home\n-->\nx", "a.html")
    expect(meta.title).toBe("a: b")
  })
  test("returns the body without the comment", () => {
    expect(parsePage(META + "<p>body</p>", "a.html").body).toBe("<p>body</p>")
  })
})

describe("renderNav", () => {
  test("marks only the active tool", () => {
    const html = renderNav("agentio")
    expect(html.match(/aria-current="page"/g)?.length).toBe(1)
    expect(html).toContain('href="/agentio/" class="on" aria-current="page"')
  })
  test("marks nothing on the homepage", () => {
    expect(renderNav("home")).not.toContain("aria-current")
  })
  test("marks the Utilities link, and no tool, on a utility page", () => {
    const html = renderNav("utilities")
    expect(html.match(/aria-current="page"/g)?.length).toBe(1)
    expect(html).toContain('class="text on" href="/#utilities" aria-current="page"')
  })
  test("lists exactly siteio, agentio and pagerio, in that order", () => {
    const slugs = [...renderNav("home").matchAll(/href="\/(\w+)\/"/g)].map((m) => m[1])
    expect(slugs).toEqual(["siteio", "agentio", "pagerio"])
  })
})

describe("renderPage", () => {
  const meta = { title: "T", description: "D", active: "home" as const }
  test("fails on an unknown placeholder in the layout", () => {
    expect(() => renderPage("{{title}} {{oops}}", meta, "")).toThrow("{{oops}}")
  })
  test("does not expand placeholders written inside a page body", () => {
    expect(renderPage("<main>{{content}}</main>", meta, "literal {{title}}")).toBe("<main>literal {{title}}</main>")
  })
  test("escapes HTML in title and description", () => {
    const out = renderPage("<title>{{title}}</title>{{description}}", { ...meta, title: "<script>x</script>", description: '"&' }, "")
    expect(out).toBe("<title>&lt;script&gt;x&lt;/script&gt;</title>&quot;&amp;")
  })
})

describe("checkOutput", () => {
  let dist: string
  beforeEach(async () => { dist = await mkdtemp(join(tmpdir(), "hh-dist-")) })
  afterEach(async () => { await rm(dist, { recursive: true, force: true }) })

  test("flags an old subdomain in any text file, whatever the case", async () => {
    await mkdir(join(dist, "siteio"), { recursive: true })
    await writeFile(join(dist, "siteio", "skill.md"), "curl https://SiteIO.houlahop.com/install")
    await writeFile(join(dist, "index.html"), "<a href='https://agentio.houlahop.com'>x</a>")
    const problems = await checkOutput(dist)
    expect(problems.some((p) => p.includes("siteio/skill.md"))).toBe(true)
    expect(problems.some((p) => p.includes("index.html"))).toBe(true)
  })
  test("flags a mention of falcio", async () => {
    await writeFile(join(dist, "index.html"), "<p>falcio</p>")
    expect((await checkOutput(dist)).join()).toContain("falcio")
  })
  test("flags a broken internal link", async () => {
    await writeFile(join(dist, "index.html"), '<a href="/siteio/instal">x</a>')
    expect((await checkOutput(dist)).join()).toContain("/siteio/instal")
  })
  test("accepts links to a folder with or without the trailing slash", async () => {
    await mkdir(join(dist, "siteio"), { recursive: true })
    await writeFile(join(dist, "siteio", "index.html"), "ok")
    await writeFile(join(dist, "index.html"), '<a href="/siteio/">a</a><a href="/siteio">b</a><a href="/siteio/#install">c</a>')
    expect(await checkOutput(dist)).toEqual([])
  })
  test("ignores external links and in-page anchors", async () => {
    await writeFile(join(dist, "index.html"), '<a href="https://github.com/plosson">g</a><a href="#top">t</a>')
    expect(await checkOutput(dist)).toEqual([])
  })
  test("ignores binary files", async () => {
    await writeFile(join(dist, "icon.png"), new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff]))
    expect(await checkOutput(dist)).toEqual([])
  })
})

describe("build", () => {
  let root: string
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "hh-src-"))
    await mkdir(join(root, "src", "pages", "siteio"), { recursive: true })
    await mkdir(join(root, "src", "static", "siteio"), { recursive: true })
    await writeFile(join(root, "src", "_layout.html"), "<title>{{title}}</title><nav>{{nav}}</nav><main>{{content}}</main>")
    await writeFile(join(root, "src", "pages", "index.html"), "<!--\ntitle: Home\ndescription: D\nactive: home\n-->\n<a href=\"/siteio/install\">i</a>")
    await writeFile(join(root, "src", "pages", "siteio", "index.html"), META + "<p>siteio</p>")
    await writeFile(join(root, "src", "static", "siteio", "install"), "#!/bin/sh\necho ok\n")
  })
  afterEach(async () => { await rm(root, { recursive: true, force: true }) })

  test("renders pages and copies static files byte for byte", async () => {
    await build(join(root, "src"), join(root, "dist"))
    expect(await readFile(join(root, "dist", "siteio", "install"), "utf8")).toBe("#!/bin/sh\necho ok\n")
    expect(await readFile(join(root, "dist", "siteio", "index.html"), "utf8")).toContain("<main><p>siteio</p></main>")
  })
  test("removes files left from an earlier build", async () => {
    await mkdir(join(root, "dist"), { recursive: true })
    await writeFile(join(root, "dist", "stale.html"), "old")
    await build(join(root, "src"), join(root, "dist"))
    expect(await Bun.file(join(root, "dist", "stale.html")).exists()).toBe(false)
  })
  test("fails when a static file and a page write the same path", async () => {
    await writeFile(join(root, "src", "static", "siteio", "index.html"), "clash")
    await expect(build(join(root, "src"), join(root, "dist"))).rejects.toThrow("siteio/index.html")
  })
  test("fails when the output has a broken link", async () => {
    await writeFile(join(root, "src", "pages", "index.html"), "<!--\ntitle: H\ndescription: D\nactive: home\n-->\n<a href=\"/nope/\">x</a>")
    await expect(build(join(root, "src"), join(root, "dist"))).rejects.toThrow("/nope/")
  })
})
```

- [ ] **Step 5: Run the tests and check that they fail**

Run: `bun test`
Expected: FAIL, `Cannot find module '../scripts/build'`.

- [ ] **Step 6: Write `scripts/build.ts`**

```ts
import { readdir, readFile, writeFile, mkdir, copyFile, rm, stat } from "node:fs/promises"
import { join, dirname, relative } from "node:path"

export type PageMeta = { title: string; description: string; active: "home" | "siteio" | "agentio" | "pagerio" | "utilities" }

const TOOLS = [
  { slug: "siteio", icon: "/assets/icons/siteio.svg" },
  { slug: "agentio", icon: "/assets/icons/agentio.png" },
  { slug: "pagerio", icon: "/assets/icons/pagerio.png" },
] as const
const ACTIVE = new Set(["home", "utilities", ...TOOLS.map((t) => t.slug)])
const FORBIDDEN = [/siteio\.houlahop\.com/i, /agentio\.houlahop\.com/i, /falcio/i]
const TEXT_EXT = /\.(html|css|js|md|svg|txt|ps1)$|\/install$/

const META_RE = /^<!--\n([\s\S]*?)\n-->\n/

export function parsePage(source: string, file: string): { meta: PageMeta; body: string } {
  const match = source.match(META_RE)
  if (!match) throw new Error(`${file}: missing the metadata comment at the top`)
  const fields: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":")
    if (colon < 1) throw new Error(`${file}: bad metadata line "${line}"`)
    fields[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }
  for (const key of ["title", "description", "active"]) {
    if (!fields[key]) throw new Error(`${file}: missing "${key}"`)
  }
  if (!ACTIVE.has(fields.active)) throw new Error(`${file}: unknown active "${fields.active}"`)
  return { meta: fields as PageMeta, body: source.slice(match[0].length) }
}

export function renderNav(active: string): string {
  const tools = TOOLS.map((t) => {
    const on = t.slug === active ? ' class="on" aria-current="page"' : ""
    return `<a href="/${t.slug}/"${on}><img src="${t.icon}" alt="" width="20" height="20"><span>${t.slug}</span></a>`
  })
  const utilitiesOn = active === "utilities" ? ' aria-current="page"' : ""
  const utilities = `<span class="sep"></span><a class="text${utilitiesOn ? " on" : ""}" href="/#utilities"${utilitiesOn}>Utilities</a>`
  return [...tools, utilities].join("\n")
}

const escapeHtml = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

export function renderPage(layout: string, meta: PageMeta, body: string): string {
  const values: Record<string, string> = {
    title: escapeHtml(meta.title),
    description: escapeHtml(meta.description),
    nav: renderNav(meta.active),
    content: body,
  }
  return layout.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`layout: unknown placeholder {{${key}}}`)
    return values[key]
  })
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries.filter((e) => e.isFile()).map((e) => relative(dir, join(e.parentPath, e.name)))
}

async function exists(path: string): Promise<boolean> {
  return stat(path).then(() => true, () => false)
}

async function linkTargetExists(dist: string, href: string): Promise<boolean> {
  const path = href.split(/[?#]/)[0]
  const target = join(dist, path)
  if (path.endsWith("/")) return exists(join(target, "index.html"))
  return (await exists(join(target, "index.html"))) || ((await exists(target)) && (await stat(target)).isFile())
}

export async function checkOutput(dist: string): Promise<string[]> {
  const problems: string[] = []
  for (const file of await listFiles(dist)) {
    if (!TEXT_EXT.test(`/${file}`)) continue
    const text = await readFile(join(dist, file), "utf8")
    for (const pattern of FORBIDDEN) {
      if (pattern.test(text)) problems.push(`${file}: contains ${pattern.source}`)
    }
    if (!file.endsWith(".html")) continue
    for (const [, href] of text.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      if (!(await linkTargetExists(dist, href))) problems.push(`${file}: broken link ${href}`)
    }
  }
  return problems
}

export async function build(srcDir: string, distDir: string): Promise<void> {
  await rm(distDir, { recursive: true, force: true })
  const layout = await readFile(join(srcDir, "_layout.html"), "utf8")
  const written = new Set<string>()

  const staticDir = join(srcDir, "static")
  if (await exists(staticDir)) {
    for (const file of await listFiles(staticDir)) {
      await mkdir(dirname(join(distDir, file)), { recursive: true })
      await copyFile(join(staticDir, file), join(distDir, file))
      written.add(file)
    }
  }

  const pagesDir = join(srcDir, "pages")
  for (const file of await listFiles(pagesDir)) {
    if (written.has(file)) throw new Error(`${file}: written by both a page and a static file`)
    const { meta, body } = parsePage(await readFile(join(pagesDir, file), "utf8"), `pages/${file}`)
    await mkdir(dirname(join(distDir, file)), { recursive: true })
    await writeFile(join(distDir, file), renderPage(layout, meta, body))
    written.add(file)
  }

  const problems = await checkOutput(distDir)
  if (problems.length > 0) throw new Error(`build output has problems:\n${problems.join("\n")}`)
}

if (import.meta.main) {
  await build("site/src", "site/dist")
  console.error("built site/dist")
}
```

- [ ] **Step 7: Run the tests and check that they pass**

Run: `bun test`
Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json bun.lock .gitignore scripts/build.ts tests/build.test.ts
git commit -m "build: render pages from one layout and check the output"
```

---

### Task 2: Layout, CSS and homepage

**Files:**
- Create: `site/src/_layout.html`, `site/src/pages/index.html`, `site/src/static/assets/site.css`, `site/src/static/assets/copy.js`, `site/src/static/assets/icons/*`, `site/src/static/favicon.svg`
- Spec: `docs/design/swatch-v4.html`

**Interfaces:**
- Consumes: `build()` from Task 1, placeholders `{{title}}`, `{{description}}`, `{{nav}}`, `{{content}}`.
- Produces: CSS classes used by Task 3 pages: `.in`, `.btn`, `.btn-ink`, `.btn-quiet`, `.btn-lg`, `.appicon`, `.sq`, `.prompt`, `.lbl`, `.txt`, `.row`, `.small`, `.t-siteio`, `.t-agentio`, `.t-pagerio`, `.p-hero`, `.block`, `.sub`, `.svcs`, `.facts`, `.fact`, `.mac`, `.head`, `.tag`, `.win`, `.st`, `details.manual`. Copy buttons use `<button class="btn btn-ink" data-copy>`; the text to copy is the `.txt` element in the same `.prompt`.

- [ ] **Step 1: Copy the icons and favicon**

```bash
mkdir -p site/src/static/assets/icons
cp docs/design/icons/siteio.svg docs/design/icons/agentio.png docs/design/icons/pagerio.png docs/design/icons/copycat.svg site/src/static/assets/icons/
git mv site/favicon.svg site/src/static/favicon.svg
```

- [ ] **Step 2: Write `site/src/static/assets/site.css`**

Copy these line ranges from `docs/design/swatch-v4.html`, in order, without the surrounding `<style>` tag:
- lines 10–26 (`:root` tokens, tool and Copycat tints, base `*`, `html`, `body`, `a`, `code`)
- lines 43–45 (`.dots`, used by the window mockups)
- lines 50–166 (`/* ---------- Site ---------- */`, `/* ---------- tool page ---------- */` and `/* utilities … */`)
- lines 167–178 (reduced motion and the 860 px media query), removing `.changes` from the one-column rule (it styles the mockup wrapper only). Keep `.hh-nav span { display: none; }`: on phones the header shows icons only.

Then add the pagerio icon rule, because its PNG has no transparent margin:
```css
.appicon img.sq, .hh-nav img[src$="pagerio.png"] { border-radius: 22.5%; }
.hh-nav img[src$="pagerio.png"] { width: 16px; height: 16px; margin: 2px; }
```

- [ ] **Step 3: Write `site/src/_layout.html`**

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{title}}</title>
<meta name="description" content="{{description}}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
<script src="/assets/copy.js" defer></script>
</head>
<body>
<header class="hh-header"><div class="in">
  <a class="wordmark" href="/">houlahop</a>
  <nav class="hh-nav">
{{nav}}
  </nav>
  <span class="spacer"></span>
  <a class="btn btn-quiet" href="https://github.com/plosson">GitHub ↗</a>
</div></header>
<main>
{{content}}
</main>
<footer class="hh-footer"><div class="in"><span>houlahop</span><span class="spacer"></span><a href="https://github.com/plosson">GitHub</a></div></footer>
</body>
</html>
```

- [ ] **Step 4: Write `site/src/static/assets/copy.js`**

```js
// Copy buttons: copy the prompt next to the button. If the clipboard is not
// available, select the text so the person can copy it by hand.
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]")
  if (!button) return
  const text = button.closest(".prompt")?.querySelector(".txt")
  if (!text) return
  try {
    await navigator.clipboard.writeText(text.innerText.trim())
    button.textContent = "Copied"
  } catch {
    const range = document.createRange()
    range.selectNodeContents(text)
    getSelection().removeAllRanges()
    getSelection().addRange(range)
    button.textContent = "Select and copy"
  }
  setTimeout(() => { button.textContent = "Copy" }, 2000)
})
```

- [ ] **Step 5: Write `site/src/pages/index.html`**

```html
<!--
title: houlahop · Tools for my AI agents
description: Open-source tools I built for my AI agents. Each one does one job.
active: home
-->
<section class="hero"><div class="in">
  <h1>Tools for my AI agents. <span>Open source.</span></h1>
  <p>I built each one for one job. To install one, I ask my agent.</p>
</div></section>

<div class="in"><div class="apps">
  <div class="app t-siteio">
    <a class="appicon" href="/siteio/"><img src="/assets/icons/siteio.svg" alt="siteio"></a>
    <h2>siteio</h2>
    <p class="what">My agents put websites and apps online, on my own server.</p>
    <div class="prompt">
      <span class="lbl">Paste into an agent</span>
      <div class="txt">Install siteio by reading and following <i>https://houlahop.com/siteio/skill.md</i></div>
      <div class="row"><button class="btn btn-ink" data-copy>Copy</button><a class="small" href="/siteio/#install">Install by hand</a></div>
    </div>
    <a class="more" href="/siteio/">About siteio →</a>
  </div>

  <div class="app t-agentio">
    <a class="appicon" href="/agentio/"><img src="/assets/icons/agentio.png" alt="agentio"></a>
    <h2>agentio</h2>
    <p class="what">My agents use my email, Slack, WhatsApp, JIRA and more.</p>
    <div class="prompt">
      <span class="lbl">Paste into an agent</span>
      <div class="txt">Install agentio by reading and following <i>https://houlahop.com/agentio/skill.md</i></div>
      <div class="row"><button class="btn btn-ink" data-copy>Copy</button><a class="small" href="/agentio/#install">Install by hand</a></div>
    </div>
    <a class="more" href="/agentio/">About agentio and its Mac app →</a>
  </div>

  <div class="app t-pagerio">
    <a class="appicon" href="/pagerio/"><img class="sq" src="/assets/icons/pagerio.png" alt="pagerio"></a>
    <h2>pagerio</h2>
    <p class="what">My agents ring my iPhone and Mac when they need me.</p>
    <div class="prompt">
      <span class="lbl">Get the app, then paste into an agent</span>
      <div class="txt">When you finish or need my answer, page me. Read <i>&lt;my pager URL&gt;</i> to learn how.</div>
      <div class="row"><button class="btn btn-ink" data-copy>Copy</button><a class="small" href="https://pagerio.chuut.com">Get the app</a></div>
    </div>
    <a class="more" href="/pagerio/">About pagerio →</a>
  </div>
</div></div>

<section class="utils" id="utilities"><div class="in">
  <div class="utils-head"><h2>Utilities</h2><p>Small apps I use every day. Not for agents.</p></div>
  <div class="util-list">
    <div class="util t-copycat">
      <a class="appicon" href="/copycat/"><img src="/assets/icons/copycat.svg" alt="Copycat"></a>
      <div><a href="/copycat/" style="text-decoration:none"><b>Copycat<span class="os">Mac</span></b></a><span class="d">Copy a GIF or a video from a web page and paste it anywhere, still animated.</span></div>
      <a class="btn btn-quiet" href="https://github.com/plosson/copycat/releases/latest">Download</a>
    </div>
  </div>
</div></section>

<div class="in"><div class="strip"><span>Runs on my own machines</span><span>No cloud service in the middle</span><span>Each tool works alone</span></div></div>
```

To add a utility later: one row in this list, one page in `site/src/pages/<name>/` with `active: utilities`, and its icon in `site/src/static/assets/icons/`.

`.more` links take the tool colour: add to `site.css`:
```css
.app .more { color: var(--tint-ink); }
```

- [ ] **Step 6: Remove the old homepage and brand kit**

```bash
git rm -r site/index.html site/brand site/assets/logos
```

- [ ] **Step 7: Build and look at the result**

The tool pages don't exist yet, so the link check fails on `/siteio/` and the others. Create empty placeholders only for this check, then delete them:

```bash
for t in siteio agentio pagerio; do mkdir -p site/src/pages/$t; printf '<!--\ntitle: %s\ndescription: x\nactive: %s\n-->\n<p>%s</p>\n' $t $t $t > site/src/pages/$t/index.html; done
mkdir -p site/src/pages/copycat && printf '<!--\ntitle: c\ndescription: x\nactive: utilities\n-->\n<p>c</p>\n' > site/src/pages/copycat/index.html
mkdir -p site/src/static/siteio site/src/static/agentio && touch site/src/static/siteio/install site/src/static/agentio/install
bun run build && bunx serve site/dist -l 4321
```

Open http://localhost:4321 and compare with the "Homepage" frame in `docs/design/swatch-v4.html` at 1280 px and at 390 px wide. Check: icons 168 px with shadow, three equal prompt boxes, the grey Utilities list under the tools, "Utilities" in the header scrolls to it, no horizontal scroll on mobile. Then stop the server and remove the placeholders:

```bash
rm -r site/src/pages/siteio site/src/pages/agentio site/src/pages/pagerio site/src/pages/copycat site/src/static/siteio site/src/static/agentio
```

- [ ] **Step 8: Test the copy button fallback**

In the browser console on http://localhost:4321 (placeholders still in place, or after Task 3), run:
```js
Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) } })
```
Click a Copy button. Expected: the prompt text is selected and the button says "Select and copy", then "Copy" after 2 s.

- [ ] **Step 9: Commit**

```bash
git add site/src package.json
git commit -m "site: Swatch layout, styles and homepage"
```

---

### Task 3: Tool pages and the Copycat page

**Files:**
- Create: `site/src/pages/siteio/index.html`, `site/src/pages/agentio/index.html`, `site/src/pages/pagerio/index.html`, `site/src/pages/copycat/index.html`

**Interfaces:**
- Consumes: CSS classes from Task 2; `id="install"` is the target of the homepage "Install by hand" links.

- [ ] **Step 1: Write `site/src/pages/agentio/index.html`** (matches the "Tool page" frame of the spec)

```html
<!--
title: agentio · houlahop
description: My agents use my email, chat and work tools. I sign in to each account once.
active: agentio
-->
<div class="t-agentio">
<section class="p-hero"><div class="in">
  <div class="appicon"><img src="/assets/icons/agentio.png" alt="agentio"></div>
  <div>
    <h1>agentio</h1>
    <p>My agents use my email, chat and work tools. I sign in to each account once.</p>
    <div class="prompt">
      <span class="lbl">Paste into an agent</span>
      <div class="txt">Install agentio by reading and following <i>https://houlahop.com/agentio/skill.md</i></div>
      <div class="row"><button class="btn btn-ink" data-copy>Copy</button><a class="small" href="#install">Install by hand</a></div>
    </div>
  </div>
</div></section>

<section class="block"><div class="in">
  <h2>What my agents can use</h2>
  <p class="sub">Read, search and send. One command line for all of them.</p>
  <div class="svcs"><span>Gmail</span><span>Slack</span><span>WhatsApp</span><span>Google Chat</span><span>Google Drive</span><span>JIRA</span><span>Confluence</span><span>Apple Notes</span><span>Discourse</span><span>RSS</span><span>Revolut</span><span>Kite</span><span>Claude</span><span>ChatGPT</span><span>…and more</span></div>
</div></section>

<section class="block"><div class="in">
  <h2>My passwords stay with me</h2>
  <p class="sub">I sign in once. agentio keeps the tokens encrypted.</p>
  <div class="facts">
    <div class="fact"><b>Encrypted vault</b><span>Tokens are encrypted on my machine (AES-256-GCM).</span></div>
    <div class="fact"><b>My own hub</b><span>Agents on other machines get access from a hub I run.</span></div>
    <div class="fact"><b>Works in CI</b><span>The same commands run in GitHub Actions.</span></div>
  </div>
</div></section>

<section class="block"><div class="in mac">
  <div>
    <div class="head"><div class="appicon"><img src="/assets/icons/agentio.png" alt=""></div><div><h2 style="margin:0">Mac app</h2><span class="tag">Preview</span></div></div>
    <ul>
      <li>See every connected account in one window.</li>
      <li>Find accounts that need a new sign-in.</li>
      <li>Keeps agentio up to date.</li>
    </ul>
    <a class="btn btn-ink btn-lg" href="https://github.com/plosson/agentio-app/releases/latest">Download for Mac</a>
    <p style="font-size:13px;color:var(--ink-2);margin:10px 0 0">macOS 14 or later.</p>
  </div>
  <div class="win">
    <div class="bar"><div class="dots"><i></i><i></i><i></i></div><b>agentio</b></div>
    <div class="rows">
      <div class="r"><span class="s" style="background:#ea4335">M</span><span class="n">Gmail · work<small>pa@company.com</small></span><span class="st">Connected</span></div>
      <div class="r"><span class="s" style="background:#611f69">#</span><span class="n">Slack · team<small>company.slack.com</small></span><span class="st">Connected</span></div>
      <div class="r"><span class="s" style="background:#25d366">W</span><span class="n">WhatsApp · personal<small>+32 4•• •• •• 12</small></span><span class="st">Connected</span></div>
      <div class="r"><span class="s" style="background:#0c66e4">J</span><span class="n">JIRA · platform<small>company.atlassian.net</small></span><span class="st bad">Sign in again</span></div>
    </div>
  </div>
</div></section>

<section class="block" id="install"><div class="in">
  <details class="manual">
    <summary>Install by hand</summary>
<pre># macOS and Linux
curl -LsSf https://houlahop.com/agentio/install | sh

# Windows (PowerShell)
iwr -useb https://houlahop.com/agentio/install.ps1 | iex

# Homebrew
brew tap plosson/agentio && brew install agentio</pre>
  </details>
</div></section>
</div>
```

The window mockup uses the `.dots` rules copied in Task 2. The Mac app has releases (v0.2.0 on 2026-10-09); check the link still opens a release before committing.

- [ ] **Step 2: Write `site/src/pages/siteio/index.html`**

```html
<!--
title: siteio · houlahop
description: My agents put websites and apps online, on my own server.
active: siteio
-->
<div class="t-siteio">
<section class="p-hero"><div class="in">
  <div class="appicon"><img src="/assets/icons/siteio.svg" alt="siteio"></div>
  <div>
    <h1>siteio</h1>
    <p>My agents put websites and apps online, on my own server. Each one gets HTTPS and its own address.</p>
    <div class="prompt">
      <span class="lbl">Paste into an agent</span>
      <div class="txt">Install siteio by reading and following <i>https://houlahop.com/siteio/skill.md</i></div>
      <div class="row"><button class="btn btn-ink" data-copy>Copy</button><a class="small" href="#install">Install by hand</a></div>
    </div>
  </div>
</div></section>

<section class="block"><div class="in">
  <h2>What my agents can put online</h2>
  <p class="sub">One command for each.</p>
  <div class="svcs"><span>A folder of HTML</span><span>A Docker image</span><span>A Git repository</span><span>A folder in a monorepo</span><span>A site with sign-in and a database</span></div>
</div></section>

<section class="block"><div class="in">
  <h2>My server, my addresses</h2>
  <p class="sub">siteio runs on a server I own.</p>
  <div class="facts">
    <div class="fact"><b>HTTPS</b><span>Certificates are issued and renewed automatically.</span></div>
    <div class="fact"><b>History</b><span>Every deploy is kept. Go back with one command.</span></div>
    <div class="fact"><b>My domains</b><span>Any domain can point to a site.</span></div>
  </div>
</div></section>

<section class="block" id="install"><div class="in">
  <details class="manual">
    <summary>Install by hand</summary>
<pre># macOS and Linux
curl -LsSf https://houlahop.com/siteio/install | sh

# Connect to a server
siteio login --token &lt;connection-token&gt;</pre>
  </details>
</div></section>
</div>
```

- [ ] **Step 3: Write `site/src/pages/pagerio/index.html`**

```html
<!--
title: pagerio · houlahop
description: My agents ring my iPhone and Mac when they need me.
active: pagerio
-->
<div class="t-pagerio">
<section class="p-hero"><div class="in">
  <div class="appicon"><img class="sq" src="/assets/icons/pagerio.png" alt="pagerio"></div>
  <div>
    <h1>pagerio</h1>
    <p>My agents ring my iPhone and Mac when they need me. I have one private URL; anything that can send a web request can use it.</p>
    <div class="prompt">
      <span class="lbl">Get the app, then paste into an agent</span>
      <div class="txt">When you finish or need my answer, page me. Read <i>&lt;my pager URL&gt;</i> to learn how.</div>
      <div class="row"><button class="btn btn-ink" data-copy>Copy</button><a class="small" href="https://pagerio.chuut.com">Get the app</a></div>
    </div>
  </div>
</div></section>

<section class="block"><div class="in">
  <h2>How it works</h2>
  <p class="sub">No key and no SDK. The URL is the secret.</p>
  <div class="facts">
    <div class="fact"><b>One private URL</b><span>I get it by signing in to the app. Anyone with it can page me, so it stays private.</span></div>
    <div class="fact"><b>Rings within seconds</b><span>My iPhone and Mac get the page as a notification.</span></div>
    <div class="fact"><b>Details and links</b><span>A page can carry longer text and a link. I see them when I open it.</span></div>
  </div>
</div></section>

<section class="block" id="install"><div class="in">
  <details class="manual">
    <summary>Send a page by hand</summary>
<pre>curl -d "Build finished" &lt;my pager URL&gt;

# With a title, details and a link
curl &lt;my pager URL&gt; \
  -H "Content-Type: application/json" \
  -d '{"title":"Backup failed","message":"Disk full on db-1.","url":"https://example.com"}'</pre>
  </details>
</div></section>
</div>
```

- [ ] **Step 4: Write `site/src/pages/copycat/index.html`** (matches the "Utility page" frame of the spec)

```html
<!--
title: Copycat · houlahop
description: Copycat copies the real file from a web page, so a GIF stays animated and a video stays a video when I paste it.
active: utilities
-->
<div class="t-copycat">
<section class="u-hero"><div class="in">
  <div class="appicon"><img src="/assets/icons/copycat.svg" alt="Copycat"></div>
  <div>
    <p class="kind">Utility · Mac</p>
    <h1>Copycat</h1>
    <p>Browsers can only copy text and still images. Copycat copies the real file, so a GIF stays animated and a video stays a video when I paste it.</p>
    <a class="btn btn-ink btn-lg" href="https://github.com/plosson/copycat/releases/latest">Download for Mac</a><span class="meta">macOS 14 or later · signed and notarized</span>
  </div>
</div></section>

<section class="block"><div class="in">
  <h2>How it works</h2>
  <p class="sub">It runs in the menu bar. It only acts when a site I allowed asks it to.</p>
  <div class="facts">
    <div class="fact"><b>Press Copy on a page</b><span>The page asks Copycat to copy a file by its URL.</span></div>
    <div class="fact"><b>Allow the site once</b><span>Copycat asks me the first time. Sites I didn't allow can't use it.</span></div>
    <div class="fact"><b>Paste anywhere</b><span>Messages, Slack, WhatsApp, Mail. The GIF or video arrives as a real file.</span></div>
  </div>
</div></section>

<section class="block"><div class="in">
  <details class="manual">
    <summary>Add a Copy button to a site</summary>
<pre>&lt;script src="copycat.js"&gt;&lt;/script&gt;

if (await Copycat.status() !== "absent") {
  await Copycat.copy("https://example.com/cat.gif", { name: "cat.gif" })
}</pre>
  </details>
</div></section>
</div>
```

The version is left out of the page on purpose: the Download link always opens the latest release, and a version written here would go stale. Before committing, check the `copycat.js` API in `../copycat/js/copycat.js` (`status()` and `copy(url, hints)`); fix the example if it changed.

- [ ] **Step 5: Build with placeholder install files and check each page**

```bash
mkdir -p site/src/static/siteio site/src/static/agentio
touch site/src/static/siteio/install site/src/static/agentio/install
bun run build && bunx serve site/dist -l 4321
```

Open `/siteio/`, `/agentio/`, `/pagerio/` and `/copycat/` at 1280 px and 390 px. Check: the active tool (or "Utilities" on `/copycat/`) is highlighted in the header, the hero tint matches the page, "Install by hand" on the homepage scrolls to the section, and no visible text says "you" or "your" outside code examples: `grep -n "[Yy]our\b\|\b[Yy]ou\b" site/dist/index.html site/dist/*/index.html` should only show the pagerio prompt ("When you finish…", addressed to the agent). Stop the server, then `rm site/src/static/siteio/install site/src/static/agentio/install`.

- [ ] **Step 6: Commit**

```bash
git add site/src/pages site/src/static/assets/site.css
git commit -m "site: siteio, agentio, pagerio and Copycat pages"
```

---

### Task 4: Install files and skill.md at the new paths

**Files:**
- Create: `site/src/static/siteio/{install,install.ps1,skill.md}` (copied from `../siteio/site/` on `main`)
- Create: `site/src/static/agentio/{install,install.ps1}` (copied from `../agentio/site/public/`)
- Create: `site/src/static/agentio/skill.md` (new)

**Interfaces:**
- Produces: the six install URLs in Global Constraints. Tasks 6–8 point code at them.

- [ ] **Step 1: Copy the siteio files from `main`, not from the working branch**

```bash
mkdir -p site/src/static/siteio site/src/static/agentio
for f in install install.ps1 skill.md; do git -C ../siteio show main:site/$f > site/src/static/siteio/$f; done
for f in install install.ps1; do git -C ../agentio show main:site/public/$f > site/src/static/agentio/$f; done
```

- [ ] **Step 2: Replace the old URLs**

```bash
sed -i '' 's#https://siteio\.houlahop\.com/#https://houlahop.com/siteio/#g' site/src/static/siteio/*
sed -i '' 's#https://agentio\.houlahop\.com/#https://houlahop.com/agentio/#g' site/src/static/agentio/*
grep -rn "houlahop" site/src/static/siteio site/src/static/agentio
```
Expected: every hit uses `https://houlahop.com/siteio/…` or `https://houlahop.com/agentio/…`. Fix any other form by hand.

- [ ] **Step 3: Write `site/src/static/agentio/skill.md`**

Before writing, check the commands exist on the latest agentio: `agentio --help`, `agentio profile list --help`, `agentio doctor --help`, `agentio skill --list`. Adjust the text if a command differs.

```markdown
# Install agentio

These instructions are for an AI agent. Follow them to install agentio. agentio lets you read and send email, Slack, WhatsApp, JIRA and other services from the command line, with accounts the user signs in to once.

## 1. Install the CLI

Skip this step if `agentio --version` already works.

macOS and Linux:

    curl -LsSf https://houlahop.com/agentio/install | sh

Windows (PowerShell):

    iwr -useb https://houlahop.com/agentio/install.ps1 | iex

If `agentio` is still not found, use the full path the installer printed (usually `~/.local/bin/agentio`).

## 2. Install the skills

In Claude Code, add the plugin marketplace once, then one plugin per service the user needs:

    claude plugin marketplace add https://github.com/plosson/agentio
    claude plugin install agentio-gmail@agentio

`agentio skill --list` lists the services. In other agents, run `agentio <service> --help` to learn the commands.

## 3. Connect accounts

Ask the user which services they want. For each one, the user runs:

    agentio <service> profile add

It opens a browser to sign in. The user must approve access, so ask them to run it.

## 4. Check

    agentio profile list
    agentio doctor
```

- [ ] **Step 4: Check the scripts still run**

```bash
bun run build
sh site/dist/siteio/install --help | head -5
sh site/dist/agentio/install --help | head -5
```
Expected: each prints its usage text with the new URL. If `--help` isn't supported, run `sh -n site/dist/siteio/install` (syntax check) instead.

- [ ] **Step 5: Commit**

```bash
git add site/src/static/siteio site/src/static/agentio
git commit -m "site: serve install scripts and skill.md under /siteio and /agentio"
```

---

### Task 5: Deploy and smoke test

**Files:**
- Create: `scripts/smoke.sh`
- Modify: `.github/workflows/deploy-site.yml`

- [ ] **Step 1: Write `scripts/smoke.sh`**

```sh
#!/bin/sh
# Checks the deployed site. Usage: sh scripts/smoke.sh [base-url]
set -u
BASE="${1:-https://houlahop.com}"
fail=0

expect() { # url expected-status expected-content-type-prefix
  got=$(curl -s -o /dev/null -w "%{http_code} %{content_type}" "$1")
  case "$got" in
    "$2 $3"*) echo "ok   $1 -> $got" ;;
    *) echo "FAIL $1 -> $got (expected $2 $3)"; fail=1 ;;
  esac
}

for page in / /siteio/ /agentio/ /pagerio/ /copycat/; do expect "$BASE$page" 200 text/html; done
for f in /siteio/install /siteio/install.ps1 /agentio/install /agentio/install.ps1; do expect "$BASE$f" 200 text/plain; done
for f in /siteio/skill.md /agentio/skill.md; do expect "$BASE$f" 200 text/; done
for t in siteio agentio pagerio copycat; do expect "$BASE/$t" 301 ""; done

# An install script must start with a shebang, never with HTML.
for t in siteio agentio; do
  first=$(curl -fsSL "$BASE/$t/install" | head -c 2)
  [ "$first" = "#!" ] && echo "ok   $t/install starts with #!" || { echo "FAIL $t/install starts with '$first'"; fail=1; }
done

# No old domain may appear in what agents read.
for f in /siteio/skill.md /agentio/skill.md /siteio/install /agentio/install; do
  if curl -fsSL "$BASE$f" | grep -Eqi "(siteio|agentio)\.houlahop\.com"; then echo "FAIL $f mentions an old domain"; fail=1; fi
done

exit $fail
```

Run it against a local server first: `bun run build && (bunx serve site/dist -l 4321 &) && sleep 2 && sh scripts/smoke.sh http://localhost:4321`. The content-type and 301 lines may differ locally; the shebang and old-domain checks must pass.

- [ ] **Step 2: Update the deploy workflow**

Replace the steps of `.github/workflows/deploy-site.yml` with:
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'site/src/**'
      - 'scripts/build.ts'
      - 'package.json'
      - '.github/workflows/deploy-site.yml'
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to houlahop.com
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun test
      - run: bun run build
      - name: Install siteio
        run: |
          curl -LsSf https://houlahop.com/siteio/install | sh
          echo "$HOME/.local/bin" >> "$GITHUB_PATH"
      - name: Login
        run: siteio login --username github-actions
        env:
          SITEIO_TOKEN: ${{ secrets.SITEIO_TOKEN }}
      - run: siteio sites deploy site/dist -n www
      - run: sh scripts/smoke.sh
```

The install URL here only works after the first deploy. For the first run, use `https://siteio.houlahop.com/install` and change it in the next commit.

- [ ] **Step 3: Merge, deploy and check**

```bash
git add scripts/smoke.sh .github/workflows/deploy-site.yml
git commit -m "ci: build, test, deploy and smoke-test houlahop.com"
git checkout main && git merge --no-ff feat/single-site && git push
gh run watch -R plosson/houlahop
sh scripts/smoke.sh
```
Expected: the workflow succeeds and every smoke line says `ok`. The old subdomains still work at this point.

- [ ] **Step 4: Switch the workflow to the new install URL**

Change the install line to `https://houlahop.com/siteio/install`, commit "ci: install siteio from houlahop.com", push, and watch the run pass.

---

### Task 6: siteio points to the new URLs

**Files (siteio repo, new worktree from `main`):**
- Modify: `src/commands/agent/install.ts:15`, `src/commands/update.ts:120,393,395`, `src/lib/skill-content.ts:47`, `README.md:9`
- Test: the existing tests that cover these files

- [ ] **Step 1: Create a worktree from `main`**

```bash
cd ~/devel/projects/personal/siteio
git worktree add ../siteio-new-urls -b chore/houlahop-urls main
cd ../siteio-new-urls && bun install
```

- [ ] **Step 2: Find tests that pin the old URL**

Run: `grep -rn "siteio.houlahop.com" src/__tests__`
For each hit, change the expected value to `https://houlahop.com/siteio/install` first, then run `bun test <file>` and check it FAILS.

If no test pins the install URL in `src/commands/agent/install.ts`, add one to its existing test file:
```ts
import { INSTALL_SCRIPT_URL } from "../commands/agent/install.ts"
test("the agent installer downloads from houlahop.com", () => {
  expect(INSTALL_SCRIPT_URL).toBe("https://houlahop.com/siteio/install")
  expect(INSTALL_SCRIPT_URL).not.toContain("siteio.houlahop.com")
})
```
Export `INSTALL_SCRIPT_URL` (`export const`) for this.

- [ ] **Step 3: Replace the URLs**

```bash
grep -rln "siteio.houlahop.com" src README.md | xargs sed -i '' 's#https://siteio\.houlahop\.com/#https://houlahop.com/siteio/#g'
grep -rn "houlahop.com" src README.md
```
Expected: no `siteio.houlahop.com` left.

- [ ] **Step 4: Run quality gates**

Run: `bun run typecheck && bun test`
Expected: PASS.

- [ ] **Step 5: Commit, release and update servers**

Follow "Releasing" in siteio's `CLAUDE.md` (patch bump, tag, Actions link), then update the servers listed in the "siteio production servers" notes with `siteio update -y && siteio agent restart`.

```bash
git commit -am "chore: install from houlahop.com/siteio"
```

---

### Task 7: agentio points to the new URLs

**Files (agentio repo):**
- Modify: `src/daemon/install-guide.ts:7,43`, `src/commands/update.ts:127,427,429`, `README.md:60,71,76,326`
- Test: `tests/daemon/api.test.ts:508`, `tests/daemon/ui/assets.test.ts:491`

- [ ] **Step 1: Change the tests first**

In both test files, replace `https://agentio.houlahop.com/install` with `https://houlahop.com/agentio/install`. Add to `tests/daemon/api.test.ts`, next to the existing assertion:
```ts
expect(body).not.toContain('agentio.houlahop.com');
```
Run: `bun test tests/daemon/api.test.ts tests/daemon/ui/assets.test.ts`
Expected: FAIL.

- [ ] **Step 2: Replace the URLs**

```bash
git checkout -b chore/houlahop-urls
grep -rln "agentio.houlahop.com" src README.md | xargs sed -i '' 's#https://agentio\.houlahop\.com/#https://houlahop.com/agentio/#g'
grep -rn "agentio.houlahop.com" src README.md tests
```
Expected: no hits.

- [ ] **Step 3: Run quality gates**

Run: `bun run typecheck && bun test`
Expected: PASS.

- [ ] **Step 4: Commit and release**

```bash
git commit -am "chore: install from houlahop.com/agentio"
```
Merge to `main`, bump the patch version, tag `vX.Y.Z` and push the tag.

---

### Task 8: AgentIO Companion and other repos

**Files:**
- Modify: `agentio-app/apps/macos/AgentioKit/Installer.swift:14-15`
- Modify: `mdio/.github/workflows/deploy-site.yml:21`
- Modify: `prox/CLAUDE.md:52`

- [ ] **Step 1: Companion installer**

In `Installer.swift`:
```swift
/// The official installer, as documented at https://houlahop.com/agentio/#install.
public let installScriptURL = URL(string: "https://houlahop.com/agentio/install")!
```
If a test asserts the URL, change it first and check it fails. Then:
```bash
cd apps/macos && xcodegen generate && xcodebuild -scheme AgentioCompanion -destination 'platform=macOS' -derivedDataPath build test
```
Expected: PASS. Commit "chore: install agentio from houlahop.com".

- [ ] **Step 2: mdio and prox**

Replace `https://siteio.houlahop.com/install` with `https://houlahop.com/siteio/install` in both files. Commit each repo separately and push.

- [ ] **Step 3: Search everything once more**

```bash
cd ~/devel/projects && grep -rlI "siteio\.houlahop\.com\|agentio\.houlahop\.com" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build --exclude-dir=temp . 
```
Expected: only `siteio/site/`, `agentio/site/` and the agentio deploy workflow (removed in Task 10), plus plan and history files. Show any other hit to the user.

---

### Task 9: Cloudflare redirects (the user does this)

This needs the Cloudflare dashboard (or the Cloudflare MCP) on the `houlahop.com` zone. Give the user these exact steps and wait for them to confirm.

- [ ] **Step 1: Make the two names go through Cloudflare**

`*.houlahop.com` is probably a DNS-only wildcard pointing at the siteio server. Redirect rules only run on proxied records. Add two records that override the wildcard:
- `siteio` — A — server IP — **Proxied**
- `agentio` — A — server IP — **Proxied**

- [ ] **Step 2: Add two redirect rules** (Rules → Redirect Rules → Create rule)

Rule "siteio subdomain":
- When: `http.host eq "siteio.houlahop.com"`
- Then: Dynamic redirect, expression `concat("https://houlahop.com/siteio", http.request.uri.path)`, status **301**, preserve query string **on**

Rule "agentio subdomain": the same with `agentio`.

- [ ] **Step 3: Check**

```bash
curl -sI https://siteio.houlahop.com/install | grep -iE "^(HTTP|location)"
curl -sI https://agentio.houlahop.com/ | grep -iE "^(HTTP|location)"
curl -LsSf https://siteio.houlahop.com/install | head -c 2
```
Expected: `301` with `location: https://houlahop.com/siteio/install`, `301` with `location: https://houlahop.com/agentio/`, and `#!`.

---

### Task 10: Remove the old sites and their sources

**Files:**
- siteio repo (worktree from Task 6): delete `site/`, `.github/workflows/deploy-site.yml`
- agentio repo: delete `site/`, `scripts/build-site.ts`, `scripts/build-site/`, `tests/scripts/build-site/`, `.github/workflows/deploy-site.yml`; modify `package.json` (remove `build:site`), `AGENTS.md:40,65`

- [ ] **Step 1: Delete the deployed sites** (only after Task 9 checks pass)

```bash
siteio sites rm siteio
siteio sites rm agentio
curl -sI https://siteio.houlahop.com/install | head -3
```
Expected: still `301` to the new URL (Cloudflare answers, not the server).

- [ ] **Step 2: Remove the siteio site sources**

```bash
cd ~/devel/projects/personal/siteio-new-urls
git rm -r site .github/workflows/deploy-site.yml
bun run typecheck && bun test
git commit -m "chore: the website moved to houlahop.com"
```

- [ ] **Step 3: Remove the agentio site sources**

```bash
cd ~/devel/projects/personal/agentio
git rm -r site scripts/build-site.ts scripts/build-site tests/scripts/build-site .github/workflows/deploy-site.yml
```
Remove the `"build:site"` line from `package.json`. In `AGENTS.md`, remove the `bun run build:site` row and `site/` from the folders row.
```bash
grep -rn "build-site\|build:site\|site/dist\|site/src" . --exclude-dir=node_modules --exclude-dir=.git
bun run typecheck && bun test
git commit -am "chore: the website moved to houlahop.com"
```
Expected: the grep finds nothing; tests pass.

- [ ] **Step 4: Push both repos**

For siteio: push `chore/houlahop-urls`, open a PR to `main` (see the "gh account for siteio PRs" note), merge. For agentio: merge to `main` and push. Then `git worktree remove ../siteio-new-urls`.

---

### Task 11: houlahop docs

**Files:**
- Modify: `README.md`, `BRIEF.md`

- [ ] **Step 1: Update `README.md`**

```markdown
# houlahop.com

The public site for my tools (siteio, agentio with its Mac app, pagerio) and utilities (Copycat).

- Pages: `site/src/pages/`, one layout: `site/src/_layout.html`
- Install scripts and skill.md: `site/src/static/siteio/` and `site/src/static/agentio/`
- Design: `docs/design/swatch-v4.html`

    bun install
    bun test          # build script tests
    bun run build     # writes site/dist and checks it
    sh scripts/smoke.sh   # checks the live site

A push to `main` deploys to houlahop.com.

When a tool changes its install steps, update its files here, not in the tool repo.

To add a utility: one row in the Utilities list in `site/src/pages/index.html`, one page in `site/src/pages/<name>/index.html` with `active: utilities`, and its icon in `site/src/static/assets/icons/`.
```

- [ ] **Step 2: Update `BRIEF.md`**

Replace the "Information Architecture" tree and "Current Capabilities" with the tools (siteio, agentio, pagerio) and the Utilities tier (Copycat). Remove falcio. Replace "The website is not about me" with: the site shows the tools I use, in the first person; it doesn't try to convince anyone. Replace "Three capability cards" with "The three tools, each with its app icon and an install prompt". Add under "Writing Style": "Plain language (ISO 24495-1). One sentence per idea."

- [ ] **Step 3: Commit and push**

```bash
git commit -am "docs: houlahop.com is one site for all tools"
git push
git status
```
Expected: "up to date with origin".

---

## Self-review notes

- Every Global Constraint maps to a task: URLs (2–5), redirects (9), no reference pages (10), pagerio app stays (3), falcio gone (1 check, 11), Companion inside agentio (3), prompt first (2, 3), two tiers and Utilities (1 nav, 2 list, 3 Copycat page), download links (3), first-person copy (2, 3, with a grep check in Task 3 step 5), design v4 (2), Bun (1), siteio branch safety (6), houlahop dirty tree (1).
- Review Focus items have checks: 1 → smoke.sh content-type and shebang; 2 → `checkOutput` + smoke.sh; 3 → smoke.sh 301 (now including `/copycat`); 4 → Task 9 step 3; 5 → Task 2 step 8.
- The Copycat app icon was done separately on 2026-10-09 (copycat commit `ff3b23a`, released by the copycat agent), so it is not a task here.

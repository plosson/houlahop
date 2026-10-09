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
// https://houlahop.com/<path> written as text (prompts, <pre>, .md); ends at whitespace, quote, <, ), | or backtick
const SELF_URL = /https:\/\/houlahop\.com(\/[^\s"'<)|`]*)?/g
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
  return { meta: fields as unknown as PageMeta, body: source.slice(match[0].length) }
}

export function renderNav(active: string): string {
  const tools = TOOLS.map((t) => {
    const on = t.slug === active ? ' class="on" aria-current="page"' : ""
    return `<a href="/${t.slug}/" aria-label="${t.slug}"${on}><img src="${t.icon}" alt="" width="20" height="20"><span>${t.slug}</span></a>`
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
    for (const [, rawPath = ""] of text.matchAll(SELF_URL)) {
      const path = rawPath.replace(/[.,]$/, "") || "/"
      if (!(await linkTargetExists(dist, path))) problems.push(`${file}: broken houlahop.com URL ${path}`)
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

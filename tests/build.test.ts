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
    expect(html).toContain('href="/agentio/" aria-label="agentio" class="on" aria-current="page"')
  })
  test("marks nothing on the homepage", () => {
    expect(renderNav("home")).not.toContain("aria-current")
  })
  test("marks the Utilities link, and no tool, on a utility page", () => {
    const html = renderNav("utilities")
    expect(html.match(/aria-current="page"/g)?.length).toBe(1)
    expect(html).toContain('class="text on" href="/#utilities" aria-current="page"')
  })
  test("gives every tool link an aria-label, since the visible name is hidden on phones", () => {
    const html = renderNav("home")
    for (const slug of ["siteio", "agentio", "pagerio"]) {
      expect(html).toContain(`<a href="/${slug}/" aria-label="${slug}">`)
    }
    expect(renderNav("agentio")).toContain('<a href="/agentio/" aria-label="agentio" class="on" aria-current="page">')
  })
  test("keeps the Utilities link's visible text and gives it no aria-label", () => {
    expect(renderNav("home")).toMatch(/<a class="text" href="\/#utilities">Utilities<\/a>/)
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
  test("flags a houlahop.com URL written in a <pre> that points at a missing file", async () => {
    await writeFile(join(dist, "index.html"), "<pre>curl -LsSf https://houlahop.com/siteio/instal | sh</pre>")
    expect((await checkOutput(dist)).join()).toContain("/siteio/instal")
  })
  test("flags a houlahop.com URL written in a .md file that points at a missing file", async () => {
    await mkdir(join(dist, "siteio"), { recursive: true })
    await writeFile(join(dist, "siteio", "skill.md"), "Read `https://houlahop.com/agentio/skill.md` first")
    expect((await checkOutput(dist)).join()).toContain("/agentio/skill.md")
  })
  test("accepts a houlahop.com URL that resolves, with query or fragment", async () => {
    await mkdir(join(dist, "siteio"), { recursive: true })
    await writeFile(join(dist, "siteio", "install"), "#!/bin/sh\n")
    await writeFile(join(dist, "siteio", "index.html"), "ok")
    await writeFile(join(dist, "index.html"), "<pre>https://houlahop.com/siteio/install?v=1 https://houlahop.com/siteio/#x https://houlahop.com/siteio https://houlahop.com/</pre>")
    expect(await checkOutput(dist)).toEqual([])
  })
  test("ignores URLs on other hosts", async () => {
    await writeFile(join(dist, "index.html"), "<pre>https://example.com/siteio/install https://nothoulahop.com/x</pre>")
    expect(await checkOutput(dist)).toEqual([])
  })
  test("strips one trailing period or comma from a URL at the end of a sentence", async () => {
    await mkdir(join(dist, "siteio"), { recursive: true })
    await writeFile(join(dist, "siteio", "skill.md"), "ok")
    await writeFile(join(dist, "index.html"), "<p>See https://houlahop.com/siteio/skill.md. Or https://houlahop.com/siteio/skill.md, then go.</p>")
    expect(await checkOutput(dist)).toEqual([])
    await writeFile(join(dist, "index.html"), "<p>See https://houlahop.com/siteio/nope.</p>")
    expect((await checkOutput(dist)).join()).toContain("/siteio/nope")
  })
  test("stops a URL at a quote, angle bracket, parenthesis, pipe or backtick", async () => {
    await writeFile(join(dist, "index.html"), '<i>https://houlahop.com/</i> (https://houlahop.com/) "https://houlahop.com/" `https://houlahop.com/`|')
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
    await mkdir(join(root, "src", "pages", "agentio"), { recursive: true })
    await mkdir(join(root, "src", "pages", "pagerio"), { recursive: true })
    await mkdir(join(root, "src", "static", "siteio"), { recursive: true })
    await mkdir(join(root, "src", "static", "assets", "icons"), { recursive: true })
    await writeFile(join(root, "src", "_layout.html"), "<title>{{title}}</title><nav>{{nav}}</nav><main>{{content}}</main>")
    await writeFile(join(root, "src", "pages", "index.html"), "<!--\ntitle: Home\ndescription: D\nactive: home\n-->\n<a href=\"/siteio/install\">i</a>")
    await writeFile(join(root, "src", "pages", "siteio", "index.html"), META + "<p>siteio</p>")
    await writeFile(join(root, "src", "pages", "agentio", "index.html"), "<!--\ntitle: Agentio\ndescription: D\nactive: agentio\n-->\n<p>agentio</p>")
    await writeFile(join(root, "src", "pages", "pagerio", "index.html"), "<!--\ntitle: Pagerio\ndescription: D\nactive: pagerio\n-->\n<p>pagerio</p>")
    await writeFile(join(root, "src", "static", "siteio", "install"), "#!/bin/sh\necho ok\n")
    await writeFile(join(root, "src", "static", "assets", "icons", "siteio.svg"), "<svg></svg>")
    await writeFile(join(root, "src", "static", "assets", "icons", "agentio.png"), "")
    await writeFile(join(root, "src", "static", "assets", "icons", "pagerio.png"), "")
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

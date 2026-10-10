import { describe, expect, test } from "bun:test"
import { readFile, readdir, stat } from "node:fs/promises"
import { join } from "node:path"

const ASSETS = "site/src/static/assets/chats"
const PAGES = "site/src/pages"

// Runs stories.js and chats.js as the browser would, with just enough of a DOM
// for chats.js to load without mounting anything.
async function loadChats() {
  const stories = await readFile(join(ASSETS, "stories.js"), "utf8")
  const player = await readFile(join(ASSETS, "chats.js"), "utf8")
  const run = new Function("matchMedia", "document",
    `${stories}\n${player}\nreturn { STORIES, PREVIEWS, LINKS, ICONS, svcOf, md }`)
  return run(() => ({ matches: true }), { querySelectorAll: () => [] })
}

// The stories each page asks for, from data-stories="a,b"
async function pageStories(): Promise<Map<string, string[]>> {
  const found = new Map<string, string[]>()
  for (const dir of await readdir(PAGES)) {
    const html = await readFile(join(PAGES, dir, "index.html"), "utf8").catch(() => "")
    for (const [, ids] of html.matchAll(/data-stories="([^"]*)"/g)) found.set(dir, ids.split(",").map((s) => s.trim()))
  }
  return found
}

const { STORIES, PREVIEWS, LINKS, ICONS, svcOf, md } = await loadChats()

describe("chat stories", () => {
  test("each page asks only for stories that exist", async () => {
    const pages = await pageStories()
    expect([...pages.keys()].sort()).toEqual(["agentio", "siteio"])
    for (const [page, ids] of pages) {
      for (const id of ids) expect(STORIES.map((s: any) => s.id), `${page} → ${id}`).toContain(id)
    }
  })

  test("story ids are unique", () => {
    const ids = STORIES.map((s: any) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test("every step is a known kind, and every choice picks an option that exists", () => {
    const kinds = ["me", "ai", "run", "ask", "event", "pv", "card"]
    for (const story of STORIES) {
      for (const step of story.steps) {
        const kind = kinds.filter((k) => k in step)
        expect(kind.length, `${story.id}: ${JSON.stringify(step).slice(0, 80)}`).toBe(1)
        if (step.ask) {
          expect(step.options.length).toBeGreaterThanOrEqual(2)
          expect(step.options.length).toBeLessThanOrEqual(3)
          expect(step.options[step.pick], `${story.id}: pick ${step.pick}`).toBeDefined()
        }
        if (step.pv) expect(typeof PREVIEWS[step.pv], `${story.id}: preview ${step.pv}`).toBe("function")
        if (step.run) expect(typeof step.out, `${story.id}: ${step.run}`).toBe("string")
      }
      expect(story.steps.at(-1).card, `${story.id} ends with its result`).toBeDefined()
    }
  })

  test("only previews that exist get a link card", () => {
    for (const key of Object.keys(LINKS)) expect(typeof PREVIEWS[key], key).toBe("function")
  })

  test("every service a story shows has a logo file on disk", async () => {
    const keys = new Set<string>()
    for (const story of STORIES) {
      story.svcs.forEach((k: string) => keys.add(k))
      for (const step of story.steps) {
        if (step.run) svcOf(step).forEach((k: string) => keys.add(k))
        if (step.stats) step.stats.forEach((k: string) => keys.add(k))
      }
    }
    for (const key of keys) {
      expect(ICONS[key], `no logo for "${key}"`).toBeDefined()
      if (ICONS[key].startsWith("data:")) continue
      const file = join("site/src/static", ICONS[key])
      expect((await stat(file).catch(() => null))?.isFile(), file).toBe(true)
    }
  })

  test("text from a story is escaped, not run as HTML", () => {
    expect(md('<img src=x onerror="alert(1)">')).not.toContain("<img")
    expect(md("**<b>x</b>**")).toBe("<p><b>&lt;b&gt;x&lt;/b&gt;</b></p>")
  })
})

describe("privacy", () => {
  // The stories are made up: no real person, employer, server or address
  const PERSONAL = [/hex[\s-]?rays/i, /pierre/i, /losson/i, /chuut/i, /docunit/i, /[\w.+-]+@(?!example\.com)[\w-]+\.\w+/i, /\bBE\d{2}[\s\d]{12,}/]

  test("the chat files mention nothing personal", async () => {
    for (const file of await readdir(ASSETS)) {
      if (!/\.(js|css)$/.test(file)) continue
      const text = await readFile(join(ASSETS, file), "utf8")
      for (const pattern of PERSONAL) expect(pattern.test(text), `${file} matches ${pattern}`).toBe(false)
    }
  })

  test("the check catches what it is meant to catch", () => {
    for (const leak of ["Hex-Rays", "pierre@x.be", "send to someone@gmail.com", "BE68 5390 0754 7034"]) {
      expect(PERSONAL.some((p) => p.test(leak)), leak).toBe(true)
    }
    for (const fine of ["--to me@example.com", "--values-json @leads.json"]) {
      expect(PERSONAL.some((p) => p.test(fine)), fine).toBe(false)
    }
  })
})

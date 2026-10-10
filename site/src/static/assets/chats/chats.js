// Animated agent chats. Each <div class="chats" data-stories="id,id"> plays the
// stories from stories.js (loaded first). The same chat can be shown as Claude,
// ChatGPT or Grok Bot: the skin changes only the look, never the words.

const LOGOS = "/assets/chats/logos/"
const ICONS = {
  gmail: LOGOS + "gmail.svg", gdrive: LOGOS + "gdrive.svg", gsheets: LOGOS + "gsheets.svg", gdocs: LOGOS + "gdocs.svg",
  github: LOGOS + "github.svg", dropbox: LOGOS + "dropbox.svg", revolut: LOGOS + "revolut.svg", belfius: LOGOS + "belfius.png",
  falco: LOGOS + "falco.png", ovh: LOGOS + "ovh.svg", gcal: LOGOS + "gcal.svg", fintable: LOGOS + "fintable.svg", kite: LOGOS + "kite.svg", firecrawl: LOGOS + "firecrawl.svg",
  claude: LOGOS + "claude.svg", chatgpt: LOGOS + "chatgpt.svg",
  siteio: "/assets/icons/siteio.svg", agentio: "/assets/icons/agentio.png",
}
const NAMES = { gmail: "Gmail", gdrive: "Google Drive", gsheets: "Google Sheets", gdocs: "Google Docs", github: "GitHub",
  dropbox: "Dropbox", revolut: "Revolut", belfius: "Belfius", falco: "Falco", ovh: "OVHcloud", gcal: "Google Calendar", fintable: "Fintable", kite: "Kite",
  firecrawl: "Firecrawl", siteio: "siteio", agentio: "agentio" }

// The Grok Bot avatar: a rounded blob with two eyes, in the agent's colour
const blob = (c) => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g transform="rotate(-14 16 16)"><rect x="3" y="5" width="26" height="22" rx="10" fill="${c}"/><rect x="11.5" y="10" width="3.4" height="7.5" rx="1.7" fill="#fff" transform="rotate(-10 13 14)"/><rect x="18" y="10" width="3.4" height="7.5" rx="1.7" fill="#fff" transform="rotate(-10 19.5 14)"/></g></svg>`)
ICONS.grokbot = blob("#f5ad4a")

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  return "#" + [16, 8, 0].map((b) => Math.round(((n >> b) & 255) * f).toString(16).padStart(2, "0")).join("")
}
const ico = (k) => ICONS[k] ? `<img class="lg" src="${ICONS[k]}" alt="${NAMES[k] || k}" title="${NAMES[k] || k}">` : ""
// logos of a tool step: given by the story, or read from the command
function svcOf(s) {
  if (s.svc) return s.svc
  const m = s.run.match(/^agentio (\w+)/)
  if (m) return m[1] === "update" ? ["agentio"] : [m[1]]
  return /^siteio /.test(s.run) ? ["siteio"] : []
}

const SKINS = [
  { id: "claude", name: "Claude", ph: "Reply…", icon: "claude" },
  { id: "chatgpt", name: "ChatGPT", ph: "Ask anything", icon: "chatgpt" },
  { id: "grok", name: "Grok Bot", ph: "", icon: "grokbot" },
]

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))
// the little Markdown the stories use: **bold**, `code`, lists and quotes
function md(src) {
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`(.+?)`/g, "<code>$1</code>")
  let html = "", list = null, quote = []
  const flush = () => {
    if (list) { html += `<${list.t}>${list.items.map((i) => `<li>${i}</li>`).join("")}</${list.t}>`; list = null }
    if (quote.length) { html += `<blockquote>${quote.join("<br>")}</blockquote>`; quote = [] }
  }
  for (const line of src.split("\n")) {
    let m
    if ((m = line.match(/^- (.*)/)) || (m = line.match(/^\d+\. (.*)/))) {
      const t = line.startsWith("- ") ? "ul" : "ol"
      if (quote.length || (list && list.t !== t)) flush()
      list = list || { t, items: [] }; list.items.push(inline(m[1]))
    } else if ((m = line.match(/^> ?(.*)/))) {
      if (list) flush(); quote.push(inline(m[1]))
    } else { flush(); if (line.trim()) html += `<p>${inline(line)}</p>` }
  }
  flush()
  return html
}

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
const GLOBE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/></svg>`
const MIC = `<svg width="14" height="18" viewBox="0 0 14 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="4" y="1" width="6" height="10" rx="3"/><path d="M1 8a6 6 0 0 0 12 0M7 14v3"/></svg>`
const WAVE = `<svg class="wave" width="16" height="14" viewBox="0 0 16 14" fill="#fff"><rect x="0" y="5" width="2" height="4" rx="1"/><rect x="3.5" y="2" width="2" height="10" rx="1"/><rect x="7" y="0" width="2" height="14" rx="1"/><rect x="10.5" y="3" width="2" height="8" rx="1"/><rect x="14" y="5" width="2" height="4" rx="1"/></svg>`

function mount(root) {
  const stories = root.dataset.stories.split(",").map((id) => {
    const story = STORIES.find((s) => s.id === id.trim())
    if (!story) throw new Error(`chats: unknown story "${id}"`)
    return story
  })
  root.innerHTML = `
    <div class="picks">${stories.map((s) => `<button class="pick" data-id="${s.id}"><span class="logos">${s.svcs.map(ico).join("")}</span><b>${esc(s.title)}</b></button>`).join("")}</div>
    <div class="bar">
      <span class="lbl">Shown as</span>
      <div class="seg">${SKINS.map((s) => `<button data-skin="${s.id}">${ico(s.icon)}${s.name}</button>`).join("")}</div>
      <div class="ctl"><button data-pause>Pause</button><button data-speed>1×</button><button data-replay>Replay</button></div>
    </div>
    <div class="win">
      <div class="whead"><span class="dots"><i></i><i></i><i></i></span><span class="pill"><span class="av"></span><span class="tt"><b></b></span></span></div>
      <div class="scroll"><div class="col"></div></div>
      <div class="comp"><div class="box"><span class="plus">+</span><span class="txt"></span><span class="mic">${MIC}</span><span class="send" aria-hidden="true"><span>↑</span>${WAVE}</span></div></div>
    </div>
    <div class="progress"><i></i></div>
    <p class="hook"></p>
    <div class="cmds"></div>`
  const $ = (sel) => root.querySelector(sel)
  const win = $(".win"), col = $(".col"), scroller = $(".scroll"), composer = $(".comp .txt")

  let skin = "claude", current = stories[0], run = 0, paused = false, speed = 1, lastWho = null

  function wait(ms) {
    const my = run
    return new Promise((resolve, reject) => {
      let left = reduced ? 0 : ms / speed
      const tick = () => {
        if (my !== run) return reject("cancel")
        if (paused) return setTimeout(tick, 100)
        if (left <= 0) return resolve()
        const step = Math.min(left, 50); left -= step; setTimeout(tick, step)
      }
      tick()
    })
  }
  const scrollDown = () => { scroller.scrollTop = scroller.scrollHeight }
  // Grok Bot hides tool steps: while they run, the agent shows "…" in the chat instead (see chats.css)
  const working = document.createElement("div")
  working.className = "row ai working"
  working.innerHTML = `<div class="body"><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div></div>`
  const add = (el) => {
    if (!el.classList.contains("tool")) working.remove()
    // tool steps go in before the dots, so the dots stay last without restarting their animation
    col.insertBefore(el, working.isConnected ? working : null)
    if (el.classList.contains("tool") && !working.isConnected) col.appendChild(working)
    scrollDown(); return el
  }

  function row(who) {
    const el = document.createElement("div")
    el.className = `row ${who}` + (lastWho === who ? " cont" : "")
    lastWho = who
    el.innerHTML = `<div class="body"><div class="bub"></div></div>`
    return add(el).querySelector(".bub")
  }

  async function typeComposer(text) {
    const per = Math.max(12, Math.min(35, 1600 / text.length))
    for (let i = 1; i <= text.length; i++) { composer.textContent = text.slice(0, i); await wait(per) }
    await wait(350)
    composer.textContent = ""
  }

  function setHead() {
    const grok = skin === "grok"
    $(".whead b").textContent = grok ? current.agent : current.chat
    $(".whead .av").innerHTML = grok ? `<img src="${blob(current.color)}" alt="">` : ""
    // Grok Bot paints my messages in a darker shade of the agent's colour
    win.style.setProperty("--me", shade(current.color, 0.75))
    composer.dataset.ph = grok ? `Message ${current.agent}` : SKINS.find((s) => s.id === skin).ph
  }

  function setSkin(id) {
    skin = id
    win.dataset.skin = id
    root.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("on", b.dataset.skin === id))
    setHead()
    try { localStorage.setItem("hh-skin", id) } catch {}
    scrollDown()
  }

  async function play(story) {
    const my = ++run
    current = story; lastWho = null; paused = false; $("[data-pause]").textContent = "Pause"
    col.innerHTML = ""; composer.textContent = ""
    setHead()
    $(".hook").textContent = story.hook
    const cmds = new Map()
    story.steps.filter((s) => s.via === "agentio" || s.via === "siteio").forEach((s) => cmds.set(s.run.split(" ").slice(0, 3).join(" "), svcOf(s)))
    $(".cmds").innerHTML = [...cmds].map(([c, v]) => `<code>${v.map(ico).join("")}${esc(c)}</code>`).join("")
    root.querySelectorAll(".pick").forEach((b) => b.classList.toggle("on", b.dataset.id === story.id))
    const progress = $(".progress i"), total = story.steps.length
    try {
      for (let i = 0; i < total; i++) {
        const s = story.steps[i]
        progress.style.width = `${(i / total) * 100}%`
        if (s.event) {
          const e = document.createElement("div"); e.className = "event"; e.innerHTML = `<span>${esc(s.event)}</span>`
          add(e); lastWho = null; await wait(700)
        } else if (s.me) {
          // the opening message is already sent when the chat starts: no need to look down at the composer
          if (i > 0) await typeComposer(s.me)
          row("me").innerHTML = md(s.me)
          await wait(600)
        } else if (s.ai) {
          const b = row("ai")
          b.innerHTML = `<span class="typing"><i></i><i></i><i></i></span>`; scrollDown()
          await wait(700)
          const words = s.ai.split(/(\s+)/)
          for (let w = 1; w <= words.length; w += 2) { b.innerHTML = md(words.slice(0, w).join("")); scrollDown(); await wait(28) }
          b.innerHTML = md(s.ai); scrollDown()
          await wait(Math.min(2600, 500 + s.ai.length * 12))
        } else if (s.run) {
          // always drawn, so switching skins mid-chat keeps the history; Grok Bot hides it and moves on faster
          const el = document.createElement("div"); el.className = "tool"; el.dataset.via = s.via; lastWho = null
          const svcs = svcOf(s); if (svcs.length) el.classList.add("haslogo")
          el.innerHTML = `<div class="th"><span class="logos">${svcs.map(ico).join("")}</span><span class="ic"></span><span class="cmd"></span><span class="st spin"></span></div><pre class="out"></pre>`
          add(el)
          const cmd = el.querySelector(".cmd")
          const per = Math.max(6, Math.min(18, 700 / s.run.length))
          for (let k = 1; k <= s.run.length; k += 2) { cmd.textContent = s.run.slice(0, k); await wait(per) }
          cmd.textContent = s.run; cmd.title = s.run
          await wait(skin === "grok" ? 250 : 650)
          el.querySelector(".out").textContent = s.out
          el.classList.add("done")
          const st = el.querySelector(".st"); st.classList.remove("spin"); st.classList.add("ok")
          scrollDown()
          await wait(skin === "grok" ? 250 : 650)
        } else if (s.ask) {
          const k = document.createElement("div"); k.className = "ask"; lastWho = null
          k.innerHTML = `<div class="q">${esc(s.ask)}<i>✕</i></div><div class="d">${esc(s.desc)}</div>
            <div class="opts">${s.options.map((o, j) => `<div class="opt"><kbd>${"ABC"[j]}</kbd>${esc(o)}</div>`).join("")}</div>
            <div class="own">Type your own answer</div>`
          add(k)
          await wait(1800)
          k.querySelectorAll(".opt")[s.pick].classList.add("picked")
          await wait(700)
          k.classList.add("done")
          row("me").innerHTML = md(s.options[s.pick])
          await wait(600)
        } else if (s.pv) {
          const w = document.createElement("div"); w.innerHTML = PREVIEWS[s.pv]()
          const link = LINKS[s.pv]
          if (link) {
            w.firstElementChild.classList.add("haslink")
            w.insertAdjacentHTML("beforeend", `<div class="lcard">${GLOBE}<span><b>${esc(link.title)}</b><span>${esc(link.host)}</span></span></div>`)
          }
          [...w.children].forEach(add); lastWho = null; await wait(1500)
        } else if (s.card) {
          const next = stories[(stories.indexOf(story) + 1) % stories.length]
          const c = document.createElement("div"); c.className = "card"
          c.innerHTML = `<div class="k">Result</div><div class="v">${esc(s.card)}</div>
            <div class="stats">${s.stats.map((x) => `<span>${ico(x)}${esc(NAMES[x] || x)}</span>`).join("")}</div>
            <div class="again">${next !== story ? `<button data-id="${next.id}">Next: ${esc(next.title)} →</button>` : ""}<button class="q" data-replay>Replay</button></div>`
          add(c)
        }
      }
      progress.style.width = "100%"
    } catch (e) { if (e !== "cancel") throw e }
  }

  root.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return
    if (t.dataset.id) play(stories.find((s) => s.id === t.dataset.id))
    else if (t.dataset.skin) setSkin(t.dataset.skin)
    else if ("replay" in t.dataset) play(current)
    else if ("pause" in t.dataset) { paused = !paused; t.textContent = paused ? "Play" : "Pause" }
    else if ("speed" in t.dataset) { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; t.textContent = speed + "×" }
  })

  let saved = null; try { saved = localStorage.getItem("hh-skin") } catch {}
  setSkin(SKINS.some((s) => s.id === saved) ? saved : "claude")
  setHead()
  // start the first chat only when it scrolls into view, unless a click already started one
  new IntersectionObserver((entries, observer) => {
    if (!entries.some((en) => en.isIntersecting)) return
    observer.disconnect()
    if (run === 0) play(stories[0])
  }, { threshold: 0.3 }).observe(win)
}

document.querySelectorAll(".chats[data-stories]").forEach(mount)

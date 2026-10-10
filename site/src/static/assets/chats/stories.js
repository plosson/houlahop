/* The stories on the tool pages. Names, numbers and addresses are made up.
   Step types:
   { me } typed by me · { file } attachment from me · { ai } agent message
   { run, out, via, svc } tool call (svc: logos; guessed from the command when absent)
   { ask, desc, options, pick } the agent asks, I pick an option
   { event } time divider · { pv } preview · { card, stats } result */
const STORIES = [
{
  id: "site", color: "#f47a35", tools: ["siteio"], agent: "Dev agent", av: "D", title: "One message, one website",
  chat: "Training site for architects",
  hook: "One sentence. A few minutes later, the code is on GitHub and a sales page with five lessons is online on HTTPS, on my own server.",
  svcs: ["github", "siteio"],
  steps: [
    { me: "build me a site that sells a course to architects who want to use AI for hiring. 5 self-service lessons. deploy it with siteio on hiring.northwind.studio", t: "10:02" },
    { ai: "A sales page plus 5 lessons, live on **hiring.northwind.studio**. On it 🚀" },
    { run: "write the sales page and 5 lessons", via: "task", out: "index.html · lessons/01…05.html\neach lesson: ready-to-use prompts · checklist · quiz · progress saved" },
    { run: "gh repo create northwind/hiring-course --private --source . --push", via: "shell", svc: ["github"], out: "✓ Created repository northwind/hiring-course\n✓ Pushed 14 files" },
    { run: "siteio sites deploy . --name hiring-course", via: "siteio", out: "✓ Deployed hiring-course (version 1)\n  https://hiring-course.mysite.dev" },
    { run: "siteio sites domain add hiring.northwind.studio -n hiring-course", via: "siteio", out: "✓ hiring.northwind.studio → hiring-course\n✓ HTTPS certificate issued" },
    { run: "for p in / /lessons/{01..05}; do curl -so /dev/null -w '%{http_code} ' https://hiring.northwind.studio$p; done", via: "shell", out: "200 200 200 200 200 200" },
    { ai: "It's live 🎉 **https://hiring.northwind.studio**\n1. Writing job descriptions with AI\n2. Automated sourcing\n3. Screening CVs and portfolios\n4. Interviews and assessments\n5. The full pipeline, up to onboarding\n\nFor now the Buy button gives direct access.", t: "10:09" },
    { pv: "site" },
    { ask: "Add Stripe so the course really sells?", desc: "I'd create the product and wire the Buy button to checkout.", options: ["Yes, set it up", "Later", "No"], pick: 1, t: "10:11" },
    { card: "1 message → code on GitHub and a live HTTPS site with a sales page and 5 lessons.", stats: ["github", "siteio"] },
  ]
},
{
  id: "vat", color: "#ef4f5f", tools: ["agentio"], agent: "Accounting agent", av: "A", title: "Everything my accountant needs for the VAT return",
  chat: "Q3 VAT return",
  hook: "One message. Invoices, bank statements and receipts come from Gmail, Falco, Revolut, Belfius and the OVH portal, and land in my accountant's Drive folder.",
  svcs: ["gmail", "falco", "revolut", "belfius", "gdrive", "gsheets", "ovh"],
  steps: [
    { me: "my Q3 VAT return is due soon. gather every document my accountant needs: purchase and sales invoices, bank statements, receipts. put them in the Drive folder they shared with me", t: "10:20" },
    { run: "agentio gmail search --query \"from:martin-co.example newer_than:30d\"", via: "agentio", out: "3 messages\nOct 1 · \"Q3 VAT: documents needed by Oct 10\" · Drive link" },
    { ai: "Your accountant's Oct 1 email asks for the Q3 documents by **Oct 10**, in the Drive folder they shared in June. I'll follow its structure." },
    { run: "agentio gdrive folders --parent 1Qx…", via: "agentio", out: "Purchases/ · Sales/ · Bank statements/" },
    { run: "agentio falco peppol sync --since 2026-07-01 --extract-pdf --output q3/purchases", via: "agentio", out: "31 purchase invoices · 31 PDFs" },
    { run: "agentio falco invoices sync --since 2026-07-01 --output q3/sales", via: "agentio", out: "14 sales invoices" },
    { run: "agentio revolut transactions --from 2026-07-01 --to 2026-09-30 --format csv", via: "agentio", out: "412 transactions · 12 receipts downloaded" },
    { run: "agentio gdrive put q3/… --folder <Purchases|Sales|Bank statements>", via: "agentio", out: "57 files uploaded · nothing overwritten" },
    { ai: "Done 📂 **57 documents filed.** Still missing: two utility bills and a car lease invoice. I'll watch for them." },
    { me: "now check that every payment from Belfius and Revolut has a receipt. one line per payment", t: "10:31" },
    { run: "agentio gsheets create \"Bank reconciliation Q3\" --sheets Belfius,Revolut,Sources", via: "agentio", out: "✓ spreadsheet created" },
    { run: "agentio gsheets get 1Bf… \"Belfius!A:F\"   (bank feed by Fintable)", via: "agentio", svc: ["gsheets", "fintable", "belfius"], out: "188 Belfius payments in Q3" },
    { run: "agentio gmail search --query \"<merchant> <amount> after:2026/07/01\"   (×86, one per payment without a receipt)", via: "agentio", out: "79 receipts found → saved to Drive, linked in the sheet\n7 left: OVH invoices, only in the OVH customer portal" },
    { pv: "sheet" },
    { ai: "7 payments are **OVH** hosting invoices. They only live in the OVH customer portal. Sign me in through this secure form and I'll fetch them in my own browser 🔒" },
    { pv: "ovhLogin" },
    { me: "done", t: "10:44" },
    { run: "manager.ovh.com → Billing → download Q3 invoices", via: "browser", svc: ["ovh"], out: "18 PDFs downloaded" },
    { run: "agentio gdrive put invoices/*.pdf --folder <Purchases>", via: "agentio", out: "18 files uploaded · 7 payments justified" },
    { ai: "Every payment now has a receipt or a comment ✅ I also filled a **Sources** tab: for each of 161 merchants, where to find the invoice next time. Next quarter will be much faster." },
    { card: "57 documents filed, every payment justified, 18 invoices fetched from the OVH portal.", stats: ["gmail", "falco", "revolut", "belfius", "gdrive", "gsheets", "ovh"] },
  ]
},
{
  id: "booking", color: "#e86aa6", tools: ["agentio"], agent: "Errands agent", av: "E", title: "It books my slot on a real website",
  chat: "Recycling park",
  hook: "The agent signs in to a booking website in its own browser, picks the slot, and puts it in my calendar.",
  svcs: ["gcal"],
  steps: [
    { me: "book me a slot at the recycling park, Saturday at noon", t: "09:12" },
    { ai: "Sure. I'll do it on the park's booking website, in my own browser. I need your login: use this secure form, it never shows up in the chat 🔒" },
    { pv: "parkLogin" },
    { me: "done", t: "09:13" },
    { run: "open the recycling park website → sign in", via: "browser", out: "✓ signed in" },
    { run: "bookings → Saturday → 12:00 → confirm", via: "browser", out: "✓ \"Thank you for your reservation\"" },
    { ai: "Booked ✅ **Saturday, 12:00 to 12:15**, at your usual park. Here's the confirmation 👇", t: "09:14" },
    { pv: "booked" },
    { me: "remember this, I go there all the time", t: "09:15" },
    { run: "save: booking website, usual park, account (never the password)", via: "memory", out: "✓ saved" },
    { ai: "Noted. Next time, just tell me the day and time." },
    { me: "add it to my calendar", t: "09:16" },
    { run: "agentio gcal create --summary \"Recycling park\" --from 2026-10-17T12:00:00+02:00 --to 2026-10-17T12:15:00+02:00 --send-updates none", via: "agentio", out: "✓ event created · no invites sent" },
    { ai: "It's in your calendar 📅 Don't forget the old printer!" },
    { card: "A slot booked on a real website and added to my calendar, in under a minute of my time.", stats: ["gcal"] },
  ]
},
{
  id: "deals", color: "#5ec4b6", tools: ["agentio"], agent: "Deal agent", av: "D", title: "A deal room built in one morning",
  chat: "Buying a company in 2027",
  hook: "\"I want to buy a company in 2027.\" It scans the listing sites, then builds the tracker, one research file per company and the folder that holds them.",
  svcs: ["firecrawl", "gsheets", "gdocs", "gdrive"],
  steps: [
    { me: "I want to buy a Belgian SME in 2027, budget €1–3M. watch the market for me", t: "09:02" },
    { run: "scan 7 Belgian business-for-sale sites", via: "task", svc: ["firecrawl"], out: "12 leads in your range · 2 distressed sales" },
    { ai: "First sweep done: **12 leads** in your range, plus 2 distressed sales. Top pick: a plumbing and HVAC installer in Hainaut, about 20 staff.\n\nI'll run this every weekday morning at 8:00." },
    { me: "make a google sheet tracking every company, with a link to the source", t: "09:13" },
    { run: "agentio gsheets create \"Deal tracker\" --sheets Leads,Distressed", via: "agentio", out: "✓ spreadsheet created" },
    { run: "agentio gsheets append 1Dt… \"Leads!A:H\" --values-json @leads.json", via: "agentio", out: "+12 rows (Leads) · +2 rows (Distressed)" },
    { me: "also one google doc per company: market, competitors, history, management. same structure every time", t: "09:39" },
    { run: "agentio gdocs create --title \"00 · How to write a company file\" --content @process.md", via: "agentio", out: "✓ 11 fixed sections · rule: \"not found\", never invent" },
    { run: "research 14 companies: listing, market, competitors", via: "task", svc: ["firecrawl"], out: "14 research notes" },
    { run: "agentio gdocs create --title \"Company file · HVAC, Hainaut\" --content @file-01.md   (×14)", via: "agentio", out: "✓ 14 documents" },
    { run: "agentio gsheets update 1Dt… \"Leads!I2:I15\" --values-json @doc-links.json", via: "agentio", out: "✓ each company links to its file" },
    { pv: "tracker" },
    { me: "put everything in a \"project 2027\" folder", t: "09:42" },
    { run: "agentio gdrive folders --query \"name = 'project 2027'\"", via: "agentio", out: "no folder found" },
    { ai: "There's no \"project 2027\" folder yet." },
    { ask: "Create the \"project 2027\" folder?", desc: "Then I move the tracker, the process and the 14 company files into it.", options: ["Yes, create it", "No, use another folder", "Not now"], pick: 0, t: "09:42" },
    { run: "agentio gdrive mkdir \"project 2027\" && agentio gdrive move <file> <folder>   (×3)", via: "agentio", out: "✓ tracker, process and company files moved" },
    { ai: "All set 📁 Every weekday morning, new leads go into the sheet, with no duplicates, and each one gets its own file." },
    { card: "One sentence → a tracker, 14 research files and a tidy Drive folder, refreshed every morning.", stats: ["firecrawl", "gsheets", "gdocs", "gdrive"] },
  ]
},
{
  id: "health", color: "#9b7bf0", tools: ["agentio"], agent: "Family agent", av: "F", title: "Health insurance, explained on one page",
  chat: "Mary's health cover",
  hook: "A broker's email, the current policy in Dropbox and official sources become one page that anyone in the family can read.",
  svcs: ["gmail", "dropbox", "kite"],
  steps: [
    { me: "check Mary's latest email, read the health insurance proposal and compare it with what she has now (it's in Dropbox). what do you think?", t: "18:20" },
    { run: "agentio gmail search --query \"Medicare Supplement newer_than:7d\"", via: "agentio", out: "1 thread · from her broker · proposal.pdf" },
    { run: "agentio gmail attachment 19a3… --output proposal/", via: "agentio", out: "proposal.pdf · Plan G from Jan 1" },
    { run: "agentio dropbox search --query \"health\" --path /Family/Mary", via: "agentio", out: "current-plan-letter.pdf · belgian-policy-terms.pdf" },
    { run: "agentio dropbox download /Family/Mary/current-plan-letter.pdf", via: "agentio", out: "✓ 2 files read" },
    { ai: "**Bottom line: I agree with the broker.** Moving Mary from her HMO-style plan to Original Medicare plus **Plan G** fits how she lives: two states, several specialists, no referrals.\n- ⚠️ Plan G doesn't cover **drugs**, so she needs a Part D plan before Dec 7.\n- ⚠️ Keep the Belgian policy for now.", t: "18:24" },
    { me: "her current setup was chosen carefully. why would it be worse? what's the catch?", t: "18:27" },
    { ai: "No catch, it's a trade-off. The current setup is built for **one home state plus a Belgian safety net**. The new one is built for **freedom anywhere in the US**. The price: **higher premiums, drugs and dental become separate**, and don't drop the Belgian policy until the new setup is proven." },
    { me: "make it a visual page on Kite. start with Medicare A/B/C/D for dummies", t: "18:30" },
    { run: "agentio kite publish mary-health.html --title \"Mary's health cover\"", via: "agentio", out: "✗ A new document needs --description and --summary" },
    { run: "agentio update", via: "agentio", out: "✓ agentio updated to the latest version" },
    { run: "agentio kite publish mary-health.html --title \"Mary's health cover\" --description … --summary-file summary.txt", via: "agentio", out: "✓ published · private link" },
    { ai: "Here it is 👉 **Mary's health cover**\nIt opens with \"Path 1 vs Path 2\", then one card per Medicare letter, then a scorecard. At the end, **10 real-life events** (a broken hip, a heart attack while travelling, expensive drugs…) show who pays in each setup.", t: "18:36" },
    { pv: "kite" },
    { card: "An email, a Dropbox folder and official sources → one page the family can read.", stats: ["gmail", "dropbox", "kite"] },
  ]
},
];

// Grok Bot shows a shared link as a small card (title + domain) instead of a preview
const LINKS = {
  site: { title: "Hire better with AI", host: "hiring.northwind.studio" },
  tracker: { title: "Deal tracker", host: "docs.google.com" },
  kite: { title: "A private artifact", host: "Kite" },
  sheet: { title: "Bank reconciliation Q3", host: "docs.google.com" },
};

// A secure form: the password goes to the agent and never appears in the chat
const login = (logo, name) => `<div class="pv"><div class="secure"><b>🔒 Secure form · ${logo} ${name}</b><span style="color:#666;font-size:12px">The agent gets the password. It never appears in the chat.</span><div class="f">email ··········</div><div class="f">password ●●●●●●●●●●</div><span class="ok">Sent ✓</span></div></div>`

const PREVIEWS = {
  site: () => `<div class="pv"><div class="url">🔒 <i>hiring.northwind.studio</i></div>
    <div class="site-hero"><span>A course for architecture studios</span><b>Hire better with AI.<br>Five lessons. No fluff.</b><em>Get the course</em></div>
    <div class="lessons"><div>1 · Writing job descriptions with AI<span>200</span></div><div>2 · Automated sourcing<span>200</span></div><div>3 · Screening CVs and portfolios<span>200</span></div><div>4 · Interviews and assessments<span>200</span></div><div>5 · The full pipeline<span>200</span></div></div></div>`,
  tracker: () => `<div class="pv"><div class="pvh">${ico("gsheets")}Deal tracker</div><div class="tabs"><span class="on">Leads</span><span>Distressed</span></div><div class="sheet s5">
    <div class="r h"><span>Sector</span><span>Region</span><span>Staff</span><span>Price</span><span>File</span></div>
    <div class="r"><span>Plumbing & HVAC</span><span>Hainaut</span><span>~20</span><span>€1.4M</span><span class="lk">${ico("gdocs")}open</span></div>
    <div class="r"><span>Fleet wrapping</span><span>Flemish Brabant</span><span>~8</span><span>€1.1M</span><span class="lk">${ico("gdocs")}open</span></div>
    <div class="r"><span>Healthy meals</span><span>Liège</span><span>~12</span><span>€1.0M</span><span class="lk">${ico("gdocs")}open</span></div>
    <div class="r"><span>Industrial cleaning</span><span>Antwerp</span><span>~30</span><span>€2.6M</span><span class="lk">${ico("gdocs")}open</span></div></div></div>`,
  kite: () => `<div class="pv"><div class="url">${ico("kite")}<i>Mary's health cover · private</i></div><div class="kite">
    <b>Medicare for dummies</b><div class="abcd"><span><em>A</em>Hospital</span><span><em>B</em>Doctors</span><span><em>C</em>All-in-one plans</span><span><em>D</em>Drugs</span></div>
    <div class="paths"><div><small>Path 1 · today</small>HMO-style plan + Belgian policy</div><div><small>Path 2 · proposed</small>Original Medicare + Plan G + Part D</div></div></div></div>`,
  sheet: () => `<div class="pv"><div class="pvh">${ico("gsheets")}Bank reconciliation Q3</div><div class="tabs"><span class="on">Belfius</span><span>Revolut</span><span>Sources</span></div><div class="sheet s4">
    <div class="r h"><span>Date</span><span>Merchant</span><span>Amount</span><span>Receipt / comment</span></div>
    <div class="r g"><span>07-03</span><span>Office supplies</span><span>-42.10</span><span>receipt ↗</span></div>
    <div class="r g"><span>07-08</span><span>SNCB train tickets</span><span>-86.00</span><span>receipt ↗</span></div>
    <div class="r y"><span>07-11</span><span>Transfer to Revolut</span><span>-500.00</span><span>internal transfer, no receipt</span></div>
    <div class="r g"><span>07-15</span><span>Software licence</span><span>-29.00</span><span>receipt ↗</span></div>
    <div class="r"><span>07-19</span><span>OVH</span><span>-24.19</span><span>in the OVH portal…</span></div></div></div>`,
  ovhLogin: () => login(ico("ovh"), "OVH sign-in"),
  parkLogin: () => login("♻️", "Recycling park sign-in"),
  booked: () => `<div class="pv"><div class="url">🔒 <i>Recycling park · bookings</i></div><div class="booked"><b>✓ Thank you for your reservation</b><span>Saturday · 12:00 to 12:15</span><span>Your usual park · bring your ID card</span></div></div>`,
};

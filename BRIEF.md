# Design Brief — houlahop.com

## Vision

houlahop.com is one site for all my tools. It shows the open-source tools I built for my AI agents. It also lists a few small utilities I use myself.

This is **not**:

- A personal portfolio
- A developer résumé
- A blog
- A GitHub profile
- A documentation site

It is a **problem-oriented catalog of tools**.

The primary goal is to show what my AI agents can do for me.

When someone leaves the site, they should think:

> "I didn't realize AI agents could do that."

The secondary goal is:

> "I want to use one (or more) of these tools."

The way to install a tool is to ask an agent. Each tool has a prompt to paste into an agent. Manual install steps are one click away.

---

# Core Philosophy

The site shows the tools I use. It speaks in the first person. It does not try to convince anyone.

The site is **not about my career**.

The site is **not about the code**.

The site is about the **problems my agents solve**.

The repositories are simply implementations of those tools.

Every tool page should answer four questions:

1. What problem exists?
2. Why is this difficult for AI agents?
3. How does this project solve it?
4. How can I start using it?

---

# Target Audience

Primary audience:

- AI engineers
- Agent builders
- Automation engineers
- Developers integrating LLMs
- Companies building autonomous systems

Secondary audience:

- Curious developers interested in what agents can do
- Technical founders
- Early adopters

Not intended for:

- Recruiters
- Employers
- General consumers

---

# Desired User Journey

## Visitor arrives

↓

Reads a simple statement explaining the mission.

↓

Discovers interesting tools for agents.

↓

Thinks:

> "Wait... agents can actually do this?"

↓

Clicks one tool.

↓

Understands the problem immediately.

↓

Realizes this solves a problem they have.

↓

Pastes the install prompt into an agent, or visits GitHub.

↓

Explores the remaining tools.

---

# Information Architecture

Home

├── Tools

│   ├── siteio

│   ├── agentio (with its Mac app, AgentIO Companion)

│   └── pagerio

└── Utilities

    └── Copycat

Tools are for my agents. Utilities are small apps I use myself, not for agents.

Each tool and utility has one page: `/siteio/`, `/agentio/`, `/pagerio/`, `/copycat/`.

No blog.

No timeline.

No résumé.

No personal story.

No "About me" hero.

If an About page exists, it should be minimal.

---

# Homepage

## Hero

A concise mission statement.

Example direction:

> Tools for my AI agents. Open source.

Followed by one line: I built each one for one job. To install one, I ask my agent.

The hero should be short.

No long manifesto.

No biography.

---

# Main Content

Immediately after the hero:

The three tools, each with its app icon and an install prompt.

Each card says what the tool does for me. The tool name and its icon sit above it.

Example structure:

---

**siteio**

My agents put websites and apps online, on my own server.

Prompt: Install siteio by reading and following https://houlahop.com/siteio/skill.md

→ About siteio

---

**agentio**

My agents use my email, Slack, WhatsApp, JIRA and more.

Prompt: Install agentio by reading and following https://houlahop.com/agentio/skill.md

→ About agentio and its Mac app

---

**pagerio**

My agents ring my iPhone and Mac when they need me.

Prompt: ask the agent to page me, with the URL of my pager. The app comes first.

→ About pagerio

---

Below the cards, a **Utilities** list. One row per utility, with its icon, one sentence and a download link. Today: Copycat.

---

# Navigation

Very small.

Example:

Home

siteio, agentio, pagerio

Utilities

GitHub

No unnecessary pages.

---

# Tool Pages

Every tool page follows the same structure.

---

# Hero

Tool name and app icon

What it does for me

One-sentence summary

---

# 1. The Problem

Describe the real-world problem.

Not the technology.

Not the implementation.

The visitor should immediately recognize the situation.

Example:

> Most AI coding agents stop after generating code.
>
> Delivering a complete application to a non-technical client—including deployment, accessibility, and iteration—is still largely a manual process.

---

# 2. The Solution

Explain how the project solves that problem.

Focus on outcomes.

Avoid implementation details.

---

# 3. When to Use It

Concrete scenarios.

For example:

Use siteio when your agents need to:

- Build customer websites
- Deliver internal tools
- Create dashboards
- Iterate with non-technical users

---

# 4. Features

Simple list.

No marketing fluff.

---

# 5. Getting Started

The install prompt comes first. Manual install steps come next.

GitHub

Documentation

Examples

---

# 6. Future Work (optional)

Possible roadmap.

Future integrations.

Related tools.

---

# Writing Style

The tone should be:

Practical.

Direct.

Honest.

Engineering-focused.

First person. I describe what I use.

Plain language (ISO 24495-1). One sentence per idea.

Avoid:

- hype
- buzzwords
- exaggerated AI claims
- startup marketing language

The visitor should feel:

> "Someone built this after running into a real problem."

---

# Visual Style

The design is called Swatch v4. The reference is `docs/design/swatch-v4.html`.

Overall feeling:

Minimal.

Calm.

Confident.

Product-focused.

Light page. Grey chrome. Each tool owns one colour tint. The tint shows on its card and its page.

App icons carry the identity of each tool and utility.

No flashy gradients.

No AI clichés.

No giant illustrations of robots.

No "future" aesthetics.

Rather than:

- Product Hunt
- Crypto landing pages
- AI startup templates

---

# Design Principles

Every section should answer:

"Why should I care?"

before

"How does it work?"

Problem first.

Implementation second.

---

# What NOT to Emphasize

Avoid making the site about:

- myself
- years of experience
- career
- achievements
- GitHub statistics
- followers
- star counts

The projects should stand on their own.

---

# Brand Positioning

This is **not** a portfolio.

It is the set of tools I built for my AI agents, plus a few utilities.

The tools are independent. Each one works alone.

Together, they show what agents can do when given the right interfaces.

---

# Current Tools

## siteio

What it does:

My agents put websites and apps online, on my own server.

Core message:

> Let your agent deliver complete software projects, not just generate code.

---

## agentio

What it does:

My agents use my email, Slack, WhatsApp, JIRA and more, through one CLI. A Mac app, AgentIO Companion, comes with it.

Core message:

> Give your agents one way to communicate everywhere.

---

## pagerio

What it does:

My agents ring my iPhone and Mac when they need me. The app is at pagerio.houlahop.com, and the Mac app downloads from GitHub.

Core message:

> Your agent pages you when it needs you.

---

# Utilities

## Copycat

What it does:

Copy a GIF or a video from a web page and paste it anywhere, still animated. Mac app.

Utilities are for me, not for agents. They are listed below the tools.

---

# Success Criteria

A successful visitor should leave thinking:

> "I didn't know AI agents could solve these kinds of problems."

And ideally:

> "I can use one of these tools with my own agents."

Everything on the site should reinforce those two outcomes.

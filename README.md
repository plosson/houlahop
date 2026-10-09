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

# Fog

A second-monitor Terraria companion for the [WebMCP Challenge](https://webmcp.devpost.com/). The page exposes structured tools to ChatGPT or Codex so you can ask crafting, housing, and progression questions without alt-tabbing to a spoiler-heavy wiki.

**Stack:** Vite · React · TypeScript · WebMCP (`document.modelContext.registerTool`) · static deploy (Vercel)

## Where to build what

| Work | Where |
| --- | --- |
| All source code, data, tests | **Cursor / this repo** |
| Live URL for judges | **Vercel** (or Netlify / Cloudflare Pages) |
| Real WebMCP testing | **Your machine** — ChatGPT desktop in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` |

Cursor runs the dev server for UI work. WebMCP site tools are validated on the **deployed HTTPS URL**, not only on localhost.

## Quick start (Cursor or local)

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:43123 — UI only. WebMCP requires a secure context (localhost or HTTPS).

```bash
npm run build    # production bundle → dist/
npm run preview  # serve dist/ locally
```

## Deploy (Vercel — recommended)

1. Push this repo to **public GitHub** with this `LICENSE` visible in the repo About section.
2. [vercel.com/new](https://vercel.com/new) → Import repo → Framework preset **Vite** → Deploy.
3. Copy the production URL (e.g. `https://fog-xxx.vercel.app`).

No server, env vars, or database required for the MVP.

## Test WebMCP (required before submit)

### ChatGPT desktop (primary judging surface)

1. Install/update the **ChatGPT desktop app**.
2. Use **GPT-5.6 Sol or Terra** (Luna disables WebMCP).
3. Open the **built-in browser** → your deployed URL.
4. Address bar → **Site tools** → confirm tools like `get_progress` and `next_step_hint`.
5. Ask: *"What's my progress and give me a nudge for what to do next?"*

### Chrome (debugging)

1. Chrome 149+ → `chrome://flags/#enable-webmcp-testing` → **Enabled** → relaunch.
2. Open the deployed URL.
3. Optional: [Model Context Tool Inspector](https://github.com/beaufortfrancois/model-context-tool-inspector) extension.

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for the four-layer design (data → core → webmcp → ui).

**WebMCP tools (9 total):**

| Always available | Stage-scoped (re-registered on progress change) |
| --- | --- |
| `get_progress`, `set_progress`, `set_inventory`, `check_housing`, `log_discovery`, `get_discovery_log` | `what_can_i_craft`, `recipe_for`, `next_step_hint` |

Try in ChatGPT: *"Set my inventory to 30 iron bar and 40 wood, then what can I craft?"*

```
src/
  webmcp/          # Tool registration (document.modelContext)
  data/            # Stage-tagged game data (recipes, hints)
  lib/             # Gating engine, housing rules (pure functions)
  App.tsx          # Companion UI
.cursor/
  environment.json # Cloud Agent: npm ci + Vite on :43123
vercel.json        # Static SPA deploy
```

## Hackathon submission checklist

- [ ] Live HTTPS URL works in ChatGPT browser or Chrome + WebMCP flag
- [ ] Public GitHub repo with OSS license in About
- [ ] README explains WebMCP fit and how to test
- [ ] <3 min YouTube demo with audio
- [ ] Devpost description: fit, UX, human+agent together, implementation notes
- [ ] Freeze repo + site after deadline (Sep 3, 2026 1:00 pm PDT)

## Data licensing

Game reference data may be derived from the [Terraria Wiki](https://terraria.wiki.gg/) (CC BY-NC-SA 4.0). Attribute in `data/README.md` when you add curated exports. Application code is MIT.

## License

MIT — see [LICENSE](./LICENSE).

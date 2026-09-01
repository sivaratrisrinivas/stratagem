# Fog architecture

Simple four-layer stack. Each layer only talks to the one below it.

```
Agent (ChatGPT / Codex)
        │  WebMCP tool calls
        ▼
┌───────────────────┐
│  webmcp/          │  Thin adapters: schemas, execute(), stage-scoped registration
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  core/            │  Pure TypeScript: gating, recipes, housing, hints, progress
└─────────┬─────────┘  No React. No WebMCP. Unit-testable.
          │
          ▼
┌───────────────────┐
│  data/*.json      │  Static game catalog (stages, recipes, hints)
└───────────────────┘

┌───────────────────┐
│  ui/ + hooks/     │  React shell — calls the same core/ APIs as WebMCP tools
└───────────────────┘
```

## Design rules

1. **Single source of truth** — `core/progress.ts` persists player state (stage, inventory, discoveries). WebMCP tools and UI both read/write through core.
2. **Gating in core, not in the agent** — `core/gating.ts` decides what content is unlocked. WebMCP registers tools per stage so the agent literally cannot call locked capabilities.
3. **Data scales by adding JSON** — new recipes, stages, or hint text = new rows in `src/data/`, no structural changes.
4. **No backend for MVP** — static SPA on Vercel. Optional later: share links via KV/D1 without changing core.

## Tool lifecycle

| Scope | Tools | Registration |
| --- | --- | --- |
| Always | `get_progress`, `set_progress`, `set_inventory`, `check_housing`, `log_discovery`, `get_discovery_log` | Base `AbortController` |
| Per stage | `what_can_i_craft`, `recipe_for`, `next_step_hint` | Stage `AbortController`; aborted and re-registered when progress changes |

On `set_progress`, the page fires `toolchange` (via re-registration) so agents refresh available tools.

## Adding content later

- **More recipes** → `data/recipes.json`
- **New boss stage** → `data/stages.json` + hints entry
- **Second game** → `data/games/terraria/…` + game picker in UI (core API unchanged)

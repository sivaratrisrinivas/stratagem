# Testing Fog (for judges and builders)

Fog is a static SPA. WebMCP tools register on page load via `document.modelContext.registerTool`.

## Requirements

- **ChatGPT desktop app** with built-in browser, **GPT-5.6 Sol or Terra**, ChatGPT Work or Codex  
  **or**
- **Chrome 149+** with `chrome://flags/#enable-webmcp-testing` enabled

## Quick verify (30 seconds)

1. Open the deployed URL.
2. Confirm the page shows **11 tools registered** (8 base + 3 stage) at pre-Eye stage.
3. In ChatGPT, open Site tools in the address bar — you should see tools including `load_demo_scenario`.
4. Paste this prompt:

```
Load demo scenario guide_house. Then check housing: 70 tiles, walls yes, door yes, light no, chair yes, work bench yes. What should I craft to fix it?
```

Expected: agent calls `load_demo_scenario`, then `check_housing`, identifies missing light, suggests torch/lantern.

## Demo scenario 2 — crafting

```
Load demo scenario iron_crafting. What can I craft now and what's one step away?
```

Expected: `what_can_i_craft` returns craftable items (torch, work bench, etc.) and nearby (anvil, furnace).

## Demo scenario 3 — progress unlock

1. Note tool count / stage-scoped tools at pre-Eye.
2. Prompt:

```
Load demo scenario post_eye_unlock. What stage am I at and what hint do you have for me?
```

Expected: stage `post_eye`, post-Eye hint text, worm food recipe visible in craft lists.

## Tool reference

| Tool | Read/Write | Purpose |
| --- | --- | --- |
| `get_progress` | read | Stage, bosses, inventory summary |
| `set_progress` | write | Update stage / tier / boss |
| `set_inventory` | write | Set items from names or ids |
| `check_housing` | read | Validate NPC house rules |
| `what_can_i_craft` | read | Craftable + nearby recipes |
| `recipe_for` | read | Single recipe lookup |
| `next_step_hint` | read | Spoiler-tier progression hint |
| `load_demo_scenario` | write | Load judge demo state |
| `reset_progress` | write | Clear to fresh run |
| `log_discovery` / `get_discovery_log` | write/read | Session notes |

Stage-scoped tools (`what_can_i_craft`, `recipe_for`, `next_step_hint`) re-register when progress changes via `set_progress`, boss defeat, or demo load.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| No Site tools arrow | Wrong browser/model; use ChatGPT desktop + Sol/Terra |
| Tools not discovered | Hard refresh; ensure HTTPS URL |
| Agent answers from memory | Ask it to call Fog tools first; page data is authoritative |
| `LOCKED` response | Player hasn't reached that stage — call `set_progress` or defeat boss |

## Local dev

```bash
npm ci && npm run dev
```

UI works at http://127.0.0.1:43123. WebMCP requires secure context (localhost or deployed HTTPS).

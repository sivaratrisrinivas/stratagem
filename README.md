# Fog

Second-monitor Terraria companion. You mark bosses and inventory. ChatGPT talks to the page through WebMCP. Recipes and hints come from that state. Later stages are not registered as tools, so the agent cannot call them.

Live: https://stratagem-opal.vercel.app

WebMCP: document.modelContext.registerTool({ name, description, inputSchema, execute })

Eleven tools. Eight always on (get_progress, set_progress, set_inventory, check_housing, log_discovery, get_discovery_log, load_demo_scenario, reset_progress). Three swap with stage (what_can_i_craft, recipe_for, next_step_hint).

## Run

    npm ci
    npm run dev

http://127.0.0.1:43123 — UI only. WebMCP needs HTTPS or localhost.

    npm run build && npm run preview

Vite + React + TypeScript. Static host (this one is Vercel). No env vars, no database.

## Test (judges)

ChatGPT desktop, Sol or Terra, in-app browser — or Chrome 149+ with chrome://flags/#enable-webmcp-testing.

1. Open the live URL. Site tools should appear.
2. Load demo scenario guide_house. Check housing and tell me what to craft. — missing light, torch.
3. Load demo scenario post_eye_unlock. What should I do next?
4. Reset progress. Stage tools lock.

More prompts: TESTING.md

## Layout

    src/webmcp/   registerTool
    src/core/     gating, housing, hints
    src/data/     stages, recipes, items
    src/App.tsx   second-monitor UI

## License

MIT — LICENSE. Recipe/hint text may follow the Terraria Wiki (CC BY-NC-SA 4.0); see src/data/README.md.

Not affiliated with Re-Logic.

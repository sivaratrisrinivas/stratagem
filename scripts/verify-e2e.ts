/**
 * End-to-end verification for Fog — run: npx tsx scripts/verify-e2e.ts
 */

// Mock browser APIs before any module reads localStorage at import time
const store: Record<string, string> = {};
(globalThis as typeof globalThis & { localStorage: Storage }).localStorage = {
  get length() {
    return Object.keys(store).length;
  },
  key: (i: number) => Object.keys(store)[i] ?? null,
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => {
    store[k] = String(v);
  },
  removeItem: (k) => {
    delete store[k];
  },
  clear: () => {
    for (const k of Object.keys(store)) delete store[k];
  },
};

const registeredTools = new Map<string, import("../src/webmcp/types").ModelContextTool>();

(globalThis as typeof globalThis & { document: Document }).document = {
  modelContext: {
    registerTool: async (tool, options = {}) => {
      if (options.signal) {
        options.signal.addEventListener("abort", () => {
          registeredTools.delete(tool.name);
        });
      }
      registeredTools.set(tool.name, tool);
    },
    ontoolchange: null,
  },
} as unknown as Document;

(globalThis as typeof globalThis & { window: Window }).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
} as unknown as Window;

import * as gating from "../src/core/gating";
import * as housing from "../src/core/housing";
import * as hints from "../src/core/hints";
import * as recipes from "../src/core/recipes";
import * as progress from "../src/core/progress";
import * as demo from "../src/core/demo";
import * as types from "../src/core/types";
import * as registry from "../src/webmcp/registry";
import * as catalog from "../src/core/catalog";

// ── Test harness ───────────────────────────────────────────────────────────
const results: Array<{ name: string; ok: boolean; detail?: string }> = [];
let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    results.push({ name, ok: true });
  } else {
    failed++;
    results.push({ name, ok: false, detail });
    console.error(`  FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function runTool(name: string, input: Record<string, unknown> = {}) {
  const tool = registeredTools.get(name);
  if (!tool) throw new Error(`Tool not registered: ${name}`);
  return tool.execute(input, { signal: new AbortController().signal });
}

console.log("\n=== Fog E2E Verification ===\n");

// ── 1. Data integrity ──────────────────────────────────────────────────────
console.log("1. Data integrity");
assert("stages loaded (5)", catalog.stages.length === 5);
assert("recipes loaded (>=20)", catalog.recipes.length >= 20);
assert("items loaded (>=30)", catalog.items.length >= 30);
assert("hints for all stages", catalog.stages.every((s) => catalog.hints[s.id]));

// ── 2. Gating ──────────────────────────────────────────────────────────────
console.log("2. Progress gating");
assert("pre_eye unlocks pre_eye content", gating.isStageUnlocked("pre_eye", "pre_eye"));
assert("pre_eye locks post_eye content", !gating.isStageUnlocked("pre_eye", "post_eye"));
const locked = gating.lockContent("pre_eye", "post_wall");
assert("lockContent returns LOCKED", locked?.code === "LOCKED");
assert(
  "highestStageForBosses eye → post_eye",
  gating.highestStageForBosses(["eye_of_cthulhu"]) === "post_eye",
);
assert("highestStageForBosses empty → pre_eye", gating.highestStageForBosses([]) === "pre_eye");

// ── 3. Housing ─────────────────────────────────────────────────────────────
console.log("3. Housing validation");
const guideHouse = housing.validateHousing({
  roomSize: 70,
  hasWalls: true,
  hasDoor: true,
  hasLight: false,
  hasChair: true,
  hasWorkBench: true,
});
assert("guide_house invalid (no light)", !guideHouse.valid);
assert("guide_house issue mentions light", guideHouse.issues.some((i) => /light/i.test(i)));
assert(
  "guide_house fix suggests torch/lantern",
  guideHouse.fixes.some((f) => /torch|lantern/i.test(f)),
);

const validHouse = housing.validateHousing({
  roomSize: 70,
  hasWalls: true,
  hasDoor: true,
  hasLight: true,
  hasChair: true,
  hasWorkBench: true,
});
assert("valid house passes", validHouse.valid);

// ── 4. Recipes ─────────────────────────────────────────────────────────────
console.log("4. Recipe engine");
const ironInv = { iron_bar: 30, wood: 40, gel: 10, stone_block: 25 };
const craftList = recipes.listCraftable("pre_eye", ironInv);
assert("listCraftable returns array", Array.isArray(craftList));
const craftable = recipes.craftableNow("pre_eye", ironInv);
assert("iron_crafting has craftable items", craftable.length > 0);
assert("torch craftable with wood+gel", craftable.some((r) => r.id === "torch"));
const nearby = recipes.nearbyCraftable("pre_eye", ironInv);
assert("nearby crafts returned", nearby.length > 0);

const wormLookup = recipes.lookupRecipe("pre_eye", "worm_food");
assert("worm_food LOCKED at pre_eye", types.isLocked(wormLookup));

const wormPost = recipes.lookupRecipe("post_eye", "worm_food");
assert(
  "worm_food found at post_eye",
  wormPost !== null && !types.isLocked(wormPost) && wormPost.id === "worm_food",
);

// ── 5. Hints ─────────────────────────────────────────────────────────────
console.log("5. Spoiler-tier hints");
const nudge = hints.getHint("pre_eye", "nudge");
assert("nudge hint has text", !types.isLocked(nudge) && nudge.text.length > 10);
const futureLocked = hints.getHint("pre_eye", "hint", "post_wall");
assert("future stage hint LOCKED", types.isLocked(futureLocked));

// ── 6. Progress persistence ────────────────────────────────────────────────
console.log("6. Progress state");
localStorage.clear();
const fresh = progress.getProgress();
assert("default stage pre_eye", fresh.stageId === "pre_eye");
progress.setInventoryFromList(["30 iron bar", "40 wood"]);
assert("inventory parse iron_bar", progress.getProgress().inventory.iron_bar === 30);
progress.toggleBossDefeated("eye_of_cthulhu");
assert("boss toggle advances stage", progress.getProgress().stageId === "post_eye");
progress.toggleBossDefeated("eye_of_cthulhu");
assert("boss untoggle reverts stage", progress.getProgress().stageId === "pre_eye");

// ── 7. Demo scenarios ──────────────────────────────────────────────────────
console.log("7. Demo scenarios");
localStorage.clear();
assert("3 demo scenarios", demo.demoScenarios.length === 3);
const scenario = demo.applyDemoScenario("guide_house");
assert("guide_house stage", scenario.state.stageId === "pre_eye");
assert("guide_house inventory wood", progress.getProgress().inventory.wood === 40);
demo.resetFogProgress();
assert("reset clears inventory", Object.keys(progress.getProgress().inventory).length === 0);

// ── 8. WebMCP registration ─────────────────────────────────────────────────
console.log("8. WebMCP tool registration");
registeredTools.clear();
const snap = await registry.initFogWebMcp();
assert("WebMCP supported in mock", snap.webmcpSupported);
assert("8 base tools registered", snap.baseToolCount === 8);
assert("3 stage tools registered", snap.stageToolCount === 3);
assert("11 total tools", registeredTools.size === 11);

const toolNames = [...registeredTools.keys()].sort();
const expected = [
  "check_housing",
  "get_discovery_log",
  "get_progress",
  "load_demo_scenario",
  "log_discovery",
  "next_step_hint",
  "recipe_for",
  "reset_progress",
  "set_inventory",
  "set_progress",
  "what_can_i_craft",
];
assert(
  "all expected tool names",
  JSON.stringify(toolNames) === JSON.stringify(expected),
  `got: ${toolNames.join(", ")}`,
);

// ── 9. WebMCP tool execution ───────────────────────────────────────────────
console.log("9. WebMCP tool execution");

const progResult = (await runTool("get_progress")) as { stageId: string };
assert("get_progress returns stageId", progResult.stageId === "pre_eye");

await runTool("load_demo_scenario", { scenario: "iron_crafting" });
const afterDemo = (await runTool("get_progress")) as { inventory: unknown[] };
assert("load_demo_scenario sets inventory", (afterDemo.inventory?.length ?? 0) > 0);

const housingResult = (await runTool("check_housing", {
  roomSize: 70,
  hasWalls: true,
  hasDoor: true,
  hasLight: false,
  hasChair: true,
  hasWorkBench: true,
})) as { valid: boolean };
assert("check_housing invalid", housingResult.valid === false);

const craftResult = (await runTool("what_can_i_craft")) as {
  craftableNow: unknown[];
};
assert(
  "what_can_i_craft returns craftableNow",
  Array.isArray(craftResult.craftableNow) && craftResult.craftableNow.length > 0,
);

const recipeResult = (await runTool("recipe_for", { query: "torch" })) as {
  id?: string;
  name?: string;
};
assert("recipe_for torch", recipeResult.id === "torch" || Boolean(recipeResult.name));

const hintResult = (await runTool("next_step_hint", { tier: "nudge" })) as {
  text?: string;
  code?: string;
};
assert("next_step_hint text", (hintResult.text?.length ?? 0) > 5 || hintResult.code === "LOCKED");

await runTool("set_progress", { defeatedBoss: "eye_of_cthulhu" });
await registry.refreshStageTools("post_eye");
assert("stage tools still 11 after refresh", registeredTools.size === 11);

const wormRecipe = (await runTool("recipe_for", { query: "worm_food" })) as { id?: string };
assert("post_eye worm_food accessible", wormRecipe.id === "worm_food");

await runTool("log_discovery", { text: "Found spider cave" });
const logResult = (await runTool("get_discovery_log")) as { discoveries: unknown[] };
assert("discovery log has entry", (logResult.discoveries?.length ?? 0) >= 1);

await runTool("reset_progress");
const resetResult = (await runTool("get_progress")) as { stageId: string };
assert("reset_progress clears stage", resetResult.stageId === "pre_eye");

await registry.refreshStageTools("pre_eye");
assert(
  "stage tools re-registered after refresh",
  ["what_can_i_craft", "recipe_for", "next_step_hint"].every((n) => registeredTools.has(n)),
);

// ── Summary ────────────────────────────────────────────────────────────────
console.log("\n=== Summary ===");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  console.log("\nFailures:");
  for (const r of results.filter((x) => !x.ok)) {
    console.log(`  - ${r.name}${r.detail ? `: ${r.detail}` : ""}`);
  }
  process.exit(1);
}
console.log("\nAll checks passed.\n");

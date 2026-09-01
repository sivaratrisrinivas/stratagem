import { applyDemoScenario, resetFogProgress } from "../core/demo";
import { getStage } from "../core/catalog";
import { highestStageForBosses } from "../core/gating";
import { guideHousingTips, validateHousing } from "../core/housing";
import { getHint } from "../core/hints";
import {
  getProgress,
  inventorySummary,
  logDiscovery,
  setInventoryCounts,
  setInventoryFromList,
  setProgress,
  setSpoilerTier,
  setStageId,
} from "../core/progress";
import { listCraftable, lookupRecipe, nearbyCraftable } from "../core/recipes";
import { isLocked } from "../core/types";
import { getModelContext, isWebMcpSupported, type JsonSchema } from "./types";

const emptySchema: JsonSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

let baseController: AbortController | null = null;
let stageController: AbortController | null = null;

export type ToolRegistrationSnapshot = {
  webmcpSupported: boolean;
  baseToolCount: number;
  stageToolCount: number;
  stageId: string;
};

let snapshot: ToolRegistrationSnapshot = {
  webmcpSupported: false,
  baseToolCount: 0,
  stageToolCount: 0,
  stageId: "pre_eye",
};

export function getToolSnapshot(): ToolRegistrationSnapshot {
  return snapshot;
}

export async function initFogWebMcp(): Promise<ToolRegistrationSnapshot> {
  if (!isWebMcpSupported()) {
    snapshot = { webmcpSupported: false, baseToolCount: 0, stageToolCount: 0, stageId: getProgress().stageId };
    return snapshot;
  }

  await registerBaseTools();
  await registerStageTools(getProgress().stageId);

  const modelContext = getModelContext();
  if (modelContext) {
    modelContext.ontoolchange = () => {
      window.dispatchEvent(new CustomEvent("fog:tools-changed"));
    };
  }

  return snapshot;
}

export async function refreshStageTools(stageId: string): Promise<void> {
  if (!isWebMcpSupported()) return;
  stageController?.abort();
  await registerStageTools(stageId);
  window.dispatchEvent(new CustomEvent("fog:tools-changed"));
}

async function registerBaseTools(): Promise<void> {
  baseController?.abort();
  baseController = new AbortController();
  const signal = baseController.signal;
  const ctx = getModelContext();
  if (!ctx) return;

  const baseTools = [
    {
      name: "get_progress",
      title: "Get player progress",
      description:
        "Read current progression stage, spoiler tier, defeated bosses, and inventory summary. Call first.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
      execute: async () => {
        const p = getProgress();
        const stage = getStage(p.stageId);
        return {
          stageId: p.stageId,
          stageLabel: stage?.label ?? p.stageId,
          spoilerTier: p.spoilerTier,
          defeatedBosses: p.defeatedBosses,
          inventory: inventorySummary(),
        };
      },
    },
    {
      name: "set_progress",
      title: "Update player progress",
      description:
        "Update stage, spoiler tier, and/or defeated bosses. Defeating a boss may advance the unlocked stage automatically.",
      inputSchema: {
        type: "object",
        properties: {
          stageId: { type: "string", description: "Progression stage id, e.g. pre_eye, post_eye" },
          spoilerTier: { type: "string", enum: ["nudge", "hint", "answer"] },
          defeatedBoss: {
            type: "string",
            description: "Boss id to mark defeated: eye_of_cthulhu, eater_or_brain, skeletron, wall_of_flesh",
          },
        },
        additionalProperties: false,
      },
      execute: async (input: Record<string, unknown>) => {
        const patch = input as {
          stageId?: string;
          spoilerTier?: "nudge" | "hint" | "answer";
          defeatedBoss?: string;
        };
        let next = getProgress();
        if (patch.spoilerTier) next = setSpoilerTier(patch.spoilerTier);
        if (patch.defeatedBoss) {
          const bosses = next.defeatedBosses.includes(patch.defeatedBoss)
            ? next.defeatedBosses
            : [...next.defeatedBosses, patch.defeatedBoss];
          const autoStage = highestStageForBosses(bosses);
          next = setProgress({ defeatedBosses: bosses, stageId: autoStage });
        }
        if (patch.stageId) next = setStageId(patch.stageId);

        await refreshStageTools(next.stageId);
        const stage = getStage(next.stageId);
        return {
          stageId: next.stageId,
          stageLabel: stage?.label ?? next.stageId,
          defeatedBosses: next.defeatedBosses,
          message: "Progress updated. Stage-scoped tools refreshed.",
        };
      },
    },
    {
      name: "set_inventory",
      title: "Set inventory",
      description:
        "Set what the player is carrying. Pass itemNames (array of strings like '30 iron bar') or counts (object of itemId to number).",
      inputSchema: {
        type: "object",
        properties: {
          itemNames: {
            type: "array",
            items: { type: "string" },
            description: "Human-readable stack list, e.g. ['30 iron bar', '40 wood', 'anvil']",
          },
          counts: {
            type: "object",
            additionalProperties: { type: "number" },
            description: "Item id to count map, e.g. { iron_bar: 30, wood: 40 }",
          },
        },
        additionalProperties: false,
      },
      execute: async (input: Record<string, unknown>) => {
        const body = input as { itemNames?: string[]; counts?: Record<string, number> };
        if (body.counts) setInventoryCounts(body.counts);
        else if (body.itemNames) setInventoryFromList(body.itemNames);
        return { inventory: inventorySummary() };
      },
    },
    {
      name: "check_housing",
      title: "Validate NPC house",
      description:
        "Check whether a room meets NPC housing rules. Pass booleans for walls, door, light, chair, table/workbench, and optional roomSize in tiles.",
      inputSchema: {
        type: "object",
        properties: {
          roomSize: { type: "number" },
          hasWalls: { type: "boolean" },
          hasDoor: { type: "boolean" },
          hasLight: { type: "boolean" },
          hasChair: { type: "boolean" },
          hasTable: { type: "boolean" },
          hasWorkBench: { type: "boolean" },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input: Record<string, unknown>) => {
        const result = validateHousing(input as import("../core/types").HousingInput);
        return { ...result, tips: guideHousingTips() };
      },
    },
    {
      name: "log_discovery",
      title: "Log a discovery",
      description: "Record something the player learned for the session log.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
        additionalProperties: false,
      },
      execute: async (input: Record<string, unknown>) => {
        const body = input as { text: string };
        const next = logDiscovery(body.text);
        return { discoveries: next.discoveries.slice(0, 5) };
      },
    },
    {
      name: "get_discovery_log",
      title: "Get discovery log",
      description: "Read recent discoveries logged this session.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true },
      execute: async () => ({ discoveries: getProgress().discoveries }),
    },
    {
      name: "load_demo_scenario",
      title: "Load a demo scenario",
      description:
        "Reset player state to a curated demo for judges: guide_house, iron_crafting, or post_eye_unlock. Refreshes stage tools.",
      inputSchema: {
        type: "object",
        properties: {
          scenario: {
            type: "string",
            enum: ["guide_house", "iron_crafting", "post_eye_unlock"],
          },
        },
        required: ["scenario"],
        additionalProperties: false,
      },
      execute: async (input: Record<string, unknown>) => {
        const body = input as { scenario: "guide_house" | "iron_crafting" | "post_eye_unlock" };
        const scenario = applyDemoScenario(body.scenario);
        await refreshStageTools(scenario.state.stageId);
        return {
          scenario: scenario.id,
          label: scenario.label,
          chatPrompt: scenario.chatPrompt,
          stageId: scenario.state.stageId,
        };
      },
    },
    {
      name: "reset_progress",
      title: "Reset all progress",
      description: "Clear inventory, bosses, discoveries, and return to pre-Eye stage.",
      inputSchema: emptySchema,
      execute: async () => {
        const fresh = resetFogProgress();
        await refreshStageTools(fresh.stageId);
        return { stageId: fresh.stageId, message: "Progress reset." };
      },
    },
  ];

  for (const tool of baseTools) {
    await ctx.registerTool(tool, { signal });
  }

  snapshot = {
    ...snapshot,
    webmcpSupported: true,
    baseToolCount: baseTools.length,
    stageId: getProgress().stageId,
  };
}

async function registerStageTools(stageId: string): Promise<void> {
  stageController = new AbortController();
  const signal = stageController.signal;
  const ctx = getModelContext();
  if (!ctx) return;

  const stageTools = [
    {
      name: "what_can_i_craft",
      title: "List craftable recipes",
      description:
        "List recipes unlocked at the player's stage. Shows which are craftable now with current inventory and what's missing.",
      inputSchema: emptySchema,
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => {
        const p = getProgress();
        const list = listCraftable(p.stageId, p.inventory);
        if (isLocked(list)) return list;
        const ready = list.filter((r) => r.canCraft);
        const almost = nearbyCraftable(p.stageId, p.inventory);
        return { craftableNow: ready, nearby: almost, stageId: p.stageId };
      },
    },
    {
      name: "recipe_for",
      title: "Look up one recipe",
      description: "Get ingredients and craft status for a specific recipe id or item name.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Recipe id or item name, e.g. iron_broadsword" },
        },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input: Record<string, unknown>) => {
        const body = input as { query: string };
        const p = getProgress();
        const result = lookupRecipe(p.stageId, body.query);
        if (!result) {
          return {
            error: "NOT_FOUND",
            message: `No recipe found for "${body.query}". Try what_can_i_craft first.`,
          };
        }
        return result;
      },
    },
    {
      name: "next_step_hint",
      title: "Spoiler-safe next step",
      description:
        "Return a progression hint for the current stage at nudge, hint, or answer tier. Respects LOCKED if asking about future stages.",
      inputSchema: {
        type: "object",
        properties: {
          tier: { type: "string", enum: ["nudge", "hint", "answer"] },
          stageId: { type: "string", description: "Optional stage; defaults to player stage." },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input: Record<string, unknown>) => {
        const body = input as { tier?: "nudge" | "hint" | "answer"; stageId?: string };
        const p = getProgress();
        const tier = body.tier ?? p.spoilerTier;
        return getHint(p.stageId, tier, body.stageId);
      },
    },
  ];

  for (const tool of stageTools) {
    await ctx.registerTool(tool, { signal });
  }

  snapshot = {
    ...snapshot,
    stageToolCount: stageTools.length,
    stageId,
  };
}

/** @deprecated use initFogWebMcp */
export const registerFogTools = initFogWebMcp;

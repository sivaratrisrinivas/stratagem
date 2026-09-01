import stagesData from "../data/stages.json";
import recipesData from "../data/recipes.json";
import itemsData from "../data/items.json";
import hintsData from "../data/hints.json";
import type { HintSet, ItemDef, Recipe, Stage } from "./types";

export const stages = stagesData as Stage[];
export const recipes = recipesData as Recipe[];
export const items = itemsData as ItemDef[];
export const hints = hintsData as Record<string, HintSet>;

const stageById = new Map(stages.map((s) => [s.id, s]));
const recipeById = new Map(recipes.map((r) => [r.id, r]));
const itemById = new Map(items.map((i) => [i.id, i]));

export function getStage(stageId: string): Stage | undefined {
  return stageById.get(stageId);
}

export function getRecipe(recipeId: string): Recipe | undefined {
  return recipeById.get(recipeId);
}

export function getItem(itemId: string): ItemDef | undefined {
  return itemById.get(itemId);
}

export function getItemName(itemId: string): string {
  return getItem(itemId)?.name ?? itemId.replace(/_/g, " ");
}

export function resolveItemId(raw: string): string | null {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (itemById.has(normalized)) return normalized;

  for (const item of items) {
    if (item.id === normalized) return item.id;
    for (const alias of item.aliases) {
      if (alias.toLowerCase().replace(/\s+/g, "_") === normalized) return item.id;
      if (alias.toLowerCase() === raw.trim().toLowerCase()) return item.id;
    }
  }
  return null;
}

export function getHintForStage(stageId: string): HintSet | undefined {
  return hints[stageId];
}

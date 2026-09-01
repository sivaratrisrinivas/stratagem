import { getItemName, getRecipe, recipes } from "./catalog";
import { isStageUnlocked, lockContent } from "./gating";
import { getProgress } from "./progress";
import type { CraftableRecipe, LockedResult } from "./types";

export function listCraftable(
  playerStageId: string,
  inventory: Record<string, number>,
): CraftableRecipe[] | LockedResult {
  const results: CraftableRecipe[] = [];

  for (const recipe of recipes) {
    if (!isStageUnlocked(playerStageId, recipe.minStageId)) continue;

    const missing: CraftableRecipe["missing"] = [];
    let canCraft = true;

    for (const ing of recipe.ingredients) {
      const have = inventory[ing.itemId] ?? 0;
      if (have < ing.count) {
        canCraft = false;
        missing.push({
          itemId: ing.itemId,
          name: getItemName(ing.itemId),
          need: ing.count,
          have,
        });
      }
    }

    results.push({ ...recipe, canCraft, missing });
  }

  return results.sort((a, b) => {
    if (a.canCraft !== b.canCraft) return a.canCraft ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function lookupRecipe(
  playerStageId: string,
  recipeIdOrName: string,
): (CraftableRecipe & { ingredientsDetail: string }) | LockedResult | null {
  const byId = getRecipe(recipeIdOrName);
  const recipe =
    byId ??
    recipes.find(
      (r) =>
        r.name.toLowerCase() === recipeIdOrName.toLowerCase() ||
        r.result.toLowerCase() === recipeIdOrName.toLowerCase(),
    );

  if (!recipe) return null;

  const locked = lockContent(playerStageId, recipe.minStageId);
  if (locked) return locked;

  const inventory = getProgress().inventory;
  const list = listCraftable(playerStageId, inventory);
  if (isLockedList(list)) return list;

  const match = list.find((r) => r.id === recipe.id);
  if (!match) return null;

  const ingredientsDetail = recipe.ingredients
    .map((i) => `${i.count} ${getItemName(i.itemId)}`)
    .join(", ");

  return { ...match, ingredientsDetail };
}

function isLockedList(
  value: CraftableRecipe[] | LockedResult,
): value is LockedResult {
  return "code" in value && value.code === "LOCKED";
}

export function craftableNow(
  playerStageId: string,
  inventory: Record<string, number>,
): CraftableRecipe[] {
  const list = listCraftable(playerStageId, inventory);
  if (isLockedList(list)) return [];
  return list.filter((r) => r.canCraft);
}

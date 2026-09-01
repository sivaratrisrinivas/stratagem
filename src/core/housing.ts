import type { HousingInput, HousingResult } from "./types";

const MIN_SIZE = 60;

export function validateHousing(input: HousingInput): HousingResult {
  const issues: string[] = [];
  const fixes: string[] = [];

  if (input.roomSize !== undefined && input.roomSize < MIN_SIZE) {
    issues.push(`Room is ${input.roomSize} tiles; NPC houses need at least ${MIN_SIZE}.`);
    fixes.push("Expand the enclosed area or combine adjacent rooms with a shared wall.");
  }

  if (input.hasWalls === false) {
    issues.push("Background walls are missing.");
    fixes.push("Place background walls on every interior tile (use a hammer to check for gaps).");
  }

  if (input.hasDoor === false) {
    issues.push("No valid entrance.");
    fixes.push("Add a door or platform entrance the NPC can reach.");
  }

  if (input.hasLight === false) {
    issues.push("No light source.");
    fixes.push("Place a torch, lantern, or other light inside the room.");
  }

  if (input.hasChair === false) {
    issues.push("Missing chair.");
    fixes.push("Craft a chair at a work bench and place it.");
  }

  if (input.hasTable === false && input.hasWorkBench === false) {
    issues.push("Missing flat surface (table or work bench).");
    fixes.push("Add a table or work bench — the Guide needs a work bench specifically.");
  }

  return {
    valid: issues.length === 0,
    issues,
    fixes,
  };
}

export function guideHousingTips(): string[] {
  return [
    "Minimum enclosed size is 60 tiles including walls.",
    "Must have background walls, a door, a light, a chair, and a flat item (table or work bench).",
    "The Guide requires a work bench, not just a table.",
    "Keep corrupt/crimson blocks away — too much evil biome blocks invalidate the house.",
  ];
}

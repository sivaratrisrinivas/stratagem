export type SpoilerTier = "nudge" | "hint" | "answer";

export type Stage = {
  id: string;
  label: string;
  order: number;
  unlocksAfterBoss: string | null;
};

export type Recipe = {
  id: string;
  name: string;
  result: string;
  resultCount: number;
  ingredients: Array<{ itemId: string; count: number }>;
  station: string | null;
  minStageId: string;
};

export type ItemDef = {
  id: string;
  name: string;
  aliases: string[];
};

export type HintSet = {
  nudge: string;
  hint: string;
  answer: string;
};

export type ProgressState = {
  stageId: string;
  spoilerTier: SpoilerTier;
  defeatedBosses: string[];
  inventory: Record<string, number>;
  discoveries: DiscoveryEntry[];
};

export type DiscoveryEntry = {
  id: string;
  text: string;
  at: string;
};

export type HousingInput = {
  roomSize?: number;
  hasWalls?: boolean;
  hasDoor?: boolean;
  hasLight?: boolean;
  hasChair?: boolean;
  hasTable?: boolean;
  hasWorkBench?: boolean;
};

export type HousingResult = {
  valid: boolean;
  issues: string[];
  fixes: string[];
};

export type CraftableRecipe = Recipe & {
  canCraft: boolean;
  missing: Array<{ itemId: string; name: string; need: number; have: number }>;
};

export type LockedResult = {
  code: "LOCKED";
  message: string;
  currentStage: string;
  requiredStage: string;
};

export function isLocked<T>(value: T | LockedResult): value is LockedResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    (value as LockedResult).code === "LOCKED"
  );
}

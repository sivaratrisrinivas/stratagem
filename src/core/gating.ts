import { getStage, stages } from "./catalog";
import type { LockedResult } from "./types";

export function stageOrder(stageId: string): number {
  return getStage(stageId)?.order ?? -1;
}

export function isStageUnlocked(
  playerStageId: string,
  contentStageId: string,
): boolean {
  return stageOrder(playerStageId) >= stageOrder(contentStageId);
}

export function lockContent(
  playerStageId: string,
  contentStageId: string,
): LockedResult | null {
  if (isStageUnlocked(playerStageId, contentStageId)) return null;

  const current = getStage(playerStageId);
  const required = getStage(contentStageId);

  return {
    code: "LOCKED",
    message: `Content requires stage "${required?.label ?? contentStageId}". You are at "${current?.label ?? playerStageId}". Ask the player to confirm boss progress, then call set_progress.`,
    currentStage: playerStageId,
    requiredStage: contentStageId,
  };
}

export function nextStageId(currentStageId: string): string | null {
  const current = getStage(currentStageId);
  if (!current) return null;
  const next = stages.find((s) => s.order === current.order + 1);
  return next?.id ?? null;
}

export function stageIdsUnlockedThrough(playerStageId: string): string[] {
  const order = stageOrder(playerStageId);
  return stages.filter((s) => s.order <= order).map((s) => s.id);
}

export function highestStageForBosses(defeatedBosses: string[]): string {
  let best = stages[0]?.id ?? "pre_eye";
  let bestOrder = stages[0]?.order ?? 0;

  for (const stage of stages) {
    if (
      stage.unlocksAfterBoss &&
      defeatedBosses.includes(stage.unlocksAfterBoss) &&
      stage.order > bestOrder
    ) {
      bestOrder = stage.order;
      best = stage.id;
    }
  }

  return best;
}

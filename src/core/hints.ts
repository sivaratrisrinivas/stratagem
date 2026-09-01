import { getHintForStage } from "./catalog";
import { lockContent } from "./gating";
import type { HintSet, LockedResult, SpoilerTier } from "./types";

export function getHint(
  playerStageId: string,
  tier?: SpoilerTier,
  explicitStageId?: string,
): { stageId: string; tier: SpoilerTier; text: string } | LockedResult {
  const stageId = explicitStageId ?? playerStageId;
  const locked = lockContent(playerStageId, stageId);
  if (locked) return locked;

  const hints = getHintForStage(stageId);
  if (!hints) {
    return {
      code: "LOCKED",
      message: `No hints for stage ${stageId}.`,
      currentStage: playerStageId,
      requiredStage: stageId,
    };
  }

  const resolvedTier = tier ?? "nudge";
  return {
    stageId,
    tier: resolvedTier,
    text: hints[resolvedTier],
  };
}

export function hintTiersForStage(stageId: string): HintSet | undefined {
  return getHintForStage(stageId);
}

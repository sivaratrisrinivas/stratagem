import { useSyncExternalStore } from "react";
import { getStage, stages } from "../core/catalog";
import { getToolSnapshot, refreshStageTools } from "../webmcp/registry";
import {
  getProgress,
  subscribeProgress,
  setSpoilerTier,
  setStageId,
  setInventoryFromList,
  defeatBossAndAdvance,
} from "../core/progress";
import { craftableNow } from "../core/recipes";
import { getHint } from "../core/hints";
import { isLocked } from "../core/types";
import type { SpoilerTier } from "../core/types";

export function useFogProgress() {
  return useSyncExternalStore(subscribeProgress, getProgress, getProgress);
}

export function useToolSnapshot() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("fog:tools-changed", cb);
      return () => window.removeEventListener("fog:tools-changed", cb);
    },
    getToolSnapshot,
    getToolSnapshot,
  );
}

export function useFogActions() {
  const progress = useFogProgress();

  return {
    progress,
    setStage: (stageId: string) => {
      setStageId(stageId);
      void refreshStageTools(stageId);
    },
    setTier: (tier: SpoilerTier) => setSpoilerTier(tier),
    defeatBoss: (bossId: string) => {
      const next = defeatBossAndAdvance(bossId);
      void refreshStageTools(next.stageId);
    },
    setInventoryText: (text: string) => {
      const lines = text.split("\n").filter(Boolean);
      setInventoryFromList(lines);
    },
    previewHint: () => {
      const hint = getHint(progress.stageId, progress.spoilerTier);
      return isLocked(hint) ? hint.message : hint.text;
    },
    craftableCount: () => craftableNow(progress.stageId, progress.inventory).length,
    stageLabel: getStage(progress.stageId)?.label ?? progress.stageId,
    stages,
  };
}

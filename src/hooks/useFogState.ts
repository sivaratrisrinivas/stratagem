import { useSyncExternalStore, useCallback } from "react";
import { getStage, stages } from "../core/catalog";
import { demoScenarios, applyDemoScenario, resetFogProgress } from "../core/demo";
import { getToolSnapshot, refreshStageTools } from "../webmcp/registry";
import {
  getProgress,
  subscribeProgress,
  setSpoilerTier,
  setStageId,
  setInventoryFromList,
  toggleBossDefeated,
} from "../core/progress";
import { craftableNow, nearbyCraftable } from "../core/recipes";
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

  const afterProgressChange = useCallback(async (stageId: string) => {
    await refreshStageTools(stageId);
  }, []);

  return {
    progress,
    stages,
    demos: demoScenarios,
    setStage: (stageId: string) => {
      setStageId(stageId);
      void afterProgressChange(stageId);
    },
    setTier: (tier: SpoilerTier) => setSpoilerTier(tier),
    toggleBoss: (bossId: string) => {
      const next = toggleBossDefeated(bossId);
      void afterProgressChange(next.stageId);
    },
    setInventoryText: (text: string) => {
      const lines = text.split("\n").filter(Boolean);
      setInventoryFromList(lines);
    },
    loadDemo: (id: (typeof demoScenarios)[number]["id"]) => {
      const scenario = applyDemoScenario(id);
      void afterProgressChange(scenario.state.stageId);
      return scenario;
    },
    resetAll: () => {
      const fresh = resetFogProgress();
      void afterProgressChange(fresh.stageId);
    },
    previewHint: () => {
      const hint = getHint(progress.stageId, progress.spoilerTier);
      return isLocked(hint) ? hint.message : hint.text;
    },
    craftable: () => craftableNow(progress.stageId, progress.inventory),
    nearby: () => nearbyCraftable(progress.stageId, progress.inventory),
    stageLabel: getStage(progress.stageId)?.label ?? progress.stageId,
  };
}

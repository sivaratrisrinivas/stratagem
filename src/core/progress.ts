import { resolveItemId } from "./catalog";
import { highestStageForBosses } from "./gating";
import type { ProgressState, SpoilerTier } from "./types";

const STORAGE_KEY = "fog.progress.v1";

export const defaultProgress: ProgressState = {
  stageId: "pre_eye",
  spoilerTier: "nudge",
  defeatedBosses: [],
  inventory: {},
  discoveries: [],
};

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultProgress };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      ...defaultProgress,
      ...parsed,
      inventory: parsed.inventory ?? {},
      defeatedBosses: parsed.defeatedBosses ?? [],
      discoveries: parsed.discoveries ?? [],
    };
  } catch {
    return { ...defaultProgress };
  }
}

let cache: ProgressState = read();

function write(next: ProgressState): void {
  cache = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function getProgress(): ProgressState {
  return cache;
}

export function subscribeProgress(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setProgress(patch: Partial<ProgressState>): ProgressState {
  const next = { ...cache, ...patch };
  write(next);
  return next;
}

export function setSpoilerTier(tier: SpoilerTier): ProgressState {
  return setProgress({ spoilerTier: tier });
}

export function setStageId(stageId: string): ProgressState {
  return setProgress({ stageId });
}

export function defeatBossAndAdvance(bossId: string): ProgressState {
  const bosses = cache.defeatedBosses.includes(bossId)
    ? cache.defeatedBosses
    : [...cache.defeatedBosses, bossId];
  const stageId = highestStageForBosses(bosses);
  return setProgress({ defeatedBosses: bosses, stageId });
}

export function toggleBossDefeated(bossId: string): ProgressState {
  const defeated = cache.defeatedBosses.includes(bossId);
  const bosses = defeated
    ? cache.defeatedBosses.filter((b) => b !== bossId)
    : [...cache.defeatedBosses, bossId];
  const stageId = highestStageForBosses(bosses);
  return setProgress({ defeatedBosses: bosses, stageId });
}

export function markBossDefeated(bossId: string): ProgressState {
  if (cache.defeatedBosses.includes(bossId)) return cache;
  return setProgress({
    defeatedBosses: [...cache.defeatedBosses, bossId],
  });
}

export function setInventoryFromList(itemNames: string[]): ProgressState {
  const inventory: Record<string, number> = {};

  for (const name of itemNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)\s*(?:x\s+)?(.+)$/i);
    const count = match ? Number.parseInt(match[1] ?? "1", 10) : 1;
    const label = match ? (match[2] ?? trimmed) : trimmed;
    const id = resolveItemId(label);
    if (id) inventory[id] = (inventory[id] ?? 0) + count;
  }

  return setProgress({ inventory });
}

export function setInventoryCounts(counts: Record<string, number>): ProgressState {
  return setProgress({ inventory: { ...counts } });
}

export function logDiscovery(text: string): ProgressState {
  const entry = {
    id: crypto.randomUUID(),
    text,
    at: new Date().toISOString(),
  };
  return setProgress({
    discoveries: [entry, ...cache.discoveries].slice(0, 50),
  });
}

export function inventorySummary(): Array<{ itemId: string; count: number }> {
  return Object.entries(cache.inventory).map(([itemId, count]) => ({
    itemId,
    count,
  }));
}

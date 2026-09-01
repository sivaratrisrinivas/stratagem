import { defaultProgress, setProgress } from "./progress";
import type { ProgressState } from "./types";

export type DemoScenarioId = "guide_house" | "iron_crafting" | "post_eye_unlock";

export type DemoScenario = {
  id: DemoScenarioId;
  label: string;
  description: string;
  chatPrompt: string;
  state: ProgressState;
};

export const demoScenarios: DemoScenario[] = [
  {
    id: "guide_house",
    label: "Guide won't move in",
    description: "Early base with iron and wood — housing check finds missing light.",
    chatPrompt:
      "I'm on Fog. Check housing: 70 tiles, walls yes, door yes, light no, chair yes, work bench yes. What's wrong and what should I craft?",
    state: {
      stageId: "pre_eye",
      spoilerTier: "hint",
      defeatedBosses: [],
      inventory: { wood: 40, iron_bar: 30, gel: 10, stone_block: 25 },
      discoveries: [],
    },
  },
  {
    id: "iron_crafting",
    label: "What can I craft?",
    description: "Mid early-game inventory — several crafts available, anvil next.",
    chatPrompt:
      "Set my inventory to 30 iron bar, 40 wood, 10 gel, 25 stone block. What can I craft right now? What's one step away?",
    state: {
      stageId: "pre_eye",
      spoilerTier: "nudge",
      defeatedBosses: [],
      inventory: { iron_bar: 30, wood: 40, gel: 10, stone_block: 25, copper_ore: 12 },
      discoveries: [],
    },
  },
  {
    id: "post_eye_unlock",
    label: "Beat the Eye → tools unlock",
    description: "Shows stage advance after Eye of Cthulhu — post-Eye recipes appear.",
    chatPrompt:
      "Mark Eye of Cthulhu defeated, then tell me what changed and give a hint for what to do next.",
    state: {
      stageId: "post_eye",
      spoilerTier: "hint",
      defeatedBosses: ["eye_of_cthulhu"],
      inventory: { iron_bar: 20, lens: 4, demonite_bar: 5, rotten_chunk: 8 },
      discoveries: [],
    },
  },
];

export function getDemoScenario(id: DemoScenarioId): DemoScenario | undefined {
  return demoScenarios.find((s) => s.id === id);
}

export function applyDemoScenario(id: DemoScenarioId): DemoScenario {
  const scenario = getDemoScenario(id);
  if (!scenario) throw new Error(`Unknown demo scenario: ${id}`);
  setProgress({ ...scenario.state });
  return scenario;
}

export function resetFogProgress(): ProgressState {
  const fresh: ProgressState = {
    ...defaultProgress,
    inventory: {},
    discoveries: [],
    defeatedBosses: [],
  };
  setProgress(fresh);
  return fresh;
}

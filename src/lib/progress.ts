/** Progress and spoiler preferences — wire to localStorage in the MVP. */
export type SpoilerTier = "nudge" | "hint" | "answer";

export type ProgressState = {
  stageId: string;
  spoilerTier: SpoilerTier;
};

export const defaultProgress: ProgressState = {
  stageId: "pre_eye",
  spoilerTier: "nudge",
};

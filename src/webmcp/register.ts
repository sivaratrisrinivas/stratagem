import { getModelContext, isWebMcpSupported } from "./types";

const noopSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

/** Registers starter tools so the page is WebMCP-ready before game data lands. */
export async function registerFogTools(): Promise<void> {
  if (!isWebMcpSupported()) {
    console.info("[fog] WebMCP not available in this browser.");
    return;
  }

  const modelContext = getModelContext();
  if (!modelContext) return;

  const controller = new AbortController();

  await modelContext.registerTool(
    {
      name: "get_progress",
      title: "Get player progress",
      description:
        "Read the player's declared Terraria progression stage and spoiler tier. Call before giving guidance.",
      inputSchema: noopSchema,
      annotations: { readOnlyHint: true },
      execute: async () => ({
        stageId: "pre_eye",
        stageLabel: "Pre-Eye of Cthulhu",
        spoilerTier: "nudge",
        message: "Starter stack — wire real progress state in src/lib/progress.ts",
      }),
    },
    { signal: controller.signal },
  );

  await modelContext.registerTool(
    {
      name: "next_step_hint",
      title: "Next step hint",
      description:
        "Return a spoiler-safe hint for the current progression stage. Refuses locked content with a LOCKED code.",
      inputSchema: {
        type: "object",
        properties: {
          tier: {
            type: "string",
            enum: ["nudge", "hint", "answer"],
            description: "How direct the hint should be.",
          },
        },
        required: ["tier"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async ({ tier }) => ({
        tier,
        hint: "Build your base, gather ore, and craft better gear. The Eye of Cthulhu comes after you feel ready.",
        stageId: "pre_eye",
      }),
    },
    { signal: controller.signal },
  );

  console.info("[fog] WebMCP tools registered.");
}

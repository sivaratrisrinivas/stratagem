import { useCallback, useState } from "react";
import { invokeFogTool } from "../webmcp/registry";
import { isWebMcpSupported } from "../webmcp/types";

type LogLine = {
  id: string;
  kind: "call" | "result" | "say";
  text: string;
};

const JUDGE_FLOW: Array<{ tool: string; input?: Record<string, unknown>; say?: string }> = [
  {
    tool: "load_demo_scenario",
    input: { scenario: "guide_house" },
    say: "Loading judge demo state…",
  },
  {
    tool: "check_housing",
    input: {
      roomSize: 70,
      hasWalls: true,
      hasDoor: true,
      hasLight: false,
      hasChair: true,
      hasWorkBench: true,
    },
    say: "Checking housing — missing light detected.",
  },
  {
    tool: "what_can_i_craft",
    say: "Listing craftable items with current inventory…",
  },
];

function summarize(result: unknown): string {
  if (!result || typeof result !== "object") return String(result);
  const r = result as Record<string, unknown>;
  if (r.valid === false && Array.isArray(r.issues)) {
    return `Invalid: ${(r.issues as string[]).join("; ")}. Fix: ${((r.fixes as string[]) ?? []).join(" ")}`;
  }
  if (Array.isArray(r.craftableNow)) {
    const names = (r.craftableNow as Array<{ name: string }>).map((c) => c.name);
    const hasTorch = names.some((n) => /torch/i.test(n));
    return hasTorch
      ? `Craftable: ${names.slice(0, 5).join(", ")}… → Agent answer: Craft a Torch.`
      : `Craftable: ${names.slice(0, 6).join(", ")}`;
  }
  if (r.stageId && r.label) return `Loaded ${r.label} (${r.stageId})`;
  return JSON.stringify(result, null, 2).slice(0, 280);
}

export function AgentPanel() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);

  const append = useCallback((kind: LogLine["kind"], text: string) => {
    setLines((prev) => [...prev, { id: crypto.randomUUID(), kind, text }]);
  }, []);

  const runJudgeFlow = useCallback(async () => {
    setRunning(true);
    setLines([]);
    append("say", "Agent: running judge demo flow…");

    for (const step of JUDGE_FLOW) {
      append("call", `→ ${step.tool}(${step.input ? JSON.stringify(step.input) : ""})`);
      if (step.say) append("say", step.say);
      try {
        const result = await invokeFogTool(step.tool, step.input ?? {});
        append("result", summarize(result));
        await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        append("result", `Error: ${err instanceof Error ? err.message : String(err)}`);
        break;
      }
    }

    append("say", "Done — housing needs light; craft a Torch.");
    setRunning(false);
    window.dispatchEvent(new CustomEvent("fog:tools-changed"));
  }, [append]);

  return (
    <section className="glass glass--wide agent-panel">
      <div className="agent-panel__head">
        <h2 className="glass__heading">Agent replay</h2>
        <p className="agent-panel__sub">
          {isWebMcpSupported()
            ? "Calls registered WebMCP tools — same path ChatGPT uses."
            : "Simulates agent tool calls for demo recording."}
        </p>
      </div>
      <button type="button" className="btn agent-panel__run" disabled={running} onClick={runJudgeFlow}>
        {running ? "Running…" : "Run judge demo flow"}
      </button>
      {lines.length > 0 && (
        <ol className="agent-log" aria-live="polite">
          {lines.map((line) => (
            <li key={line.id} className={`agent-log__line agent-log__line--${line.kind}`}>
              {line.text}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

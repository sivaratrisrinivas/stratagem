import { useEffect, useMemo, useState } from "react";
import { getItemName } from "./core/catalog";
import { useFogActions, useFogProgress, useToolSnapshot } from "./hooks/useFogState";
import { isWebMcpSupported } from "./webmcp/types";
import type { CraftableRecipe, DiscoveryEntry, Stage } from "./core/types";

const BOSSES = [
  { id: "eye_of_cthulhu", label: "Eye of Cthulhu" },
  { id: "eater_or_brain", label: "Eater / Brain" },
  { id: "skeletron", label: "Skeletron" },
  { id: "wall_of_flesh", label: "Wall of Flesh" },
] as const;

function inventoryToText(inventory: Record<string, number>): string {
  return Object.entries(inventory)
    .map(([id, count]) => `${count} ${getItemName(id).toLowerCase()}`)
    .join("\n");
}

export function App() {
  const progress = useFogProgress();
  const tools = useToolSnapshot();
  const actions = useFogActions();
  const [inventoryText, setInventoryText] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  useEffect(() => {
    setInventoryText(inventoryToText(progress.inventory));
  }, [progress.inventory]);

  const craftable = useMemo(() => actions.craftable(), [actions, progress.stageId, progress.inventory]);
  const nearby = useMemo(() => actions.nearby(), [actions, progress.stageId, progress.inventory]);
  const hintPreview = actions.previewHint();
  const totalTools = tools.baseToolCount + tools.stageToolCount;

  const copyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(text);
      window.setTimeout(() => setCopiedPrompt(null), 2000);
    } catch {
      setCopiedPrompt("Copy failed — select text manually");
    }
  };

  const runDemo = (id: (typeof actions.demos)[number]["id"]) => {
    const scenario = actions.loadDemo(id);
    setActiveDemo(scenario.label);
    setInventoryText(inventoryToText(scenario.state.inventory));
  };

  return (
    <div className="layout">
      <header className="hero">
        <p className="eyebrow">WebMCP Challenge · Terraria companion</p>
        <h1>Fog</h1>
        <p className="lede">
          Progress-gated help for your second monitor. The agent only gets tools for what
          you&apos;ve unlocked — watch the tool count change when you beat a boss.
        </p>
      </header>

      <section className="panel wide demo-bar">
        <h2>Demo scenarios</h2>
        <p className="muted">One click loads state for judges or your ChatGPT test.</p>
        <div className="demo-buttons">
          {actions.demos.map((d) => (
            <button key={d.id} type="button" className="demo-btn" onClick={() => runDemo(d.id)}>
              <strong>{d.label}</strong>
              <span>{d.description}</span>
            </button>
          ))}
          <button type="button" className="demo-btn ghost" onClick={() => actions.resetAll()}>
            Reset progress
          </button>
        </div>
        {activeDemo ? <p className="demo-active">Loaded: {activeDemo}</p> : null}
      </section>

      <div className="grid">
        <section className="panel">
          <h2>Progress</h2>
          <label className="field">
            <span>Stage</span>
            <select value={progress.stageId} onChange={(e) => actions.setStage(e.target.value)}>
              {actions.stages.map((s: Stage) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Spoiler tier</span>
            <select
              value={progress.spoilerTier}
              onChange={(e) => actions.setTier(e.target.value as typeof progress.spoilerTier)}
            >
              <option value="nudge">Nudge</option>
              <option value="hint">Hint</option>
              <option value="answer">Answer</option>
            </select>
          </label>

          <div className="bosses">
            <span className="field-label">Bosses defeated</span>
            <ul>
              {BOSSES.map((b) => (
                <li key={b.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={progress.defeatedBosses.includes(b.id)}
                      onChange={() => actions.toggleBoss(b.id)}
                    />
                    {b.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel">
          <h2>Inventory</h2>
          <label className="field">
            <span>One item per line (e.g. 30 iron bar)</span>
            <textarea
              rows={6}
              value={inventoryText}
              onChange={(e) => setInventoryText(e.target.value)}
            />
          </label>
          <button type="button" onClick={() => actions.setInventoryText(inventoryText)}>
            Apply inventory
          </button>
          {Object.keys(progress.inventory).length > 0 && (
            <ul className="pill-list">
              {Object.entries(progress.inventory).map(([id, count]) => (
                <li key={id}>
                  {count}× {getItemName(id)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>WebMCP</h2>
          <dl className="meta">
            <div>
              <dt>API</dt>
              <dd className={isWebMcpSupported() ? "ok" : "warn"}>
                {isWebMcpSupported() ? "document.modelContext ready" : "Use ChatGPT desktop or Chrome + flag"}
              </dd>
            </div>
            <div>
              <dt>Tools registered</dt>
              <dd className="tool-count">
                <span className="count">{totalTools}</span>
                <span className="detail">
                  {tools.baseToolCount} base + {tools.stageToolCount} stage
                </span>
              </dd>
            </div>
            <div>
              <dt>Stage scope</dt>
              <dd>{actions.stageLabel}</dd>
            </div>
          </dl>
          <p className="hint-box">{hintPreview}</p>
        </section>

        <section className="panel wide">
          <h2>Try in ChatGPT</h2>
          <ul className="prompt-list">
            {actions.demos.map((d) => (
              <li key={d.id}>
                <code>{d.chatPrompt}</code>
                <button type="button" onClick={() => copyPrompt(d.chatPrompt)}>
                  {copiedPrompt === d.chatPrompt ? "Copied" : "Copy"}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Craftable now ({craftable.length})</h2>
          {craftable.length === 0 ? (
            <p className="muted">Load a demo or apply inventory.</p>
          ) : (
            <ul className="recipe-list">
              {craftable.map((r: CraftableRecipe) => (
                <li key={r.id}>
                  <strong>{r.name}</strong>
                  {r.station ? <span className="tag">{r.station}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h2>One step away ({nearby.length})</h2>
          {nearby.length === 0 ? (
            <p className="muted">No nearby crafts.</p>
          ) : (
            <ul className="recipe-list compact">
              {nearby.map((r: CraftableRecipe) => (
                <li key={r.id}>
                  <strong>{r.name}</strong>
                  <span className="missing">
                    need {r.missing.map((m) => `${m.need - m.have} ${m.name}`).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {progress.discoveries.length > 0 && (
          <section className="panel wide">
            <h2>Discoveries</h2>
            <ul className="discoveries">
              {progress.discoveries.slice(0, 5).map((d: DiscoveryEntry) => (
                <li key={d.id}>{d.text}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;

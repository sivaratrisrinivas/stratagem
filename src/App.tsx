import { useMemo, useState } from "react";
import { getItemName } from "./core/catalog";
import { craftableNow } from "./core/recipes";
import { useFogActions, useFogProgress, useToolSnapshot } from "./hooks/useFogState";
import { isWebMcpSupported } from "./webmcp/types";
import type { Stage } from "./core/types";
import type { CraftableRecipe } from "./core/types";
import type { DiscoveryEntry } from "./core/types";

const BOSSES = [
  { id: "eye_of_cthulhu", label: "Eye of Cthulhu" },
  { id: "eater_or_brain", label: "Eater / Brain" },
  { id: "skeletron", label: "Skeletron" },
  { id: "wall_of_flesh", label: "Wall of Flesh" },
] as const;

export function App() {
  const progress = useFogProgress();
  const tools = useToolSnapshot();
  const actions = useFogActions();
  const [inventoryText, setInventoryText] = useState("30 iron bar\n40 wood\n10 gel");

  const craftable = useMemo(
    () => craftableNow(progress.stageId, progress.inventory),
    [progress.stageId, progress.inventory],
  );

  const hintPreview = actions.previewHint();

  return (
    <div className="layout">
      <header className="hero">
        <p className="eyebrow">WebMCP Challenge · Terraria companion</p>
        <h1>Fog</h1>
        <p className="lede">
          Progress-gated help for your second monitor. The agent only gets tools for what
          you&apos;ve unlocked.
        </p>
      </header>

      <div className="grid">
        <section className="panel">
          <h2>Progress</h2>
          <label className="field">
            <span>Stage</span>
            <select
              value={progress.stageId}
              onChange={(e) => actions.setStage(e.target.value)}
            >
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
                      onChange={() => actions.defeatBoss(b.id)}
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
              onBlur={() => actions.setInventoryText(inventoryText)}
            />
          </label>
          <button type="button" onClick={() => actions.setInventoryText(inventoryText)}>
            Apply inventory
          </button>
          {progress.inventory && Object.keys(progress.inventory).length > 0 && (
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
                {isWebMcpSupported() ? "document.modelContext ready" : "Not in this browser"}
              </dd>
            </div>
            <div>
              <dt>Tools</dt>
              <dd>
                {tools.baseToolCount} base + {tools.stageToolCount} stage (
                {tools.baseToolCount + tools.stageToolCount} total)
              </dd>
            </div>
          </dl>
          <p className="hint-box">{hintPreview}</p>
        </section>

        <section className="panel wide">
          <h2>Craftable now ({craftable.length})</h2>
          {craftable.length === 0 ? (
            <p className="muted">Add inventory items or advance stage to see recipes.</p>
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

import { useEffect, useMemo, useState } from "react";
import { getItemName } from "./core/catalog";
import { useFogActions, useFogProgress, useToolSnapshot } from "./hooks/useFogState";
import { isWebMcpSupported } from "./webmcp/types";
import type { Stage } from "./core/types";
import "./App.css";

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
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const webmcpLive = isWebMcpSupported();
  const totalTools = tools.baseToolCount + tools.stageToolCount;
  const toolLabel = totalTools > 0 ? String(totalTools) : "11";

  useEffect(() => {
    setInventoryText(inventoryToText(progress.inventory));
  }, [progress.inventory]);

  const craftable = useMemo(() => actions.craftable(), [actions, progress.stageId, progress.inventory]);
  const hintPreview = actions.previewHint();
  const activeScenario = actions.demos.find((d) => d.id === activeDemo);

  const runDemo = (id: (typeof actions.demos)[number]["id"]) => {
    const scenario = actions.loadDemo(id);
    setActiveDemo(id);
    setInventoryText(inventoryToText(scenario.state.inventory));
  };

  return (
    <div className="app">
      <header className="top">
        <div className="top__brand">
          <h1 className="top__title">Fog</h1>
          <p className="top__tag">Spoiler-safe Terraria help on your second monitor.</p>
        </div>
        <div className={`status ${webmcpLive ? "status--live" : ""}`}>
          <span className="status__dot" aria-hidden />
          {webmcpLive ? "WebMCP ready" : "Open in ChatGPT or Chrome + flag"}
        </div>
      </header>

      <dl className="stats" aria-label="Session summary">
        <div>
          <dt>Tools</dt>
          <dd>{toolLabel}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{actions.stageLabel}</dd>
        </div>
        <div>
          <dt>Craftable</dt>
          <dd>{craftable.length}</dd>
        </div>
      </dl>

      <section className="card" aria-labelledby="scenarios-heading">
        <h2 id="scenarios-heading" className="card__title">
          Start here
        </h2>
        <p className="card__lead">Load a demo state, then ask your agent to use Fog&apos;s site tools.</p>
        <div className="scenarios">
          {actions.demos.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`scenario ${activeDemo === d.id ? "scenario--on" : ""}`}
              onClick={() => runDemo(d.id)}
            >
              <span className="scenario__name">{d.label}</span>
              <span className="scenario__desc">{d.description}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="link-btn"
          onClick={() => {
            actions.resetAll();
            setActiveDemo(null);
          }}
        >
          Reset session
        </button>
      </section>

      {(activeScenario || craftable.length > 0) && (
        <section className="card card--accent" aria-labelledby="now-heading">
          <h2 id="now-heading" className="card__title">
            Right now
          </h2>
          {activeScenario ? (
            <p className="active-label">Loaded: {activeScenario.label}</p>
          ) : null}
          <p className="hint">{hintPreview}</p>
          {craftable.length > 0 ? (
            <ul className="crafts">
              {craftable.slice(0, 6).map((r) => (
                <li key={r.id}>
                  {r.name}
                  {r.station ? <span className="crafts__tag">{r.station}</span> : null}
                </li>
              ))}
              {craftable.length > 6 ? (
                <li className="crafts__more">+{craftable.length - 6} more via agent</li>
              ) : null}
            </ul>
          ) : (
            <p className="muted">Load a scenario to see craftable items.</p>
          )}
        </section>
      )}

      <details className="card details">
        <summary className="details__summary">Adjust progress &amp; inventory</summary>
        <div className="details__body">
          <label className="field">
            <span className="field__label">Stage</span>
            <select value={progress.stageId} onChange={(e) => actions.setStage(e.target.value)}>
              {actions.stages.map((s: Stage) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Spoiler depth</span>
            <select
              value={progress.spoilerTier}
              onChange={(e) => actions.setTier(e.target.value as typeof progress.spoilerTier)}
            >
              <option value="nudge">Nudge</option>
              <option value="hint">Hint</option>
              <option value="answer">Answer</option>
            </select>
          </label>
          <fieldset className="bosses">
            <legend className="field__label">Bosses defeated</legend>
            {BOSSES.map((b) => (
              <label key={b.id} className="boss">
                <input
                  type="checkbox"
                  checked={progress.defeatedBosses.includes(b.id)}
                  onChange={() => actions.toggleBoss(b.id)}
                />
                {b.label}
              </label>
            ))}
          </fieldset>
          <label className="field">
            <span className="field__label">Inventory (one item per line)</span>
            <textarea
              rows={4}
              value={inventoryText}
              onChange={(e) => setInventoryText(e.target.value)}
              placeholder="30 iron bar&#10;40 wood"
            />
          </label>
          <button type="button" className="btn" onClick={() => actions.setInventoryText(inventoryText)}>
            Apply inventory
          </button>
        </div>
      </details>

      <footer className="foot">
        <p>
          Test with Chrome: enable <code>chrome://flags/#enable-webmcp-testing</code>, then use the Model Context
          Tool Inspector. See <code>TESTING.md</code> in the repo.
        </p>
      </footer>
    </div>
  );
}

export default App;

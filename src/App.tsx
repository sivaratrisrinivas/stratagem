import { useEffect, useMemo, useState } from "react";
import { getItemName } from "./core/catalog";
import { useFogActions, useFogProgress, useToolSnapshot } from "./hooks/useFogState";
import { isWebMcpSupported } from "./webmcp/types";
import type { CraftableRecipe, DiscoveryEntry, Stage } from "./core/types";
import { AgentPanel } from "./ui/AgentPanel";
import "./App.css";

const BOSSES = [
  { id: "eye_of_cthulhu", label: "Eye of Cthulhu" },
  { id: "eater_or_brain", label: "Eater / Brain" },
  { id: "skeletron", label: "Skeletron" },
  { id: "wall_of_flesh", label: "Wall of Flesh" },
] as const;

const EXPECTED_TOOLS = 11;

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

  const webmcpLive = isWebMcpSupported();

  useEffect(() => {
    setInventoryText(inventoryToText(progress.inventory));
  }, [progress.inventory]);

  const craftable = useMemo(() => actions.craftable(), [actions, progress.stageId, progress.inventory]);
  const nearby = useMemo(() => actions.nearby(), [actions, progress.stageId, progress.inventory]);
  const hintPreview = actions.previewHint();
  const totalTools = tools.baseToolCount + tools.stageToolCount;
  const displayTools = totalTools > 0 ? totalTools : EXPECTED_TOOLS;

  const copyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(text);
      window.setTimeout(() => setCopiedPrompt(null), 2000);
    } catch {
      setCopiedPrompt("Copy failed");
    }
  };

  const runDemo = (id: (typeof actions.demos)[number]["id"]) => {
    const scenario = actions.loadDemo(id);
    setActiveDemo(scenario.id);
    setInventoryText(inventoryToText(scenario.state.inventory));
  };

  return (
    <div className="fog">
      <div className="fog__aurora" aria-hidden="true">
        <div className="fog__orb fog__orb--1" />
        <div className="fog__orb fog__orb--2" />
        <div className="fog__orb fog__orb--3" />
      </div>
      <div className="fog__grain" aria-hidden="true" />

      <div className="fog__shell">
        <header className="fog__hero">
          <div className="fog__brand">
            <p className="fog__eyebrow">WebMCP · Terraria</p>
            <h1 className="fog__title">Fog</h1>
            <p className="fog__lede">
              A second-monitor companion. Tools unlock as you progress — the agent
              literally cannot spoil what you haven&apos;t earned.
            </p>
            <div className={`fog__status ${webmcpLive ? "fog__status--live" : ""}`}>
              <span className="fog__status-dot" />
              {webmcpLive ? "WebMCP connected" : "Open in ChatGPT or Chrome + flag"}
            </div>
          </div>

          <div className="fog__pulse">
            <span className={`fog__pulse-num ${!webmcpLive && totalTools === 0 ? "fog__pulse-num--idle" : ""}`}>
              {displayTools}
            </span>
            <span className="fog__pulse-label">tools</span>
            <span className="fog__pulse-detail">
              {totalTools > 0
                ? `${tools.baseToolCount} base · ${tools.stageToolCount} stage${webmcpLive ? "" : " · sim mode"}`
                : `${EXPECTED_TOOLS} when connected`}
            </span>
          </div>
        </header>

        <section className="fog__section">
          <p className="fog__section-title">Scenarios</p>
          <p className="fog__section-sub">One tap. Judge-ready state.</p>
          <div className="glass">
            <div className="fog__demos">
              {actions.demos.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`capsule ${activeDemo === d.id ? "capsule--active" : ""}`}
                  onClick={() => runDemo(d.id)}
                >
                  <span className="capsule__title">{d.label}</span>
                  <span className="capsule__desc">{d.description}</span>
                </button>
              ))}
              <button
                type="button"
                className="capsule capsule--ghost"
                onClick={() => {
                  actions.resetAll();
                  setActiveDemo(null);
                }}
              >
                Reset
              </button>
            </div>
            {activeDemo ? (
              <p className="fog__loaded">
                Loaded · {actions.demos.find((d) => d.id === activeDemo)?.label}
              </p>
            ) : null}
          </div>
        </section>

        <div className="fog__grid">
          <section className="glass glass--half">
            <h2 className="glass__heading">Progress</h2>
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
            <span className="field__label">Bosses defeated</span>
            <div className="boss-grid">
              {BOSSES.map((b) => {
                const on = progress.defeatedBosses.includes(b.id);
                return (
                  <label key={b.id} className={`boss-pill ${on ? "boss-pill--on" : ""}`}>
                    <input type="checkbox" checked={on} onChange={() => actions.toggleBoss(b.id)} />
                    {b.label}
                  </label>
                );
              })}
            </div>
          </section>

          <section className="glass glass--half">
            <h2 className="glass__heading">Inventory</h2>
            <label className="field">
              <span className="field__label">One per line · e.g. 30 iron bar</span>
              <textarea
                rows={5}
                value={inventoryText}
                onChange={(e) => setInventoryText(e.target.value)}
              />
            </label>
            <button type="button" className="btn" onClick={() => actions.setInventoryText(inventoryText)}>
              Apply
            </button>
            {Object.keys(progress.inventory).length > 0 && (
              <ul className="chips">
                {Object.entries(progress.inventory).map(([id, count]) => (
                  <li key={id} className="chip">
                    {count}× {getItemName(id)}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass glass--wide">
            <h2 className="glass__heading">Try in ChatGPT</h2>
            <ul className="prompt-stack">
              {actions.demos.map((d) => (
                <li key={d.id} className="prompt-card">
                  <code>{d.chatPrompt}</code>
                  <button type="button" className="btn btn--sm" onClick={() => copyPrompt(d.chatPrompt)}>
                    {copiedPrompt === d.chatPrompt ? "Copied" : "Copy"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <AgentPanel />

          <section className="glass glass--half">
            <h2 className="glass__heading">Whisper</h2>
            <div className="stat-row">
              <dl className="stat">
                <dt>Stage scope</dt>
                <dd>{actions.stageLabel}</dd>
              </dl>
            </div>
            <p className="hint-glass">{hintPreview}</p>
          </section>

          <section className="glass glass--half">
            <h2 className="glass__heading">
              Craftable now
              <span className="count-badge">{craftable.length}</span>
            </h2>
            {craftable.length === 0 ? (
              <p className="empty">Load a scenario or set inventory.</p>
            ) : (
              <ul className="recipe-scroll">
                {craftable.map((r: CraftableRecipe) => (
                  <li key={r.id}>
                    <strong>{r.name}</strong>
                    {r.station ? <span className="tag">{r.station}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass glass--half">
            <h2 className="glass__heading">
              One step away
              <span className="count-badge">{nearby.length}</span>
            </h2>
            {nearby.length === 0 ? (
              <p className="empty">Nothing close yet.</p>
            ) : (
              <ul className="recipe-scroll">
                {nearby.map((r: CraftableRecipe) => (
                  <li key={r.id}>
                    <div>
                      <strong>{r.name}</strong>
                      <span className="missing">
                        need {r.missing.map((m) => `${m.need - m.have} ${m.name}`).join(", ")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {progress.discoveries.length > 0 && (
            <section className="glass glass--wide">
              <h2 className="glass__heading">Discoveries</h2>
              <ul className="discoveries">
                {progress.discoveries.slice(0, 5).map((d: DiscoveryEntry) => (
                  <li key={d.id}>{d.text}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

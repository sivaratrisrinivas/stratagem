import { useEffect, useState } from "react";
import { isWebMcpSupported } from "./webmcp/types";
import "./App.css";

function App() {
  const [webmcpReady, setWebmcpReady] = useState(false);

  useEffect(() => {
    setWebmcpReady(isWebMcpSupported());
  }, []);

  return (
    <div className="app">
      <header>
        <p className="eyebrow">WebMCP Challenge · Terraria companion</p>
        <h1>Fog</h1>
        <p className="lede">
          Second-screen help that knows your progress and refuses to spoil what
          you have not earned yet.
        </p>
      </header>

      <section className="status" aria-live="polite">
        <h2>Runtime</h2>
        <dl>
          <div>
            <dt>WebMCP</dt>
            <dd className={webmcpReady ? "ok" : "warn"}>
              {webmcpReady
                ? "document.modelContext available"
                : "Not detected — test on deployed HTTPS URL in ChatGPT desktop or Chrome with the WebMCP flag"}
            </dd>
          </div>
          <div>
            <dt>Starter tools</dt>
            <dd>
              <code>get_progress</code>, <code>next_step_hint</code>
            </dd>
          </div>
        </dl>
      </section>

      <section className="next">
        <h2>Next in Cursor</h2>
        <ol>
          <li>Curate <code>src/data/</code> (recipes, stages, housing rules)</li>
          <li>Implement gating in <code>src/lib/</code></li>
          <li>Wire progress UI and stage-scoped tool registration</li>
          <li>Deploy to Vercel and test in ChatGPT&apos;s browser</li>
        </ol>
      </section>
    </div>
  );
}

export default App;

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import diagrams from 'virtual:worktree-diagrams';
import { workshopPalette, diagramLabels, diagramNames, diagramSummaries } from './content.js';
import '@xyflow/react/dist/style.css';
import './styles.css';
const NodeWorkshop = React.lazy(() => import('./workshop.jsx').then(({ NodeWorkshop }) => ({ default: NodeWorkshop })));

let mermaidPromise;
function loadMermaid() {
  mermaidPromise ??= import('mermaid').then(({ default: instance }) => {
    instance.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base' });
    return instance;
  });
  return mermaidPromise;
}

let renderQueue = Promise.resolve();

function renderMermaid(id, code, colors) {
  const config = {
    theme: 'base',
    themeVariables: {
      background: colors.surface,
      primaryColor: colors.surface,
      primaryTextColor: colors.ink,
      primaryBorderColor: colors.line,
      secondaryColor: colors.ground,
      tertiaryColor: colors.surface,
      lineColor: colors.accent,
      textColor: colors.ink,
      mainBkg: colors.surface,
      actorBkg: colors.surface,
      actorBorder: colors.line,
      actorTextColor: colors.ink,
      signalColor: colors.accent,
      noteBkgColor: colors.ground,
      noteTextColor: colors.ink,
      labelBoxBkgColor: colors.surface,
      stateBkg: colors.surface,
      stateLabelColor: colors.ink,
      fontFamily: 'Georgia, serif',
    },
  };
  const themedSource = `%%{init: ${JSON.stringify(config)}}%%\n${code}`;
  const job = renderQueue.then(async () => (await loadMermaid()).render(id, themedSource));
  renderQueue = job.then(() => undefined, () => undefined);
  return job;
}

function useNearViewport() {
  const host = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '600px' });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  return [host, visible];
}

function MermaidDiagram({ id, code, colors, name, summary }) {
  const [host, visible] = useNearViewport();
  const [result, setResult] = useState({ svg: '', error: '' });

  useEffect(() => {
    if (!visible) return;
    let live = true;
    renderMermaid(id, code, colors).then(
      ({ svg }) => { if (live) setResult({ svg, error: '' }); },
      (error) => { if (live) setResult({ svg: '', error: error.message }); },
    );
    return () => { live = false; };
  }, [visible, id, code, colors]);

  return (
    <div ref={host} className={`mermaid-host ${result.svg ? 'is-ready' : ''}`}>
      {result.svg ? (
        <div className="diagram-svg" role="img" aria-label={summary} dangerouslySetInnerHTML={{ __html: result.svg }} />
      ) : result.error ? (
        <p className="render-error" role="alert">Could not render {name}: {result.error}</p>
      ) : (
        <p className="render-pending" aria-live="polite">{visible ? 'Drawing diagram…' : 'Diagram loads as you scroll'}</p>
      )}
    </div>
  );
}

function WorkshopMount({ colors }) {
  const [host, visible] = useNearViewport();
  return (
    <div ref={host} className="flow-workshop-mount">
      {visible ? (
        <Suspense fallback={<p className="render-pending">Loading interactive graph…</p>}>
          <NodeWorkshop colors={colors} />
        </Suspense>
      ) : (
        <p className="render-pending">Interactive graph loads as you scroll</p>
      )}
    </div>
  );
}

const diagramIds = ['component-map', 'session-handoff', 'review-gates'];

function Study() {
  const colors = workshopPalette;
  const style = {
    '--ground': colors.ground,
    '--surface': colors.surface,
    '--ink': colors.ink,
    '--muted': colors.muted,
    '--accent': colors.accent,
    '--line': colors.line,
  };

  return (
    <section className="study study--workshop" style={style} aria-labelledby="page-title">
      <header className="study-heading">
        <div className="study-index" aria-hidden="true">17</div>
        <div className="study-copy">
          <p className="eyebrow">Chosen direction / interactive diagrams</p>
          <h1 id="page-title">Node Workshop</h1>
          <p className="study-idea">Explore how the worktree workflow is owned, handed off, and reviewed.</p>
        </div>
        <div className="study-meta">
          <p>Three full-width views from <code>USAGE.md</code>. Move the component map; use the sequence and state diagrams for the exact handoff and review rules.</p>
          <a href="#component-map" className="index-link">Explore the map <span aria-hidden="true">↓</span></a>
        </div>
      </header>

      <div className="study-controls">
        <p>Drag nodes to rearrange the map. Use the graph controls to zoom. On small screens, scroll each diagram frame horizontally.</p>
      </div>

      <div className="diagram-stack">
        {diagrams.map((code, diagramIndex) => (
          <article
            id={diagramIds[diagramIndex]}
            key={diagramIds[diagramIndex]}
            className="diagram-block"
            data-kind={diagramIndex}
            aria-label={`${diagramNames[diagramIndex]} in Node Workshop`}
          >
            <div className="diagram-caption">
              <span className="diagram-kicker">{diagramLabels[diagramIndex]}</span>
              <h2>{diagramNames[diagramIndex]}</h2>
            </div>
            <div className="diagram-canvas">
              {diagramIndex === 0 ? (
                <WorkshopMount colors={colors} />
              ) : (
                <MermaidDiagram id={`diagram-workshop-${diagramIndex}`} code={code} colors={colors} name={diagramNames[diagramIndex]} summary={diagramSummaries[diagramIndex]} />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <header className="site-header" id="top">
        <div className="site-mark">WORKTREE <span aria-hidden="true">/</span> NODE WORKSHOP</div>
        <a href="#component-map">Explore the diagrams <span aria-hidden="true">↓</span></a>
      </header>
      <main><Study /></main>
      <footer className="site-footer">
        <span>One workflow / three connected views</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);

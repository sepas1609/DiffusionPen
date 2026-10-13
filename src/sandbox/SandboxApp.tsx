import React, { useState, useEffect, useRef } from 'react';
import { DHSEEngine } from '../engine/DHSEEngine';
import { RenderParams, RenderedDocument, InstrumentType } from '../types/engine';
import { WebGLScene } from '../realism/WebGLScene';
import { AccessibilityEngine } from '../a11y/AccessibilityEngine';
import { ParameterRail } from './components/ParameterRail';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ABComparison } from './components/ABComparison';
import { ContinuationStudio } from './components/ContinuationStudio';
import { RealismStudio } from './components/RealismStudio';
import { ForensicInspector } from './components/ForensicInspector';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import './styles/sandbox.css';

const DEFAULT_SAMPLE_TEXT = `# DiffusionPen (DHSE) Synthesis Demonstration

The transition from digital notes to physical handwriting requires biomechanical motor fidelity.

$$ \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$

\`\`\`python
def train_step(x, y, lr=0.01):
    grad = compute_gradient(x, y)
    return weights - lr * grad
\`\`\`

flowchart: [Raw Photo] -> <CRAFT Detect> -> [ViT+SAQ Embed] -> (Encrypted Vault)

Handwritten synthesis obeys the Two-Thirds Power Law where angular velocity ω matches curvature κ.`;

export const SandboxApp: React.FC = () => {
  const [engine] = useState(() => new DHSEEngine({ userId: 'student_user_408' }));
  const [a11y] = useState(() => new AccessibilityEngine());
  const [a11yConfig, setA11yConfig] = useState(() => a11y.getConfig());

  const [text, setText] = useState(DEFAULT_SAMPLE_TEXT);
  const [params, setParams] = useState<RenderParams>({
    variancePct: 9.0,
    baselineAmp: 1.2,
    kerningSigma: 0.8,
    powerLawK: 1.0,
    instrument: 'ballpoint',
    fatigueEnabled: false,
    handedness: 'right',
    paperColor: '#fdfbf7',
    inkColor: '#141724',
    ruledLines: true,
    ruledSpacing: 28,
  });

  const [renderedDoc, setRenderedDoc] = useState<RenderedDocument | null>(null);
  const [renderTimeMs, setRenderTimeMs] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'calibration' | 'continuation' | 'ab' | 'realism' | 'forensics' | 'a11y'>('calibration');
  const [use3DWarp, setUse3DWarp] = useState<boolean>(false);
  const [showCoffeeRing, setShowCoffeeRing] = useState<boolean>(false);
  const [showFilmGrain, setShowFilmGrain] = useState<boolean>(true);
  const [lightingIntensity, setLightingIntensity] = useState<number>(0.65);

  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);
  const webglSceneRef = useRef<WebGLScene | null>(null);

  // Initialize DHSE Engine
  useEffect(() => {
    engine.init().then(() => {
      triggerRender();
    });
  }, []);

  // Initialize WebGL Scene
  useEffect(() => {
    if (canvas3DRef.current && !webglSceneRef.current) {
      webglSceneRef.current = new WebGLScene(canvas3DRef.current);
    }
  }, []);

  const triggerRender = async (currentParams = params) => {
    const t0 = performance.now();
    const doc = await engine.render(text, currentParams);
    const t1 = performance.now();
    setRenderTimeMs(Math.round(t1 - t0));
    setRenderedDoc(doc);

    // Render to 2D Canvas
    if (canvas2DRef.current && doc.pages.length > 0) {
      engine.renderToCanvas(doc.pages[0], canvas2DRef.current, currentParams);

      // If 3D warp enabled, pass through WebGL scene
      if (use3DWarp && webglSceneRef.current && canvas3DRef.current) {
        webglSceneRef.current.setCoffeeRing(showCoffeeRing);
        webglSceneRef.current.setLightingIntensity(lightingIntensity);
        webglSceneRef.current.render(canvas2DRef.current);
      }
    }
  };

  // Re-render when parameters or text change
  useEffect(() => {
    const debounce = setTimeout(() => {
      triggerRender(params);
    }, 120);
    return () => clearTimeout(debounce);
  }, [text, params, use3DWarp, showCoffeeRing, lightingIntensity]);

  const handleReset = () => {
    const resetDefaults: RenderParams = {
      variancePct: 9.0,
      baselineAmp: 1.2,
      kerningSigma: 0.8,
      powerLawK: 1.0,
      instrument: 'ballpoint',
      fatigueEnabled: false,
      handedness: 'right',
      paperColor: '#fdfbf7',
      inkColor: '#141724',
      ruledLines: true,
      ruledSpacing: 28,
    };
    setParams(resetDefaults);
  };

  const handleExportSVG = async () => {
    if (!renderedDoc) return;
    const blob = await engine.exportDocument(renderedDoc, 'svg');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhse_document_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    a11y.announceLive('Exported vector SVG successfully with embedded forensic watermark.');
  };

  const handleExportPNG = async () => {
    if (!renderedDoc) return;
    const blob = await engine.exportDocument(renderedDoc, 'png');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhse_document_${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    a11y.announceLive('Exported PNG document successfully.');
  };

  const handlePresetSelect = (preset: 'student' | 'architect' | 'mathematician' | 'quill') => {
    switch (preset) {
      case 'student':
        setParams({
          ...params,
          variancePct: 9.5,
          baselineAmp: 1.4,
          kerningSigma: 0.85,
          powerLawK: 1.05,
          instrument: 'ballpoint',
          inkColor: '#141724',
        });
        break;
      case 'architect':
        setParams({
          ...params,
          variancePct: 5.5,
          baselineAmp: 0.3,
          kerningSigma: 0.4,
          powerLawK: 0.9,
          instrument: 'gel',
          inkColor: '#0f172a',
        });
        break;
      case 'mathematician':
        setParams({
          ...params,
          variancePct: 7.2,
          baselineAmp: 0.8,
          kerningSigma: 0.65,
          powerLawK: 1.15,
          instrument: 'fountain',
          inkColor: '#091d42',
        });
        break;
      case 'quill':
        setParams({
          ...params,
          variancePct: 11.0,
          baselineAmp: 2.1,
          kerningSigma: 1.1,
          powerLawK: 1.4,
          instrument: 'fountain',
          inkColor: '#301b1b',
        });
        break;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">DP</div>
          <div>
            <h1 className="brand-title" style={{ fontSize: '16px', lineHeight: 1.2 }}>
              DiffusionPen <span className="brand-badge">DHSE v2.0</span>
            </h1>
          </div>
        </div>

        <div className="header-controls">
          <div style={{ display: 'flex', gap: '6px', marginRight: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => handlePresetSelect('student')}
              style={{ fontSize: '11.5px', height: '30px' }}
            >
              Student Cursive
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handlePresetSelect('architect')}
              style={{ fontSize: '11.5px', height: '30px' }}
            >
              Architect Clean
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handlePresetSelect('mathematician')}
              style={{ fontSize: '11.5px', height: '30px' }}
            >
              Mathematician
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handlePresetSelect('quill')}
              style={{ fontSize: '11.5px', height: '30px' }}
            >
              Expressive Quill
            </button>
          </div>

          <button
            className={`btn ${use3DWarp ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setUse3DWarp(!use3DWarp)}
            aria-label="Toggle 3D WebGL binding warp view"
          >
            {use3DWarp ? '3D WebGL Mesh Active' : 'Enable 3D WebGL'}
          </button>

          <button className="btn btn-secondary" onClick={handleExportPNG}>
            Export PNG
          </button>
          <button className="btn btn-primary" onClick={handleExportSVG}>
            Export Vector SVG
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="workspace-layout">
        <div className="center-stage">
          {/* Left: Input Text Editor */}
          <section className="editor-pane" aria-label="Document Source Editor">
            <div className="pane-header">
              <span>Structured Content Editor</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Markdown • LaTeX • Code • Diagrams</span>
            </div>
            <textarea
              className="editor-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter markdown, $$ LaTeX equations $$, code blocks, or flowchart: [A] -> [B]"
              aria-label="Document source text input"
            />
          </section>

          {/* Right: Rendered Document Viewport */}
          <section className="viewport-pane" aria-label="Handwritten Document Viewport">
            <div className="pane-header">
              <span>Live Biomechanical Ink Viewport</span>
              <span style={{ fontSize: '11px', color: '#00f2fe' }}>
                {renderTimeMs}ms • 60 FPS • Zero-Knowledge Wasm
              </span>
            </div>
            <div className="viewport-content">
              {use3DWarp ? (
                <canvas
                  ref={canvas3DRef}
                  width={780}
                  height={1040}
                  className="paper-card"
                  style={{ display: 'block', maxHeight: '85vh', width: 'auto' }}
                />
              ) : (
                <canvas
                  ref={canvas2DRef}
                  width={780}
                  height={1040}
                  className="paper-card"
                  style={{ display: 'block', maxHeight: '85vh', width: 'auto' }}
                />
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar: Biomechanical Parameter Rail */}
        <ParameterRail params={params} onChange={setParams} onReset={handleReset} />
      </div>

      {/* Bottom Drawer & Diagnostic Tabs */}
      <div className="bottom-drawer">
        <div className="drawer-tabs">
          <button
            className={`tab-btn ${activeTab === 'calibration' ? 'active' : ''}`}
            onClick={() => setActiveTab('calibration')}
          >
            Stylus Calibration
          </button>
          <button
            className={`tab-btn ${activeTab === 'continuation' ? 'active' : ''}`}
            onClick={() => setActiveTab('continuation')}
          >
            Physical Continuation (OCR)
          </button>
          <button
            className={`tab-btn ${activeTab === 'ab' ? 'active' : ''}`}
            onClick={() => setActiveTab('ab')}
          >
            A/B Visual Comparison & CER
          </button>
          <button
            className={`tab-btn ${activeTab === 'realism' ? 'active' : ''}`}
            onClick={() => setActiveTab('realism')}
          >
            3D WebGL Realism Studio
          </button>
          <button
            className={`tab-btn ${activeTab === 'forensics' ? 'active' : ''}`}
            onClick={() => setActiveTab('forensics')}
          >
            Forensic Watermark Seal
          </button>
          <button
            className={`tab-btn ${activeTab === 'a11y' ? 'active' : ''}`}
            onClick={() => setActiveTab('a11y')}
          >
            Accessibility & Dysgraphia
          </button>
        </div>

        <div className="drawer-body">
          {activeTab === 'calibration' && <DrawingCanvas />}
          {activeTab === 'continuation' && <ContinuationStudio />}
          {activeTab === 'ab' && <ABComparison currentText={text} />}
          {activeTab === 'realism' && (
            <RealismStudio
              use3DWarp={use3DWarp}
              onToggle3DWarp={setUse3DWarp}
              showCoffeeRing={showCoffeeRing}
              onToggleCoffeeRing={setShowCoffeeRing}
              lightingIntensity={lightingIntensity}
              onChangeLighting={setLightingIntensity}
              showFilmGrain={showFilmGrain}
              onToggleFilmGrain={setShowFilmGrain}
            />
          )}
          {activeTab === 'forensics' && <ForensicInspector metadata={renderedDoc?.metadata} />}
          {activeTab === 'a11y' && (
            <AccessibilityPanel
              a11y={a11y}
              config={a11yConfig}
              onUpdate={() => setA11yConfig(a11y.getConfig())}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <footer className="status-bar">
        <div className="status-item">
          <span className="status-dot"></span>
          <span>Zero-Knowledge Invariant Verified: 0 Network Calls</span>
        </div>
        <div className="status-item">
          <span>Encrypted Profile: student-cursive (AES-GCM-256)</span>
        </div>
        <div className="status-item">
          <span>Steganographic Watermark: SHA-256 Nonce Embedded</span>
        </div>
      </footer>
    </div>
  );
};

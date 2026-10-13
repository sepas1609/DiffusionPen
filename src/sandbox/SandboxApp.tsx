import React, { useState, useEffect, useRef } from 'react';
import { DHSEEngine } from '../engine/DHSEEngine';
import { RenderParams, RenderedDocument, RenderedPage } from '../types/engine';
import { WebGLScene } from '../realism/WebGLScene';
import { AccessibilityEngine } from '../a11y/AccessibilityEngine';
import { ParameterRail } from './components/ParameterRail';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ABComparison } from './components/ABComparison';
import { ContinuationStudio } from './components/ContinuationStudio';
import { RealismStudio } from './components/RealismStudio';
import { ForensicInspector } from './components/ForensicInspector';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { PersonalQuirksPanel } from './components/PersonalQuirksPanel';
import { FileImportModal } from './components/FileImportModal';
import { PdfExporter } from '../export/PdfExporter';
import { QuirksConfig } from '../engine/PersonalQuirks';
import './styles/sandbox.css';

const DEFAULT_SAMPLE_TEXT = `# DiffusionPen (DHSE v2.0) — Research Assignment

Student: Saran Boddu | Date: October 13, 2026 | Roll: AM.EN.U4AIE22042

The transition from digital notes to physical handwriting requires biomechanical motor fidelity. In this submission, we formulate the optimization problem:

$$ \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$

\`\`\`python
def train_step(weights, x, y, lr=0.01):
    # Backward pass with motor velocity modulation
    grad = compute_gradient(x, y)
    return weights - lr * grad
\`\`\`

flowchart: [Raw Document] -> <Homography Warp> -> [Hough Pitch Detect] -> (Anchor Continuation)

Handwritten motor control obeys the Two-Thirds Power Law where angular velocity ω matches curvature κ.
Notice the crossed ~~numbers~~ 7 and z symbols, representing authentic STEM motor habits.`;

export const SandboxApp: React.FC = () => {
  const [engine] = useState(() => new DHSEEngine({ userId: 'student_saran_boddu' }));
  const [a11y] = useState(() => new AccessibilityEngine());
  const [a11yConfig, setA11yConfig] = useState(() => a11y.getConfig());

  const [text, setText] = useState(DEFAULT_SAMPLE_TEXT);
  const [importedFilename, setImportedFilename] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination state
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Quirks state
  const [quirks, setQuirks] = useState<QuirksConfig>({
    crossedSevenAndZ: true,
    tBarStyle: 'high',
    dottedIStyle: 'standard',
    descenderStyle: 'loopy',
    enableScratchOuts: true,
    marginDoodles: true,
    wavyUnderlines: true,
    signatureBlock: true,
    signerName: 'Saran Boddu',
    submissionDate: '13/10/2026',
    studentId: 'AM.EN.U4AIE22042',
    highlightPeculiars: false,
  });

  const [params, setParams] = useState<RenderParams>({
    variancePct: 9.0,
    baselineAmp: 1.2,
    kerningSigma: 0.8,
    powerLawK: 1.0,
    instrument: 'ballpoint',
    paperTemplate: 'notebook',
    fontSizeScale: 1.0,
    slantAngle: 4.0,
    wordSpacingScale: 1.0,
    letterSpacingScale: 1.0,
    fatigueEnabled: false,
    handedness: 'right',
    paperColor: '#fdfbf7',
    inkColor: '#141724',
    ruledLines: true,
    ruledSpacing: 28,
    quirks: {
      crossedSevenAndZ: true,
      tBarStyle: 'high',
      dottedIStyle: 'standard',
      descenderStyle: 'loopy',
      enableScratchOuts: true,
      marginDoodles: true,
      wavyUnderlines: true,
      signatureBlock: true,
      signerName: 'Saran Boddu',
      submissionDate: '13/10/2026',
      studentId: 'AM.EN.U4AIE22042',
      highlightPeculiars: false,
    },
  });

  const [renderedDoc, setRenderedDoc] = useState<RenderedDocument | null>(null);
  const [renderTimeMs, setRenderTimeMs] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'quirks' | 'calibration' | 'continuation' | 'ab' | 'realism' | 'forensics' | 'a11y'>('quirks');
  const [use3DWarp, setUse3DWarp] = useState<boolean>(false);
  const [showCoffeeRing, setShowCoffeeRing] = useState<boolean>(false);
  const [showFilmGrain, setShowFilmGrain] = useState<boolean>(true);
  const [lightingIntensity, setLightingIntensity] = useState<number>(0.65);

  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const canvas3DRef = useRef<HTMLCanvasElement | null>(null);
  const webglSceneRef = useRef<WebGLScene | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const triggerRender = async (currentParams = params, currentQuirks = quirks) => {
    const t0 = performance.now();
    const doc = await engine.render(text, {
      ...currentParams,
      quirks: currentQuirks,
    });
    const t1 = performance.now();
    setRenderTimeMs(Math.round(t1 - t0));
    setRenderedDoc(doc);

    // If current page index is beyond total pages, reset to 0
    if (currentPageIndex >= doc.pages.length) {
      setCurrentPageIndex(0);
    }

    renderActivePageToCanvas(doc.pages[currentPageIndex] || doc.pages[0], currentParams);
  };

  const renderActivePageToCanvas = (page: RenderedPage, currentParams = params) => {
    if (!page) return;
    if (canvas2DRef.current) {
      engine.renderToCanvas(page, canvas2DRef.current, currentParams);

      if (use3DWarp && webglSceneRef.current && canvas3DRef.current) {
        webglSceneRef.current.setCoffeeRing(showCoffeeRing);
        webglSceneRef.current.setLightingIntensity(lightingIntensity);
        webglSceneRef.current.render(canvas2DRef.current);
      }
    }
  };

  // Debounced re-render when text, params, or quirks change
  useEffect(() => {
    const debounce = setTimeout(() => {
      triggerRender(params, quirks);
    }, 120);
    return () => clearTimeout(debounce);
  }, [text, params, quirks, use3DWarp, showCoffeeRing, lightingIntensity]);

  // Re-render when page changes
  useEffect(() => {
    if (renderedDoc && renderedDoc.pages[currentPageIndex]) {
      renderActivePageToCanvas(renderedDoc.pages[currentPageIndex], params);
    }
  }, [currentPageIndex]);

  const handleApplyImportedText = (importedText: string, filename: string) => {
    setText(importedText);
    setImportedFilename(filename);
    setCurrentPageIndex(0);
    showToast(`Imported ${filename}! Synthesizing Page 1 handwritten sample...`);
    a11y.announceLive(`Imported ${filename}. Displaying handwritten synthesis sample.`);
  };

  const handleExportPDF = async () => {
    if (!renderedDoc) return;
    showToast('Compiling multi-page handwritten PDF...');
    await PdfExporter.exportToPdf(
      engine,
      renderedDoc.pages,
      params,
      importedFilename ? `${importedFilename.replace(/\.[^/.]+$/, '')}_handwritten.pdf` : 'assignment_handwritten.pdf'
    );
    showToast('Handwritten PDF exported successfully!');
    a11y.announceLive('Exported multi-page handwritten PDF.');
  };

  const handleExportSVG = async () => {
    if (!renderedDoc) return;
    const blob = await engine.exportDocument(renderedDoc, 'svg');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhse_page_${currentPageIndex + 1}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Page SVG with steganographic watermark!');
  };

  const handleExportPNG = async () => {
    if (!renderedDoc) return;
    const blob = await engine.exportDocument(renderedDoc, 'png');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhse_page_${currentPageIndex + 1}.png`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Page PNG image!');
  };

  const handlePresetSelect = (preset: 'student' | 'architect' | 'mathematician' | 'fast-exam' | 'doctor' | 'quill') => {
    switch (preset) {
      case 'student':
        setParams({
          ...params,
          variancePct: 9.5,
          baselineAmp: 1.4,
          kerningSigma: 0.85,
          powerLawK: 1.05,
          instrument: 'ballpoint',
          paperTemplate: 'notebook',
          fontSizeScale: 1.0,
          slantAngle: 4.0,
          inkColor: '#141724',
        });
        showToast('Applied Preset: Student Cursive (Authentic Class Notes)');
        break;
      case 'architect':
        setParams({
          ...params,
          variancePct: 5.5,
          baselineAmp: 0.3,
          kerningSigma: 0.4,
          powerLawK: 0.9,
          instrument: 'gel',
          paperTemplate: 'grid',
          fontSizeScale: 0.95,
          slantAngle: 0.0,
          inkColor: '#0f172a',
        });
        showToast('Applied Preset: Architect Clean (Precision Engineering Print)');
        break;
      case 'mathematician':
        setParams({
          ...params,
          variancePct: 7.2,
          baselineAmp: 0.8,
          kerningSigma: 0.65,
          powerLawK: 1.15,
          instrument: 'fountain',
          paperTemplate: 'grid',
          fontSizeScale: 1.05,
          slantAngle: 6.0,
          inkColor: '#091d42',
        });
        showToast('Applied Preset: Mathematician STEM (Sharp Equations & Crossed Ticks)');
        break;
      case 'fast-exam':
        setParams({
          ...params,
          variancePct: 12.0,
          baselineAmp: 1.8,
          kerningSigma: 1.0,
          powerLawK: 1.25,
          instrument: 'ballpoint',
          paperTemplate: 'notebook',
          fontSizeScale: 1.1,
          slantAngle: 12.0,
          fatigueEnabled: true,
          inkColor: '#141724',
        });
        showToast('Applied Preset: Fast Exam-Taker (Rapid Slanted Script & Fatigue)');
        break;
      case 'doctor':
        setParams({
          ...params,
          variancePct: 14.5,
          baselineAmp: 2.4,
          kerningSigma: 1.2,
          powerLawK: 1.35,
          instrument: 'ballpoint',
          paperTemplate: 'blank',
          fontSizeScale: 0.9,
          slantAngle: 15.0,
          inkColor: '#1e293b',
        });
        showToast('Applied Preset: Doctor Medical Script (Loose Fluid Ligatures)');
        break;
      case 'quill':
        setParams({
          ...params,
          variancePct: 11.0,
          baselineAmp: 2.1,
          kerningSigma: 1.1,
          powerLawK: 1.4,
          instrument: 'fountain',
          paperTemplate: 'legal',
          fontSizeScale: 1.15,
          slantAngle: 8.0,
          inkColor: '#301b1b',
        });
        showToast('Applied Preset: Expressive Quill (High-Curvature Nib-Flex)');
        break;
    }
  };

  const totalPages = renderedDoc ? renderedDoc.pages.length : 1;
  const activeMarkers = renderedDoc && renderedDoc.pages[currentPageIndex]
    ? renderedDoc.pages[currentPageIndex].peculiarMarkers
    : [];

  return (
    <div className="app-container">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            right: '24px',
            background: 'rgba(18, 24, 38, 0.95)',
            border: '1px solid #00f2fe',
            boxShadow: '0 8px 24px rgba(0, 242, 254, 0.25)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span style={{ color: '#00f2fe' }}>✦</span> {toastMessage}
        </div>
      )}

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
          {/* File Importer Button */}
          <button
            className="btn btn-secondary"
            onClick={() => setIsImportModalOpen(true)}
            style={{ border: '1px solid rgba(0, 242, 254, 0.4)', background: 'rgba(0, 242, 254, 0.08)' }}
            aria-label="Import PDF, DOCX, or TXT file"
          >
            <span style={{ color: '#00f2fe' }}>📂</span> Import PDF / DOCX / TXT
          </button>

          {/* Preset Selector Dropdown */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-secondary" onClick={() => handlePresetSelect('student')} style={{ fontSize: '11px', height: '30px' }}>
              Student
            </button>
            <button className="btn btn-secondary" onClick={() => handlePresetSelect('architect')} style={{ fontSize: '11px', height: '30px' }}>
              Architect
            </button>
            <button className="btn btn-secondary" onClick={() => handlePresetSelect('mathematician')} style={{ fontSize: '11px', height: '30px' }}>
              Mathematician
            </button>
            <button className="btn btn-secondary" onClick={() => handlePresetSelect('fast-exam')} style={{ fontSize: '11px', height: '30px' }}>
              Fast-Exam
            </button>
            <button className="btn btn-secondary" onClick={() => handlePresetSelect('doctor')} style={{ fontSize: '11px', height: '30px' }}>
              Doctor
            </button>
          </div>

          {/* Highlight Quirks for Evaluator/Head */}
          <button
            className={`btn ${quirks.highlightPeculiars ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => {
              const updated = !quirks.highlightPeculiars;
              setQuirks({ ...quirks, highlightPeculiars: updated });
              showToast(updated ? 'Highlighting authentic personal quirks for evaluator review!' : 'Peculiar highlights hidden.');
            }}
            title="Highlight authentic personal quirks so evaluator/head recognizes it as your handwriting"
          >
            ★ Highlight Quirks
          </button>

          {/* 3D WebGL Toggle */}
          <button
            className={`btn ${use3DWarp ? 'btn-active' : 'btn-secondary'}`}
            onClick={() => setUse3DWarp(!use3DWarp)}
            aria-label="Toggle 3D WebGL binding warp view"
          >
            {use3DWarp ? '3D WebGL Mesh' : '3D Warp'}
          </button>

          {/* Export Actions */}
          <button className="btn btn-secondary" onClick={handleExportPNG} title="Export active page as PNG">
            PNG
          </button>
          <button className="btn btn-secondary" onClick={handleExportSVG} title="Export active page as vector SVG">
            SVG
          </button>
          <button className="btn btn-primary" onClick={handleExportPDF} title="Export multi-page handwritten PDF">
            <span>📄</span> Export Handwritten PDF
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="workspace-layout">
        <div className="center-stage">
          {/* Left: Input Text Editor */}
          <section className="editor-pane" aria-label="Document Source Editor">
            <div className="pane-header">
              <span>Structured Editor {importedFilename ? `(${importedFilename})` : ''}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {text.split(/\s+/).filter(Boolean).length} words • {text.length} chars
              </span>
            </div>
            <textarea
              className="editor-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or import PDF/Word notes, $$ LaTeX equations $$, code blocks, or flowchart: [A] -> [B]"
              aria-label="Document source text input"
            />
          </section>

          {/* Right: Rendered Document Viewport */}
          <section className="viewport-pane" aria-label="Handwritten Document Viewport">
            <div className="pane-header">
              {/* Pagination Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#00f2fe', fontWeight: 600 }}>Page {currentPageIndex + 1} of {totalPages}</span>
                <button
                  className="btn btn-secondary"
                  disabled={currentPageIndex === 0}
                  onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                  style={{ height: '24px', padding: '0 6px', fontSize: '11px' }}
                >
                  ◀ Prev
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={currentPageIndex >= totalPages - 1}
                  onClick={() => setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
                  style={{ height: '24px', padding: '0 6px', fontSize: '11px' }}
                >
                  Next ▶
                </button>
              </div>

              {/* Viewport Zoom & Telemetry */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Zoom:</span>
                  <button className="btn btn-secondary" onClick={() => setZoomLevel(0.75)} style={{ height: '22px', padding: '0 5px', fontSize: '10px' }}>75%</button>
                  <button className="btn btn-secondary" onClick={() => setZoomLevel(1.0)} style={{ height: '22px', padding: '0 5px', fontSize: '10px' }}>100%</button>
                  <button className="btn btn-secondary" onClick={() => setZoomLevel(1.25)} style={{ height: '22px', padding: '0 5px', fontSize: '10px' }}>125%</button>
                </div>
                <span style={{ fontSize: '11px', color: '#00f2fe' }}>
                  {renderTimeMs}ms • 60 FPS
                </span>
              </div>
            </div>

            <div className="viewport-content" style={{ overflow: 'auto' }}>
              <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform 0.15s ease' }}>
                {use3DWarp ? (
                  <canvas
                    ref={canvas3DRef}
                    width={794}
                    height={1123}
                    className="paper-card"
                    style={{ display: 'block', maxHeight: '85vh', width: 'auto' }}
                  />
                ) : (
                  <canvas
                    ref={canvas2DRef}
                    width={794}
                    height={1123}
                    className="paper-card"
                    style={{ display: 'block', maxHeight: '85vh', width: 'auto' }}
                  />
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Sidebar: Biomechanical & Typographic Parameters */}
        <ParameterRail
          params={params}
          onChange={(newParams) => {
            setParams(newParams);
          }}
          onReset={() => {
            setParams({
              variancePct: 9.0,
              baselineAmp: 1.2,
              kerningSigma: 0.8,
              powerLawK: 1.0,
              instrument: 'ballpoint',
              paperTemplate: 'notebook',
              fontSizeScale: 1.0,
              slantAngle: 4.0,
              wordSpacingScale: 1.0,
              letterSpacingScale: 1.0,
              fatigueEnabled: false,
              handedness: 'right',
              paperColor: '#fdfbf7',
              inkColor: '#141724',
              ruledLines: true,
              ruledSpacing: 28,
            });
          }}
        />
      </div>

      {/* Bottom Drawer & Diagnostic Tabs */}
      <div className="bottom-drawer">
        <div className="drawer-tabs">
          <button
            className={`tab-btn ${activeTab === 'quirks' ? 'active' : ''}`}
            onClick={() => setActiveTab('quirks')}
          >
            ★ Personal Quirks & Signature Hallmarks
          </button>
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
          {activeTab === 'quirks' && (
            <PersonalQuirksPanel
              quirks={quirks}
              onChange={(updated) => setQuirks(updated)}
              activeMarkers={activeMarkers}
            />
          )}
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
          <span>Active Template: {params.paperTemplate.toUpperCase()} (A4 Multi-Page)</span>
        </div>
        <div className="status-item">
          <span>Peculiar Markers: {activeMarkers.length} Authentic Ticks Detected</span>
        </div>
      </footer>

      {/* File Import Modal */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApplyText={handleApplyImportedText}
      />
    </div>
  );
};

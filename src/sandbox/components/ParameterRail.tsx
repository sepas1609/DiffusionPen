import React from 'react';
import { RenderParams, InstrumentType, PaperTemplateType } from '../../types/engine';

interface ParameterRailProps {
  params: RenderParams;
  onChange: (updated: RenderParams) => void;
  onReset: () => void;
}

export const ParameterRail: React.FC<ParameterRailProps> = ({ params, onChange, onReset }) => {
  const update = <K extends keyof RenderParams>(key: K, value: RenderParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <aside className="parameter-rail" aria-label="Biomechanical Parameters">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="rail-title">Biomechanical Control</span>
        <button
          className="btn btn-secondary"
          onClick={onReset}
          style={{ height: '24px', padding: '0 8px', fontSize: '11px' }}
          aria-label="Reset parameters to defaults"
        >
          Reset
        </button>
      </div>

      {/* Typography & Font Sizing */}
      <div className="rail-section">
        <span className="rail-title">Typography & Geometry</span>

        {/* Font Size Scale */}
        <div className="slider-group">
          <div className="slider-header">
            <label htmlFor="param-fontsize">Handwriting Size</label>
            <span className="slider-value">{(params.fontSizeScale ?? 1.0).toFixed(2)}x</span>
          </div>
          <input
            id="param-fontsize"
            type="range"
            min={0.75}
            max={1.5}
            step={0.05}
            value={params.fontSizeScale ?? 1.0}
            onChange={(e) => update('fontSizeScale', parseFloat(e.target.value))}
          />
        </div>

        {/* Slant Angle */}
        <div className="slider-group">
          <div className="slider-header">
            <label htmlFor="param-slant">Cursive Slant Angle</label>
            <span className="slider-value">{(params.slantAngle ?? 4.0).toFixed(1)}°</span>
          </div>
          <input
            id="param-slant"
            type="range"
            min={-12.0}
            max={22.0}
            step={1.0}
            value={params.slantAngle ?? 4.0}
            onChange={(e) => update('slantAngle', parseFloat(e.target.value))}
          />
        </div>

        {/* Word Spacing */}
        <div className="slider-group">
          <div className="slider-header">
            <label htmlFor="param-wordspacing">Word Spacing Multiplier</label>
            <span className="slider-value">{(params.wordSpacingScale ?? 1.0).toFixed(2)}x</span>
          </div>
          <input
            id="param-wordspacing"
            type="range"
            min={0.75}
            max={1.6}
            step={0.05}
            value={params.wordSpacingScale ?? 1.0}
            onChange={(e) => update('wordSpacingScale', parseFloat(e.target.value))}
          />
        </div>

        {/* Letter Spacing */}
        <div className="slider-group">
          <div className="slider-header">
            <label htmlFor="param-letterspacing">Letter Spacing (Kerning)</label>
            <span className="slider-value">{(params.letterSpacingScale ?? 1.0).toFixed(2)}x</span>
          </div>
          <input
            id="param-letterspacing"
            type="range"
            min={0.8}
            max={1.4}
            step={0.05}
            value={params.letterSpacingScale ?? 1.0}
            onChange={(e) => update('letterSpacingScale', parseFloat(e.target.value))}
          />
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Variance Band (Chapter 5.3) */}
      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="param-variance">Variance Band (Authenticity)</label>
          <span className="slider-value">{params.variancePct.toFixed(1)}%</span>
        </div>
        <input
          id="param-variance"
          type="range"
          min={5.0}
          max={15.0}
          step={0.1}
          value={params.variancePct}
          onChange={(e) => update('variancePct', parseFloat(e.target.value))}
        />
        <span style={{ fontSize: '10.5px', color: '#64748b' }}>
          Turing authentic band: 5–15% (default 9%)
        </span>
      </div>

      {/* Baseline Drift (Chapter 5.1) */}
      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="param-baseline">Baseline Drift (Compound Sine)</label>
          <span className="slider-value">{params.baselineAmp.toFixed(1)} px</span>
        </div>
        <input
          id="param-baseline"
          type="range"
          min={0.0}
          max={4.5}
          step={0.1}
          value={params.baselineAmp}
          onChange={(e) => update('baselineAmp', parseFloat(e.target.value))}
        />
      </div>

      {/* Two-Thirds Power Law K (Chapter 6) */}
      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="param-powerlaw">Two-Thirds Power-Law K</label>
          <span className="slider-value">{params.powerLawK.toFixed(2)}</span>
        </div>
        <input
          id="param-powerlaw"
          type="range"
          min={0.5}
          max={1.8}
          step={0.05}
          value={params.powerLawK}
          onChange={(e) => update('powerLawK', parseFloat(e.target.value))}
        />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Paper Template Selector */}
      <div className="rail-section">
        <span className="rail-title">Paper Canvas Template</span>
        <select
          id="param-papertemplate"
          className="form-select"
          value={params.paperTemplate}
          onChange={(e) => update('paperTemplate', e.target.value as PaperTemplateType)}
          aria-label="Select paper canvas template"
        >
          <option value="notebook">Ruled Notebook (Single Line + Margin)</option>
          <option value="grid">Engineering Quad (5mm Grid Paper)</option>
          <option value="legal">Yellow Legal Pad (Double Margin)</option>
          <option value="dotted">Dotted Journal (Bullet Planner)</option>
          <option value="blank">Smooth Parchment (Blank Sheet)</option>
        </select>
      </div>

      {/* Instrument Physics Model (Chapter 14) */}
      <div className="rail-section">
        <span className="rail-title">Instrument Physics</span>
        <select
          id="param-instrument"
          className="form-select"
          value={params.instrument}
          onChange={(e) => update('instrument', e.target.value as InstrumentType)}
          aria-label="Select writing instrument physics model"
        >
          <option value="ballpoint">Ballpoint Pen (Micro-skips & striations)</option>
          <option value="gel">Gel Pen (Uniform ink & bleed halo)</option>
          <option value="fountain">Fountain Pen (Nib-flex & capillary pooling)</option>
          <option value="pencil">Graphite Pencil (Grain noise & shading)</option>
          <option value="marker">Chisel Highlighter (Translucent blend)</option>
        </select>
      </div>

      {/* Handedness & Muscular Fatigue */}
      <div className="rail-section">
        <span className="rail-title">Motor Biometrics</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn btn-secondary ${params.handedness === 'right' ? 'btn-active' : ''}`}
            style={{ flex: 1, height: '32px', fontSize: '12px' }}
            onClick={() => update('handedness', 'right')}
          >
            Right-Handed
          </button>
          <button
            type="button"
            className={`btn btn-secondary ${params.handedness === 'left' ? 'btn-active' : ''}`}
            style={{ flex: 1, height: '32px', fontSize: '12px' }}
            onClick={() => update('handedness', 'left')}
          >
            Left-Handed
          </button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', marginTop: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={params.fatigueEnabled}
            onChange={(e) => update('fatigueEnabled', e.target.checked)}
          />
          Muscular Fatigue Decay Over Length
        </label>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Ink & Paper Stock Color Pickers */}
      <div className="rail-section">
        <span className="rail-title">Ink Shade & Stock</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Ink Shade</span>
            <input
              type="color"
              value={params.inkColor ?? '#141724'}
              onChange={(e) => update('inkColor', e.target.value)}
              style={{ width: '100%', height: '30px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Paper Stock</span>
            <input
              type="color"
              value={params.paperColor ?? '#fdfbf7'}
              onChange={(e) => update('paperColor', e.target.value)}
              style={{ width: '100%', height: '30px', background: 'transparent', border: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

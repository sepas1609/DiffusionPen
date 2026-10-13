import React from 'react';
import { RenderParams, InstrumentType } from '../../types/engine';

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

      {/* Variance Band (Chapter 5.3) */}
      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="param-variance">Variance Band</label>
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
          aria-valuemin={5.0}
          aria-valuemax={15.0}
          aria-valuenow={params.variancePct}
        />
        <span style={{ fontSize: '10.5px', color: '#64748b' }}>
          Optimal authentic band: 5–15% (internal study n=240)
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

      {/* Kerning Sigma (Chapter 5.2) */}
      <div className="slider-group">
        <div className="slider-header">
          <label htmlFor="param-kerning">Gaussian Kerning σ</label>
          <span className="slider-value">{params.kerningSigma.toFixed(2)} px</span>
        </div>
        <input
          id="param-kerning"
          type="range"
          min={0.2}
          max={2.0}
          step={0.05}
          value={params.kerningSigma}
          onChange={(e) => update('kerningSigma', parseFloat(e.target.value))}
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
          <option value="pencil">Graphite Pencil (Grain noise & pressure)</option>
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
          Enable Muscular Fatigue Decay
        </label>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

      {/* Paper & Ink Styling */}
      <div className="rail-section">
        <span className="rail-title">Paper & Ink Environment</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={params.ruledLines}
            onChange={(e) => update('ruledLines', e.target.checked)}
          />
          Notebook Ruled Lines & Margin
        </label>

        {params.ruledLines && (
          <div className="slider-group" style={{ marginTop: '4px' }}>
            <div className="slider-header">
              <label htmlFor="param-spacing">Line Spacing</label>
              <span className="slider-value">{params.ruledSpacing} px</span>
            </div>
            <input
              id="param-spacing"
              type="range"
              min={22}
              max={38}
              step={1}
              value={params.ruledSpacing}
              onChange={(e) => update('ruledSpacing', parseInt(e.target.value))}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
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

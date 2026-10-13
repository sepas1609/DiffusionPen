import React from 'react';
import { QuirksConfig, PeculiarMarker } from '../../engine/PersonalQuirks';

interface PersonalQuirksPanelProps {
  quirks: QuirksConfig;
  onChange: (updated: QuirksConfig) => void;
  activeMarkers: PeculiarMarker[];
}

export const PersonalQuirksPanel: React.FC<PersonalQuirksPanelProps> = ({ quirks, onChange, activeMarkers }) => {
  const update = <K extends keyof QuirksConfig>(key: K, value: QuirksConfig[K]) => {
    onChange({ ...quirks, [key]: value });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
            Personal Quirks & Authentic Human Hallmarks
          </h4>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Signature motor habits that distinguish your personal handwriting so evaluators and department heads instantly verify authenticity.
          </span>
        </div>

        {/* Highlight Toggle for Evaluator/Head Review */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            background: quirks.highlightPeculiars ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            padding: '5px 12px',
            borderRadius: '6px',
            border: `1px solid ${quirks.highlightPeculiars ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="checkbox"
            checked={quirks.highlightPeculiars}
            onChange={(e) => update('highlightPeculiars', e.target.checked)}
          />
          <span style={{ fontWeight: 600, color: quirks.highlightPeculiars ? '#10b981' : '#f1f5f9' }}>
            Highlight Peculiars for Review ({activeMarkers.length} Active on Page)
          </span>
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px',
          background: '#0d1118',
          padding: '14px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Crossed 7 and Z */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={quirks.crossedSevenAndZ}
              onChange={(e) => update('crossedSevenAndZ', e.target.checked)}
            />
            <span style={{ fontWeight: 500, color: quirks.crossedSevenAndZ ? '#00f2fe' : '#f1f5f9' }}>
              STEM Crossed '7' & 'Z' (European Tick)
            </span>
          </label>
          <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '22px' }}>
            Adds horizontal tick stroke across stems to avoid confusion with '1' and '2'.
          </span>
        </div>

        {/* T-Bar Slant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>T-Bar Crossing Habit</label>
          <select
            className="form-select"
            value={quirks.tBarStyle}
            onChange={(e) => update('tBarStyle', e.target.value as any)}
            style={{ height: '30px', fontSize: '12px' }}
          >
            <option value="high">High Aggressive Cross (Fast Thinker)</option>
            <option value="centered">Balanced Centered Cross</option>
            <option value="slanted">Rushed Upward Slanted Cross</option>
            <option value="loop">Cursive Looped Crossbar</option>
          </select>
        </div>

        {/* Dotted 'i' Quirk */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>Dotted 'i' Kinetic Gesture</label>
          <select
            className="form-select"
            value={quirks.dottedIStyle}
            onChange={(e) => update('dottedIStyle', e.target.value as any)}
            style={{ height: '30px', fontSize: '12px' }}
          >
            <option value="standard">Standard Round Dot</option>
            <option value="high-floating">High Floating Dot</option>
            <option value="slash">Kinetic Quick Slash</option>
            <option value="circle">Open Circular Dot</option>
          </select>
        </div>

        {/* Scratch-out mistakes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={quirks.enableScratchOuts}
              onChange={(e) => update('enableScratchOuts', e.target.checked)}
            />
            <span style={{ fontWeight: 500, color: quirks.enableScratchOuts ? '#f59e0b' : '#f1f5f9' }}>
              Organic Scratch-Out Typo Corrections
            </span>
          </label>
          <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '22px' }}>
            Renders words wrapped in ~~mistake~~ with rapid ballpoint ink zig-zag cross-outs.
          </span>
        </div>

        {/* Wavy Underlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={quirks.wavyUnderlines}
              onChange={(e) => update('wavyUnderlines', e.target.checked)}
            />
            <span style={{ fontWeight: 500, color: '#f1f5f9' }}>
              Hand-Drawn Wavy Heading Underlines
            </span>
          </label>
          <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '22px' }}>
            Underlines Markdown # Headings with organic wobbles and ink pressure accumulation.
          </span>
        </div>

        {/* Personal Signature Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={quirks.signatureBlock}
              onChange={(e) => update('signatureBlock', e.target.checked)}
            />
            <span style={{ fontWeight: 500, color: quirks.signatureBlock ? '#8b5cf6' : '#f1f5f9' }}>
              Personal Wet-Ink Signature Seal Block
            </span>
          </label>
          <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '22px' }}>
            Appends handwritten signature loop flourish, submission date, and roll ID at document end.
          </span>
        </div>
      </div>

      {/* Signature Configuration Inputs */}
      {quirks.signatureBlock && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            padding: '10px 14px',
            borderRadius: '6px',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '2px' }}>
              Author Name
            </span>
            <input
              type="text"
              value={quirks.signerName}
              onChange={(e) => update('signerName', e.target.value)}
              style={{
                width: '100%',
                background: '#161a26',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '2px' }}>
              Submission Date
            </span>
            <input
              type="text"
              value={quirks.submissionDate}
              onChange={(e) => update('submissionDate', e.target.value)}
              style={{
                width: '100%',
                background: '#161a26',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', marginBottom: '2px' }}>
              Student Roll / ID
            </span>
            <input
              type="text"
              value={quirks.studentId}
              onChange={(e) => update('studentId', e.target.value)}
              style={{
                width: '100%',
                background: '#161a26',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

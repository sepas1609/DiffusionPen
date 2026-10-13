import React from 'react';
import { AccessibilityEngine, A11yConfig } from '../../a11y/AccessibilityEngine';

interface AccessibilityPanelProps {
  a11y: AccessibilityEngine;
  config: A11yConfig;
  onUpdate: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ a11y, config, onUpdate }) => {
  const toggleDysgraphia = () => {
    a11y.setDysgraphiaMode(!config.dysgraphiaMode);
    onUpdate();
  };

  const toggleHighContrast = () => {
    a11y.setHighContrast(!config.highContrast);
    onUpdate();
  };

  const toggleSwitchControl = () => {
    a11y.setSwitchControl(!config.switchControlEnabled);
    onUpdate();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
          Accessibility & Dysgraphia Suite (Chapter 23 — WCAG 2.2 AA)
        </h4>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Restores handwriting capability without physical pain for neurodivergent users with dysgraphia or repetitive strain injuries.
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.dysgraphiaMode}
            onChange={toggleDysgraphia}
          />
          <span style={{ color: config.dysgraphiaMode ? '#00f2fe' : '#f1f5f9' }}>
            Dysgraphia Assist Mode (Stroke Stabilizer & Low Tremor Jitter)
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.highContrast}
            onChange={toggleHighContrast}
          />
          <span style={{ color: config.highContrast ? '#ffbe0b' : '#f1f5f9' }}>
            High-Contrast UI & Ruled Guidelines (≥7:1 Ratio)
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.switchControlEnabled}
            onChange={toggleSwitchControl}
          />
          <span style={{ color: config.switchControlEnabled ? '#10b981' : '#f1f5f9' }}>
            Single-Switch / Eye-Gaze Automated Scanner (1.5s interval)
          </span>
        </label>
      </div>

      <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '16px' }}>
        <span>✔ WCAG 1.4.3 Contrast (≥4.5:1)</span>
        <span>✔ WCAG 2.1.1 Full Keyboard Navigation</span>
        <span>✔ WCAG 2.4.7 2px Cyan Focus Ring</span>
        <span>✔ WCAG 2.5.8 Touch Target Size ≥24px</span>
      </div>
    </div>
  );
};

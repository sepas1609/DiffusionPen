import React from 'react';

interface RealismStudioProps {
  use3DWarp: boolean;
  onToggle3DWarp: (enabled: boolean) => void;
  showCoffeeRing: boolean;
  onToggleCoffeeRing: (enabled: boolean) => void;
  lightingIntensity: number;
  onChangeLighting: (val: number) => void;
  showFilmGrain: boolean;
  onToggleFilmGrain: (enabled: boolean) => void;
}

export const RealismStudio: React.FC<RealismStudioProps> = ({
  use3DWarp,
  onToggle3DWarp,
  showCoffeeRing,
  onToggleCoffeeRing,
  lightingIntensity,
  onChangeLighting,
  showFilmGrain,
  onToggleFilmGrain,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
          Advanced Environmental Realism & WebGL 3D Studio (Chapter 15)
        </h4>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Vertex-displaced 3D mesh warp (z = -0.04(x+0.5)²), Lambertian desk-lamp shaders, coffee stains, and film grain.
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={use3DWarp}
            onChange={(e) => onToggle3DWarp(e.target.checked)}
          />
          <span style={{ color: use3DWarp ? '#00f2fe' : '#f1f5f9' }}>
            3D Notebook Binding Mesh Curvature
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showCoffeeRing}
            onChange={(e) => onToggleCoffeeRing(e.target.checked)}
          />
          <span style={{ color: showCoffeeRing ? '#f59e0b' : '#f1f5f9' }}>
            Coffee Cup Ring Stain Overlay
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showFilmGrain}
            onChange={(e) => onToggleFilmGrain(e.target.checked)}
          />
          Smartphone Camera Film Grain
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Desk Lamp Light:</span>
          <input
            type="range"
            min={0.3}
            max={1.0}
            step={0.05}
            value={lightingIntensity}
            onChange={(e) => onChangeLighting(parseFloat(e.target.value))}
            style={{ width: '100px' }}
          />
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#00f2fe' }}>
            {(lightingIntensity * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

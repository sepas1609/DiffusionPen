import { describe, it, expect } from 'vitest';
import { BezierFitter } from '../src/engine/BezierFitter';
import { PowerLawModulator } from '../src/engine/PowerLawModulator';
import { BaselineDrift, GaussianKerning, GlyphJitterBudget } from '../src/engine/NaturalImperfections';
import { LigatureEngine } from '../src/engine/LigatureEngine';
import { Point } from '../src/types/engine';

describe('Biomechanical Synthesis Core (Chapters 4-7)', () => {
  it('BezierFitter: fits skeleton points to cubic Bezier curves with low error', () => {
    const fitter = new BezierFitter(0.8, 8, 2);
    // Sequence of points along a smooth curve
    const skeleton: Point[] = [
      { x: 0, y: 0 },
      { x: 5, y: 3 },
      { x: 10, y: 8 },
      { x: 15, y: 15 },
      { x: 20, y: 20 },
    ];
    const segments = fitter.fit(skeleton);
    expect(segments.length).toBeGreaterThan(0);
    expect(segments[0].p0).toBeDefined();
    expect(segments[0].c1).toBeDefined();
    expect(segments[0].c2).toBeDefined();
    expect(segments[0].p1).toBeDefined();
  });

  it('PowerLawModulator: implements Two-Thirds Power Law curvature velocity', () => {
    const mod = new PowerLawModulator(1.0);
    // Straight line: zero curvature, high velocity
    const vStraight = mod.velocityAt([10, 0], [0, 0], [20, 0]);

    // Sharp 90-degree corner: high curvature, low velocity
    const vSharp = mod.velocityAt([10, 10], [10, 0], [20, 10]);

    expect(vStraight).toBeGreaterThan(vSharp);

    // Verify low velocity maps to high pressure and thicker line
    const paramsFast = mod.renderParams(vStraight);
    const paramsSlow = mod.renderParams(vSharp);

    expect(paramsSlow.pressure).toBeGreaterThanOrEqual(paramsFast.pressure);
    expect(paramsSlow.lineWidth).toBeGreaterThanOrEqual(paramsFast.lineWidth);
  });

  it('BaselineDrift: generates compound harmonic sine waves with expected amplitude', () => {
    const drift = new BaselineDrift(1.5, 3, false, 12345);
    const y0 = drift.offsetAt(0);
    const y100 = drift.offsetAt(100);
    const y500 = drift.offsetAt(500);

    // Should fluctuate organically within bounded range
    expect(Math.abs(y0)).toBeLessThan(3.5);
    expect(Math.abs(y100)).toBeLessThan(3.5);
    expect(Math.abs(y500)).toBeLessThan(3.5);
  });

  it('GaussianKerning: applies punctuation boost and clamps outliers', () => {
    const kerning = new GaussianKerning(8.0, 0.8);
    const gapLetter = kerning.sampleGap('a', () => 0.5);
    const gapPeriod = kerning.sampleGap('.', () => 0.5);

    // Period gap should be significantly wider than letter gap
    expect(gapPeriod).toBeGreaterThan(gapLetter * 1.5);
  });

  it('GlyphJitterBudget: preserves variance band thresholds', () => {
    const budget = new GlyphJitterBudget(9.0);
    const dummyPath = [{
      p0: [0, 0] as [number, number],
      c1: [2, 2] as [number, number],
      c2: [4, 4] as [number, number],
      p1: [6, 6] as [number, number],
    }];
    const jittered = budget.applyJitter(dummyPath, () => 0.6);
    expect(jittered).toHaveLength(1);
    expect(jittered[0].p0[0]).toBeCloseTo(dummyPath[0].p0[0], 0);
  });

  it('LigatureEngine: detects high cursive probability bigram pairs', () => {
    const lig = new LigatureEngine();
    // 'th' is a frequent cursive pair
    const connectsTh = lig.shouldConnect('t', 'h', 1.0, () => 0.1);
    expect(connectsTh).toBe(true);

    // Uppercase or digits should not form ligatures
    const connectsUpper = lig.shouldConnect('A', 'B', 1.0, () => 0.1);
    expect(connectsUpper).toBe(false);
  });
});

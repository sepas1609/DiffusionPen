import { BezierPath } from '../types/engine';

export class BaselineDrift {
  private amplitudes: number[];
  private frequencies: number[];
  private phases: number[];
  private fatigueSlope: number;

  constructor(
    baseAmp: number = 1.2,
    numHarmonics: number = 3,
    fatigueEnabled: boolean = false,
    seed: number = 42
  ) {
    let rng = this.createPseudoRng(seed);
    this.amplitudes = [];
    this.frequencies = [];
    this.phases = [];
    this.fatigueSlope = fatigueEnabled ? 0.0003 : 0.0;

    for (let k = 0; k < numHarmonics; k++) {
      this.amplitudes.push(baseAmp * (0.6 / (k + 1)) * (0.8 + 0.4 * rng()));
      this.frequencies.push(0.0015 * (k + 1) * (0.9 + 0.2 * rng()));
      this.phases.push(rng() * 2 * Math.PI);
    }
  }

  offsetAt(x: number, charIndex: number = 0): number {
    let y = 0;
    for (let k = 0; k < this.amplitudes.length; k++) {
      y += this.amplitudes[k] * Math.sin(2 * Math.PI * this.frequencies[k] * x + this.phases[k]);
    }
    // Muscular fatigue drift: gradual downward slump as writing progresses
    y += this.fatigueSlope * charIndex * 0.4;
    return y;
  }

  applyToStrokes(strokes: BezierPath[], currentX: number, charIndex: number = 0): BezierPath[] {
    const yOff = this.offsetAt(currentX, charIndex);
    return strokes.map((p) => ({
      p0: [p.p0[0], p.p0[1] + yOff],
      c1: [p.c1[0], p.c1[1] + yOff],
      c2: [p.c2[0], p.c2[1] + yOff],
      p1: [p.p1[0], p.p1[1] + yOff],
      pressure: p.pressure,
      velocity: p.velocity,
    }));
  }

  private createPseudoRng(seed: number) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
}

export class GaussianKerning {
  private punctBoost: Record<string, number> = {
    ',': 1.8,
    '.': 2.4,
    ';': 1.6,
    ':': 1.4,
    '!': 2.2,
    '?': 2.2,
    '-': 1.3,
  };

  constructor(
    private meanSpace: number = 8.0,
    private sigmaSpace: number = 0.8
  ) {}

  sampleGap(prevChar: string, rng: () => number = Math.random): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.max(rng(), 1e-10);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    let gap = this.meanSpace + z * this.sigmaSpace;

    if (prevChar in this.punctBoost) {
      gap *= this.punctBoost[prevChar];
    }

    // Clamp to [0.3 * mean, 3.0 * mean] to prevent unnatural extremes
    return Math.max(0.3 * this.meanSpace, Math.min(3.0 * this.meanSpace, gap));
  }
}

export class GlyphJitterBudget {
  private rollingJitterWindow: number[] = [];
  private readonly windowSize: number = 50;

  constructor(
    private variancePct: number = 9.0 // 5% - 15%
  ) {}

  setVariancePct(pct: number) {
    this.variancePct = Math.max(5.0, Math.min(15.0, pct));
  }

  applyJitter(strokes: BezierPath[], rng: () => number = Math.random): BezierPath[] {
    const intensity = this.variancePct / 9.0; // Normalized around 9%

    // Axes bounds scaled by variance threshold
    const maxAngle = (2.0 * Math.PI / 180) * intensity;
    const maxScale = 0.03 * intensity;
    const maxTrans = 1.5 * intensity;

    const angle = (rng() * 2 - 1) * maxAngle;
    const scale = 1.0 + (rng() * 2 - 1) * maxScale;
    let dx = (rng() * 2 - 1) * maxTrans;
    let dy = (rng() * 2 - 1) * maxTrans;

    // Self-correction redistribution if window budget is exceeded
    const currentMagnitude = Math.hypot(dx, dy);
    this.rollingJitterWindow.push(currentMagnitude);
    if (this.rollingJitterWindow.length > this.windowSize) {
      this.rollingJitterWindow.shift();
    }
    const windowSum = this.rollingJitterWindow.reduce((a, b) => a + b, 0);
    if (windowSum > this.windowSize * maxTrans * 1.2) {
      // Damped correction toward zero
      dx *= 0.3;
      dy *= 0.3;
    }

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    return strokes.map((p) => {
      const transform = (pt: [number, number]): [number, number] => {
        const sx = pt[0] * scale;
        const sy = pt[1] * scale;
        const rx = sx * cosA - sy * sinA;
        const ry = sx * sinA + sy * cosA;
        return [rx + dx, ry + dy];
      };

      return {
        p0: transform(p.p0),
        c1: transform(p.c1),
        c2: transform(p.c2),
        p1: transform(p.p1),
        pressure: p.pressure,
        velocity: p.velocity,
      };
    });
  }
}

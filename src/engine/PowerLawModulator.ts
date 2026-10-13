import { InstrumentType } from '../types/engine';

export interface DynamicStrokeParams {
  lineWidth: number;
  alpha: number;
  pressure: number;
}

export class PowerLawModulator {
  constructor(
    private K: number = 1.0,
    private pressureFloor: number = 0.35,
    private pressureCeil: number = 1.0,
    private lineWidthBase: number = 1.6,   // px
    private lineWidthRange: number = 1.4,  // px additional at max pressure
    private alphaBase: number = 0.78,
    private alphaRange: number = 0.20,
    private instrument: InstrumentType = 'ballpoint',
    private handedness: 'left' | 'right' = 'right'
  ) {}

  setK(K: number) {
    this.K = Math.max(0.1, K);
  }

  setInstrument(inst: InstrumentType) {
    this.instrument = inst;
  }

  setHandedness(handedness: 'left' | 'right') {
    this.handedness = handedness;
  }

  /** Compute tangential velocity for a point on a curve using finite-difference curvature */
  velocityAt(p: [number, number], prev: [number, number], next: [number, number], progressIndex: number = 0): number {
    const tx = next[0] - prev[0];
    const ty = next[1] - prev[1];
    const tangentMag = Math.hypot(tx, ty);
    if (tangentMag < 1e-6) return 20;

    const v1x = p[0] - prev[0];
    const v1y = p[1] - prev[1];
    const v2x = next[0] - p[0];
    const v2y = next[1] - p[1];
    const cross = v1x * v2y - v1y * v2x;
    const v1m = Math.hypot(v1x, v1y);
    const v2m = Math.hypot(v2x, v2y);
    const denom = v1m * v2m * (v1m + v2m);

    let kappa = denom > 1e-6 ? Math.abs(2 * cross) / denom : 0;

    // Handedness curvature adjustment (left-hand pushes rightward curves)
    if (this.handedness === 'left' && cross > 0) {
      kappa *= 1.15;
    } else if (this.handedness === 'right' && cross < 0) {
      kappa *= 1.12;
    }

    // Fatigue decay: slightly slower velocity as document progresses
    const fatigueFactor = Math.max(0.8, 1.0 - progressIndex * 0.00005);
    const effectiveK = this.K * fatigueFactor;

    const R = kappa > 1e-6 ? 1 / kappa : 1e6;
    return effectiveK * Math.pow(R, 1 / 3);
  }

  /** Map velocity -> {lineWidth, alpha, pressure} for Canvas2D and SVG rendering */
  renderParams(velocity: number): DynamicStrokeParams {
    // Normalization against empirical vmax=80 px/s
    const vNorm = Math.max(0, Math.min(1, velocity / 80));

    let pressure: number;
    switch (this.instrument) {
      case 'ballpoint':
        // Sharper sigmoid pressure response
        pressure = this.pressureCeil - (1 / (1 + Math.exp(-6 * (vNorm - 0.5)))) * (this.pressureCeil - this.pressureFloor);
        break;
      case 'gel':
        // Nearly flat, uniform deposition
        pressure = this.pressureFloor + 0.85 * (this.pressureCeil - this.pressureFloor);
        break;
      case 'fountain':
        // High dynamic range nib-flex
        pressure = this.pressureCeil - Math.pow(vNorm, 0.7) * (this.pressureCeil - this.pressureFloor);
        break;
      case 'pencil':
        // Linear graphite deposition
        pressure = this.pressureCeil - vNorm * (this.pressureCeil - this.pressureFloor);
        break;
      case 'marker':
        pressure = 0.9;
        break;
      default:
        pressure = this.pressureCeil - vNorm * (this.pressureCeil - this.pressureFloor);
    }

    pressure = Math.max(this.pressureFloor, Math.min(this.pressureCeil, pressure));

    let widthBase = this.lineWidthBase;
    let widthRange = this.lineWidthRange;
    let alphaBase = this.alphaBase;
    let alphaRange = this.alphaRange;

    if (this.instrument === 'fountain') {
      widthBase = 1.2;
      widthRange = 2.4;
      alphaBase = 0.82;
    } else if (this.instrument === 'gel') {
      widthBase = 2.0;
      widthRange = 0.4;
      alphaBase = 0.92;
      alphaRange = 0.06;
    } else if (this.instrument === 'pencil') {
      widthBase = 1.3;
      widthRange = 1.0;
      alphaBase = 0.65;
      alphaRange = 0.28;
    } else if (this.instrument === 'marker') {
      widthBase = 3.6;
      widthRange = 0.8;
      alphaBase = 0.70;
      alphaRange = 0.15;
    }

    return {
      lineWidth: widthBase + pressure * widthRange,
      alpha: Math.min(1.0, alphaBase + (1 - vNorm) * alphaRange),
      pressure,
    };
  }
}

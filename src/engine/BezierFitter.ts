import { Point, BezierPath } from '../types/engine';

export class BezierFitter {
  constructor(
    private maxError: number = 0.8,    // px, L2 error tolerance
    private maxSegments: number = 8,   // max Bezier segments per stroke
    private minSegmentLen: number = 2  // px, merge shorter segments
  ) {}

  /** Fit a sequence of skeleton points to one or more cubic Bezier segments. */
  fit(skeleton: Point[]): BezierPath[] {
    if (skeleton.length < 2) return [];

    // 1. Ramer-Douglas-Peucker simplification to find corner points
    const corners = this.rdpSimplify(skeleton, this.maxError * 1.5);

    // 2. Split at corners, fit a Bezier to each segment
    const segments: BezierPath[] = [];
    for (let i = 0; i < corners.length - 1; i++) {
      const sub = skeleton.slice(corners[i], corners[i + 1] + 1);
      if (sub.length < 2) continue;

      const bez = this.fitSingleSegment(sub);
      if (bez) segments.push(bez);
      if (segments.length >= this.maxSegments) break;
    }

    return segments;
  }

  /** Least-squares fit of a single cubic Bezier to a point sequence. */
  private fitSingleSegment(pts: Point[]): BezierPath | null {
    if (pts.length < 4) {
      // Degenerate: connect endpoints with a straight line
      return {
        p0: [pts[0].x, pts[0].y],
        c1: [pts[0].x, pts[0].y],
        c2: [pts[pts.length - 1].x, pts[pts.length - 1].y],
        p1: [pts[pts.length - 1].x, pts[pts.length - 1].y],
        pressure: 0.5,
      };
    }

    // Compute chord-length parameterization
    const u = this.chordLengthParameterize(pts);

    // Initial guess: place control points at 1/3 and 2/3 along the chord
    let c1 = this.lerp(pts[0], pts[pts.length - 1], 1 / 3);
    let c2 = this.lerp(pts[0], pts[pts.length - 1], 2 / 3);

    // Newton-Raphson refinement (3 iterations)
    for (let iter = 0; iter < 3; iter++) {
      const [newC1, newC2] = this.refineControls(pts, u, c1, c2);
      c1 = newC1;
      c2 = newC2;
    }

    // Check error
    const err = this.maxErrorOf(pts, u, pts[0], c1, c2, pts[pts.length - 1]);
    if (err > this.maxError * 3) {
      // Return split segment fallback
      const mid = Math.floor(pts.length / 2);
      return {
        p0: [pts[0].x, pts[0].y],
        c1: [c1.x, c1.y],
        c2: [c2.x, c2.y],
        p1: [pts[mid].x, pts[mid].y],
        pressure: 0.5,
      };
    }

    return {
      p0: [pts[0].x, pts[0].y],
      c1: [c1.x, c1.y],
      c2: [c2.x, c2.y],
      p1: [pts[pts.length - 1].x, pts[pts.length - 1].y],
      pressure: 0.5,
    };
  }

  private chordLengthParameterize(pts: Point[]): number[] {
    const u = [0];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      u.push(total);
    }
    if (total < 1e-6) return pts.map((_, i) => i / (pts.length - 1));
    return u.map((v) => v / total);
  }

  private refineControls(pts: Point[], u: number[], c1: Point, c2: Point): [Point, Point] {
    // Schneider least-squares fitting of control points C1, C2
    const p0 = pts[0];
    const p3 = pts[pts.length - 1];

    let c1x = 0, c1y = 0, c2x = 0, c2y = 0;
    let det = 0;

    // Basis polynomials sum
    let a11 = 0, a12 = 0, a22 = 0;
    let b1x = 0, b1y = 0, b2x = 0, b2y = 0;

    for (let i = 0; i < pts.length; i++) {
      const t = u[i];
      const b0 = Math.pow(1 - t, 3);
      const b1 = 3 * Math.pow(1 - t, 2) * t;
      const b2 = 3 * (1 - t) * t * t;
      const b3 = Math.pow(t, 3);

      a11 += b1 * b1;
      a12 += b1 * b2;
      a22 += b2 * b2;

      const px = pts[i].x - b0 * p0.x - b3 * p3.x;
      const py = pts[i].y - b0 * p0.y - b3 * p3.y;

      b1x += b1 * px;
      b1y += b1 * py;
      b2x += b2 * px;
      b2y += b2 * py;
    }

    det = a11 * a22 - a12 * a12;
    if (Math.abs(det) > 1e-6) {
      c1x = (a22 * b1x - a12 * b2x) / det;
      c1y = (a22 * b1y - a12 * b2y) / det;
      c2x = (a11 * b2x - a12 * b1x) / det;
      c2y = (a11 * b2y - a12 * b1y) / det;
      return [{ x: c1x, y: c1y }, { x: c2x, y: c2y }];
    }

    return [c1, c2];
  }

  private rdpSimplify(pts: Point[], epsilon: number): number[] {
    if (pts.length < 3) return [0, pts.length - 1];
    let dmax = 0;
    let idx = 0;
    const end = pts.length - 1;

    for (let i = 1; i < end; i++) {
      const d = this.perpDist(pts[i], pts[0], pts[end]);
      if (d > dmax) {
        idx = i;
        dmax = d;
      }
    }

    if (dmax > epsilon) {
      const left = this.rdpSimplify(pts.slice(0, idx + 1), epsilon);
      const right = this.rdpSimplify(pts.slice(idx), epsilon);
      return [...left.slice(0, -1), ...right.map((j) => j + idx)];
    }
    return [0, end];
  }

  private perpDist(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1e-6) return Math.hypot(p.x - a.x, p.y - a.y);
    return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / mag;
  }

  private lerp(a: Point, b: Point, t: number): Point {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  private maxErrorOf(pts: Point[], u: number[], p0: Point, c1: Point, c2: Point, p1: Point): number {
    let maxErr = 0;
    for (let i = 0; i < pts.length; i++) {
      const t = u[i];
      const bx =
        Math.pow(1 - t, 3) * p0.x +
        3 * Math.pow(1 - t, 2) * t * c1.x +
        3 * (1 - t) * t * t * c2.x +
        Math.pow(t, 3) * p1.x;
      const by =
        Math.pow(1 - t, 3) * p0.y +
        3 * Math.pow(1 - t, 2) * t * c1.y +
        3 * (1 - t) * t * t * c2.y +
        Math.pow(t, 3) * p1.y;
      const err = Math.hypot(bx - pts[i].x, by - pts[i].y);
      if (err > maxErr) maxErr = err;
    }
    return maxErr;
  }
}

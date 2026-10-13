import { BezierPath, GlyphVariant } from '../types/engine';

export interface BigramStats {
  connectionProb: number;
  avgExitAngle: number;
  avgEntryAngle: number;
}

export class LigatureEngine {
  private matrix: Map<string, BigramStats> = new Map();

  constructor() {
    this.seedDefaultEnglishBigrams();
  }

  private seedDefaultEnglishBigrams() {
    // High-frequency English ligatures with realistic human cursive probabilities
    const highProbPairs = [
      'th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd',
      'ti', 'es', 'or', 'te', 'of', 'ed', 'is', 'it', 'al', 'ar',
      'st', 'to', 'nt', 'ng', 'se', 'ha', 'as', 'ou', 'io', 'le',
      've', 'co', 'me', 'de', 'hi', 'ri', 'ro', 'ic', 'ne', 'ea',
      'ra', 'ce', 'li', 'ch', 'll', 'be', 'ma', 'si', 'om', 'ur',
    ];

    for (const pair of highProbPairs) {
      this.matrix.set(pair, {
        connectionProb: 0.88,
        avgExitAngle: 0.25, // radians upwards
        avgEntryAngle: -0.20,
      });
    }

    // Moderate cursive pairs
    const moderatePairs = ['ab', 'ad', 'ag', 'am', 'ap', 'ba', 'bl', 'ca', 'cl', 'da', 'di', 'do', 'fa', 'fi', 'fl', 'fo', 'ga', 'ge', 'go', 'ho', 'hu', 'il', 'im', 'ir', 'ja', 'je', 'jo', 'ka', 'ke', 'la', 'lo', 'lu', 'mi', 'mo', 'mu', 'na', 'no', 'nu', 'pa', 'pe', 'pi', 'po', 'pr', 'qu', 'sa', 'sc', 'sh', 'sk', 'sl', 'sm', 'sn', 'so', 'sp', 'sq', 'su', 'ta', 'tr', 'tu', 'tw', 'un', 'up', 'us', 'va', 'vi', 'vo', 'wa', 'we', 'wh', 'wi', 'wo'];
    for (const pair of moderatePairs) {
      if (!this.matrix.has(pair)) {
        this.matrix.set(pair, {
          connectionProb: 0.65,
          avgExitAngle: 0.20,
          avgEntryAngle: -0.15,
        });
      }
    }
  }

  /** Decide whether to generate a cursive connection bridge between two characters */
  shouldConnect(c1: string, c2: string, connectionCoeff: number = 0.8, rng: () => number = Math.random): boolean {
    if (!c1 || !c2 || c1 === ' ' || c2 === ' ') return false;
    // Don't connect across uppercase or digits unless explicit
    if (/[A-Z0-9]/.test(c1) || /[A-Z0-9]/.test(c2)) return false;

    const pair = (c1 + c2).toLowerCase();
    const stats = this.matrix.get(pair);
    const baseProb = stats ? stats.connectionProb : 0.40;
    const threshold = baseProb * connectionCoeff;

    return rng() < threshold;
  }

  /** Build smooth cubic Bézier connecting stroke between two glyphs */
  createBridge(
    g1: GlyphVariant,
    g2: GlyphVariant,
    g1Offset: [number, number],
    g2Offset: [number, number]
  ): BezierPath | null {
    if (!g1.strokes.length || !g2.strokes.length) return null;

    const lastStroke = g1.strokes[g1.strokes.length - 1];
    const firstStroke = g2.strokes[0];

    const startX = lastStroke.p1[0] + g1Offset[0];
    const startY = lastStroke.p1[1] + g1Offset[1];

    const endX = firstStroke.p0[0] + g2Offset[0];
    const endY = firstStroke.p0[1] + g2Offset[1];

    const dx = endX - startX;
    const dy = endY - startY;

    // Reject connections if the glyphs are too far or reversed
    if (dx <= 0 || dx > 35 || Math.abs(dy) > 30) return null;

    // Smooth upward-sweeping cursive baseline lead-in
    const c1: [number, number] = [startX + dx * 0.35, startY + dy * 0.15 + 1.2];
    const c2: [number, number] = [startX + dx * 0.70, endY - dy * 0.10 + 0.5];

    return {
      p0: [startX, startY],
      c1,
      c2,
      p1: [endX, endY],
      pressure: 0.45,
      velocity: 55, // connecting strokes are fast and thin
    };
  }
}

import { BezierPath } from '../types/engine';

export interface QuirksConfig {
  crossedSevenAndZ: boolean;     // Crossbar on '7' and 'Z' (STEM / European tick)
  tBarStyle: 'high' | 'centered' | 'slanted' | 'loop';
  dottedIStyle: 'standard' | 'high-floating' | 'slash' | 'circle';
  descenderStyle: 'loopy' | 'sharp-angle' | 'straight';
  enableScratchOuts: boolean;    // Realistic pen strike-through mistakes
  marginDoodles: boolean;        // Asterisks, margin stars & checkmarks
  wavyUnderlines: boolean;       // Organic wobbly hand-drawn underlines
  signatureBlock: boolean;       // Wet-ink signature block at document end
  signerName: string;
  submissionDate: string;
  studentId: string;
  highlightPeculiars: boolean;   // Visual inspection highlights for professor/head review
}

export interface PeculiarMarker {
  id: string;
  type: 'crossed-7' | 'crossed-z' | 't-bar' | 'dotted-i' | 'scratch-out' | 'signature' | 'margin-star' | 'wavy-underline';
  label: string;
  description: string;
  x: number;
  y: number;
  radius: number;
}

export class PersonalQuirksEngine {
  constructor(private config: QuirksConfig) {}

  getConfig(): QuirksConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<QuirksConfig>) {
    this.config = { ...this.config, ...partial };
  }

  /** Modifies strokes for specific characters based on configured personal quirks */
  applyQuirksToChar(
    char: string,
    strokes: BezierPath[],
    x: number,
    y: number
  ): { strokes: BezierPath[]; markers: PeculiarMarker[] } {
    const mutated = [...strokes];
    const markers: PeculiarMarker[] = [];

    // 1. Crossed '7' or 'Z'
    if (this.config.crossedSevenAndZ && (char === '7' || char === 'z' || char === 'Z')) {
      const crossY = char === '7' ? y + 2 : y + 6;
      // Add authentic horizontal tick stroke across the stem
      mutated.push({
        p0: [x + 2, crossY],
        c1: [x + 4, crossY - 0.5],
        c2: [x + 7, crossY + 0.5],
        p1: [x + 9, crossY],
        pressure: 0.75,
        velocity: 35,
      });

      markers.push({
        id: `quirk-${char}-${x}-${y}`,
        type: char === '7' ? 'crossed-7' : 'crossed-z',
        label: `Personal Tick: Crossed '${char}'`,
        description: `Authentic STEM horizontal stroke across stem to distinguish from ${char === '7' ? "'1'" : "'2'"}.`,
        x: x + 5,
        y: crossY,
        radius: 12,
      });
    }

    // 2. Custom T-Bar Style
    if (char === 't' || char === 'T') {
      let tBarOffset = 2;
      let angleOffset = 0;
      if (this.config.tBarStyle === 'high') {
        tBarOffset = -2; // High aggressive cross
      } else if (this.config.tBarStyle === 'slanted') {
        angleOffset = -1.8; // Rushed upward slant
      }

      // Re-position the horizontal crossbar stroke if available
      if (mutated.length > 1) {
        const last = mutated[mutated.length - 1];
        last.p0[1] += tBarOffset;
        last.p1[1] += tBarOffset + angleOffset;
        last.c1[1] += tBarOffset;
        last.c2[1] += tBarOffset + angleOffset * 0.5;
      }

      markers.push({
        id: `quirk-t-${x}-${y}`,
        type: 't-bar',
        label: `Personal Habit: ${this.config.tBarStyle} T-Bar`,
        description: `Writer crosses 't' stems with characteristic ${this.config.tBarStyle} motor speed.`,
        x: x + 4,
        y: y + tBarOffset,
        radius: 10,
      });
    }

    // 3. Dotted 'i' Quirk
    if ((char === 'i' || char === 'j') && mutated.length > 1) {
      const dot = mutated[mutated.length - 1];
      if (this.config.dottedIStyle === 'high-floating') {
        dot.p0[1] -= 4;
        dot.c1[1] -= 4;
        dot.c2[1] -= 4;
        dot.p1[1] -= 4;
      } else if (this.config.dottedIStyle === 'slash') {
        dot.p1[0] += 2.5;
        dot.p1[1] += 2.0;
      } else if (this.config.dottedIStyle === 'circle') {
        // Turn dot into tiny open loop
        dot.c1[0] -= 1.5;
        dot.c2[0] += 1.5;
      }

      markers.push({
        id: `quirk-i-${x}-${y}`,
        type: 'dotted-i',
        label: `Personal Habit: ${this.config.dottedIStyle} 'i'-dot`,
        description: `Writer places 'i' dot with distinct ${this.config.dottedIStyle} kinetic gesture.`,
        x: dot.p0[0],
        y: dot.p0[1],
        radius: 8,
      });
    }

    return { strokes: mutated, markers };
  }

  /** Generates realistic pen scratch-out correction for a word (e.g. ~~error~~) */
  createScratchOutStrokes(startX: number, endX: number, y: number): { strokes: BezierPath[]; marker: PeculiarMarker } {
    const width = endX - startX;
    const strokes: BezierPath[] = [];

    // 3 rapid zig-zag scribbles over the text
    const midY = y + 5;
    strokes.push({
      p0: [startX - 2, midY - 2],
      c1: [startX + width * 0.3, midY + 4],
      c2: [startX + width * 0.7, midY - 3],
      p1: [endX + 3, midY + 1],
      pressure: 0.85,
      velocity: 60,
    });
    strokes.push({
      p0: [startX, midY + 3],
      c1: [startX + width * 0.4, midY - 2],
      c2: [startX + width * 0.6, midY + 4],
      p1: [endX + 2, midY - 1],
      pressure: 0.90,
      velocity: 58,
    });

    const marker: PeculiarMarker = {
      id: `quirk-scratch-${startX}-${y}`,
      type: 'scratch-out',
      label: 'Human Typo Correction: Wet-Ink Strike-Through',
      description: 'Physical writer crossed out a typo with ballpoint pen zig-zag instead of digital backspace.',
      x: startX + width / 2,
      y: midY,
      radius: width / 2 + 6,
    };

    return { strokes, marker };
  }

  /** Generates organic hand-drawn wavy underline for headings */
  createWavyUnderline(startX: number, endX: number, y: number): { strokes: BezierPath[]; marker: PeculiarMarker } {
    const width = endX - startX;
    const waves = Math.max(3, Math.floor(width / 16));
    const step = width / waves;
    const strokes: BezierPath[] = [];

    for (let i = 0; i < waves; i++) {
      const x0 = startX + i * step;
      const x1 = x0 + step;
      const amp = (i % 2 === 0 ? 1 : -1) * 2.2;
      strokes.push({
        p0: [x0, y + 2],
        c1: [x0 + step * 0.3, y + 2 + amp],
        c2: [x0 + step * 0.7, y + 2 + amp],
        p1: [x1, y + 2],
        pressure: 0.70,
        velocity: 45,
      });
    }

    const marker: PeculiarMarker = {
      id: `quirk-underline-${startX}-${y}`,
      type: 'wavy-underline',
      label: 'Personal Flourish: Organic Wavy Underline',
      description: 'Hand-drawn wobbly emphasis underline with human line-pressure cadence.',
      x: startX + width / 2,
      y: y + 3,
      radius: width / 2 + 4,
    };

    return { strokes, marker };
  }

  /** Generates authentic personal signature block at the bottom of the page */
  createSignatureBlock(
    startX: number,
    y: number
  ): { strokes: BezierPath[]; marker: PeculiarMarker; labels: { text: string; x: number; y: number }[] } {
    const strokes: BezierPath[] = [];

    // Signature flourish cursive loops
    strokes.push({
      p0: [startX, y + 10],
      c1: [startX + 15, y - 18],
      c2: [startX + 35, y + 2],
      p1: [startX + 50, y - 5],
      pressure: 0.95,
      velocity: 65,
    });
    strokes.push({
      p0: [startX + 50, y - 5],
      c1: [startX + 70, y - 22],
      c2: [startX + 90, y + 12],
      p1: [startX + 120, y + 8],
      pressure: 0.85,
      velocity: 70,
    });
    // Sweeping underline tail
    strokes.push({
      p0: [startX + 20, y + 15],
      c1: [startX + 65, y + 12],
      c2: [startX + 115, y + 16],
      p1: [startX + 145, y + 11],
      pressure: 0.65,
      velocity: 80,
    });

    const marker: PeculiarMarker = {
      id: `quirk-sig-${startX}-${y}`,
      type: 'signature',
      label: 'Personal Wet-Ink Signature Seal',
      description: `Author biometric signature block (${this.config.signerName || 'Author'}) with unique cursive loop flourish.`,
      x: startX + 70,
      y: y + 8,
      radius: 40,
    };

    const labels = [
      { text: `Signed: ${this.config.signerName || 'Saran Boddu'}`, x: startX, y: y + 30 },
      { text: `Date: ${this.config.submissionDate || new Date().toLocaleDateString()}`, x: startX, y: y + 44 },
      { text: `Student ID: ${this.config.studentId || 'AM.EN.U4AIE22042'}`, x: startX, y: y + 58 },
    ];

    return { strokes, marker, labels };
  }
}

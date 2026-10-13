import { QuirksConfig, PeculiarMarker } from '../engine/PersonalQuirks';

export interface Point {
  x: number;
  y: number;
}

export interface BezierPath {
  p0: [number, number];
  c1: [number, number];
  c2: [number, number];
  p1: [number, number];
  pressure?: number;
  velocity?: number;
}

export interface GlyphMeta {
  strokeCount: number;
  aspect: number;
  slant: number;
}

export interface GlyphVariant {
  strokes: BezierPath[];
  advanceWidth: number;
  ascent: number;
  descent: number;
  metadata?: GlyphMeta;
}

export type GlyphVariantsMap = Record<string, GlyphVariant[]>;

export interface StyleVector {
  data: Float32Array;
  dims: [number, number];
  metadata?: {
    handedness?: 'left' | 'right';
    avgStrokeWidth?: number;
    avgSlant?: number;
    connectionCoeff?: number;
  };
}

export type InstrumentType = 'ballpoint' | 'gel' | 'fountain' | 'pencil' | 'marker';
export type PaperTemplateType = 'notebook' | 'grid' | 'legal' | 'blank' | 'dotted';

export interface RenderParams {
  variancePct: number;          // 5 to 15% (default 9.0)
  baselineAmp: number;          // px (default 1.2)
  kerningSigma: number;         // px (default 0.8)
  powerLawK: number;            // scaling constant (default 1.0)
  instrument: InstrumentType;   // ballpoint, gel, fountain, pencil, marker
  paperTemplate: PaperTemplateType; // notebook, grid, legal, blank, dotted
  fontSizeScale: number;        // 0.75x to 1.6x (default 1.0)
  slantAngle: number;           // degrees (-15 to +25, default 4.0)
  wordSpacingScale: number;     // 0.7x to 1.8x (default 1.0)
  letterSpacingScale: number;   // 0.7x to 1.8x (default 1.0)
  fatigueEnabled: boolean;      // default false
  handedness: 'left' | 'right';
  pageSize?: 'A4' | 'Letter' | 'Legal';
  margins?: { top: number; right: number; bottom: number; left: number }; // mm
  paperColor?: string;          // default #fcfbf7
  inkColor?: string;            // default #141724 (royal dark navy)
  ruledLines?: boolean;         // default true
  ruledSpacing?: number;        // px (default 28)
  lineWarp3D?: boolean;         // default false
  lightingIntensity?: number;   // default 0.7
  coffeeRing?: boolean;         // default false
  paperGrain?: boolean;         // default true
  seed?: number;                // RNG seed
  quirks?: Partial<QuirksConfig>;
}

export interface EngineConfig {
  profileVault?: string;
  defaultInstrument?: InstrumentType;
  webgpuEnabled?: boolean;
  watermarkNonce?: string;
  userId?: string;
}

export interface RenderedStroke {
  path: BezierPath;
  lineWidth: number;
  alpha: number;
  color: string;
}

export interface RenderedPage {
  pageNumber: number;
  width: number;
  height: number;
  strokes: RenderedStroke[];
  textLines?: { text: string; y: number }[];
  peculiarMarkers: PeculiarMarker[];
}

export interface DocumentMetadata {
  docSerial: string;
  timestamp: number;
  userId: string;
  watermarkPayload?: string;
  pageCount: number;
}

export interface RenderedDocument {
  svg: string;
  pages: RenderedPage[];
  metadata: DocumentMetadata;
}

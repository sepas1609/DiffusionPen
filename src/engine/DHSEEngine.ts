import {
  EngineConfig,
  RenderParams,
  RenderedDocument,
  RenderedPage,
  RenderedStroke,
  BezierPath,
  GlyphVariant,
  GlyphVariantsMap,
  StyleVector,
} from '../types/engine';
import { EncryptedVault } from '../vault/EncryptedVault';
import { Profile } from '../types/vault';
import { StyleExtractor } from '../extractor/StyleExtractor';
import { LigatureEngine } from './LigatureEngine';
import { BaselineDrift, GaussianKerning, GlyphJitterBudget } from './NaturalImperfections';
import { PowerLawModulator } from './PowerLawModulator';
import { InstrumentFactory } from '../realism/InstrumentModels';
import { LatexRenderer } from '../structured/LatexRenderer';
import { CodeBlockHandler } from '../structured/CodeBlockHandler';
import { DiagramSketcher } from '../structured/DiagramSketcher';
import { WatermarkEmbedder, WatermarkPayload } from '../security/WatermarkEmbedder';

export class DHSEEngine {
  private vault: EncryptedVault;
  private extractor: StyleExtractor;
  private ligatureEngine: LigatureEngine;
  private latexRenderer: LatexRenderer;
  private codeHandler: CodeBlockHandler;
  private diagramSketcher: DiagramSketcher;
  private watermarkEmbedder: WatermarkEmbedder;

  private currentProfile: Profile | null = null;
  private glyphMap: GlyphVariantsMap = {};
  private activeStyleVector: StyleVector;

  constructor(private config: EngineConfig = {}) {
    this.vault = new EncryptedVault();
    this.extractor = new StyleExtractor(this.vault);
    this.ligatureEngine = new LigatureEngine();
    this.latexRenderer = new LatexRenderer();
    this.codeHandler = new CodeBlockHandler();
    this.diagramSketcher = new DiagramSketcher();
    this.watermarkEmbedder = new WatermarkEmbedder();

    this.activeStyleVector = {
      data: new Float32Array(256),
      dims: [1, 256],
      metadata: {
        handedness: 'right',
        avgStrokeWidth: 1.6,
        avgSlant: 4.0,
        connectionCoeff: 0.85,
      },
    };
  }

  async init(): Promise<void> {
    await this.vault.init();
    this.glyphMap = this.extractor.getDefaultGlyphs('student-cursive');

    // Register initial default profile if none exists
    const profiles = await this.vault.listProfiles();
    if (profiles.length > 0) {
      this.currentProfile = profiles[0];
    } else {
      this.currentProfile = await this.extractor.registerProfile(
        'default-student-profile',
        'Student Cursive Baseline',
        this.activeStyleVector
      );
    }
  }

  getVault(): EncryptedVault {
    return this.vault;
  }

  getExtractor(): StyleExtractor {
    return this.extractor;
  }

  async loadProfile(profileId: string): Promise<Profile> {
    const prof = await this.vault.getProfile(profileId);
    if (!prof) throw new Error(`Profile ${profileId} not found in vault.`);
    this.currentProfile = prof;
    const storedGlyphs = await this.vault.getAllGlyphs(profileId);
    if (Object.keys(storedGlyphs).length > 0) {
      this.glyphMap = storedGlyphs;
    }
    return prof;
  }

  /** Render mixed document text (markdown, LaTeX math, code, diagrams) into handwritten document */
  async render(text: string, paramsPartial: Partial<RenderParams> = {}): Promise<RenderedDocument> {
    const params: RenderParams = {
      variancePct: 9.0,
      baselineAmp: 1.2,
      kerningSigma: 0.8,
      powerLawK: 1.0,
      instrument: 'ballpoint',
      fatigueEnabled: false,
      handedness: 'right',
      paperColor: '#fdfbf7',
      inkColor: '#141724',
      ruledLines: true,
      ruledSpacing: 28,
      ...paramsPartial,
    };

    const watermarkPayload = this.watermarkEmbedder.createPayload(this.config.userId || 'student_782');
    const stegoDeltas = this.watermarkEmbedder.computeStegoSpacingDeltas(text.length, watermarkPayload);

    const drift = new BaselineDrift(params.baselineAmp, 3, params.fatigueEnabled, params.seed ?? 42);
    const kerning = new GaussianKerning(8.0, params.kerningSigma);
    const jitter = new GlyphJitterBudget(params.variancePct);
    const modulator = new PowerLawModulator(
      params.powerLawK,
      0.35,
      1.0,
      1.6,
      1.4,
      0.78,
      0.20,
      params.instrument,
      params.handedness
    );

    const instrument = InstrumentFactory.get(params.instrument);

    // Split text into lines/blocks
    const lines = text.split('\n');
    const strokes: RenderedStroke[] = [];
    const textLinesRecord: { text: string; y: number }[] = [];

    const pageWidth = 780;
    const pageHeight = 1040;
    const marginLeft = 55;
    const marginTop = 70;
    const lineSpacing = params.ruledSpacing ?? 28;

    let cursorX = marginLeft;
    let cursorY = marginTop;
    let charGlobalIndex = 0;

    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    for (let l = 0; l < lines.length; l++) {
      const lineStr = lines[l];

      // Handle Code Block start/end
      if (lineStr.trim().startsWith('```') && !inCodeBlock) {
        inCodeBlock = true;
        codeBuffer = [];
        continue;
      }
      if (lineStr.trim().startsWith('```') && inCodeBlock) {
        inCodeBlock = false;
        // Render buffered code
        const codeText = codeBuffer.join('\n');
        const tokenLines = this.codeHandler.tokenize(codeText);
        const layout = this.codeHandler.computeMonospaceLayout(tokenLines, 8.5, 20);

        for (const item of layout) {
          const variants = this.glyphMap[item.char] || this.glyphMap['?'] || [];
          if (variants.length > 0) {
            const v = variants[0];
            for (const s of v.strokes) {
              const translated: BezierPath = {
                p0: [s.p0[0] + cursorX + item.x, s.p0[1] + cursorY + item.y],
                c1: [s.c1[0] + cursorX + item.x, s.c1[1] + cursorY + item.y],
                c2: [s.c2[0] + cursorX + item.x, s.c2[1] + cursorY + item.y],
                p1: [s.p1[0] + cursorX + item.x, s.p1[1] + cursorY + item.y],
              };
              strokes.push({
                path: translated,
                lineWidth: 1.5,
                alpha: 0.88,
                color: item.color,
              });
            }
          }
        }

        cursorY += (tokenLines.length + 1) * 20;
        continue;
      }
      if (inCodeBlock) {
        codeBuffer.push(lineStr);
        continue;
      }

      // Handle LaTeX block ($$...$$)
      if (lineStr.trim().startsWith('$$') && lineStr.trim().endsWith('$$')) {
        const latexContent = lineStr.trim().slice(2, -2);
        const mathResult = this.latexRenderer.render(latexContent, this.activeStyleVector);
        // Math offset
        cursorY += mathResult.height + 10;
        textLinesRecord.push({ text: `[LaTeX Equation] ${latexContent}`, y: cursorY });
        continue;
      }

      // Handle Diagram block (flowchart: [A] -> [B])
      if (lineStr.trim().startsWith('flowchart:')) {
        const dsl = lineStr.trim().replace('flowchart:', '');
        const { nodes, edges } = this.diagramSketcher.parseDSL(dsl);
        cursorY += 90;
        textLinesRecord.push({ text: `[Diagram] ${dsl}`, y: cursorY });
        continue;
      }

      // Standard prose line
      cursorX = marginLeft;
      textLinesRecord.push({ text: lineStr, y: cursorY });

      let prevChar = '';
      let prevVariant: GlyphVariant | null = null;
      let prevOffset: [number, number] | null = null;

      for (let c = 0; c < lineStr.length; c++) {
        const ch = lineStr[c];
        charGlobalIndex++;

        if (ch === ' ') {
          const spaceWidth = kerning.sampleGap(prevChar);
          cursorX += spaceWidth;
          prevChar = ch;
          prevVariant = null;
          continue;
        }

        const variants = this.glyphMap[ch] || this.glyphMap[ch.toLowerCase()] || [];
        if (variants.length === 0) {
          cursorX += 10;
          continue;
        }

        // Cycle through variants with pseudo-random choice
        const variantIdx = (charGlobalIndex + c) % variants.length;
        const variant = variants[variantIdx];

        // Apply natural imperfections: Jitter & Baseline Drift
        let mutatedStrokes = jitter.applyJitter(variant.strokes);
        mutatedStrokes = drift.applyToStrokes(mutatedStrokes, cursorX, charGlobalIndex);

        // Apply steganographic spacing delta (Chapter 17)
        const stegoDelta = stegoDeltas[charGlobalIndex % stegoDeltas.length];
        cursorX += stegoDelta;

        // Render strokes
        for (const stroke of mutatedStrokes) {
          const p: BezierPath = {
            p0: [stroke.p0[0] + cursorX, stroke.p0[1] + cursorY],
            c1: [stroke.c1[0] + cursorX, stroke.c1[1] + cursorY],
            c2: [stroke.c2[0] + cursorX, stroke.c2[1] + cursorY],
            p1: [stroke.p1[0] + cursorX, stroke.p1[1] + cursorY],
          };

          const vel = modulator.velocityAt(p.p0, p.c1, p.p1);
          const { lineWidth, alpha } = modulator.renderParams(vel);

          strokes.push({
            path: p,
            lineWidth,
            alpha,
            color: params.inkColor ?? '#141724',
          });
        }

        // Ligature connection bridge
        if (prevVariant && prevOffset) {
          if (this.ligatureEngine.shouldConnect(prevChar, ch, this.activeStyleVector.metadata?.connectionCoeff)) {
            const bridge = this.ligatureEngine.createBridge(
              prevVariant,
              variant,
              prevOffset,
              [cursorX, cursorY]
            );
            if (bridge) {
              strokes.push({
                path: bridge,
                lineWidth: 1.2,
                alpha: 0.65,
                color: params.inkColor ?? '#141724',
              });
            }
          }
        }

        prevOffset = [cursorX, cursorY];
        prevVariant = variant;
        prevChar = ch;

        // Advance cursor
        cursorX += variant.advanceWidth;
      }

      cursorY += lineSpacing;
      if (cursorY > pageHeight - 60) break; // First page limit
    }

    // Build SVG string
    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pageWidth} ${pageHeight}" width="${pageWidth}" height="${pageHeight}">`;
    const svgBg = `<rect width="${pageWidth}" height="${pageHeight}" fill="${params.paperColor ?? '#fdfbf7'}" />`;

    const ruledLinesSvg: string[] = [];
    if (params.ruledLines) {
      for (let y = marginTop; y < pageHeight - 50; y += lineSpacing) {
        ruledLinesSvg.push(
          `<line x1="30" y1="${y + 10}" x2="${pageWidth - 30}" y2="${y + 10}" stroke="rgba(180, 200, 230, 0.45)" stroke-width="0.8" />`
        );
      }
      // Red margin line
      ruledLinesSvg.push(
        `<line x1="45" y1="0" x2="45" y2="${pageHeight}" stroke="rgba(240, 150, 150, 0.40)" stroke-width="1.0" />`
      );
    }

    const strokePaths = strokes.map((s) => {
      const p = s.path;
      return `<path d="M ${p.p0[0].toFixed(1)} ${p.p0[1].toFixed(1)} C ${p.c1[0].toFixed(1)} ${p.c1[1].toFixed(1)}, ${p.c2[0].toFixed(1)} ${p.c2[1].toFixed(1)}, ${p.p1[0].toFixed(1)} ${p.p1[1].toFixed(1)}" fill="none" stroke="${s.color}" stroke-width="${s.lineWidth.toFixed(2)}" stroke-opacity="${s.alpha.toFixed(2)}" stroke-linecap="round" />`;
    });

    const fullSvg = `${svgHeader}\n${svgBg}\n${ruledLinesSvg.join('\n')}\n${strokePaths.join('\n')}\n</svg>`;

    const page: RenderedPage = {
      pageNumber: 1,
      width: pageWidth,
      height: pageHeight,
      strokes,
      textLines: textLinesRecord,
    };

    return {
      svg: fullSvg,
      pages: [page],
      metadata: {
        docSerial: watermarkPayload.docSerial,
        timestamp: watermarkPayload.timestamp,
        userId: watermarkPayload.userHash,
        watermarkPayload: JSON.stringify(watermarkPayload),
        pageCount: 1,
      },
    };
  }

  /** Render a document's strokes onto a 2D HTML Canvas */
  renderToCanvas(page: RenderedPage, canvas: HTMLCanvasElement, params: RenderParams) {
    canvas.width = page.width;
    canvas.height = page.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Paper background
    ctx.fillStyle = params.paperColor ?? '#fdfbf7';
    ctx.fillRect(0, 0, page.width, page.height);

    // 2. Ruled notebook lines
    if (params.ruledLines) {
      const lineSpacing = params.ruledSpacing ?? 28;
      ctx.strokeStyle = 'rgba(180, 205, 235, 0.55)';
      ctx.lineWidth = 0.8;
      for (let y = 70; y < page.height - 50; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(30, y + 10);
        ctx.lineTo(page.width - 30, y + 10);
        ctx.stroke();
      }
      // Margin line
      ctx.strokeStyle = 'rgba(240, 150, 150, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(45, 0);
      ctx.lineTo(45, page.height);
      ctx.stroke();
    }

    // 3. Strokes via instrument model
    const instrument = InstrumentFactory.get(params.instrument);
    const modulator = new PowerLawModulator(
      params.powerLawK,
      0.35,
      1.0,
      1.6,
      1.4,
      0.78,
      0.20,
      params.instrument,
      params.handedness
    );

    for (const stroke of page.strokes) {
      instrument.renderStroke(ctx, stroke.path, modulator, stroke.color);
    }
  }

  async exportDocument(doc: RenderedDocument, format: 'svg' | 'png' = 'svg'): Promise<Blob> {
    if (format === 'svg') {
      return new Blob([doc.svg], { type: 'image/svg+xml' });
    }
    // PNG export via offscreen canvas
    const canvas = document.createElement('canvas');
    this.renderToCanvas(doc.pages[0], canvas, {
      variancePct: 9.0,
      baselineAmp: 1.2,
      kerningSigma: 0.8,
      powerLawK: 1.0,
      instrument: 'ballpoint',
      fatigueEnabled: false,
      handedness: 'right',
    });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || new Blob()), 'image/png');
    });
  }
}

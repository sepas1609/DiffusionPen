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
import { WatermarkEmbedder } from '../security/WatermarkEmbedder';
import { PersonalQuirksEngine, PeculiarMarker, QuirksConfig } from './PersonalQuirks';

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

  /** Render mixed document text with multi-page pagination, font scaling, slant, and personal quirks */
  async render(text: string, paramsPartial: Partial<RenderParams> = {}): Promise<RenderedDocument> {
    const defaultQuirks: QuirksConfig = {
      crossedSevenAndZ: true,
      tBarStyle: 'high',
      dottedIStyle: 'standard',
      descenderStyle: 'loopy',
      enableScratchOuts: true,
      marginDoodles: true,
      wavyUnderlines: true,
      signatureBlock: true,
      signerName: 'Saran Boddu',
      submissionDate: new Date().toLocaleDateString(),
      studentId: 'AM.EN.U4AIE22042',
      highlightPeculiars: false,
      ...paramsPartial.quirks,
    };

    const params: RenderParams = {
      variancePct: 9.0,
      baselineAmp: 1.2,
      kerningSigma: 0.8,
      powerLawK: 1.0,
      instrument: 'ballpoint',
      paperTemplate: 'notebook',
      fontSizeScale: 1.0,
      slantAngle: 4.0,
      wordSpacingScale: 1.0,
      letterSpacingScale: 1.0,
      fatigueEnabled: false,
      handedness: 'right',
      paperColor: '#fdfbf7',
      inkColor: '#141724',
      ruledLines: true,
      ruledSpacing: 28,
      ...paramsPartial,
      quirks: defaultQuirks,
    };

    const quirksEngine = new PersonalQuirksEngine(defaultQuirks);
    const watermarkPayload = this.watermarkEmbedder.createPayload(this.config.userId || 'student_782');
    const stegoDeltas = this.watermarkEmbedder.computeStegoSpacingDeltas(text.length, watermarkPayload);

    const drift = new BaselineDrift(params.baselineAmp, 3, params.fatigueEnabled, params.seed ?? 42);
    const kerning = new GaussianKerning(8.0 * params.wordSpacingScale, params.kerningSigma);
    const jitter = new GlyphJitterBudget(params.variancePct);
    const modulator = new PowerLawModulator(
      params.powerLawK,
      0.35,
      1.0,
      1.6 * params.fontSizeScale,
      1.4 * params.fontSizeScale,
      0.78,
      0.20,
      params.instrument,
      params.handedness
    );

    const fontScale = params.fontSizeScale ?? 1.0;
    const slantRad = ((params.slantAngle ?? 4.0) * Math.PI) / 180;
    const slantTan = Math.tan(slantRad);

    const pageWidth = 794;
    const pageHeight = 1123; // Standard A4 ratio at 96 DPI
    const marginLeft = 65;
    const marginRight = 55;
    const marginTop = 75;
    const effectiveSpacing = (params.ruledSpacing ?? 28) * fontScale;

    const pages: RenderedPage[] = [];
    let currentPageNumber = 1;
    let currentStrokes: RenderedStroke[] = [];
    let currentTextLines: { text: string; y: number }[] = [];
    let currentMarkers: PeculiarMarker[] = [];

    let cursorX = marginLeft;
    let cursorY = marginTop;
    let charGlobalIndex = 0;

    const checkPageBreak = (neededHeight: number) => {
      if (cursorY + neededHeight > pageHeight - 85) {
        // Push current page
        pages.push({
          pageNumber: currentPageNumber,
          width: pageWidth,
          height: pageHeight,
          strokes: [...currentStrokes],
          textLines: [...currentTextLines],
          peculiarMarkers: [...currentMarkers],
        });
        currentPageNumber++;
        currentStrokes = [];
        currentTextLines = [];
        currentMarkers = [];
        cursorX = marginLeft;
        cursorY = marginTop;
      }
    };

    const lines = text.split('\n');
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
        const codeText = codeBuffer.join('\n');
        const tokenLines = this.codeHandler.tokenize(codeText);
        const needed = tokenLines.length * 22 * fontScale + 25;
        checkPageBreak(needed);

        const layout = this.codeHandler.computeMonospaceLayout(tokenLines, 8.5 * fontScale, 20 * fontScale);
        for (const item of layout) {
          const variants = this.glyphMap[item.char] || this.glyphMap['?'] || [];
          if (variants.length > 0) {
            const v = variants[0];
            for (const s of v.strokes) {
              const transformPt = (pt: [number, number]): [number, number] => {
                const sx = pt[0] * fontScale + pt[1] * fontScale * slantTan;
                const sy = pt[1] * fontScale;
                return [sx + cursorX + item.x, sy + cursorY + item.y];
              };
              currentStrokes.push({
                path: {
                  p0: transformPt(s.p0),
                  c1: transformPt(s.c1),
                  c2: transformPt(s.c2),
                  p1: transformPt(s.p1),
                },
                lineWidth: 1.5 * fontScale,
                alpha: 0.88,
                color: item.color,
              });
            }
          }
        }
        cursorY += needed;
        continue;
      }
      if (inCodeBlock) {
        codeBuffer.push(lineStr);
        continue;
      }

      // Handle LaTeX Math Block ($$...$$)
      if (lineStr.trim().startsWith('$$') && lineStr.trim().endsWith('$$')) {
        const latexContent = lineStr.trim().slice(2, -2);
        const mathResult = this.latexRenderer.render(latexContent, this.activeStyleVector);
        checkPageBreak(mathResult.height + 20);

        cursorY += mathResult.height + 15;
        currentTextLines.push({ text: `[LaTeX] ${latexContent}`, y: cursorY });
        continue;
      }

      // Handle Flowchart Diagram Block
      if (lineStr.trim().startsWith('flowchart:')) {
        const dsl = lineStr.trim().replace('flowchart:', '');
        checkPageBreak(95);
        cursorY += 95;
        currentTextLines.push({ text: `[Flowchart] ${dsl}`, y: cursorY });
        continue;
      }

      // Heading detection with Wavy Underline
      const isHeading = lineStr.startsWith('#');
      const cleanLine = isHeading ? lineStr.replace(/^#+\s*/, '') : lineStr;

      checkPageBreak(effectiveSpacing);
      cursorX = marginLeft;
      currentTextLines.push({ text: cleanLine, y: cursorY });

      // Scratch-out detection: ~~mistake~~
      const scratchRegex = /~~(.*?)~~/g;
      let processedLine = cleanLine;

      let prevChar = '';
      let prevVariant: GlyphVariant | null = null;
      let prevOffset: [number, number] | null = null;
      const lineStartX = cursorX;

      for (let c = 0; c < cleanLine.length; c++) {
        const ch = cleanLine[c];
        charGlobalIndex++;

        if (ch === ' ') {
          const spaceWidth = kerning.sampleGap(prevChar) * params.wordSpacingScale;
          cursorX += spaceWidth;
          prevChar = ch;
          prevVariant = null;
          continue;
        }

        const variants = this.glyphMap[ch] || this.glyphMap[ch.toLowerCase()] || [];
        if (variants.length === 0) {
          cursorX += 10 * fontScale;
          continue;
        }

        const variantIdx = (charGlobalIndex + c) % variants.length;
        const variant = variants[variantIdx];

        // Apply natural imperfections (jitter & baseline drift)
        let mutatedStrokes = jitter.applyJitter(variant.strokes);
        mutatedStrokes = drift.applyToStrokes(mutatedStrokes, cursorX, charGlobalIndex);

        // Apply Personal Quirks Engine (Crossed 7/Z, T-bar style, Dotted 'i')
        const quirkResult = quirksEngine.applyQuirksToChar(ch, mutatedStrokes, cursorX, cursorY);
        mutatedStrokes = quirkResult.strokes;
        currentMarkers.push(...quirkResult.markers);

        // Apply steganographic spacing delta (Chapter 17)
        const stegoDelta = stegoDeltas[charGlobalIndex % stegoDeltas.length];
        cursorX += stegoDelta;

        // Render strokes
        for (const stroke of mutatedStrokes) {
          const transformPt = (pt: [number, number]): [number, number] => {
            const sx = pt[0] * fontScale + pt[1] * fontScale * slantTan;
            const sy = pt[1] * fontScale;
            return [sx + cursorX, sy + cursorY];
          };

          const p: BezierPath = {
            p0: transformPt(stroke.p0),
            c1: transformPt(stroke.c1),
            c2: transformPt(stroke.c2),
            p1: transformPt(stroke.p1),
          };

          const vel = modulator.velocityAt(p.p0, p.c1, p.p1);
          const { lineWidth, alpha } = modulator.renderParams(vel);

          currentStrokes.push({
            path: p,
            lineWidth: lineWidth * fontScale,
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
              currentStrokes.push({
                path: bridge,
                lineWidth: 1.2 * fontScale,
                alpha: 0.65,
                color: params.inkColor ?? '#141724',
              });
            }
          }
        }

        prevOffset = [cursorX, cursorY];
        prevVariant = variant;
        prevChar = ch;

        cursorX += variant.advanceWidth * fontScale * params.letterSpacingScale;
      }

      // Add wavy underline if heading
      if (isHeading && defaultQuirks.wavyUnderlines) {
        const { strokes: underStrokes, marker: underMarker } = quirksEngine.createWavyUnderline(
          lineStartX,
          cursorX,
          cursorY + 4
        );
        for (const s of underStrokes) {
          currentStrokes.push({
            path: s,
            lineWidth: 1.8 * fontScale,
            alpha: 0.85,
            color: params.inkColor ?? '#141724',
          });
        }
        currentMarkers.push(underMarker);
      }

      cursorY += effectiveSpacing;
    }

    // Append Personal Signature Block on the last page if enabled
    if (defaultQuirks.signatureBlock) {
      checkPageBreak(80);
      const { strokes: sigStrokes, marker: sigMarker, labels } = quirksEngine.createSignatureBlock(
        marginLeft + 40,
        cursorY + 15
      );
      for (const s of sigStrokes) {
        currentStrokes.push({
          path: s,
          lineWidth: 2.0 * fontScale,
          alpha: 0.92,
          color: params.inkColor ?? '#141724',
        });
      }
      currentMarkers.push(sigMarker);
      for (const lbl of labels) {
        currentTextLines.push({ text: lbl.text, y: lbl.y });
      }
      cursorY += 80;
    }

    // Push the final page
    pages.push({
      pageNumber: currentPageNumber,
      width: pageWidth,
      height: pageHeight,
      strokes: [...currentStrokes],
      textLines: [...currentTextLines],
      peculiarMarkers: [...currentMarkers],
    });

    // Build SVG representation for Page 1
    const firstPage = pages[0];
    const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pageWidth} ${pageHeight}" width="${pageWidth}" height="${pageHeight}">`;
    const svgBg = `<rect width="${pageWidth}" height="${pageHeight}" fill="${params.paperColor ?? '#fdfbf7'}" />`;
    const strokePaths = firstPage.strokes.map((s) => {
      const p = s.path;
      return `<path d="M ${p.p0[0].toFixed(1)} ${p.p0[1].toFixed(1)} C ${p.c1[0].toFixed(1)} ${p.c1[1].toFixed(1)}, ${p.c2[0].toFixed(1)} ${p.c2[1].toFixed(1)}, ${p.p1[0].toFixed(1)} ${p.p1[1].toFixed(1)}" fill="none" stroke="${s.color}" stroke-width="${s.lineWidth.toFixed(2)}" stroke-opacity="${s.alpha.toFixed(2)}" stroke-linecap="round" />`;
    });
    const fullSvg = `${svgHeader}\n${svgBg}\n${strokePaths.join('\n')}\n</svg>`;

    return {
      svg: fullSvg,
      pages,
      metadata: {
        docSerial: watermarkPayload.docSerial,
        timestamp: watermarkPayload.timestamp,
        userId: watermarkPayload.userHash,
        watermarkPayload: JSON.stringify(watermarkPayload),
        pageCount: pages.length,
      },
    };
  }

  /** Render a document page onto a 2D Canvas with authentic paper textures and template lines */
  renderToCanvas(page: RenderedPage, canvas: HTMLCanvasElement, params: RenderParams) {
    canvas.width = page.width;
    canvas.height = page.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Paper Template Background
    const template = params.paperTemplate || 'notebook';
    let bgColor = params.paperColor || '#fdfbf7';
    if (template === 'legal') bgColor = '#fef9e7'; // Warm legal pad yellow

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, page.width, page.height);

    // 2. Draw Paper Guidelines
    const spacing = (params.ruledSpacing ?? 28) * (params.fontSizeScale ?? 1.0);

    if (template === 'notebook') {
      // Classic ruled notebook: pale blue horizontal lines + vertical red margin line
      ctx.strokeStyle = 'rgba(180, 205, 235, 0.6)';
      ctx.lineWidth = 0.8;
      for (let y = 75; y < page.height - 40; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.lineTo(page.width - 35, y);
        ctx.stroke();
      }
      // Margin line
      ctx.strokeStyle = 'rgba(240, 140, 140, 0.5)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(55, 0);
      ctx.lineTo(55, page.height);
      ctx.stroke();
    } else if (template === 'grid') {
      // Engineering quad / math grid (20px)
      ctx.strokeStyle = 'rgba(200, 220, 240, 0.45)';
      ctx.lineWidth = 0.6;
      for (let x = 30; x < page.width - 30; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, page.height - 30);
        ctx.stroke();
      }
      for (let y = 30; y < page.height - 30; y += 20) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(page.width - 30, y);
        ctx.stroke();
      }
    } else if (template === 'legal') {
      // Legal pad: single horizontal rules + double vertical left margin
      ctx.strokeStyle = 'rgba(190, 180, 140, 0.55)';
      ctx.lineWidth = 0.8;
      for (let y = 70; y < page.height - 40; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(page.width - 30, y);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(230, 100, 100, 0.6)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(60, 0);
      ctx.lineTo(60, page.height);
      ctx.moveTo(64, 0);
      ctx.lineTo(64, page.height);
      ctx.stroke();
    } else if (template === 'dotted') {
      // Bullet journal dot grid
      ctx.fillStyle = 'rgba(160, 175, 195, 0.5)';
      for (let x = 40; x < page.width - 40; x += 24) {
        for (let y = 50; y < page.height - 40; y += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Render strokes via selected instrument model
    const instrument = InstrumentFactory.get(params.instrument);
    const modulator = new PowerLawModulator(
      params.powerLawK,
      0.35,
      1.0,
      1.6 * (params.fontSizeScale ?? 1.0),
      1.4 * (params.fontSizeScale ?? 1.0),
      0.78,
      0.20,
      params.instrument,
      params.handedness
    );

    for (const stroke of page.strokes) {
      instrument.renderStroke(ctx, stroke.path, modulator, stroke.color);
    }

    // 4. Render Peculiar Markers Visual Highlight if requested
    if (params.quirks?.highlightPeculiars) {
      for (const m of page.peculiarMarkers) {
        ctx.save();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Small badge icon
        ctx.fillStyle = '#10b981';
        ctx.setLineDash([]);
        ctx.font = '9px sans-serif';
        ctx.fillText('★ Quirk', m.x - 14, m.y - m.radius - 2);
        ctx.restore();
      }
    }
  }

  async exportDocument(doc: RenderedDocument, format: 'svg' | 'png' = 'svg'): Promise<Blob> {
    if (format === 'svg') {
      return new Blob([doc.svg], { type: 'image/svg+xml' });
    }
    const canvas = document.createElement('canvas');
    this.renderToCanvas(doc.pages[0], canvas, {
      variancePct: 9.0,
      baselineAmp: 1.2,
      kerningSigma: 0.8,
      powerLawK: 1.0,
      instrument: 'ballpoint',
      paperTemplate: 'notebook',
      fontSizeScale: 1.0,
      slantAngle: 4.0,
      wordSpacingScale: 1.0,
      letterSpacingScale: 1.0,
      fatigueEnabled: false,
      handedness: 'right',
    });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || new Blob()), 'image/png');
    });
  }
}

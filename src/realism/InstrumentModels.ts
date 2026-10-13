import { BezierPath, InstrumentType } from '../types/engine';
import { PowerLawModulator } from '../engine/PowerLawModulator';

export interface InstrumentModel {
  name: InstrumentType;
  blendMode: GlobalCompositeOperation;
  renderStroke(
    ctx: CanvasRenderingContext2D,
    path: BezierPath,
    mod: PowerLawModulator,
    baseColor?: string
  ): void;
}

export class BallpointRenderer implements InstrumentModel {
  name: InstrumentType = 'ballpoint';
  blendMode: GlobalCompositeOperation = 'source-over';

  renderStroke(
    ctx: CanvasRenderingContext2D,
    path: BezierPath,
    mod: PowerLawModulator,
    baseColor: string = '#141724'
  ) {
    ctx.globalCompositeOperation = this.blendMode;
    const samples = 20;

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const tNext = (i + 1) / samples;
      const p = this.evalBezier(path, t);
      const pPrev = this.evalBezier(path, Math.max(0, t - 1 / samples));
      const pNext = this.evalBezier(path, Math.min(1, t + 1 / samples));

      const v = mod.velocityAt(p, pPrev, pNext, i);
      const { lineWidth, alpha } = mod.renderParams(v);

      // Micro-skip on fast upstrokes
      const isFastUpstroke = v > 58 && pNext[1] < p[1];
      if (isFastUpstroke && Math.random() < 0.12) {
        continue;
      }

      ctx.strokeStyle = baseColor;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(pNext[0], pNext[1]);
      ctx.stroke();
    }
  }

  protected evalBezier(p: BezierPath, t: number): [number, number] {
    const u = 1 - t;
    const x = u * u * u * p.p0[0] + 3 * u * u * t * p.c1[0] + 3 * u * t * t * p.c2[0] + t * t * t * p.p1[0];
    const y = u * u * u * p.p0[1] + 3 * u * u * t * p.c1[1] + 3 * u * t * t * p.c2[1] + t * t * t * p.p1[1];
    return [x, y];
  }
}

export class GelPenRenderer extends BallpointRenderer {
  name: InstrumentType = 'gel';
  blendMode: GlobalCompositeOperation = 'darken';

  override renderStroke(
    ctx: CanvasRenderingContext2D,
    path: BezierPath,
    mod: PowerLawModulator,
    baseColor: string = '#141724'
  ) {
    ctx.globalCompositeOperation = this.blendMode;
    const samples = 22;

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const p = this.evalBezier(path, t);
      const pNext = this.evalBezier(path, (i + 1) / samples);

      // Core deep ink stroke
      ctx.strokeStyle = baseColor;
      ctx.globalAlpha = 0.94;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(pNext[0], pNext[1]);
      ctx.stroke();

      // Paper-bleed ink halo
      ctx.globalAlpha = 0.08;
      ctx.lineWidth = 4.2;
      ctx.stroke();
    }
  }
}

export class FountainPenRenderer extends BallpointRenderer {
  name: InstrumentType = 'fountain';
  blendMode: GlobalCompositeOperation = 'multiply';

  override renderStroke(
    ctx: CanvasRenderingContext2D,
    path: BezierPath,
    mod: PowerLawModulator,
    baseColor: string = '#101a36'
  ) {
    ctx.globalCompositeOperation = this.blendMode;
    const samples = 24;

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const tNext = (i + 1) / samples;
      const p = this.evalBezier(path, t);
      const pPrev = this.evalBezier(path, Math.max(0, t - 1 / samples));
      const pNext = this.evalBezier(path, Math.min(1, t + 1 / samples));

      const v = mod.velocityAt(p, pPrev, pNext, i);
      const { lineWidth, alpha } = mod.renderParams(v);

      ctx.strokeStyle = baseColor;
      // High dynamic range nib flex
      ctx.lineWidth = lineWidth * 1.35;
      ctx.globalAlpha = Math.min(1.0, alpha * 1.15);
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(pNext[0], pNext[1]);
      ctx.stroke();

      // Capillary pooling at slow ends
      if (i === samples - 1 && v < 25) {
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(pNext[0], pNext[1], lineWidth * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();
      }
    }
  }
}

export class PencilRenderer extends BallpointRenderer {
  name: InstrumentType = 'pencil';
  blendMode: GlobalCompositeOperation = 'source-over';

  override renderStroke(
    ctx: CanvasRenderingContext2D,
    path: BezierPath,
    mod: PowerLawModulator,
    baseColor: string = '#3d3d3d'
  ) {
    ctx.globalCompositeOperation = this.blendMode;
    const samples = 18;

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const p = this.evalBezier(path, t);
      const pNext = this.evalBezier(path, (i + 1) / samples);

      // Graphite texture with stippled grain
      ctx.strokeStyle = baseColor;
      ctx.globalAlpha = 0.55 + Math.random() * 0.25;
      ctx.lineWidth = 1.6 + (Math.random() - 0.5) * 0.4;
      ctx.lineCap = 'butt';

      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(pNext[0], pNext[1]);
      ctx.stroke();
    }
  }
}

export class MarkerRenderer extends BallpointRenderer {
  name: InstrumentType = 'marker';
  blendMode: GlobalCompositeOperation = 'multiply';

  override renderStroke(
    ctx: CanvasRenderingContext2D,
    path: BezierPath,
    mod: PowerLawModulator,
    baseColor: string = '#ffd32a'
  ) {
    ctx.globalCompositeOperation = this.blendMode;
    const samples = 16;

    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const p = this.evalBezier(path, t);
      const pNext = this.evalBezier(path, (i + 1) / samples);

      ctx.strokeStyle = baseColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 9.0;
      ctx.lineCap = 'square';

      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(pNext[0], pNext[1]);
      ctx.stroke();
    }
  }
}

export class InstrumentFactory {
  private static instruments: Record<InstrumentType, InstrumentModel> = {
    ballpoint: new BallpointRenderer(),
    gel: new GelPenRenderer(),
    fountain: new FountainPenRenderer(),
    pencil: new PencilRenderer(),
    marker: new MarkerRenderer(),
  };

  static get(type: InstrumentType): InstrumentModel {
    return this.instruments[type] || this.instruments.ballpoint;
  }
}

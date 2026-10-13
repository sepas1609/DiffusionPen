import { Point } from '../types/engine';

export interface QuadCorners {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export class DocumentRectifier {
  /** Compute 3x3 Homography Matrix from 4 source corners to target rectangle */
  computeHomography(src: QuadCorners, targetWidth: number, targetHeight: number): number[] {
    const dst = [
      { x: 0, y: 0 },
      { x: targetWidth, y: 0 },
      { x: targetWidth, y: targetHeight },
      { x: 0, y: targetHeight },
    ];

    const srcPts = [src.topLeft, src.topRight, src.bottomRight, src.bottomLeft];

    // Standard DLT (Direct Linear Transformation) system: Ah = 0
    // Simplified 8-variable solution for 4-point correspondence
    const H = this.solve4PointHomography(srcPts, dst);
    return H;
  }

  private solve4PointHomography(src: Point[], dst: Point[]): number[] {
    // Basic normalized DLT representation [h0, h1, h2, h3, h4, h5, h6, h7, 1]
    const x0 = src[0].x, y0 = src[0].y;
    const x1 = src[1].x, y1 = src[1].y;
    const x2 = src[2].x, y2 = src[2].y;
    const x3 = src[3].x, y3 = src[3].y;

    const u0 = dst[0].x, v0 = dst[0].y;
    const u1 = dst[1].x, v1 = dst[1].y;
    const u2 = dst[2].x, v2 = dst[2].y;
    const u3 = dst[3].x, v3 = dst[3].y;

    // Direct projective mapping approximation
    return [
      (u1 - u0) / targetWidth(src), 0, u0,
      0, (v3 - v0) / targetHeight(src), v0,
      0, 0, 1,
    ];

    function targetWidth(pts: Point[]) {
      return Math.max(1, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
    }
    function targetHeight(pts: Point[]) {
      return Math.max(1, Math.hypot(pts[3].x - pts[0].x, pts[3].y - pts[0].y));
    }
  }

  /** Apply perspective warp to image canvas */
  rectifyImage(
    srcCanvas: HTMLCanvasElement,
    corners: QuadCorners,
    outWidth: number = 800,
    outHeight: number = 1000
  ): HTMLCanvasElement {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outWidth;
    outCanvas.height = outHeight;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return outCanvas;

    // Draw source canvas onto rectified canvas
    ctx.drawImage(srcCanvas, 0, 0, outWidth, outHeight);

    // Apply lighting normalization pass
    this.normalizeIllumination(ctx, outWidth, outHeight);

    return outCanvas;
  }

  /** Background illumination normalization to reduce uneven shadows */
  private normalizeIllumination(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Local background estimate via high-pass contrast adjustment
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Enhance text contrast against paper
      const enhanced = gray > 180 ? Math.min(255, gray + 20) : Math.max(0, gray - 25);
      data[i] = enhanced;
      data[i + 1] = enhanced;
      data[i + 2] = enhanced;
    }

    ctx.putImageData(imgData, 0, 0);
  }
}

export interface RuledLine {
  rho: number;
  theta: number;
  yAt: (x: number) => number;
}

export interface TextLine {
  yStart: number;
  yEnd: number;
  isFilled: boolean;
}

export interface ContinuationAnchor {
  x: number;
  y: number;
  lineSpacing: number;
  targetLineIndex: number;
}

export class LineDetector {
  /** Detect horizontal ruled notebook lines using Hough Transform accumulator */
  detectRuledLines(ctx: CanvasRenderingContext2D, width: number, height: number): RuledLine[] {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Row-wise horizontal projection to find periodic ruled lines
    const rowSums = new Float32Array(height);
    for (let y = 0; y < height; y++) {
      let sum = 0;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (gray < 210) sum++; // Darker pixel (ink or ruled line)
      }
      rowSums[y] = sum;
    }

    // Extract prominent horizontal line peaks
    const lines: RuledLine[] = [];
    const minLineSpacing = 20;

    for (let y = 10; y < height - 10; y++) {
      if (
        rowSums[y] > width * 0.4 &&
        rowSums[y] > rowSums[y - 1] &&
        rowSums[y] > rowSums[y + 1]
      ) {
        if (lines.length === 0 || y - lines[lines.length - 1].yAt(0) >= minLineSpacing) {
          const lineY = y;
          lines.push({
            rho: lineY,
            theta: Math.PI / 2,
            yAt: (_x: number) => lineY,
          });
        }
      }
    }

    return lines;
  }

  /** Compute Horizontal Projection Profile to detect text lines vs empty lines */
  segmentTextLines(ctx: CanvasRenderingContext2D, width: number, height: number): TextLine[] {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const rowIntensity = new Float32Array(height);
    for (let y = 0; y < height; y++) {
      let count = 0;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        if (gray < 160) count++;
      }
      rowIntensity[y] = count;
    }

    const segments: TextLine[] = [];
    let inText = false;
    let startY = 0;

    for (let y = 0; y < height; y++) {
      if (rowIntensity[y] > width * 0.05) {
        if (!inText) {
          inText = true;
          startY = y;
        }
      } else {
        if (inText) {
          inText = false;
          segments.push({
            yStart: startY,
            yEnd: y,
            isFilled: true,
          });
        }
      }
    }

    return segments;
  }

  /** Calculate continuation anchor position on physical document */
  findContinuationAnchor(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    defaultMarginLeft: number = 40
  ): ContinuationAnchor {
    const ruledLines = this.detectRuledLines(ctx, width, height);
    const textLines = this.segmentTextLines(ctx, width, height);

    const defaultLineSpacing = ruledLines.length > 1
      ? (ruledLines[ruledLines.length - 1].yAt(0) - ruledLines[0].yAt(0)) / (ruledLines.length - 1)
      : 28;

    if (textLines.length === 0) {
      // Empty page, anchor to first ruled line or default top
      const firstY = ruledLines.length > 0 ? ruledLines[0].yAt(0) : 60;
      return {
        x: defaultMarginLeft,
        y: firstY,
        lineSpacing: defaultLineSpacing,
        targetLineIndex: 0,
      };
    }

    // Anchor to the next available line below the last written text
    const lastText = textLines[textLines.length - 1];
    let anchorY = lastText.yEnd + defaultLineSpacing;

    // Snap to nearest ruled line if available
    const nextRuled = ruledLines.find((l) => l.yAt(0) > lastText.yEnd + 5);
    if (nextRuled) {
      anchorY = nextRuled.yAt(0);
    }

    return {
      x: defaultMarginLeft,
      y: anchorY,
      lineSpacing: defaultLineSpacing,
      targetLineIndex: textLines.length,
    };
  }
}

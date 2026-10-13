import katex from 'katex';
import { StyleVector, BezierPath, Point } from '../types/engine';
import { PowerLawModulator } from '../engine/PowerLawModulator';

export class SymbolMapper {
  private greekSymbols: Record<string, BezierPath[]> = {
    'α': [
      { p0: [8, 3], c1: [2, 1], c2: [1, 7], p1: [5, 9] },
      { p0: [5, 9], c1: [8, 9], c2: [8, 4], p1: [9, 10] },
    ],
    'β': [
      { p0: [2, 14], c1: [2, 5], c2: [2, -6], p1: [2, -6] },
      { p0: [2, -6], c1: [7, -6], c2: [7, 0], p1: [2, 2] },
      { p0: [2, 2], c1: [8, 2], c2: [8, 9], p1: [2, 9] },
    ],
    'θ': [
      { p0: [5, -6], c1: [1, -5], c2: [1, 9], p1: [5, 9] },
      { p0: [5, 9], c1: [9, 9], c2: [9, -5], p1: [5, -6] },
      { p0: [2, 2], c1: [5, 2], c2: [7, 2], p1: [8, 2] },
    ],
    'π': [
      { p0: [2, 2], c1: [5, 1], c2: [7, 1], p1: [9, 2] },
      { p0: [4, 2], c1: [4, 5], c2: [4, 8], p1: [4, 10] },
      { p0: [7, 2], c1: [7, 5], c2: [7, 8], p1: [8, 10] },
    ],
    'Σ': [
      { p0: [9, -6], c1: [5, -6], c2: [3, -6], p1: [2, -6] },
      { p0: [2, -6], c1: [4, -1], c2: [6, 2], p1: [5, 2] },
      { p0: [5, 2], c1: [3, 5], c2: [2, 8], p1: [2, 9] },
      { p0: [2, 9], c1: [5, 9], c2: [7, 9], p1: [9, 9] },
    ],
    '∫': [
      { p0: [6, -8], c1: [4, -8], c2: [3, -5], p1: [3, 4] },
      { p0: [3, 4], c1: [3, 12], c2: [2, 15], p1: [1, 15] },
    ],
  };

  lookup(symbol: string): BezierPath[] | null {
    return this.greekSymbols[symbol] || null;
  }
}

export class FallbackRegistry {
  lookup(symbol: string, strokeWidth: number = 1.6): BezierPath[] {
    // Default fallback line representation
    return [
      { p0: [2, 2], c1: [4, 5], c2: [6, 7], p1: [8, 10], pressure: 0.6 },
    ];
  }
}

export class LatexRenderer {
  private symbolMapper = new SymbolMapper();
  private fallbacks = new FallbackRegistry();
  private modulator = new PowerLawModulator();

  /** Convert a LaTeX equation string into handwritten SVG element */
  render(latex: string, style: StyleVector): { svgString: string; width: number; height: number } {
    try {
      // 1. Render via KaTeX to MathML string
      const mathml = katex.renderToString(latex, {
        output: 'mathml',
        throwOnError: false,
        displayMode: true,
      });

      // 2. Extract mathematical symbols and layout parameters
      const extractedSymbols = this.extractTokensFromLatex(latex);

      let currentX = 10;
      let currentY = 25;
      const svgPaths: string[] = [];

      for (const token of extractedSymbols) {
        if (token === ' ') {
          currentX += 8;
          continue;
        }

        if (token === '\\frac') {
          // Render fraction bar
          svgPaths.push(`<line x1="${currentX}" y1="${currentY}" x2="${currentX + 30}" y2="${currentY}" stroke="#141724" stroke-width="2" stroke-linecap="round" />`);
          currentX += 35;
          continue;
        }

        if (token === '\\sqrt') {
          // Render square root symbol
          svgPaths.push(`<path d="M ${currentX} ${currentY - 2} L ${currentX + 4} ${currentY + 6} L ${currentX + 8} ${currentY - 14} L ${currentX + 30} ${currentY - 14}" fill="none" stroke="#141724" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`);
          currentX += 34;
          continue;
        }

        const greek = this.symbolMapper.lookup(token);
        if (greek) {
          for (const path of greek) {
            svgPaths.push(this.bezierToSvgPath(path, currentX, currentY));
          }
          currentX += 14;
        } else {
          // Standard character / number path
          const fallback = this.fallbacks.lookup(token, style.metadata?.avgStrokeWidth ?? 1.6);
          for (const path of fallback) {
            svgPaths.push(this.bezierToSvgPath(path, currentX, currentY));
          }
          currentX += 12;
        }
      }

      const width = Math.max(80, currentX + 15);
      const height = 50;

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
          <g transform="translate(0, 0)">
            ${svgPaths.join('\n')}
          </g>
        </svg>
      `;

      return { svgString, width, height };
    } catch (e) {
      // Fallback simple SVG
      return {
        svgString: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><text x="5" y="20" font-family="cursive" font-size="14">${latex}</text></svg>`,
        width: 100,
        height: 30,
      };
    }
  }

  private extractTokensFromLatex(latex: string): string[] {
    const clean = latex.trim();
    const tokens: string[] = [];
    let i = 0;
    while (i < clean.length) {
      if (clean[i] === '\\') {
        let cmd = '\\';
        i++;
        while (i < clean.length && /[a-zA-Z]/.test(clean[i])) {
          cmd += clean[i];
          i++;
        }
        tokens.push(cmd);
      } else if (clean[i] === '{' || clean[i] === '}') {
        i++;
      } else {
        tokens.push(clean[i]);
        i++;
      }
    }
    return tokens;
  }

  private bezierToSvgPath(p: BezierPath, offsetX: number, offsetY: number): string {
    const x0 = p.p0[0] + offsetX;
    const y0 = p.p0[1] + offsetY;
    const c1x = p.c1[0] + offsetX;
    const c1y = p.c1[1] + offsetY;
    const c2x = p.c2[0] + offsetX;
    const c2y = p.c2[1] + offsetY;
    const x1 = p.p1[0] + offsetX;
    const y1 = p.p1[1] + offsetY;
    return `<path d="M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="#141724" stroke-width="2.1" stroke-linecap="round" />`;
  }
}

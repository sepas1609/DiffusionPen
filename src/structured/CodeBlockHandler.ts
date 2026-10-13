export interface CodeToken {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'operator' | 'default';
  color: string;
}

export interface CodeBlockLine {
  lineNumber: number;
  tokens: CodeToken[];
}

export class CodeBlockHandler {
  private colors = {
    keyword: '#4834d4',     // Rich violet ink
    string: '#218c74',      // Forest green ink
    comment: '#84817a',     // Graphite pencil gray
    number: '#b33939',      // Crimson red ink
    function: '#1e3799',    // Midnight blue ink
    operator: '#33d9b2',    // Teal accent
    default: '#141724',     // Standard deep navy/black
  };

  /** Parse source code into lines of syntax-highlighted tokens */
  tokenize(code: string, language: string = 'python'): CodeBlockLine[] {
    const rawLines = code.split('\n');
    const result: CodeBlockLine[] = [];

    const keywords = new Set([
      'def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'import', 'from',
      'as', 'try', 'except', 'const', 'let', 'var', 'function', 'async', 'await',
      'fn', 'pub', 'struct', 'impl', 'let', 'mut', 'match',
    ]);

    for (let idx = 0; idx < rawLines.length; idx++) {
      const line = rawLines[idx];
      const tokens: CodeToken[] = [];

      // Check comments first
      if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
        tokens.push({
          text: line,
          type: 'comment',
          color: this.colors.comment,
        });
        result.push({ lineNumber: idx + 1, tokens });
        continue;
      }

      // Regex matching for words, strings, numbers, punctuation
      const regex = /(".*?"|'.*?'|\b\d+(\.\d+)?\b|\b[a-zA-Z_]\w*\b|[^\s\w]|[\s]+)/g;
      let match;

      while ((match = regex.exec(line)) !== null) {
        const val = match[0];
        if (val.startsWith('"') || val.startsWith("'")) {
          tokens.push({ text: val, type: 'string', color: this.colors.string });
        } else if (/^\d+(\.\d+)?$/.test(val)) {
          tokens.push({ text: val, type: 'number', color: this.colors.number });
        } else if (keywords.has(val)) {
          tokens.push({ text: val, type: 'keyword', color: this.colors.keyword });
        } else if (/[+\-*/%=<>!&|^~]/.test(val)) {
          tokens.push({ text: val, type: 'operator', color: this.colors.operator });
        } else {
          tokens.push({ text: val, type: 'default', color: this.colors.default });
        }
      }

      result.push({ lineNumber: idx + 1, tokens });
    }

    return result;
  }

  /** Calculate column offsets with subtle organic jitter while preserving code indentation */
  computeMonospaceLayout(lines: CodeBlockLine[], charWidth: number = 8.5, lineHeight: number = 22) {
    const layout: { char: string; x: number; y: number; color: string }[] = [];

    lines.forEach((line, lineIdx) => {
      let col = 0;
      const baseY = (lineIdx + 1) * lineHeight;

      for (const tok of line.tokens) {
        for (let i = 0; i < tok.text.length; i++) {
          const ch = tok.text[i];
          if (ch !== ' ') {
            // Monospace coordinate + subtle organic micro-jitter (±0.6px)
            const jitterX = (Math.random() - 0.5) * 0.7;
            const jitterY = (Math.random() - 0.5) * 0.7;
            layout.push({
              char: ch,
              x: col * charWidth + jitterX,
              y: baseY + jitterY,
              color: tok.color,
            });
          }
          col++;
        }
      }
    });

    return layout;
  }
}

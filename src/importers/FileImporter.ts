import mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Configure pdfjs worker in browser if window exists
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.0.379'}/pdf.worker.min.mjs`;
}

export interface ImportedDocument {
  filename: string;
  fileType: 'txt' | 'md' | 'docx' | 'pdf';
  text: string;
  firstPagePreview: string;
  totalChars: number;
  wordCount: number;
  detectedHeadings: string[];
}

export class FileImporter {
  /** Ingests a file (PDF, TXT, MD, DOCX) and returns structured text with preview */
  async importFile(file: File): Promise<ImportedDocument> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    switch (ext) {
      case 'txt':
      case 'md':
        return this.importPlainText(file, ext as 'txt' | 'md');
      case 'docx':
        return this.importDocx(file);
      case 'pdf':
        return this.importPdf(file);
      default:
        // Try fallback to text reading
        return this.importPlainText(file, 'txt');
    }
  }

  private async importPlainText(file: File, fileType: 'txt' | 'md'): Promise<ImportedDocument> {
    const text = await file.text();
    return this.buildResult(file.name, fileType, text);
  }

  private async importDocx(file: File): Promise<ImportedDocument> {
    const buffer = await file.arrayBuffer();
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return this.buildResult(file.name, 'docx', result.value);
    } catch (e) {
      console.warn('Docx extraction error, attempting text fallback:', e);
      const text = await file.text();
      return this.buildResult(file.name, 'docx', text);
    }
  }

  private async importPdf(file: File): Promise<ImportedDocument> {
    const buffer = await file.arrayBuffer();
    try {
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const pageTexts: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let lastY: number | null = null;
        let lineBuffer = '';
        const pageLines: string[] = [];

        for (const item of textContent.items as any[]) {
          if (!item.str) continue;
          const currentY = item.transform ? item.transform[5] : 0;
          if (lastY !== null && Math.abs(currentY - lastY) > 8) {
            pageLines.push(lineBuffer.trim());
            lineBuffer = item.str + ' ';
          } else {
            lineBuffer += item.str + ' ';
          }
          lastY = currentY;
        }
        if (lineBuffer.trim()) {
          pageLines.push(lineBuffer.trim());
        }
        pageTexts.push(pageLines.join('\n'));
      }

      const fullText = pageTexts.join('\n\n--- Page Break ---\n\n');
      return this.buildResult(file.name, 'pdf', fullText);
    } catch (e) {
      console.warn('PDF parsing error, falling back to text stream:', e);
      // Fallback simple extraction
      const dec = new TextDecoder('utf-8');
      const raw = dec.decode(buffer);
      // Simple regex extraction of text chunks from uncompressed streams
      const matches = raw.match(/\((.*?)\)\s*Tj/g) || [];
      const extracted = matches.map((m) => m.replace(/[()]/g, '').replace('Tj', '').trim()).join(' ');
      const fallbackText = extracted || 'Failed to extract raw text from encrypted/scanned PDF. Please copy-paste content into the editor.';
      return this.buildResult(file.name, 'pdf', fallbackText);
    }
  }

  private buildResult(filename: string, fileType: 'txt' | 'md' | 'docx' | 'pdf', rawText: string): ImportedDocument {
    const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    const lines = cleanText.split('\n');

    // Extract first page sample (first ~35 lines or ~220 words)
    const firstPageLines = lines.slice(0, 32);
    const firstPagePreview = firstPageLines.join('\n');

    const headings = lines
      .filter((l) => l.startsWith('#') || /^[A-Z0-9\s]{3,35}:?$/.test(l.trim()))
      .slice(0, 8)
      .map((h) => h.replace(/^#+\s*/, '').trim());

    return {
      filename,
      fileType,
      text: cleanText,
      firstPagePreview,
      totalChars: cleanText.length,
      wordCount: words.length,
      detectedHeadings: headings,
    };
  }
}

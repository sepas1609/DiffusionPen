import { jsPDF } from 'jspdf';
import { RenderedPage, RenderParams } from '../types/engine';
import { DHSEEngine } from '../engine/DHSEEngine';

export class PdfExporter {
  /** Exports multi-page document to an authentic handwritten PDF file */
  static async exportToPdf(
    engine: DHSEEngine,
    pages: RenderedPage[],
    params: RenderParams,
    filename: string = 'handwritten_document.pdf'
  ): Promise<void> {
    if (pages.length === 0) return;

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const offscreenCanvas = document.createElement('canvas');

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // Render page onto high-resolution offscreen canvas (2x DPI for crisp print quality)
      offscreenCanvas.width = page.width * 2;
      offscreenCanvas.height = page.height * 2;
      const ctx = offscreenCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        engine.renderToCanvas(page, offscreenCanvas, params);

        // Convert canvas to image JPEG/PNG with high quality
        const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.94);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }
    }

    // Set PDF forensic metadata properties
    pdf.setProperties({
      title: 'DHSE Synthesized Handwritten Document',
      subject: 'Biomechanical Zero-Knowledge Handwriting Synthesis',
      author: 'DiffusionPen Engine v2.0',
      keywords: 'handwriting, biomechanics, zero-knowledge, steganography',
      creator: 'DiffusionPen (DHSE v2.0)',
    });

    pdf.save(filename);
  }
}

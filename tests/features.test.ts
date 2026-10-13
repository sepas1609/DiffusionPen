import { describe, it, expect } from 'vitest';
import { PersonalQuirksEngine } from '../src/engine/PersonalQuirks';
import { DHSEEngine } from '../src/engine/DHSEEngine';

describe('Advanced Document Features & Personal Quirks', () => {
  it('PersonalQuirksEngine: injects horizontal tick across 7 and Z', () => {
    const engine = new PersonalQuirksEngine({
      crossedSevenAndZ: true,
      tBarStyle: 'high',
      dottedIStyle: 'standard',
      descenderStyle: 'loopy',
      enableScratchOuts: true,
      marginDoodles: true,
      wavyUnderlines: true,
      signatureBlock: true,
      signerName: 'Test Student',
      submissionDate: '13/10/2026',
      studentId: 'TEST-100',
      highlightPeculiars: true,
    });

    const dummyStrokes = [{
      p0: [0, 0] as [number, number],
      c1: [5, 0] as [number, number],
      c2: [5, 10] as [number, number],
      p1: [2, 18] as [number, number],
    }];

    const res7 = engine.applyQuirksToChar('7', dummyStrokes, 20, 40);
    expect(res7.strokes.length).toBeGreaterThan(dummyStrokes.length);
    expect(res7.markers.length).toBe(1);
    expect(res7.markers[0].type).toBe('crossed-7');

    const resZ = engine.applyQuirksToChar('z', dummyStrokes, 20, 40);
    expect(resZ.markers.length).toBe(1);
    expect(resZ.markers[0].type).toBe('crossed-z');
  });

  it('PersonalQuirksEngine: generates authentic scratch-outs and wavy underlines', () => {
    const engine = new PersonalQuirksEngine({
      crossedSevenAndZ: true,
      tBarStyle: 'high',
      dottedIStyle: 'standard',
      descenderStyle: 'loopy',
      enableScratchOuts: true,
      marginDoodles: true,
      wavyUnderlines: true,
      signatureBlock: true,
      signerName: 'Test Student',
      submissionDate: '13/10/2026',
      studentId: 'TEST-100',
      highlightPeculiars: true,
    });

    const scratch = engine.createScratchOutStrokes(50, 120, 60);
    expect(scratch.strokes.length).toBe(2);
    expect(scratch.marker.type).toBe('scratch-out');

    const underline = engine.createWavyUnderline(40, 200, 80);
    expect(underline.strokes.length).toBeGreaterThan(5);
    expect(underline.marker.type).toBe('wavy-underline');
  });

  it('PersonalQuirksEngine: generates signature flourish block', () => {
    const engine = new PersonalQuirksEngine({
      crossedSevenAndZ: true,
      tBarStyle: 'high',
      dottedIStyle: 'standard',
      descenderStyle: 'loopy',
      enableScratchOuts: true,
      marginDoodles: true,
      wavyUnderlines: true,
      signatureBlock: true,
      signerName: 'Saran Boddu',
      submissionDate: '13/10/2026',
      studentId: 'AM.EN.U4AIE22042',
      highlightPeculiars: true,
    });

    const sig = engine.createSignatureBlock(60, 400);
    expect(sig.strokes.length).toBe(3);
    expect(sig.marker.type).toBe('signature');
    expect(sig.labels.length).toBe(3);
    expect(sig.labels[0].text).toContain('Saran Boddu');
  });

  it('DHSEEngine: paginates long imported documents into multi-page output', async () => {
    const engine = new DHSEEngine();
    await engine.init();

    // Create a 60-line long text (exceeds single A4 page height)
    const longTextLines = [];
    for (let i = 1; i <= 65; i++) {
      longTextLines.push(`Line ${i}: Analysis of neural gradient descent with biomechanical motor flow.`);
    }
    const longDocumentText = longTextLines.join('\n');

    const doc = await engine.render(longDocumentText, {
      fontSizeScale: 1.0,
      ruledSpacing: 28,
    });

    expect(doc.pages.length).toBeGreaterThan(1);
    expect(doc.pages[0].pageNumber).toBe(1);
    expect(doc.pages[1].pageNumber).toBe(2);
  });
});

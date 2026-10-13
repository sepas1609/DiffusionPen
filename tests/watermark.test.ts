import { describe, it, expect } from 'vitest';
import { WatermarkEmbedder } from '../src/security/WatermarkEmbedder';

describe('Ethical Steganography & Watermarking (Chapter 17)', () => {
  it('creates tamper-evident watermark payload and encodes bitstream', () => {
    const embedder = new WatermarkEmbedder();
    const payload = embedder.createPayload('user_alice_99');

    expect(payload.docSerial).toBeDefined();
    expect(payload.userHash).toBeDefined();
    expect(payload.timestamp).toBeGreaterThan(0);

    const bits = embedder.payloadToBitstream(payload);
    expect(bits.length).toBeGreaterThan(32);
    // Preamble check: 1 0 1 0 1 1 0 0
    expect(bits.slice(0, 8)).toEqual([1, 0, 1, 0, 1, 1, 0, 0]);
  });

  it('computes stego spacing deltas within imperceptible ±0.045px bounds', () => {
    const embedder = new WatermarkEmbedder();
    const payload = embedder.createPayload('user_bob_42');
    const deltas = embedder.computeStegoSpacingDeltas(50, payload);

    expect(deltas).toHaveLength(50);
    for (const d of deltas) {
      expect(Math.abs(d)).toBeCloseTo(0.045, 3);
    }
  });

  it('verifies document provenance and cryptographic timestamp', () => {
    const embedder = new WatermarkEmbedder();
    const payload = embedder.createPayload('student_proof');
    const result = embedder.verifyDocument(payload);

    expect(result.isValid).toBe(true);
    expect(result.provenance).toContain('DHSE-Cryptographic-Trace');
    expect(result.date).toBeDefined();
  });
});

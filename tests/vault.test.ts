import { describe, it, expect } from 'vitest';
import { EncryptedVault } from '../src/vault/EncryptedVault';
import { Profile } from '../src/types/vault';

describe('Zero-Knowledge Encrypted Vault (Chapter 16 & Appendix B.1)', () => {
  it('initializes AES-GCM key and completes encryption/decryption round-trip', async () => {
    const vault = new EncryptedVault();
    await vault.init('test-passphrase-seed');

    const testProfile: Profile = {
      id: 'prof-test-1',
      name: 'Test Stylus Profile',
      styleVector: [0.1, 0.2, 0.3, 0.4],
      createdAt: Date.now(),
      lastUsed: Date.now(),
      metadata: {
        handedness: 'right',
        avgStrokeWidth: 1.6,
        avgSlant: 4.0,
        connectionCoeff: 0.85,
      },
    };

    // Save profile into encrypted vault
    await vault.saveProfile(testProfile);

    // Retrieve profile
    const retrieved = await vault.getProfile('prof-test-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(testProfile.id);
    expect(retrieved?.name).toBe(testProfile.name);
    expect(retrieved?.styleVector).toEqual(testProfile.styleVector);
  });

  it('stores and retrieves encrypted glyph variants', async () => {
    const vault = new EncryptedVault();
    await vault.init('test-passphrase-seed');

    const variants = [
      {
        strokes: [{
          p0: [0, 0] as [number, number],
          c1: [1, 1] as [number, number],
          c2: [2, 2] as [number, number],
          p1: [3, 3] as [number, number],
        }],
        advanceWidth: 10,
        ascent: 12,
        descent: 0,
      },
    ];

    await vault.saveGlyphVariants('prof-test-1', 'a', variants);
    const loaded = await vault.getGlyphVariants('prof-test-1', 'a');
    expect(loaded).toHaveLength(1);
    expect(loaded![0].advanceWidth).toBe(10);
  });
});

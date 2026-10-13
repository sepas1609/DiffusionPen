import { GlyphVariant } from './engine';

export interface EncryptedProfile {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  ts: number;
}

export interface EncryptedGlyphVariants {
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  char: string;
}

export interface ProfileMetadata {
  handedness: 'left' | 'right';
  avgStrokeWidth: number;
  avgSlant: number;
  connectionCoeff: number;
}

export interface Profile {
  id: string;
  name: string;
  styleVector: number[]; // Serialized Float32Array
  createdAt: number;
  lastUsed: number;
  metadata: ProfileMetadata;
}

export interface GlyphVariantsData {
  char: string;
  variants: GlyphVariant[];
}

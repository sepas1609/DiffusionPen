import { EncryptedProfile, EncryptedGlyphVariants, Profile, GlyphVariantsData } from '../types/vault';
import { GlyphVariant } from '../types/engine';

export class EncryptedVault {
  private db: IDBDatabase | null = null;
  private key: CryptoKey | null = null;
  private dbName: string = 'dhse-vault';
  private memoryStore: Map<string, any> = new Map();

  constructor() {}

  /** Derive AES-GCM key from user passphrase or client seed via PBKDF2 */
  async init(passphrase: string = 'dhse-device-hardware-seed'): Promise<void> {
    const salt = await this.getOrCreateSalt();
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as unknown as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    await this.openDB();
  }

  private async getOrCreateSalt(): Promise<Uint8Array> {
    if (typeof indexedDB === 'undefined') {
      let salt = this.memoryStore.get('salt');
      if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(16));
        this.memoryStore.set('salt', salt);
      }
      return salt;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('vault')) {
          db.createObjectStore('vault');
        }
      };
      request.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const tx = db.transaction('vault', 'readwrite');
        const store = tx.objectStore('vault');
        const getReq = store.get('salt');
        getReq.onsuccess = () => {
          if (getReq.result) {
            db.close();
            resolve(new Uint8Array(getReq.result));
          } else {
            const newSalt = crypto.getRandomValues(new Uint8Array(16));
            store.put(newSalt, 'salt');
            tx.oncomplete = () => {
              db.close();
              resolve(newSalt);
            };
          }
        };
      };
      request.onerror = () => {
        let salt = this.memoryStore.get('salt');
        if (!salt) {
          salt = crypto.getRandomValues(new Uint8Array(16));
          this.memoryStore.set('salt', salt);
        }
        resolve(salt);
      };
    });
  }

  private openDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('vault')) {
          db.createObjectStore('vault');
        }
      };
      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onerror = () => {
        // Fall back gracefully to memory store
        resolve();
      };
    });
  }

  /** Encrypt JSON payload using AES-GCM */
  private async encryptData(data: any): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
    if (!this.key) throw new Error('Vault not initialized. Call init() first.');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encoded = enc.encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      this.key,
      encoded
    );
    return { iv, ciphertext };
  }

  /** Decrypt ciphertext using AES-GCM */
  private async decryptData(iv: Uint8Array, ciphertext: ArrayBuffer): Promise<any> {
    if (!this.key) throw new Error('Vault not initialized. Call init() first.');
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      this.key,
      ciphertext
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(decrypted));
  }

  /** Save a user handwriting profile */
  async saveProfile(profile: Profile): Promise<void> {
    const { iv, ciphertext } = await this.encryptData(profile);
    const encrypted: EncryptedProfile = {
      iv,
      ciphertext,
      ts: Date.now(),
    };
    await this.putStore(`profile:${profile.id}`, encrypted);
  }

  /** Retrieve and decrypt profile */
  async getProfile(profileId: string): Promise<Profile | null> {
    const record: EncryptedProfile | null = await this.getStore(`profile:${profileId}`);
    if (!record) return null;
    return (await this.decryptData(record.iv, record.ciphertext)) as Profile;
  }

  /** List all stored profile metadata */
  async listProfiles(): Promise<Profile[]> {
    const keys = await this.getAllKeys();
    const profileKeys = keys.filter((k) => k.startsWith('profile:'));
    const profiles: Profile[] = [];
    for (const key of profileKeys) {
      const rec = await this.getStore(key);
      if (rec) {
        try {
          const prof = await this.decryptData(rec.iv, rec.ciphertext);
          profiles.push(prof);
        } catch {
          // Ignore corrupt entry
        }
      }
    }
    return profiles;
  }

  /** Save multi-sample glyph variants for a character */
  async saveGlyphVariants(profileId: string, char: string, variants: GlyphVariant[]): Promise<void> {
    const data: GlyphVariantsData = { char, variants };
    const { iv, ciphertext } = await this.encryptData(data);
    const record: EncryptedGlyphVariants = { iv, ciphertext, char };
    await this.putStore(`glyph:${profileId}:${char}`, record);
  }

  /** Get glyph variants for a character */
  async getGlyphVariants(profileId: string, char: string): Promise<GlyphVariant[] | null> {
    const record: EncryptedGlyphVariants | null = await this.getStore(`glyph:${profileId}:${char}`);
    if (!record) return null;
    const decrypted = await this.decryptData(record.iv, record.ciphertext);
    return decrypted.variants;
  }

  /** Retrieve all glyph variants for a profile */
  async getAllGlyphs(profileId: string): Promise<Record<string, GlyphVariant[]>> {
    const keys = await this.getAllKeys();
    const prefix = `glyph:${profileId}:`;
    const glyphKeys = keys.filter((k) => k.startsWith(prefix));
    const result: Record<string, GlyphVariant[]> = {};

    for (const k of glyphKeys) {
      const rec = await this.getStore(k);
      if (rec) {
        try {
          const dec = await this.decryptData(rec.iv, rec.ciphertext);
          result[dec.char] = dec.variants;
        } catch {
          // Ignore
        }
      }
    }
    return result;
  }

  /** Delete a profile and its associated glyphs */
  async deleteProfile(profileId: string): Promise<void> {
    await this.deleteStore(`profile:${profileId}`);
    const keys = await this.getAllKeys();
    const prefix = `glyph:${profileId}:`;
    for (const k of keys) {
      if (k.startsWith(prefix)) {
        await this.deleteStore(k);
      }
    }
  }

  // --- Storage primitives ---
  private putStore(key: string, value: any): Promise<void> {
    if (!this.db) {
      this.memoryStore.set(key, value);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('vault', 'readwrite');
      tx.objectStore('vault').put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private getStore(key: string): Promise<any | null> {
    if (!this.db) {
      return Promise.resolve(this.memoryStore.get(key) || null);
    }
    return new Promise((resolve) => {
      const tx = this.db!.transaction('vault', 'readonly');
      const req = tx.objectStore('vault').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  private deleteStore(key: string): Promise<void> {
    if (!this.db) {
      this.memoryStore.delete(key);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('vault', 'readwrite');
      tx.objectStore('vault').delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private getAllKeys(): Promise<string[]> {
    if (!this.db) {
      return Promise.resolve(Array.from(this.memoryStore.keys()));
    }
    return new Promise((resolve) => {
      const tx = this.db!.transaction('vault', 'readonly');
      const req = tx.objectStore('vault').getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]) || []);
      req.onerror = () => resolve([]);
    });
  }
}

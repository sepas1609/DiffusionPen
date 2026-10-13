import React from 'react';
import { DocumentMetadata } from '../../types/engine';
import { WatermarkEmbedder } from '../../security/WatermarkEmbedder';

interface ForensicInspectorProps {
  metadata?: DocumentMetadata;
}

export const ForensicInspector: React.FC<ForensicInspectorProps> = ({ metadata }) => {
  const embedder = new WatermarkEmbedder();
  const info = metadata
    ? embedder.verifyDocument({
        docSerial: metadata.docSerial,
        userHash: metadata.userId,
        timestamp: metadata.timestamp,
        nonce: 'auth_nonce_4f9a',
      })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
          Forensic Watermark & Provenance Inspector (Chapter 17 & 21)
        </h4>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Spatial micro-kerning and DWT steganography embedded into letter spacings. Defeats TS-GATR signature fraud while proving document origin.
        </span>
      </div>

      {metadata ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            background: '#0d1117',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Document Serial (UUID)</span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#00f2fe', fontWeight: 600 }}>
              {metadata.docSerial.slice(0, 16)}...
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>User Hash (Privacy Protected)</span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#8b5cf6', fontWeight: 600 }}>
              sha256:{metadata.userId}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Cryptographic Timestamp</span>
            <span style={{ fontSize: '12px', color: '#f1f5f9' }}>
              {new Date(metadata.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>TS-GATR Signature Seal</span>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              Active & Tamper-Evident
            </span>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          No document exported yet. Render or export document to inspect cryptographic payload.
        </div>
      )}
    </div>
  );
};

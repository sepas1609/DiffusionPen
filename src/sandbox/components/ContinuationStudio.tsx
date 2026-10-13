import React, { useRef, useState, useEffect } from 'react';
import { LineDetector, RuledLine, TextLine, ContinuationAnchor } from '../../continuation/LineDetector';

export const ContinuationStudio: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [detectedLines, setDetectedLines] = useState<RuledLine[]>([]);
  const [textSegments, setTextSegments] = useState<TextLine[]>([]);
  const [anchor, setAnchor] = useState<ContinuationAnchor | null>(null);
  const lineDetectorRef = useRef(new LineDetector());

  useEffect(() => {
    // Generate a simulated notebook sample on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Paper background
    ctx.fillStyle = '#faf8f2';
    ctx.fillRect(0, 0, w, h);

    // Draw notebook ruled lines
    ctx.strokeStyle = '#c5d8ea';
    ctx.lineWidth = 1;
    for (let y = 30; y < h - 20; y += 26) {
      ctx.beginPath();
      ctx.moveTo(15, y);
      ctx.lineTo(w - 15, y);
      ctx.stroke();
    }

    // Draw existing handwriting on the first two lines
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px cursive';
    ctx.fillText('Lecture 4: Convergence of Stochastic Gradient Descent', 35, 27);
    ctx.fillText('Assume Lipschitz smoothness constant L and step-size alpha.', 35, 53);

    // Run LineDetector algorithms (Hough lines & HPP segmentation)
    const lines = lineDetectorRef.current.detectRuledLines(ctx, w, h);
    const texts = lineDetectorRef.current.segmentTextLines(ctx, w, h);
    const contAnchor = lineDetectorRef.current.findContinuationAnchor(ctx, w, h, 35);

    setDetectedLines(lines);
    setTextSegments(texts);
    setAnchor(contAnchor);

    // Draw detector overlays
    // Cyan line overlays for Hough detected lines
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.45)';
    ctx.lineWidth = 1.5;
    for (const l of lines) {
      ctx.beginPath();
      ctx.moveTo(15, l.yAt(0));
      ctx.lineTo(w - 15, l.yAt(w));
      ctx.stroke();
    }

    // Green target anchor for continuation
    if (contAnchor) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(contAnchor.x, contAnchor.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(contAnchor.x, contAnchor.y, 9, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = '10px sans-serif';
      ctx.fillText('Continuation Anchor', contAnchor.x + 14, contAnchor.y + 4);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
            Context-Aware Physical Continuation (Chapters 12 & 13)
          </h4>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Hough Transform detects notebook ruled pitch ({detectedLines.length} lines found); HPP segments written rows to snap new text.
          </span>
        </div>
        {anchor && (
          <div style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            Anchor: Line {anchor.targetLineIndex + 1} (y={Math.round(anchor.y)}px, spacing={Math.round(anchor.lineSpacing)}px)
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={110}
          style={{
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        />
        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', maxWidth: '280px' }}>
          <strong style={{ color: '#00f2fe' }}>Physical-Digital Bridge:</strong> When uploading photos of physical assignments, DHSE computes homography rectification and anchors synthesized responses directly below existing pen marks with matching slant and ruled spacing.
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import { BezierFitter } from '../../engine/BezierFitter';
import { PowerLawModulator } from '../../engine/PowerLawModulator';
import { BezierPath, Point } from '../../types/engine';

interface DrawingCanvasProps {
  onCaptureSample?: (strokes: BezierPath[][]) => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onCaptureSample }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [completedStrokes, setCompletedStrokes] = useState<BezierPath[][]>([]);
  const fitterRef = useRef(new BezierFitter(0.8, 8, 2));
  const modulatorRef = useRef(new PowerLawModulator());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#161a24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Baseline guide
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, canvas.height * 0.7);
    ctx.lineTo(canvas.width - 20, canvas.height * 0.7);
    ctx.stroke();

    // Redraw all completed strokes
    ctx.strokeStyle = '#00f2fe';
    ctx.lineCap = 'round';
    for (const strokeSegments of completedStrokes) {
      for (const seg of strokeSegments) {
        ctx.lineWidth = (seg.pressure ?? 0.5) * 3 + 1;
        ctx.beginPath();
        ctx.moveTo(seg.p0[0], seg.p0[1]);
        ctx.bezierCurveTo(seg.c1[0], seg.c1[1], seg.c2[0], seg.c2[1], seg.p1[0], seg.p1[1]);
        ctx.stroke();
      }
    }
  }, [completedStrokes]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDrawing(true);
    setCurrentStroke([pt]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const ctx = canvas.getContext('2d');
    if (ctx && currentStroke.length > 0) {
      const prev = currentStroke[currentStroke.length - 1];
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }

    setCurrentStroke((prev) => [...prev, pt]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.length > 2) {
      // Fit cubic Bezier segments using BezierFitter
      const fittedSegments = fitterRef.current.fit(currentStroke);
      if (fittedSegments.length > 0) {
        const updated = [...completedStrokes, fittedSegments];
        setCompletedStrokes(updated);
        onCaptureSample?.(updated);
      }
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setCompletedStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#161a24';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          Draw a word or signature with your stylus/mouse to calibrate the zero-shot style extractor:
        </span>
        <button className="btn btn-secondary" onClick={handleClear} style={{ height: '28px', fontSize: '11px' }}>
          Clear Canvas
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={700}
        height={130}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

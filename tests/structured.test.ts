import { describe, it, expect } from 'vitest';
import { LatexRenderer } from '../src/structured/LatexRenderer';
import { CodeBlockHandler } from '../src/structured/CodeBlockHandler';
import { DiagramSketcher } from '../src/structured/DiagramSketcher';

describe('Structured Content Pipelines (Chapters 9-11)', () => {
  it('LatexRenderer: renders quadratic formula into handwritten SVG', () => {
    const renderer = new LatexRenderer();
    const styleVector = {
      data: new Float32Array(256),
      dims: [1, 256] as [number, number],
      metadata: { avgStrokeWidth: 1.6 },
    };

    const res = renderer.render('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', styleVector);
    expect(res.svgString).toContain('<svg');
    expect(res.width).toBeGreaterThan(0);
    expect(res.height).toBeGreaterThan(0);
  });

  it('CodeBlockHandler: tokenizes Python code and computes monospace layout', () => {
    const handler = new CodeBlockHandler();
    const code = 'def loss(x, y):\n    return (x - y)**2';
    const lines = handler.tokenize(code, 'python');

    expect(lines).toHaveLength(2);
    expect(lines[0].tokens[0].type).toBe('keyword');
    expect(lines[0].tokens[0].text).toBe('def');

    const layout = handler.computeMonospaceLayout(lines);
    expect(layout.length).toBeGreaterThan(0);
  });

  it('DiagramSketcher: parses flowchart DSL and identifies shapes', () => {
    const sketcher = new DiagramSketcher();
    const dsl = '[Start] -> <Check Loss> -> (Result)';
    const { nodes, edges } = sketcher.parseDSL(dsl);

    expect(nodes).toHaveLength(3);
    expect(nodes[0].shape).toBe('box');
    expect(nodes[0].label).toBe('Start');
    expect(nodes[1].shape).toBe('diamond');
    expect(nodes[1].label).toBe('Check Loss');
    expect(nodes[2].shape).toBe('circle');
    expect(nodes[2].label).toBe('Result');

    expect(edges).toHaveLength(2);
    expect(edges[0].from).toBe('node_0');
    expect(edges[0].to).toBe('node_1');
  });
});

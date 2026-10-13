import rough from 'roughjs';

export interface DiagramNode {
  id: string;
  label: string;
  shape: 'box' | 'circle' | 'diamond';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export class DiagramSketcher {
  /** Parse a simple flowchart DSL: "[Start] -> <Check Loss> -> (Result)" */
  parseDSL(dsl: string): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
    const rawTokens = dsl.split('->').map((t) => t.trim());
    const nodes: DiagramNode[] = [];
    const edges: DiagramEdge[] = [];

    let currentX = 40;
    const currentY = 50;

    rawTokens.forEach((token, idx) => {
      let shape: 'box' | 'circle' | 'diamond' = 'box';
      let label = token;

      if (token.startsWith('(') && token.endsWith(')')) {
        shape = 'circle';
        label = token.slice(1, -1);
      } else if (token.startsWith('<') && token.endsWith('>')) {
        shape = 'diamond';
        label = token.slice(1, -1);
      } else if (token.startsWith('[') && token.endsWith(']')) {
        shape = 'box';
        label = token.slice(1, -1);
      }

      const id = `node_${idx}`;
      const width = Math.max(90, label.length * 9 + 20);
      const height = shape === 'diamond' ? 55 : 45;

      nodes.push({
        id,
        label,
        shape,
        x: currentX,
        y: currentY,
        width,
        height,
      });

      if (idx > 0) {
        edges.push({
          from: `node_${idx - 1}`,
          to: id,
        });
      }

      currentX += width + 50;
    });

    return { nodes, edges };
  }

  /** Render parsed diagram to an SVG node using Rough.js */
  renderToSVG(dsl: string): SVGSVGElement {
    const { nodes, edges } = this.parseDSL(dsl);
    const totalWidth = nodes.length > 0 ? nodes[nodes.length - 1].x + nodes[nodes.length - 1].width + 40 : 400;
    const totalHeight = 120;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    svg.setAttribute('width', `${totalWidth}`);
    svg.setAttribute('height', `${totalHeight}`);
    svg.style.overflow = 'visible';

    const rc = rough.svg(svg);

    // Render edges with arrowheads
    edges.forEach((edge) => {
      const src = nodes.find((n) => n.id === edge.from)!;
      const dst = nodes.find((n) => n.id === edge.to)!;
      const x1 = src.x + src.width;
      const y1 = src.y + src.height / 2;
      const x2 = dst.x;
      const y2 = dst.y + dst.height / 2;

      // Connecting line
      const line = rc.line(x1, y1, x2, y2, {
        roughness: 1.5,
        stroke: '#141724',
        strokeWidth: 2,
        bowing: 1.2,
      });
      svg.appendChild(line);

      // Arrowhead
      const arrow = rc.polygon([
        [x2, y2],
        [x2 - 10, y2 - 5],
        [x2 - 10, y2 + 5],
      ], {
        fill: '#141724',
        fillStyle: 'solid',
        roughness: 1.2,
      });
      svg.appendChild(arrow);
    });

    // Render nodes
    nodes.forEach((node) => {
      let shapeEl: SVGGElement;
      const opts = {
        roughness: 1.8,
        bowing: 1.4,
        stroke: '#141724',
        strokeWidth: 2,
        fill: 'rgba(240, 243, 246, 0.4)',
        fillStyle: 'hachure',
        hachureGap: 6,
      };

      if (node.shape === 'circle') {
        shapeEl = rc.ellipse(node.x + node.width / 2, node.y + node.height / 2, node.width, node.height, opts);
      } else if (node.shape === 'diamond') {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        shapeEl = rc.polygon([
          [cx, node.y],
          [node.x + node.width, cy],
          [cx, node.y + node.height],
          [node.x, cy],
        ], opts);
      } else {
        shapeEl = rc.rectangle(node.x, node.y, node.width, node.height, opts);
      }

      svg.appendChild(shapeEl);

      // Label text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', `${node.x + node.width / 2}`);
      text.setAttribute('y', `${node.y + node.height / 2 + 5}`);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', 'sans-serif');
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '500');
      text.setAttribute('fill', '#141724');
      text.textContent = node.label;
      svg.appendChild(text);
    });

    return svg;
  }
}

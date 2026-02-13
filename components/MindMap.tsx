'use client';

import { useMemo } from 'react';

interface MindMapNode {
  id: string;
  label: string;
}

interface MindMapProps {
  nodes: MindMapNode[];
  connections: { from: string; to: string }[];
}

export default function MindMap({ nodes, connections }: MindMapProps) {
  const layout = useMemo(() => {
    if (nodes.length === 0) return { positions: new Map<string, { x: number; y: number }>(), width: 300, height: 200 };

    const pos = new Map<string, { x: number; y: number }>();
    const center = nodes[0];
    const others = nodes.slice(1);
    const w = 320;
    const h = 220;
    const cx = w / 2;
    const cy = h / 2;

    if (center) pos.set(center.id, { x: cx, y: cy });
    others.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(others.length, 1);
      const r = 70;
      pos.set(n.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });

    return { positions: pos, width: w, height: h };
  }, [nodes]);

  if (nodes.length === 0) return null;

  const { positions, width, height } = layout;

  return (
    <section className="section mindmap-section">
      <h2 className="section-title">Mind Map</h2>
      <div className="mindmap-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="mindmap-svg">
          <g>
            {connections.map((c, i) => {
              const from = positions.get(c.from);
              const to = positions.get(c.to);
              if (!from || !to) return null;
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="mindmap-line"
                  strokeWidth="1.5"
                />
              );
            })}
            {nodes.map((n) => {
              const p = positions.get(n.id);
              if (!p) return null;
              const isCenter = n.id === nodes[0]?.id;
              return (
                <g key={n.id} transform={`translate(${p.x},${p.y})`}>
                  <circle
                    r={isCenter ? 28 : 22}
                    className={`mindmap-node ${isCenter ? 'center' : ''}`}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="mindmap-label"
                    dy="0.1em"
                  >
                    {n.label.length > 12 ? n.label.slice(0, 11) + '…' : n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </section>
  );
}

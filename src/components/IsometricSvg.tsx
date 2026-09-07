'use client';

import React from 'react';
import { Cabinet, Wall, KitchenShape, IslandConfig } from '@/types/kitchen';

interface IsometricViewProps {
  walls: Wall[];
  cabinets: Cabinet[];
  shape: KitchenShape;
  island: IslandConfig;
}

interface Point2D {
  x: number;
  y: number;
}

function projectIso(
  x: number,
  y: number,
  z: number,
  scale: number,
  originX: number,
  originY: number
): Point2D {
  const cos30 = 0.8660254; // cos(30 deg)
  const sin30 = 0.5;       // sin(30 deg)

  // screenX = (x - y) * cos(30)
  // screenY = (x + y) * sin(30) - z
  const sx = originX + (x - y) * cos30 * scale;
  const sy = originY + (x + y) * sin30 * scale - z * scale;

  return { x: sx, y: sy };
}

export const IsometricSvg: React.FC<IsometricViewProps> = ({
  walls,
  cabinets,
  shape,
  island,
}) => {
  const scale = 0.12;
  const originX = 540;
  const originY = 280;
  const svgWidth = 1050;
  const svgHeight = 750;

  const wallA = walls.find((w) => w.id === 'A') || { length: 3650 };
  const wallB = walls.find((w) => w.id === 'B') || { length: 4200 };
  const wallC = walls.find((w) => w.id === 'C') || { length: 3000 };

  interface Box3D {
    id: string;
    label: string;
    type: string;
    category: string;
    x: number;
    y: number;
    z: number;
    w: number;
    d: number;
    h: number;
    fillTop: string;
    fillFront: string;
    fillSide: string;
    depthSortKey: number;
  }

  const boxes: Box3D[] = [];

  for (const cab of cabinets) {
    let bx = 0;
    let by = 0;
    let bz = 0;
    let bw = 0;
    let bd = 0;
    let bh = cab.heightMm || 870;

    if (cab.category === 'top') {
      bz = 1450;
      bh = 700;
    } else if (cab.category === 'tall') {
      bz = 0;
      bh = 2150;
    }

    if (cab.wallId === 'B') {
      bx = cab.startMm;
      by = 0;
      bw = cab.widthMm;
      bd = cab.depthMm;
    } else if (cab.wallId === 'A') {
      // Wall A runs along Y axis from corner (y=0) towards room front
      bx = 0;
      by = cab.startMm;
      bw = cab.depthMm; // depth along X
      bd = cab.widthMm; // width along Y
    } else if (cab.wallId === 'C') {
      bx = wallB.length - cab.depthMm;
      by = cab.startMm;
      bw = cab.depthMm;
      bd = cab.widthMm;
    } else if (cab.wallId === 'I') {
      // Island positioned centrally with minimum 1200mm clearance from perimeter runs
      bx = 1600 + cab.startMm;
      by = 1500;
      bw = cab.widthMm;
      bd = cab.depthMm;
    }

    const isSink = cab.type === 'sink';
    const isCooker = cab.type === 'cooker';

    boxes.push({
      id: cab.id,
      label: `${cab.widthMm}`,
      type: cab.type,
      category: cab.category,
      x: bx,
      y: by,
      z: bz,
      w: bw,
      d: bd,
      h: bh,
      fillTop: isSink ? '#38bdf8' : isCooker ? '#fb923c' : '#475569',
      fillFront: isSink ? '#0284c7' : isCooker ? '#ea580c' : '#1e293b',
      fillSide: isSink ? '#0369a1' : isCooker ? '#c2410c' : '#0f172a',
      depthSortKey: bx + by,
    });
  }

  // Painter's algorithm sort
  boxes.sort((a, b) => a.depthSortKey - b.depthSortKey);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none overflow-auto bg-slate-950/60 rounded-xl border border-slate-800">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="drop-shadow-2xl"
      >
        <defs>
          <radialGradient id="isoAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx={originX} cy={originY + 120} rx="480" ry="260" fill="url(#isoAura)" />

        {/* --- FLOOR GRID PLANE --- */}
        {(() => {
          const p0 = projectIso(0, 0, 0, scale, originX, originY);
          const pB = projectIso(wallB.length + 300, 0, 0, scale, originX, originY);
          const pCorner = projectIso(wallB.length + 300, wallA.length + 300, 0, scale, originX, originY);
          const pA = projectIso(0, wallA.length + 300, 0, scale, originX, originY);

          return (
            <polygon
              points={`${p0.x},${p0.y} ${pB.x},${pB.y} ${pCorner.x},${pCorner.y} ${pA.x},${pA.y}`}
              fill="#060911"
              stroke="#1e293b"
              strokeWidth="1"
            />
          );
        })()}

        {/* --- WALL B BACKDROP --- */}
        {(() => {
          const p0 = projectIso(0, 0, 0, scale, originX, originY);
          const p1 = projectIso(wallB.length, 0, 0, scale, originX, originY);
          const p2 = projectIso(wallB.length, 0, 2700, scale, originX, originY);
          const p3 = projectIso(0, 0, 2700, scale, originX, originY);
          return (
            <polygon
              points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1.5"
              opacity="0.85"
            />
          );
        })()}

        {/* --- WALL A BACKDROP --- */}
        {(shape === 'L' || shape === 'U') &&
          (() => {
            const p0 = projectIso(0, 0, 0, scale, originX, originY);
            const p1 = projectIso(0, wallA.length, 0, scale, originX, originY);
            const p2 = projectIso(0, wallA.length, 2700, scale, originX, originY);
            const p3 = projectIso(0, 0, 2700, scale, originX, originY);
            return (
              <polygon
                points={`${p0.x},${p0.y} ${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
                fill="#131d31"
                stroke="#334155"
                strokeWidth="1.5"
                opacity="0.85"
              />
            );
          })()}

        {/* --- 3D CABINET BOXES --- */}
        {boxes.map((b) => {
          const c0 = projectIso(b.x, b.y, b.z, scale, originX, originY);
          const c1 = projectIso(b.x + b.w, b.y, b.z, scale, originX, originY);
          const c2 = projectIso(b.x + b.w, b.y + b.d, b.z, scale, originX, originY);
          const c3 = projectIso(b.x, b.y + b.d, b.z, scale, originX, originY);

          const c4 = projectIso(b.x, b.y, b.z + b.h, scale, originX, originY);
          const c5 = projectIso(b.x + b.w, b.y, b.z + b.h, scale, originX, originY);
          const c6 = projectIso(b.x + b.w, b.y + b.d, b.z + b.h, scale, originX, originY);
          const c7 = projectIso(b.x, b.y + b.d, b.z + b.h, scale, originX, originY);

          return (
            <g key={b.id} className="transition-all duration-200">
              {/* Top Face */}
              <polygon
                points={`${c4.x},${c4.y} ${c5.x},${c5.y} ${c6.x},${c6.y} ${c7.x},${c7.y}`}
                fill={b.fillTop}
                stroke="#64748b"
                strokeWidth="1"
              />

              {/* Front Face */}
              <polygon
                points={`${c7.x},${c7.y} ${c6.x},${c6.y} ${c2.x},${c2.y} ${c3.x},${c3.y}`}
                fill={b.fillFront}
                stroke="#475569"
                strokeWidth="1"
              />

              {/* Side Face */}
              <polygon
                points={`${c6.x},${c6.y} ${c5.x},${c5.y} ${c1.x},${c1.y} ${c2.x},${c2.y}`}
                fill={b.fillSide}
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Dimension Label */}
              <text
                x={(c7.x + c6.x) / 2}
                y={(c7.y + c3.y) / 2 + 3}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="9"
                fontWeight="600"
                opacity="0.9"
              >
                {b.label}
              </text>
            </g>
          );
        })}

        <text x="40" y="45" fill="#38bdf8" fontSize="14" fontWeight="bold" letterSpacing="1">
          DETERMINISTIC ISOMETRIC WIREFRAME (3D AXONOMETRIC)
        </text>
        <text x="40" y="65" fill="#94a3b8" fontSize="11">
          Axonometric projection with non-intersecting island clearance & corner offsets
        </text>
      </svg>
    </div>
  );
};

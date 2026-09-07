'use client';

import React from 'react';
import { Wall, Cabinet, KitchenShape, IslandConfig } from '@/types/kitchen';

interface PlanViewProps {
  walls: Wall[];
  cabinets: Cabinet[];
  shape: KitchenShape;
  island: IslandConfig;
  selectedCabinetId?: string | null;
  onSelectCabinet?: (cab: Cabinet | null) => void;
}

export const PlanViewSvg: React.FC<PlanViewProps> = ({
  walls,
  cabinets,
  shape,
  island,
  selectedCabinetId,
  onSelectCabinet,
}) => {
  const scale = 0.15;
  const padding = 70;

  const wallA = walls.find((w) => w.id === 'A') || { length: 3650, openings: [] };
  const wallB = walls.find((w) => w.id === 'B') || { length: 4200, openings: [] };
  const wallC = walls.find((w) => w.id === 'C') || { length: 3000, openings: [] };

  const svgWidth = Math.max(880, (wallB.length + 600) * scale + padding * 2);
  const svgHeight = Math.max(
    700,
    (Math.max(wallA.length, wallC.length) + (island.enabled ? island.depth + 1400 : 800)) * scale +
      padding * 2
  );

  // Corner origin: (bStartX, bStartY) is the corner intersection of Wall A and Wall B
  const bStartX = padding + 120;
  const bStartY = padding + 40;
  const bEndX = bStartX + wallB.length * scale;

  // Clear Island placement position away from perimeter wall cabinets:
  // Wall B depth is 600mm. Minimum aisle is 1000mm.
  // So Island Y starts at bStartY + (600 + 1100)*scale = bStartY + 1700*scale.
  // Wall A depth is 600mm. Minimum aisle is 1000mm.
  // So Island X starts at bStartX + (600 + 1100)*scale = bStartX + 1700*scale.
  const islandScreenX = bStartX + 1600 * scale;
  const islandScreenY = bStartY + 1500 * scale;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 select-none overflow-auto bg-slate-950/60 rounded-xl border border-slate-800">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="drop-shadow-xl"
      >
        <defs>
          <pattern id="plan-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.75" />
          </pattern>
          <linearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#plan-grid)" />

        <text x={padding} y={padding - 20} fill="#94a3b8" fontSize="13" fontWeight="600" letterSpacing="1">
          TOP-DOWN ARCHITECTURAL PLAN (2D)
        </text>

        {/* --- WALL B (Rear Wall) --- */}
        <g>
          <rect
            x={bStartX}
            y={bStartY - 24}
            width={wallB.length * scale}
            height={24}
            fill="url(#wallGrad)"
            stroke="#475569"
            strokeWidth="1.5"
            rx="2"
          />
          <text
            x={bStartX + (wallB.length * scale) / 2}
            y={bStartY - 32}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="12"
            fontWeight="bold"
          >
            WALL B — {wallB.length} mm
          </text>

          {wallB.openings.map((op) => {
            const opX = bStartX + op.distanceFromLeft * scale;
            const opW = op.width * scale;
            const isDoor = op.type === 'door';
            return (
              <g key={op.id}>
                <rect
                  x={opX}
                  y={bStartY - 24}
                  width={opW}
                  height={24}
                  fill={isDoor ? '#ef4444' : '#06b6d4'}
                  opacity="0.7"
                />
                <text
                  x={opX + opW / 2}
                  y={bStartY - 8}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {op.type.toUpperCase()} {op.width}
                </text>
              </g>
            );
          })}
        </g>

        {/* --- WALL A (Left Wall for L and U) --- */}
        {(shape === 'L' || shape === 'U') && (
          <g>
            <rect
              x={bStartX - 24}
              y={bStartY}
              width={24}
              height={wallA.length * scale}
              fill="url(#wallGrad)"
              stroke="#475569"
              strokeWidth="1.5"
              rx="2"
            />
            <text
              x={bStartX - 34}
              y={bStartY + (wallA.length * scale) / 2}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="12"
              fontWeight="bold"
              transform={`rotate(-90 ${bStartX - 34} ${bStartY + (wallA.length * scale) / 2})`}
            >
              WALL A — {wallA.length} mm
            </text>

            {wallA.openings.map((op) => {
              const opY = bStartY + op.distanceFromLeft * scale;
              const opH = op.width * scale;
              return (
                <rect
                  key={op.id}
                  x={bStartX - 24}
                  y={opY}
                  width={24}
                  height={opH}
                  fill={op.type === 'door' ? '#ef4444' : '#06b6d4'}
                  opacity="0.7"
                />
              );
            })}
          </g>
        )}

        {/* --- WALL C (Right Wall for U) --- */}
        {shape === 'U' && (
          <g>
            <rect
              x={bEndX}
              y={bStartY}
              width={24}
              height={wallC.length * scale}
              fill="url(#wallGrad)"
              stroke="#475569"
              strokeWidth="1.5"
              rx="2"
            />
            <text
              x={bEndX + 40}
              y={bStartY + (wallC.length * scale) / 2}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="12"
              fontWeight="bold"
              transform={`rotate(90 ${bEndX + 40} ${bStartY + (wallC.length * scale) / 2})`}
            >
              WALL C — {wallC.length} mm
            </text>

            {wallC.openings.map((op) => {
              const opY = bStartY + op.distanceFromLeft * scale;
              const opH = op.width * scale;
              return (
                <rect
                  key={op.id}
                  x={bEndX}
                  y={opY}
                  width={24}
                  height={opH}
                  fill={op.type === 'door' ? '#ef4444' : '#06b6d4'}
                  opacity="0.7"
                />
              );
            })}
          </g>
        )}

        {/* --- PLACED CABINET BOXES --- */}
        {cabinets
          .filter((c) => c.category === 'base' || c.category === 'tall')
          .map((cab) => {
            let cx = 0;
            let cy = 0;
            let cw = 0;
            let ch = 0;

            if (cab.wallId === 'B') {
              cx = bStartX + cab.startMm * scale;
              cy = bStartY;
              cw = cab.widthMm * scale;
              ch = cab.depthMm * scale;
            } else if (cab.wallId === 'A') {
              cx = bStartX;
              cy = bStartY + cab.startMm * scale;
              cw = cab.depthMm * scale;
              ch = cab.widthMm * scale;
            } else if (cab.wallId === 'C') {
              cw = cab.depthMm * scale;
              cx = bEndX - cw;
              cy = bStartY + cab.startMm * scale;
              ch = cab.widthMm * scale;
            } else if (cab.wallId === 'I') {
              // Non-colliding Island placement
              cx = islandScreenX + cab.startMm * scale;
              cy = islandScreenY;
              cw = cab.widthMm * scale;
              ch = cab.depthMm * scale;
            }

            const isSelected = selectedCabinetId === cab.id;
            const isSink = cab.type === 'sink';
            const isCooker = cab.type === 'cooker';
            const isTall = cab.category === 'tall';

            return (
              <g
                key={cab.id}
                onClick={() => onSelectCabinet?.(cab)}
                className="cursor-pointer transition-all duration-200"
              >
                <rect
                  x={cx}
                  y={cy}
                  width={cw}
                  height={ch}
                  fill={
                    isSelected
                      ? '#38bdf8'
                      : isSink
                      ? '#0284c7'
                      : isCooker
                      ? '#ea580c'
                      : isTall
                      ? '#475569'
                      : '#1e293b'
                  }
                  stroke={isSelected ? '#f0f9ff' : '#64748b'}
                  strokeWidth={isSelected ? '2' : '1'}
                  opacity={isSelected ? 0.95 : 0.85}
                  rx="2"
                />

                {isSink && (
                  <ellipse
                    cx={cx + cw / 2}
                    cy={cy + ch / 2}
                    rx={Math.max(4, cw * 0.35)}
                    ry={Math.max(4, ch * 0.3)}
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="1"
                  />
                )}

                {isCooker && (
                  <circle
                    cx={cx + cw / 2}
                    cy={cy + ch / 2}
                    r={Math.min(cw, ch) * 0.28}
                    fill="#7c2d12"
                    stroke="#f97316"
                    strokeWidth="1"
                  />
                )}

                <text
                  x={cx + cw / 2}
                  y={cy + ch / 2 + 3}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {cab.widthMm}
                </text>
              </g>
            );
          })}

        {/* --- ISLAND ENVELOPE (With proper aisle clearance) --- */}
        {island.enabled && (
          <g>
            <rect
              x={islandScreenX}
              y={islandScreenY - 6}
              width={island.length * scale}
              height={(island.depth + 12) * scale}
              fill="none"
              stroke="#0ea5e9"
              strokeDasharray="4 3"
              strokeWidth="1.5"
              rx="4"
            />
            <text
              x={islandScreenX + (island.length * scale) / 2}
              y={islandScreenY - 14}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="11"
              fontWeight="bold"
            >
              ISLAND {island.length} × {island.depth} mm
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Wall, Cabinet, KitchenShape, IslandConfig } from '@/types/kitchen';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

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
  const [zoom, setZoom] = useState<number>(1.0);

  const scale = 0.15;
  const paddingX = 80;
  const paddingTop = 90;
  const paddingBottom = 80;

  const wallA = walls.find((w) => w.id === 'A') || { length: 3650, openings: [] };
  const wallB = walls.find((w) => w.id === 'B') || { length: 4200, openings: [] };
  const wallC = walls.find((w) => w.id === 'C') || { length: 3000, openings: [] };

  const maxDepthMm = Math.max(
    wallA.length,
    wallC.length,
    island.enabled ? 1600 + island.depth + 1000 : 1200
  );

  const svgWidth = Math.max(880, wallB.length * scale + paddingX * 2 + 100);
  const svgHeight = Math.max(680, maxDepthMm * scale + paddingTop + paddingBottom);

  // Corner origin: (bStartX, bStartY) is the corner intersection of Wall A and Wall B
  const bStartX = paddingX + 70;
  const bStartY = paddingTop;
  const bEndX = bStartX + wallB.length * scale;

  // Clear Island placement position with at least 1100mm clearance from perimeter runs:
  const islandScreenX = bStartX + 1600 * scale;
  const islandScreenY = bStartY + 1600 * scale;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start p-4 select-none overflow-auto bg-slate-950/60 rounded-xl border border-slate-800">
      {/* Plan View Header & Zoom Toolbar */}
      <div className="w-full flex items-center justify-between px-3 py-2 mb-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-white">Architectural 2D Plan View</span>
          <span className="text-slate-500">|</span>
          <span className="text-sky-400 font-mono text-[11px]">
            {shape.toUpperCase()} Kitchen • Wall B: {wallB.length}mm
            {shape !== 'straight' ? ` • Wall A: ${wallA.length}mm` : ''}
            {shape === 'U' ? ` • Wall C: ${wallC.length}mm` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1.5 text-slate-400">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.1).toFixed(1))))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-sky-400 rounded border border-slate-700 ml-1"
            title="Fit to Window"
          >
            <RotateCcw className="w-3 h-3" /> Fit
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="w-full flex items-center justify-center overflow-auto py-2">
        <svg
          width={svgWidth * zoom}
          height={svgHeight * zoom}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="max-h-[72vh] w-auto max-w-full object-contain drop-shadow-xl transition-all duration-150"
        >
          <defs>
            <pattern id="plan-grid-new" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>
            <linearGradient id="wallGrad-new" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#plan-grid-new)" />

          {/* Top Title */}
          <text
            x={paddingX}
            y={35}
            fill="#94a3b8"
            fontSize="12"
            fontWeight="bold"
            letterSpacing="1"
          >
            FLOOR PLAN (TOP-DOWN) — ALL WALLS VISIBLE
          </text>

          {/* --- WALL B (Rear Wall) --- */}
          <g>
            <rect
              x={bStartX}
              y={bStartY - 24}
              width={wallB.length * scale}
              height={24}
              fill="url(#wallGrad-new)"
              stroke="#475569"
              strokeWidth="1.5"
              rx="2"
            />
            <text
              x={bStartX + (wallB.length * scale) / 2}
              y={bStartY - 34}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="12"
              fontWeight="bold"
            >
              WALL B — {wallB.length} mm (Rear)
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
                fill="url(#wallGrad-new)"
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
                WALL A — {wallA.length} mm (Left)
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
                fill="url(#wallGrad-new)"
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
                WALL C — {wallC.length} mm (Right)
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
    </div>
  );
};

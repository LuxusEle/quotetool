'use client';

import React, { useState } from 'react';
import { Wall, Cabinet, Opening } from '@/types/kitchen';
import { ArrowLeftRight, Eye, Layers } from 'lucide-react';

interface ElevationProps {
  wall: Wall;
  cabinets: Cabinet[];
  selectedCabinetId?: string | null;
  onSelectCabinet?: (cab: Cabinet | null) => void;
}

export const ElevationSvg: React.FC<ElevationProps> = ({
  wall,
  cabinets,
  selectedCabinetId,
  onSelectCabinet,
}) => {
  // Perspective flip:
  // For Wall A, internal perspective places corner with Wall B on the RIGHT, tall units on the LEFT.
  // For Wall B, internal perspective places corner with Wall A on the LEFT, Wall C on the RIGHT.
  // For Wall C, internal perspective places corner with Wall B on the LEFT, open room on the RIGHT.
  const isWallA = wall.id === 'A';
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const scale = 0.18; // mm to px
  const paddingX = 70;
  const paddingY = 65;

  const roomHeightMm = wall.height || 2700;
  const svgWidth = wall.length * scale + paddingX * 2;
  const svgHeight = roomHeightMm * scale + paddingY * 2;

  const floorY = paddingY + roomHeightMm * scale;
  const wallStartX = paddingX;

  // Filter cabinets on this wall
  const wallCabs = cabinets.filter((c) => c.wallId === wall.id);

  // Helper to calculate X coordinate based on perspective:
  // Invert X for Wall A by default so Corner B is on the right, matching Iso and Plan interior perspective!
  const invertX = isWallA ? !isFlipped : isFlipped;

  const getScreenX = (posMm: number, widthMm: number) => {
    if (invertX) {
      return wallStartX + (wall.length - posMm - widthMm) * scale;
    }
    return wallStartX + posMm * scale;
  };

  const getPerspectiveLabel = () => {
    if (wall.id === 'A') {
      return invertX
        ? 'Room Interior View [Left: Open Room / Tall Units ➔ Right: Corner with Wall B]'
        : 'Reverse Workshop View [Left: Corner with Wall B ➔ Right: Open Room / Tall Units]';
    } else if (wall.id === 'B') {
      return !invertX
        ? 'Room Interior View [Left: Corner Wall A ➔ Right: Wall C / Open End]'
        : 'Reverse Workshop View [Left: Wall C / Open End ➔ Right: Corner Wall A]';
    } else {
      return !invertX
        ? 'Room Interior View [Left: Corner Wall B ➔ Right: Open Room End]'
        : 'Reverse Workshop View [Left: Open Room End ➔ Right: Corner Wall B]';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start p-4 select-none overflow-auto bg-slate-950/60 rounded-xl border border-slate-800">
      {/* Perspective Toolbar */}
      <div className="w-full flex items-center justify-between px-3 py-2 mb-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-white">Wall {wall.id} Front Elevation</span>
          <span className="text-slate-500">|</span>
          <span className="text-sky-400 font-mono text-[11px]">{getPerspectiveLabel()}</span>
        </div>
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded border border-slate-700 transition"
          title="Toggle between Room Interior Perspective and Workshop Reverse View"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Flip Perspective ({isFlipped ? 'Custom' : 'Default'})</span>
        </button>
      </div>

      <div className="w-full flex items-center justify-center overflow-auto py-2">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="max-h-[72vh] w-auto max-w-full object-contain drop-shadow-xl"
        >
          <defs>
            <pattern id={`elev-grid-${wall.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            <linearGradient id={`glassGrad-${wall.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          <rect width="100%" height="100%" fill={`url(#elev-grid-${wall.id})`} />

          {/* Wall Frame Outline */}
          <rect
            x={wallStartX}
            y={paddingY}
            width={wall.length * scale}
            height={roomHeightMm * scale}
            fill="#090d16"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Top Dimension Line */}
          <g>
            <line
              x1={wallStartX}
              y1={paddingY - 20}
              x2={wallStartX + wall.length * scale}
              y2={paddingY - 20}
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <line
              x1={wallStartX}
              y1={paddingY - 26}
              x2={wallStartX}
              y2={paddingY - 14}
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <line
              x1={wallStartX + wall.length * scale}
              y1={paddingY - 26}
              x2={wallStartX + wall.length * scale}
              y2={paddingY - 14}
              stroke="#38bdf8"
              strokeWidth="1.5"
            />
            <text
              x={wallStartX + (wall.length * scale) / 2}
              y={paddingY - 26}
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="12"
              fontWeight="bold"
            >
              WALL {wall.id} — {wall.length} mm (H: {roomHeightMm} mm)
            </text>
          </g>

          {/* Floor Line */}
          <line
            x1={wallStartX - 20}
            y1={floorY}
            x2={wallStartX + wall.length * scale + 20}
            y2={floorY}
            stroke="#64748b"
            strokeWidth="3"
          />
          <text
            x={wallStartX - 30}
            y={floorY + 4}
            textAnchor="end"
            fill="#64748b"
            fontSize="10"
            fontWeight="bold"
          >
            FINISHED FLOOR (0 mm)
          </text>

          {/* Corner Clearance Marker if Wall A starts after Wall B depth (600mm) */}
          {wall.id === 'A' && (
            <g>
              {(() => {
                const cornerX = getScreenX(0, 600);
                return (
                  <>
                    <rect
                      x={cornerX}
                      y={paddingY}
                      width={600 * scale}
                      height={roomHeightMm * scale}
                      fill="#334155"
                      opacity="0.18"
                    />
                    <line
                      x1={invertX ? cornerX : cornerX + 600 * scale}
                      y1={paddingY}
                      x2={invertX ? cornerX : cornerX + 600 * scale}
                      y2={floorY}
                      stroke="#64748b"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={cornerX + 300 * scale}
                      y={paddingY + 80}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontWeight="600"
                    >
                      CORNER ZONE (WALL B)
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* --- OPENINGS (Windows / Doors) --- */}
          {wall.openings.map((op) => {
            const opX = getScreenX(op.distanceFromLeft, op.width);
            const opW = op.width * scale;
            const opH = op.height * scale;
            const sillY = floorY - op.sillHeight * scale;
            const opY = sillY - opH;
            const isWindow = op.type === 'window';

            return (
              <g key={op.id}>
                <rect
                  x={opX}
                  y={opY}
                  width={opW}
                  height={opH}
                  fill={isWindow ? `url(#glassGrad-${wall.id})` : '#0f172a'}
                  stroke={isWindow ? '#38bdf8' : '#ef4444'}
                  strokeWidth="1.5"
                  rx="2"
                />
                {isWindow && (
                  <>
                    <line
                      x1={opX + opW / 2}
                      y1={opY}
                      x2={opX + opW / 2}
                      y2={opY + opH}
                      stroke="#38bdf8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <line
                      x1={opX}
                      y1={opY + opH / 2}
                      x2={opX + opW}
                      y2={opY + opH / 2}
                      stroke="#38bdf8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  </>
                )}
                <text
                  x={opX + opW / 2}
                  y={opY + opH / 2 + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  className="drop-shadow"
                >
                  {op.type.toUpperCase()} ({op.width}×{op.height})
                </text>
              </g>
            );
          })}

          {/* --- CABINETS FRONT FACES --- */}
          {wallCabs.map((cab) => {
            const cabX = getScreenX(cab.startMm, cab.widthMm);
            const cabW = cab.widthMm * scale;
            const isSelected = selectedCabinetId === cab.id;

            let cabY = 0;
            let cabH = 0;

            if (cab.category === 'base') {
              cabH = (cab.heightMm || 870) * scale;
              cabY = floorY - cabH;
            } else if (cab.category === 'top') {
              cabH = (cab.heightMm || 700) * scale;
              cabY = floorY - 2150 * scale;
            } else if (cab.category === 'tall') {
              cabH = (cab.heightMm || 2150) * scale;
              cabY = floorY - cabH;
            }

            const isSink = cab.type === 'sink';
            const isCooker = cab.type === 'cooker';
            const isHood = cab.type === 'hood';
            const isDrawer = cab.type === 'drawer';

            return (
              <g
                key={cab.id}
                onClick={() => onSelectCabinet?.(cab)}
                className="cursor-pointer transition-all duration-150"
              >
                <rect
                  x={cabX}
                  y={cabY}
                  width={cabW}
                  height={cabH}
                  fill={
                    isSelected
                      ? '#0284c7'
                      : isSink
                      ? '#0369a1'
                      : isCooker
                      ? '#9a3412'
                      : isHood
                      ? '#475569'
                      : '#1e293b'
                  }
                  stroke={isSelected ? '#38bdf8' : '#475569'}
                  strokeWidth={isSelected ? '2' : '1'}
                  rx="2"
                />

                {cab.category === 'base' && (
                  <rect
                    x={cabX}
                    y={cabY}
                    width={cabW}
                    height={20 * scale}
                    fill="#0ea5e9"
                    opacity="0.8"
                  />
                )}

                {isDrawer && (
                  <>
                    <line
                      x1={cabX + 4}
                      y1={cabY + cabH * 0.3}
                      x2={cabX + cabW - 4}
                      y2={cabY + cabH * 0.3}
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    <line
                      x1={cabX + 4}
                      y1={cabY + cabH * 0.65}
                      x2={cabX + cabW - 4}
                      y2={cabY + cabH * 0.65}
                      stroke="#475569"
                      strokeWidth="1"
                    />
                  </>
                )}

                {!isHood && (
                  <line
                    x1={cabX + cabW / 2 - 12}
                    y1={cab.category === 'top' ? cabY + cabH - 12 : cabY + 16}
                    x2={cabX + cabW / 2 + 12}
                    y2={cab.category === 'top' ? cabY + cabH - 12 : cabY + 16}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                <text
                  x={cabX + cabW / 2}
                  y={cabY + cabH / 2}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {cab.widthMm}
                </text>
                <text
                  x={cabX + cabW / 2}
                  y={cabY + cabH / 2 + 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  className="pointer-events-none"
                >
                  {cab.type.toUpperCase().replace('_', ' ')}
                </text>
              </g>
            );
          })}

          {/* Countertop Datum Line */}
          <line
            x1={wallStartX}
            y1={floorY - 870 * scale}
            x2={wallStartX + wall.length * scale}
            y2={floorY - 870 * scale}
            stroke="#0ea5e9"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.6"
          />
          <text
            x={wallStartX + wall.length * scale + 6}
            y={floorY - 870 * scale + 3}
            fill="#0ea5e9"
            fontSize="9"
            fontWeight="600"
          >
            WORKTOP (+870mm)
          </text>
        </svg>
      </div>
    </div>
  );
};

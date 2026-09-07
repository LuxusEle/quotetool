'use client';

import React from 'react';
import { ProjectDetails, DesignOptions } from '@/types/kitchen';

interface SideProfileProps {
  project?: ProjectDetails;
  options?: DesignOptions;
  baseHeightMm?: number;
  ceilingHeightMm?: number;
}

export const SideProfileSvg: React.FC<SideProfileProps> = ({
  project,
  options,
  baseHeightMm = 870,
  ceilingHeightMm = 2743,
}) => {
  // Architectural Standard Datums in mm
  const baseDepthMm = 600; // 24"
  const wallDepthMm = 305; // 12"
  const topDepthMm = 430; // 17"
  const splashHeightMm = 600; // 24"
  const wallCabHeightMm = 850; // 33.5"
  const topCabHeightMm = 600; // 23.5"
  const toeKickHeightMm = 100; // 4"
  const toeKickRecessMm = 60; // 2.4"
  const countertopThicknessMm = 38; // 1.5"

  // Scale: 1mm = 0.16px
  const scale = 0.155;
  const paddingX = 85;
  const paddingTop = 45;
  const paddingBottom = 45;

  const totalHeightMm = Math.max(ceilingHeightMm, 2800);
  const svgWidth = 420;
  const svgHeight = totalHeightMm * scale + paddingTop + paddingBottom;

  const floorY = paddingTop + totalHeightMm * scale;
  const wallX = paddingX; // Wall surface line

  // Y positions
  const baseBoxHeightMm = baseHeightMm - toeKickHeightMm - countertopThicknessMm;
  const toeKickTopY = floorY - toeKickHeightMm * scale;
  const baseCabinetTopY = toeKickTopY - baseBoxHeightMm * scale;
  const countertopTopY = floorY - baseHeightMm * scale;

  const wallCabinetBottomY = countertopTopY - splashHeightMm * scale;
  const wallCabinetTopY = wallCabinetBottomY - wallCabHeightMm * scale;

  const topCabinetBottomY = wallCabinetTopY;
  const topCabinetTopY = topCabinetBottomY - topCabHeightMm * scale;

  const ceilingY = floorY - ceilingHeightMm * scale;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 select-none overflow-auto bg-slate-950/60 rounded-xl border border-slate-800">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-auto h-full max-h-[380px] drop-shadow-md"
      >
        <defs>
          {/* Wall Hatch Pattern */}
          <pattern id="wallHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1" />
          </pattern>
          {/* Granite Hatch Pattern */}
          <pattern id="graniteHatch" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#38bdf8" />
            <circle cx="5" cy="5" r="0.8" fill="#38bdf8" />
          </pattern>
        </defs>

        {/* --- REAR WALL STRUCTURE --- */}
        <rect
          x={wallX - 35}
          y={ceilingY - 20}
          width={35}
          height={floorY - ceilingY + 40}
          fill="url(#wallHatch)"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <line x1={wallX} y1={ceilingY - 20} x2={wallX} y2={floorY + 20} stroke="#94a3b8" strokeWidth="2.5" />

        {/* --- FLOOR LINE --- */}
        <line x1={wallX - 50} y1={floorY} x2={wallX + baseDepthMm * scale + 80} y2={floorY} stroke="#f8fafc" strokeWidth="3" />
        <text x={wallX + baseDepthMm * scale + 20} y={floorY + 22} fill="#64748b" fontSize="10" fontFamily="monospace" fontWeight="bold">
          FINISHED FLOOR (±0.00)
        </text>

        {/* --- CEILING LINE --- */}
        <line
          x1={wallX - 50}
          y1={ceilingY}
          x2={wallX + topDepthMm * scale + 80}
          y2={ceilingY}
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="5,4"
        />
        <text x={wallX + topDepthMm * scale + 20} y={ceilingY - 8} fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
          CEILING LEVEL (+{ceilingHeightMm}mm)
        </text>

        {/* --- TOE KICK / PLINTH --- */}
        <rect
          x={wallX}
          y={toeKickTopY}
          width={(baseDepthMm - toeKickRecessMm) * scale}
          height={toeKickHeightMm * scale}
          fill="#1e293b"
          stroke="#0284c7"
          strokeWidth="1.5"
        />
        <text
          x={wallX + 15}
          y={toeKickTopY + (toeKickHeightMm * scale) / 2 + 3}
          fill="#38bdf8"
          fontSize="9"
          fontFamily="monospace"
        >
          PLINTH 100mm
        </text>

        {/* --- BASE CABINET CARCASS (600mm / 24") --- */}
        <rect
          x={wallX}
          y={baseCabinetTopY}
          width={baseDepthMm * scale}
          height={baseBoxHeightMm * scale}
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        {/* Interior Shelves / Drawer Divisions */}
        <line
          x1={wallX}
          y1={baseCabinetTopY + (baseBoxHeightMm * scale) * 0.33}
          x2={wallX + baseDepthMm * scale}
          y2={baseCabinetTopY + (baseBoxHeightMm * scale) * 0.33}
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeDasharray="3,3"
        />
        <line
          x1={wallX}
          y1={baseCabinetTopY + (baseBoxHeightMm * scale) * 0.66}
          x2={wallX + baseDepthMm * scale}
          y2={baseCabinetTopY + (baseBoxHeightMm * scale) * 0.66}
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeDasharray="3,3"
        />
        {/* Front Door / Drawer Panel */}
        <rect
          x={wallX + baseDepthMm * scale - 4}
          y={baseCabinetTopY}
          width={4}
          height={baseBoxHeightMm * scale}
          fill="#0284c7"
        />
        <text
          x={wallX + (baseDepthMm * scale) / 2}
          y={baseCabinetTopY + (baseBoxHeightMm * scale) / 2}
          fill="#f8fafc"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          BASE 600mm (24&quot;)
        </text>

        {/* --- GRANITE / SOLID SURFACE COUNTERTOP (38mm) --- */}
        <rect
          x={wallX - 2}
          y={countertopTopY}
          width={(baseDepthMm + 25) * scale}
          height={countertopThicknessMm * scale}
          fill="#0369a1"
          stroke="#38bdf8"
          strokeWidth="1.5"
          rx="1"
        />
        <text
          x={wallX + (baseDepthMm * scale) / 2}
          y={countertopTopY - 6}
          fill="#38bdf8"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          GRANITE COUNTERTOP (+{baseHeightMm}mm)
        </text>

        {/* --- BACKSPLASH (600mm / 24") --- */}
        <line
          x1={wallX + 2}
          y1={countertopTopY}
          x2={wallX + 2}
          y2={wallCabinetBottomY}
          stroke="#f59e0b"
          strokeWidth="3"
        />
        <text
          x={wallX + 12}
          y={countertopTopY - (splashHeightMm * scale) / 2}
          fill="#fbbf24"
          fontSize="9"
          fontFamily="monospace"
        >
          SPLASHBACK 600mm (24&quot;)
        </text>

        {/* --- WALL CABINET (305mm / 12") --- */}
        <rect
          x={wallX}
          y={wallCabinetTopY}
          width={wallDepthMm * scale}
          height={wallCabHeightMm * scale}
          fill="#0f172a"
          stroke="#10b981"
          strokeWidth="2"
        />
        {/* Interior Shelf */}
        <line
          x1={wallX}
          y1={wallCabinetTopY + (wallCabHeightMm * scale) * 0.5}
          x2={wallX + wallDepthMm * scale}
          y2={wallCabinetTopY + (wallCabHeightMm * scale) * 0.5}
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeDasharray="3,3"
        />
        {/* Front Door */}
        <rect
          x={wallX + wallDepthMm * scale - 4}
          y={wallCabinetTopY}
          width={4}
          height={wallCabHeightMm * scale}
          fill="#059669"
        />
        <text
          x={wallX + (wallDepthMm * scale) / 2}
          y={wallCabinetTopY + (wallCabHeightMm * scale) / 2}
          fill="#f8fafc"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          WALL 305mm (12&quot;)
        </text>

        {/* --- HIGH SOFFIT / TOP CABINET (430mm / 17") --- */}
        <rect
          x={wallX}
          y={topCabinetTopY}
          width={topDepthMm * scale}
          height={topCabHeightMm * scale}
          fill="#0f172a"
          stroke="#a855f7"
          strokeWidth="2"
        />
        <rect
          x={wallX + topDepthMm * scale - 4}
          y={topCabinetTopY}
          width={4}
          height={topCabHeightMm * scale}
          fill="#7e22ce"
        />
        <text
          x={wallX + (topDepthMm * scale) / 2}
          y={topCabinetTopY + (topCabHeightMm * scale) / 2}
          fill="#f8fafc"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
          textAnchor="middle"
        >
          TOP SOFFIT 430mm (17&quot;)
        </text>

        {/* --- DEPTH DIMENSION TICKS (Horizontal Top) --- */}
        {/* Top Cabinet Depth (430mm) */}
        <line
          x1={wallX}
          y1={topCabinetTopY - 14}
          x2={wallX + topDepthMm * scale}
          y2={topCabinetTopY - 14}
          stroke="#a855f7"
          strokeWidth="1"
        />
        <line x1={wallX} y1={topCabinetTopY - 18} x2={wallX} y2={topCabinetTopY - 10} stroke="#a855f7" strokeWidth="1.5" />
        <line x1={wallX + topDepthMm * scale} y1={topCabinetTopY - 18} x2={wallX + topDepthMm * scale} y2={topCabinetTopY - 10} stroke="#a855f7" strokeWidth="1.5" />
        <text
          x={wallX + (topDepthMm * scale) / 2}
          y={topCabinetTopY - 18}
          fill="#c084fc"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="middle"
        >
          430mm (17&quot;)
        </text>

        {/* Wall Cabinet Depth (305mm) */}
        <line
          x1={wallX}
          y1={wallCabinetBottomY + 12}
          x2={wallX + wallDepthMm * scale}
          y2={wallCabinetBottomY + 12}
          stroke="#10b981"
          strokeWidth="1"
        />
        <line x1={wallX} y1={wallCabinetBottomY + 8} x2={wallX} y2={wallCabinetBottomY + 16} stroke="#10b981" strokeWidth="1.5" />
        <line x1={wallX + wallDepthMm * scale} y1={wallCabinetBottomY + 8} x2={wallX + wallDepthMm * scale} y2={wallCabinetBottomY + 16} stroke="#10b981" strokeWidth="1.5" />
        <text
          x={wallX + (wallDepthMm * scale) / 2}
          y={wallCabinetBottomY + 24}
          fill="#34d399"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="middle"
        >
          305mm (12&quot;)
        </text>

        {/* Base Depth (600mm) */}
        <line
          x1={wallX}
          y1={floorY + 14}
          x2={wallX + baseDepthMm * scale}
          y2={floorY + 14}
          stroke="#0284c7"
          strokeWidth="1"
        />
        <line x1={wallX} y1={floorY + 10} x2={wallX} y2={floorY + 18} stroke="#0284c7" strokeWidth="1.5" />
        <line x1={wallX + baseDepthMm * scale} y1={floorY + 10} x2={wallX + baseDepthMm * scale} y2={floorY + 18} stroke="#0284c7" strokeWidth="1.5" />
        <text
          x={wallX + (baseDepthMm * scale) / 2}
          y={floorY + 26}
          fill="#38bdf8"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="middle"
        >
          600mm (24&quot;)
        </text>

        {/* --- VERTICAL DATUM DIMENSION CHAIN (Left Side) --- */}
        <g transform={`translate(${wallX - 45}, 0)`}>
          {/* Base Countertop Datum Line */}
          <line x1={-10} y1={floorY} x2={-10} y2={countertopTopY} stroke="#94a3b8" strokeWidth="1" />
          <line x1={-15} y1={floorY} x2={-5} y2={floorY} stroke="#94a3b8" strokeWidth="1" />
          <line x1={-15} y1={countertopTopY} x2={-5} y2={countertopTopY} stroke="#94a3b8" strokeWidth="1" />
          <text
            x={-18}
            y={floorY - (floorY - countertopTopY) / 2 + 4}
            fill="#e2e8f0"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            {baseHeightMm}
          </text>

          {/* Splashback Height Line */}
          <line x1={-10} y1={countertopTopY} x2={-10} y2={wallCabinetBottomY} stroke="#fbbf24" strokeWidth="1" />
          <line x1={-15} y1={wallCabinetBottomY} x2={-5} y2={wallCabinetBottomY} stroke="#fbbf24" strokeWidth="1" />
          <text
            x={-18}
            y={countertopTopY - (countertopTopY - wallCabinetBottomY) / 2 + 4}
            fill="#fbbf24"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            {splashHeightMm}
          </text>

          {/* Wall Cabinet Height */}
          <line x1={-10} y1={wallCabinetBottomY} x2={-10} y2={wallCabinetTopY} stroke="#34d399" strokeWidth="1" />
          <line x1={-15} y1={wallCabinetTopY} x2={-5} y2={wallCabinetTopY} stroke="#34d399" strokeWidth="1" />
          <text
            x={-18}
            y={wallCabinetBottomY - (wallCabinetBottomY - wallCabinetTopY) / 2 + 4}
            fill="#34d399"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            {wallCabHeightMm}
          </text>

          {/* Top Soffit Height */}
          <line x1={-10} y1={topCabinetBottomY} x2={-10} y2={topCabinetTopY} stroke="#c084fc" strokeWidth="1" />
          <line x1={-15} y1={topCabinetTopY} x2={-5} y2={topCabinetTopY} stroke="#c084fc" strokeWidth="1" />
          <text
            x={-18}
            y={topCabinetBottomY - (topCabinetBottomY - topCabinetTopY) / 2 + 4}
            fill="#c084fc"
            fontSize="9"
            fontFamily="monospace"
            textAnchor="end"
          >
            {topCabHeightMm}
          </text>
        </g>
      </svg>
    </div>
  );
};

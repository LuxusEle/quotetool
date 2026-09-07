'use client';

import React, { useRef, useState } from 'react';
import { Wall, Cabinet, ProjectDetails, DesignOptions } from '@/types/kitchen';
import { Download, Printer, Eye, Layers, Maximize2, Ruler } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShopDrawingProps {
  walls: Wall[];
  cabinets: Cabinet[];
  project: ProjectDetails;
  options: DesignOptions;
}

export const ArchitecturalShopDrawing: React.FC<ShopDrawingProps> = ({
  walls,
  cabinets,
  project,
  options,
}) => {
  const drawingRef = useRef<HTMLDivElement>(null);
  const [selectedWallId, setSelectedWallId] = useState<'A' | 'B' | 'C'>('B');
  const [unitMode, setUnitMode] = useState<'inches' | 'mm'>('inches');
  const [isExporting, setIsExporting] = useState(false);

  const activeWall =
    walls.find((w) => w.id === selectedWallId) ||
    walls.find((w) => w.id === 'B') ||
    walls[0];

  const wallCabs = cabinets.filter((c) => c.wallId === activeWall.id);

  // Conversion helper: 1 inch = 25.4 mm
  const formatDim = (mm: number) => {
    if (unitMode === 'inches') {
      return (mm / 25.4).toFixed(2);
    }
    return Math.round(mm) + ' mm';
  };

  const handleDownloadImage = async () => {
    if (!drawingRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(drawingRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${project.refNumber}_Wall_${activeWall.id}_Architectural_Wire_Drawing.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to export image', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Dimensions of wall in mm
  const wallLengthMm = activeWall.length || 3600;
  const baseHeightMm = 870; // 34.00"
  const splashHeightMm = 600; // 24.00"
  const wallCabHeightMm = 850; // 34.00"
  const topCabHeightMm = 600; // 23.25"
  const totalHeightMm = baseHeightMm + splashHeightMm + wallCabHeightMm + topCabHeightMm; // ~2920mm / 118.75"

  // Base depth = 600mm (24"), Wall depth = 305mm (12"), Top depth = 430mm (17")
  const baseDepthMm = 600;
  const wallDepthMm = 305;
  const topDepthMm = 430;

  // Key appliance segments
  const sinkCab = wallCabs.find((c) => c.type === 'sink');
  const cookerCab = wallCabs.find((c) => c.type === 'cooker');
  const drawerCab = wallCabs.find((c) => c.type === 'drawer');

  // Segment widths
  const sinkStart = sinkCab ? sinkCab.startMm : 600;
  const sinkWidth = sinkCab ? sinkCab.widthMm : 900;

  const cookerStart = cookerCab ? cookerCab.startMm : 2400;
  const cookerWidth = cookerCab ? cookerCab.widthMm : 900;

  return (
    <div className="w-full space-y-4">
      {/* Control Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            Architectural Engineering Wire Drawings
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">
            {project.refNumber} • Wall {activeWall.id} ({formatDim(wallLengthMm)})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Wall Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['A', 'B', 'C'] as const).map((wId) => {
              const exists = walls.some((w) => w.id === wId);
              if (!exists && wId !== 'B') return null;
              return (
                <button
                  key={wId}
                  onClick={() => setSelectedWallId(wId)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    selectedWallId === wId
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wall {wId}
                </button>
              );
            })}
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setUnitMode('inches')}
              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition ${
                unitMode === 'inches' ? 'bg-amber-600 text-white' : 'text-slate-400'
              }`}
            >
              Inches (&quot;)
            </button>
            <button
              onClick={() => setUnitMode('mm')}
              className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition ${
                unitMode === 'mm' ? 'bg-amber-600 text-white' : 'text-slate-400'
              }`}
            >
              Millimeters (mm)
            </button>
          </div>

          {/* Download PNG */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Download CAD Drawing'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            title="Print Drawing"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Architectural Sheet (Exact CAD Wireframe Aesthetic) */}
      <div className="flex justify-center overflow-auto p-4 bg-slate-950/80 rounded-xl border border-slate-800">
        <div
          ref={drawingRef}
          className="w-[1020px] bg-white text-slate-900 p-8 shadow-2xl font-sans relative"
          style={{ boxSizing: 'border-box' }}
        >
          {/* Technical Sheet Double Border */}
          <div className="border-4 border-slate-900 p-4 relative">
            <div className="border border-slate-900 p-4">
              {/* Sheet Title Block */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-6">
                <div>
                  <h2 className="text-lg font-black tracking-widest text-slate-900 uppercase">
                    LUXUS ALUMINIUM KITCHEN SYSTEMS — SHOP FABRICATION DRAWING
                  </h2>
                  <p className="text-[11px] font-mono text-slate-600 uppercase">
                    Architectural Pantry Cupboard Details • Wall {activeWall.id}
                  </p>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-700 border-l border-slate-400 pl-4">
                  <p>
                    <span className="font-bold">PROJECT:</span> {project.customerName || 'Standard Client'}
                  </p>
                  <p>
                    <span className="font-bold">DRAWING NO:</span> {project.refNumber}-DWG-{activeWall.id}
                  </p>
                  <p>
                    <span className="font-bold">UNITS:</span> {unitMode.toUpperCase()} • 1:20 CAD SCALE
                  </p>
                </div>
              </div>

              {/* GRID: TOP ROW = FRONT ELEVATION + SIDE ELEVATION */}
              <div className="grid grid-cols-12 gap-6 items-start mb-8">
                {/* 1. FRONT ELEVATION (9 Columns) */}
                <div className="col-span-9 space-y-2">
                  <div className="relative border border-slate-300 p-3 bg-white">
                    {/* SVG FRONT ELEVATION */}
                    <svg
                      viewBox="0 0 760 520"
                      className="w-full h-auto"
                      style={{ maxHeight: '460px' }}
                    >
                      <defs>
                        {/* Backsplash Tile Grid Pattern */}
                        <pattern
                          id="tile-pattern"
                          width="24"
                          height="12"
                          patternUnits="userSpaceOnUse"
                        >
                          <rect width="24" height="12" fill="#fafafa" />
                          <path
                            d="M 24 0 L 0 0 0 12 M 12 12 L 12 24"
                            fill="none"
                            stroke="#cbd5e1"
                            strokeWidth="0.5"
                          />
                        </pattern>
                      </defs>

                      {/* --- HORIZONTAL DIMENSION LINE (TOP) --- */}
                      <g stroke="#2563eb" strokeWidth="1" fill="#2563eb">
                        {/* Overall Dimension */}
                        <line x1="80" y1="20" x2="720" y2="20" />
                        <path d="M 80 16 L 80 24 M 720 16 L 720 24" />
                        <path d="M 80 20 L 86 17 L 86 23 Z M 720 20 L 714 17 L 714 23 Z" />
                        <text
                          x="400"
                          y="15"
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {formatDim(wallLengthMm)}
                        </text>

                        {/* Segment Dimensions */}
                        <line x1="80" y1="36" x2="380" y2="36" />
                        <line x1="380" y1="36" x2="520" y2="36" />
                        <line x1="520" y1="36" x2="720" y2="36" />
                        <path d="M 80 32 L 80 40 M 380 32 L 380 40 M 520 32 L 520 40 M 720 32 L 720 40" />
                        <text
                          x="230"
                          y="32"
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(sinkStart + sinkWidth)}
                        </text>
                        <text
                          x="450"
                          y="32"
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(cookerWidth)}
                        </text>
                        <text
                          x="620"
                          y="32"
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(wallLengthMm - (cookerStart + cookerWidth))}
                        </text>
                      </g>

                      {/* --- VERTICAL DIMENSION LINES (LEFT) --- */}
                      <g stroke="#2563eb" strokeWidth="1" fill="#2563eb">
                        {/* Top Soffit Unit Height */}
                        <line x1="45" y1="50" x2="45" y2="120" />
                        <path d="M 41 50 L 49 50 M 41 120 L 49 120" />
                        <text
                          x="38"
                          y="88"
                          textAnchor="end"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(topCabHeightMm)}
                        </text>

                        {/* Wall Cabinet Height */}
                        <line x1="45" y1="125" x2="45" y2="245" />
                        <path d="M 41 125 L 49 125 M 41 245 L 49 245" />
                        <text
                          x="38"
                          y="188"
                          textAnchor="end"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(wallCabHeightMm)}
                        </text>

                        {/* Backsplash Gap Height */}
                        <line x1="45" y1="245" x2="45" y2="330" />
                        <path d="M 41 245 L 49 245 M 41 330 L 49 330" />
                        <text
                          x="38"
                          y="292"
                          textAnchor="end"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(splashHeightMm)}
                        </text>

                        {/* Base Cabinet Height */}
                        <line x1="45" y1="330" x2="45" y2="470" />
                        <path d="M 41 330 L 49 330 M 41 470 L 49 470" />
                        <text
                          x="38"
                          y="405"
                          textAnchor="end"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(baseHeightMm)}
                        </text>

                        {/* Total Height Dimension (Right side) */}
                        <line x1="740" y1="50" x2="740" y2="470" />
                        <path d="M 736 50 L 744 50 M 736 470 L 744 470" />
                        <text
                          x="748"
                          y="265"
                          textAnchor="start"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {formatDim(totalHeightMm)}
                        </text>
                      </g>

                      {/* --- BACKSPLASH TILE AREA --- */}
                      <rect
                        x="80"
                        y="245"
                        width="640"
                        height="85"
                        fill="url(#tile-pattern)"
                        stroke="#94a3b8"
                        strokeWidth="1"
                      />

                      {/* --- TOP HIGH SOFFIT CUPBOARDS (Upper Run) --- */}
                      <g stroke="#0f172a" strokeWidth="1.5" fill="#ffffff">
                        <rect x="80" y="50" width="640" height="70" />
                        {/* Divisions for 8 top cupboards */}
                        {[160, 240, 320, 400, 480, 560, 640].map((x) => (
                          <line key={x} x1={x} y1="50" x2={x} y2="120" />
                        ))}
                      </g>

                      {/* --- WALL / TOP STORAGE CUPBOARDS (Middle Run) --- */}
                      <g stroke="#0f172a" strokeWidth="1.5" fill="#ffffff">
                        {/* Upper Wall Modules (excluding hood) */}
                        <rect x="80" y="125" width="340" height="120" />
                        <line x1="165" y1="125" x2="165" y2="245" />
                        <line x1="250" y1="125" x2="250" y2="245" />
                        <line x1="335" y1="125" x2="335" y2="245" />

                        {/* Door Handles */}
                        {[160, 170, 330, 340].map((hx) => (
                          <line
                            key={hx}
                            x1={hx}
                            y1="220"
                            x2={hx}
                            y2="238"
                            stroke="#475569"
                            strokeWidth="2"
                          />
                        ))}

                        {/* Right upper cabinets */}
                        <rect x="520" y="125" width="200" height="120" />
                        <line x1="620" y1="125" x2="620" y2="245" />
                        <line x1="615" y1="220" x2="615" y2="238" stroke="#475569" strokeWidth="2" />
                        <line x1="625" y1="220" x2="625" y2="238" stroke="#475569" strokeWidth="2" />
                      </g>

                      {/* --- RANGE HOOD & CANOPY --- */}
                      <g stroke="#0f172a" strokeWidth="1.5" fill="#f8fafc">
                        {/* Hood Flue & Chimney */}
                        <rect x="445" y="125" width="50" height="60" fill="#e2e8f0" />
                        {/* Hood Pyramid Canopy */}
                        <path
                          d="M 445 185 L 425 215 L 515 215 L 495 185 Z"
                          fill="#cbd5e1"
                        />
                        <rect x="420" y="215" width="100" height="12" rx="2" fill="#94a3b8" />
                      </g>

                      {/* --- GOOSENECK FAUCET & SINK FIXTURE --- */}
                      <g stroke="#0284c7" strokeWidth="1.5" fill="none">
                        {/* Gooseneck Curved Tap */}
                        <path d="M 175 328 L 175 285 A 12 12 0 0 1 199 285 L 199 295" />
                        <circle cx="175" cy="328" r="3" fill="#0284c7" />
                        <line x1="170" y1="324" x2="180" y2="324" strokeWidth="2" />
                      </g>

                      {/* --- 4-BURNER HOB ON WORKTOP --- */}
                      <g stroke="#ea580c" strokeWidth="1.5" fill="#ea580c">
                        <line x1="430" y1="328" x2="510" y2="328" strokeWidth="3" />
                        {/* Burner grates */}
                        <circle cx="445" cy="326" r="4" fill="#c2410c" />
                        <circle cx="465" cy="326" r="3" fill="#c2410c" />
                        <circle cx="485" cy="326" r="4" fill="#c2410c" />
                        <circle cx="500" cy="326" r="3" fill="#c2410c" />
                      </g>

                      {/* --- SOLID COUNTERTOP LINE --- */}
                      <rect
                        x="78"
                        y="330"
                        width="644"
                        height="6"
                        fill="#1e293b"
                        stroke="#0f172a"
                        strokeWidth="1"
                      />

                      {/* --- BASE CABINETRY RUN (Bottom) --- */}
                      <g stroke="#0f172a" strokeWidth="1.5" fill="#ffffff">
                        <rect x="80" y="336" width="640" height="120" />

                        {/* Compartment 1: Double Door Sink Unit */}
                        <line x1="160" y1="336" x2="160" y2="456" />
                        <line x1="240" y1="336" x2="240" y2="456" />
                        <line x1="320" y1="336" x2="320" y2="456" />

                        {/* Compartment 2: Bottle Holder (Narrow 200mm) */}
                        <rect x="390" y="336" width="30" height="120" fill="#f8fafc" />
                        <text
                          x="405"
                          y="395"
                          textAnchor="middle"
                          fontSize="7"
                          fontWeight="bold"
                          fill="#0f172a"
                          transform="rotate(-90 405 395)"
                        >
                          BOTTLE HOLDER
                        </text>

                        {/* Compartment 3: 3-Tier Drawer Bank (Under Hob) */}
                        <rect x="420" y="336" width="100" height="120" fill="#ffffff" />
                        {/* Drawer 1: Cutlery Tray */}
                        <rect x="424" y="340" width="92" height="24" fill="#f1f5f9" />
                        <text
                          x="470"
                          y="355"
                          textAnchor="middle"
                          fontSize="7"
                          fontWeight="bold"
                          fill="#334155"
                        >
                          CUTLERY TRAY
                        </text>

                        {/* Drawer 2: Cup & Saucer Rack */}
                        <rect x="424" y="368" width="92" height="36" fill="#f1f5f9" />
                        <text
                          x="470"
                          y="390"
                          textAnchor="middle"
                          fontSize="7"
                          fontWeight="bold"
                          fill="#334155"
                        >
                          CUP & SAUCER RACK
                        </text>

                        {/* Drawer 3: Plate Rack */}
                        <rect x="424" y="408" width="92" height="44" fill="#f1f5f9" />
                        <text
                          x="470"
                          y="435"
                          textAnchor="middle"
                          fontSize="7"
                          fontWeight="bold"
                          fill="#334155"
                        >
                          PLATE RACK
                        </text>

                        {/* Compartment 4: Right Swing Door Units */}
                        <line x1="520" y1="336" x2="520" y2="456" />
                        <line x1="620" y1="336" x2="620" y2="456" />

                        {/* Handles on Base Doors */}
                        <line x1="155" y1="350" x2="155" y2="368" stroke="#475569" strokeWidth="2" />
                        <line x1="165" y1="350" x2="165" y2="368" stroke="#475569" strokeWidth="2" />
                        <line x1="235" y1="350" x2="235" y2="368" stroke="#475569" strokeWidth="2" />
                        <line x1="245" y1="350" x2="245" y2="368" stroke="#475569" strokeWidth="2" />
                        <line x1="615" y1="350" x2="615" y2="368" stroke="#475569" strokeWidth="2" />
                        <line x1="625" y1="350" x2="625" y2="368" stroke="#475569" strokeWidth="2" />
                      </g>

                      {/* --- TOE-KICK RECESSED PLINTH (Floor line) --- */}
                      <rect x="85" y="456" width="630" height="14" fill="#e2e8f0" stroke="#64748b" />
                      <line x1="60" y1="470" x2="740" y2="470" stroke="#0f172a" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="text-center font-bold text-xs tracking-wider text-slate-900 uppercase">
                    [PANTRY CUPBOARD 01 FRONT ELEVATION]
                  </p>
                </div>

                {/* 2. SIDE ELEVATION (3 Columns) */}
                <div className="col-span-3 space-y-2">
                  <div className="relative border border-slate-300 p-3 bg-white">
                    {/* SVG SIDE ELEVATION PROFILE */}
                    <svg
                      viewBox="0 0 220 520"
                      className="w-full h-auto"
                      style={{ maxHeight: '460px' }}
                    >
                      {/* Horizontal Depth Dimensions */}
                      <g stroke="#2563eb" strokeWidth="1" fill="#2563eb">
                        {/* Top Cabinet Depth (17") */}
                        <line x1="40" y1="30" x2="140" y2="30" />
                        <path d="M 40 26 L 40 34 M 140 26 L 140 34" />
                        <text
                          x="90"
                          y="24"
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(topDepthMm)}
                        </text>

                        {/* Base Cabinet Depth (24") */}
                        <line x1="40" y1="315" x2="175" y2="315" />
                        <path d="M 40 311 L 40 319 M 175 311 L 175 319" />
                        <text
                          x="108"
                          y="310"
                          textAnchor="middle"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {formatDim(baseDepthMm)}
                        </text>
                      </g>

                      {/* Wall Hatching on the left side of section */}
                      <line x1="40" y1="40" x2="40" y2="470" stroke="#0f172a" strokeWidth="2" />

                      {/* Top High Cupboard Section (Depth 17") */}
                      <rect
                        x="40"
                        y="50"
                        width="100"
                        height="70"
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />

                      {/* Wall Cupboard Section (Depth 12") */}
                      <rect
                        x="40"
                        y="125"
                        width="75"
                        height="120"
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      {/* Diagonal section hatch */}
                      <line x1="40" y1="125" x2="115" y2="245" stroke="#cbd5e1" strokeWidth="1" />
                      <line x1="40" y1="185" x2="100" y2="245" stroke="#cbd5e1" strokeWidth="1" />

                      {/* Backsplash Profile */}
                      <line x1="40" y1="245" x2="40" y2="330" stroke="#0284c7" strokeWidth="3" />

                      {/* Countertop Bullnose Overhang */}
                      <rect
                        x="38"
                        y="330"
                        width="142"
                        height="6"
                        fill="#1e293b"
                        stroke="#0f172a"
                        strokeWidth="1"
                        rx="1"
                      />

                      {/* Base Cabinet Carcass (Depth 24") */}
                      <rect
                        x="40"
                        y="336"
                        width="135"
                        height="120"
                        fill="#ffffff"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      {/* Diagonal section hatch */}
                      <line x1="40" y1="336" x2="175" y2="456" stroke="#cbd5e1" strokeWidth="1" />

                      {/* Toe-Kick Setback */}
                      <rect
                        x="40"
                        y="456"
                        width="115"
                        height="14"
                        fill="#e2e8f0"
                        stroke="#64748b"
                      />
                      <line x1="20" y1="470" x2="190" y2="470" stroke="#0f172a" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="text-center font-bold text-xs tracking-wider text-slate-900 uppercase">
                    [PANTRY CUPBOARD 01 SIDE ELEVATION]
                  </p>
                </div>
              </div>

              {/* BOTTOM ROW: PLAN (TOP) ELEVATION */}
              <div className="space-y-2">
                <div className="relative border border-slate-300 p-4 bg-white">
                  {/* SVG PLAN TOP ELEVATION */}
                  <svg
                    viewBox="0 0 920 180"
                    className="w-full h-auto"
                    style={{ maxHeight: '160px' }}
                  >
                    {/* Dimension lines */}
                    <g stroke="#2563eb" strokeWidth="1" fill="#2563eb">
                      {/* Overall Length Dimension */}
                      <line x1="90" y1="20" x2="830" y2="20" />
                      <path d="M 90 16 L 90 24 M 830 16 L 830 24" />
                      <text
                        x="460"
                        y="15"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {formatDim(wallLengthMm)}
                      </text>

                      {/* Depth Dimension (Left) */}
                      <line x1="60" y1="65" x2="60" y2="155" />
                      <path d="M 56 65 L 64 65 M 56 155 L 64 155" />
                      <text
                        x="50"
                        y="115"
                        textAnchor="end"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {formatDim(baseDepthMm)}
                      </text>
                    </g>

                    {/* --- WALL HATCHING SECTION --- */}
                    <g stroke="#94a3b8" strokeWidth="1">
                      <rect
                        x="90"
                        y="35"
                        width="740"
                        height="30"
                        fill="#f8fafc"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      {/* Diagonal Hatch lines */}
                      {Array.from({ length: 35 }).map((_, i) => (
                        <line
                          key={i}
                          x1={100 + i * 22}
                          y1="65"
                          x2={120 + i * 22}
                          y2="35"
                        />
                      ))}
                      <text
                        x="200"
                        y="54"
                        fill="#475569"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        WALL
                      </text>
                      <text
                        x="460"
                        y="54"
                        fill="#475569"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        WALL
                      </text>
                      <text
                        x="720"
                        y="54"
                        fill="#475569"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        WALL
                      </text>
                    </g>

                    {/* --- WALL CABINET DASHED OVERHEAD PROJECTION --- */}
                    <rect
                      x="90"
                      y="65"
                      width="740"
                      height="40"
                      fill="#e2e8f0"
                      opacity="0.4"
                      stroke="#475569"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />
                    <text
                      x="350"
                      y="90"
                      fill="#334155"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      WALL CABINET OVERHEAD
                    </text>

                    {/* --- BASE COUNTERTOP OUTLINE --- */}
                    <rect
                      x="90"
                      y="65"
                      width="740"
                      height="90"
                      fill="#ffffff"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />

                    {/* --- DOUBLE BOWL SINK CUTOUT --- */}
                    <g stroke="#0284c7" strokeWidth="1.5" fill="#f0f9ff">
                      <rect x="110" y="75" width="160" height="70" rx="4" />
                      {/* Left bowl */}
                      <rect x="118" y="82" width="68" height="56" rx="6" fill="#ffffff" />
                      <circle cx="152" cy="110" r="5" fill="#0284c7" />
                      {/* Right bowl */}
                      <rect x="194" y="82" width="68" height="56" rx="6" fill="#ffffff" />
                      <circle cx="228" cy="110" r="5" fill="#0284c7" />
                      {/* Mixer faucet position */}
                      <circle cx="186" cy="78" r="4" fill="#0284c7" />
                    </g>

                    {/* --- 4-BURNER HOB ON PLAN --- */}
                    <g stroke="#ea580c" strokeWidth="1.5">
                      <rect x="440" y="65" width="120" height="90" fill="#0f172a" rx="3" />
                      <text
                        x="500"
                        y="82"
                        textAnchor="middle"
                        fontSize="8"
                        fontWeight="bold"
                        fill="#ffffff"
                        fontFamily="monospace"
                      >
                        BURNER
                      </text>
                      {/* 4 Burner grates */}
                      <circle cx="465" cy="100" r="10" fill="none" stroke="#ea580c" />
                      <circle cx="535" cy="100" r="10" fill="none" stroke="#ea580c" />
                      <circle cx="465" cy="130" r="12" fill="none" stroke="#ea580c" />
                      <circle cx="535" cy="130" r="8" fill="none" stroke="#ea580c" />
                      {/* 4 Control knobs */}
                      <circle cx="465" cy="148" r="2.5" fill="#ffffff" />
                      <circle cx="488" cy="148" r="2.5" fill="#ffffff" />
                      <circle cx="512" cy="148" r="2.5" fill="#ffffff" />
                      <circle cx="535" cy="148" r="2.5" fill="#ffffff" />
                    </g>

                    <text
                      x="660"
                      y="115"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#475569"
                      fontFamily="monospace"
                    >
                      BASE CABINET RUN
                    </text>
                  </svg>
                </div>
                <p className="text-center font-bold text-xs tracking-wider text-slate-900 uppercase">
                  [PANTRY CUPBOARD 01 PLAN (TOP) ELEVATION]
                </p>
              </div>

              {/* Drawing Sign-Off Footer */}
              <div className="mt-8 pt-3 border-t-2 border-slate-900 flex justify-between items-center text-[10px] font-mono text-slate-600">
                <div>
                  <p>
                    <span className="font-bold">LUXUS ELEMENTE (PVT) LTD</span> • Engineering & Fabrication Division
                  </p>
                  <p>Checked by: Architectural Tech Lead • Approved for CNC Carcass Cutting</p>
                </div>
                <div className="text-right">
                  <p>DATE SIGNED: {new Date().toLocaleDateString('en-GB')}</p>
                  <p>SHEET 01 OF 01 • REV {project.revision}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

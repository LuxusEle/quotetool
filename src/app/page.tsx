'use client';

import React, { useState, useMemo } from 'react';
import {
  ProjectDetails,
  Wall,
  WallId,
  Opening,
  KitchenShape,
  DesignOptions,
  Cabinet,
  PricingSettings,
  DesignWarning,
} from '@/types/kitchen';
import { generateKitchenLayout } from '@/lib/layoutEngine';
import { calculatePricing, DEFAULT_PRICING_SETTINGS } from '@/lib/pricingEngine';

import { PlanViewSvg } from '@/components/PlanViewSvg';
import { ElevationSvg } from '@/components/ElevationSvg';
import { IsometricSvg } from '@/components/IsometricSvg';
import { QuoteDocument } from '@/components/QuoteDocument';
import { FabricationSheet } from '@/components/FabricationSheet';
import { CabinetInspector } from '@/components/CabinetInspector';
import { OwnerSettingsModal } from '@/components/OwnerSettingsModal';

import {
  Layers,
  Wand2,
  FileText,
  Hammer,
  Shield,
  Plus,
  Trash2,
  AlertTriangle,
  Info,
  Building,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function KitchenQuoterApp() {
  // --- 1. PROJECT STATE ---
  const [project, setProject] = useState<ProjectDetails>({
    id: 'proj-1',
    refNumber: 'QT-2026-0184',
    revision: 0,
    customerName: 'Mr. Perera',
    mobile: '0771234567',
    location: 'Malabe, Colombo',
    wallHeight: 2700,
    notes: 'Matte black anodized aluminium, feature island with seating overhang.',
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // --- 2. WALLS & OPENINGS STATE ---
  const [walls, setWalls] = useState<Wall[]>([
    {
      id: 'A',
      name: 'Left Wall',
      length: 3650,
      height: 2700,
      openings: [],
    },
    {
      id: 'B',
      name: 'Rear / Main Wall',
      length: 4200,
      height: 2700,
      openings: [
        {
          id: 'op-win-1',
          wallId: 'B',
          type: 'window',
          distanceFromLeft: 1200,
          width: 1500,
          height: 1200,
          sillHeight: 1050, // above countertop height (870mm), allows base sink!
        },
      ],
    },
    {
      id: 'C',
      name: 'Right Wall',
      length: 3000,
      height: 2700,
      openings: [
        {
          id: 'op-door-1',
          wallId: 'C',
          type: 'door',
          distanceFromLeft: 1800,
          width: 900,
          height: 2100,
          sillHeight: 0,
        },
      ],
    },
  ]);

  // --- 3. DESIGN OPTIONS STATE ---
  const [options, setOptions] = useState<DesignOptions>({
    shape: 'L',
    sink: true,
    sinkWall: 'auto',
    cooker: true,
    cookerWidth: 900,
    hood: true,
    refrigerator: 'enclosed',
    refrigeratorWidth: 900,
    tallPantry: '600',
    tallPantryWidth: 600,
    island: {
      enabled: true,
      length: 1800,
      depth: 900,
      hasSink: false,
      hasCooker: false,
      seatingOverhang: true,
      roomOpposingDimension: 3800,
    },
    topCabinets: true,
    granite: true,
    electricalPlumbing: true,
    finish: 'Matte Black Anodized Aluminium',
  });

  // --- 4. CONFIDENTIAL PRICING SETTINGS & OWNER ROLE ---
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>(DEFAULT_PRICING_SETTINGS);
  const [isOwnerRole, setIsOwnerRole] = useState<boolean>(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);

  // --- 5. WORKSPACE TABS & SELECTION ---
  type TabType = 'plan' | 'elevationA' | 'elevationB' | 'elevationC' | 'isometric' | 'quote' | 'fabrication';
  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);

  // --- 6. CABINET LAYOUT GENERATION & EDITING ---
  const [cabinets, setCabinets] = useState<Cabinet[]>(() => {
    const { cabinets: generated } = generateKitchenLayout(walls, options);
    return generated;
  });

  const [warnings, setWarnings] = useState<DesignWarning[]>([]);

  // Trigger deterministic auto-design
  const handleAutoDesign = () => {
    const { cabinets: newCabs, warnings: newWarns } = generateKitchenLayout(
      walls,
      options,
      cabinets // passes locked units to preserve
    );
    setCabinets(newCabs);
    setWarnings(newWarns);
    setSelectedCabinet(null);
  };

  // Pricing strictly derived from geometry
  const pricing = useMemo(() => {
    return calculatePricing(cabinets, walls, options, pricingSettings);
  }, [cabinets, walls, options, pricingSettings]);

  // Update a single wall length
  const updateWallLength = (wallId: WallId, newLength: number) => {
    setWalls((prev) =>
      prev.map((w) => (w.id === wallId ? { ...w, length: Math.max(600, newLength) } : w))
    );
  };

  // Add opening to wall
  const addOpeningToWall = (wallId: WallId) => {
    const newOpening: Opening = {
      id: `op-${Date.now()}`,
      wallId,
      type: 'window',
      distanceFromLeft: 600,
      width: 1200,
      height: 1100,
      sillHeight: 1050,
    };
    setWalls((prev) =>
      prev.map((w) => (w.id === wallId ? { ...w, openings: [...w.openings, newOpening] } : w))
    );
  };

  // Delete opening
  const removeOpening = (wallId: WallId, opId: string) => {
    setWalls((prev) =>
      prev.map((w) =>
        w.id === wallId ? { ...w, openings: w.openings.filter((o) => o.id !== opId) } : w
      )
    );
  };

  // Update opening property
  const updateOpening = (wallId: WallId, opId: string, updates: Partial<Opening>) => {
    setWalls((prev) =>
      prev.map((w) =>
        w.id === wallId
          ? {
              ...w,
              openings: w.openings.map((o) => (o.id === opId ? { ...o, ...updates } : o)),
            }
          : w
      )
    );
  };

  // Cabinet Inspector Actions
  const handleUpdateCabinet = (updated: Cabinet) => {
    setCabinets((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCabinet(updated);
  };

  const handleDeleteCabinet = (id: string) => {
    setCabinets((prev) => prev.filter((c) => c.id !== id));
    setSelectedCabinet(null);
  };

  // Unlock Owner Role with PIN
  const handleUnlockOwner = (pin: string) => {
    if (pin === '1234' || pin === 'luxus') {
      setIsOwnerRole(true);
      return true;
    }
    return false;
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* --- TOP BRANDING & STATUS HEADER --- */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6 text-sky-400" />
            <div>
              <h1 className="text-base font-black tracking-wider uppercase">
                LUXUS <span className="text-sky-400 font-light">ELEMENTE</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Aluminium Kitchen Quote Designer
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-2" />

          {/* Quick Ref badge */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-800 text-sky-300 rounded border border-slate-700">
              {project.refNumber} R{project.revision}
            </span>
            <span className="text-xs text-slate-300 font-medium">{project.customerName}</span>
            <span className="text-[11px] text-slate-500">({project.location})</span>
          </div>
        </div>

        {/* Right Header Action Items */}
        <div className="flex items-center gap-3">
          {/* Warnings Pill */}
          {warnings.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{warnings.length} Geometry Warning(s)</span>
            </div>
          )}

          {/* Owner / Assistant Role Switcher */}
          <button
            onClick={() => setIsOwnerModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isOwnerRole
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {isOwnerRole ? 'Owner Mode (Unlocked)' : 'Assistant Mode'}
          </button>

          {/* Auto Layout Engine Trigger */}
          <button
            onClick={handleAutoDesign}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs font-bold rounded-lg shadow-lg shadow-sky-600/20 transition"
          >
            <Wand2 className="w-3.5 h-3.5" /> Auto Design
          </button>
        </div>
      </header>

      {/* --- MAIN WORKSPACE SPLIT --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR CONTROLS: Project, Room, Openings, Options */}
        <aside className="w-96 shrink-0 bg-slate-900/60 border-r border-slate-800 flex flex-col h-full overflow-hidden">
          {/* Scrollable Form Parameters */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* 1. PROJECT SPECIFICATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  1. Project & Client
                </h3>
                <span className="text-[10px] text-slate-500">K-Spec</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={project.customerName}
                    onChange={(e) => setProject({ ...project, customerName: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Mobile</label>
                  <input
                    type="text"
                    value={project.mobile}
                    onChange={(e) => setProject({ ...project, mobile: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Location</label>
                  <input
                    type="text"
                    value={project.location}
                    onChange={(e) => setProject({ ...project, location: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kitchen Shape</label>
                  <select
                    value={options.shape}
                    onChange={(e) => {
                      const shape = e.target.value as KitchenShape;
                      setOptions({ ...options, shape });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="straight">Straight Run</option>
                    <option value="L">L-Shape</option>
                    <option value="U">U-Shape</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Wall Height (mm)</label>
                  <input
                    type="number"
                    value={project.wallHeight}
                    onChange={(e) => setProject({ ...project, wallHeight: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. WALLS & OPENINGS MEASUREMENTS */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  2. Wall Dimensions (mm)
                </h3>
              </div>

              {/* Wall B (Always present) */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Wall B (Rear Wall)</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={walls.find((w) => w.id === 'B')?.length || 4200}
                      onChange={(e) => updateWallLength('B', Number(e.target.value))}
                      className="w-20 px-2 py-1 text-right bg-slate-900 border border-slate-700 rounded text-xs font-mono text-sky-400"
                    />
                    <span className="text-[10px] text-slate-500">mm</span>
                  </div>
                </div>

                {/* Wall B Openings */}
                <div className="space-y-1.5 pt-1">
                  {walls
                    .find((w) => w.id === 'B')
                    ?.openings.map((op) => (
                      <div
                        key={op.id}
                        className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg text-[11px] space-y-1"
                      >
                        <div className="flex justify-between items-center font-semibold text-slate-300">
                          <span className="uppercase text-sky-400">{op.type}</span>
                          <button
                            onClick={() => removeOpening('B', op.id)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-slate-400">
                          <div>
                            Start: {op.distanceFromLeft}mm
                          </div>
                          <div>
                            Width: {op.width}mm
                          </div>
                          <div>
                            Sill: {op.sillHeight}mm
                          </div>
                          <div>
                            Height: {op.height}mm
                          </div>
                        </div>
                      </div>
                    ))}
                  <button
                    onClick={() => addOpeningToWall('B')}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg border border-dashed border-slate-700 transition"
                  >
                    <Plus className="w-3 h-3" /> Add Opening (Window/Door)
                  </button>
                </div>
              </div>

              {/* Wall A (For L and U) */}
              {(options.shape === 'L' || options.shape === 'U') && (
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Wall A (Left Wall)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={walls.find((w) => w.id === 'A')?.length || 3650}
                        onChange={(e) => updateWallLength('A', Number(e.target.value))}
                        className="w-20 px-2 py-1 text-right bg-slate-900 border border-slate-700 rounded text-xs font-mono text-sky-400"
                      />
                      <span className="text-[10px] text-slate-500">mm</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addOpeningToWall('A')}
                    className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded border border-dashed border-slate-700"
                  >
                    <Plus className="w-3 h-3" /> Add Opening
                  </button>
                </div>
              )}

              {/* Wall C (For U) */}
              {options.shape === 'U' && (
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Wall C (Right Wall)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={walls.find((w) => w.id === 'C')?.length || 3000}
                        onChange={(e) => updateWallLength('C', Number(e.target.value))}
                        className="w-20 px-2 py-1 text-right bg-slate-900 border border-slate-700 rounded text-xs font-mono text-sky-400"
                      />
                      <span className="text-[10px] text-slate-500">mm</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addOpeningToWall('C')}
                    className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded border border-dashed border-slate-700"
                  >
                    <Plus className="w-3 h-3" /> Add Opening
                  </button>
                </div>
              )}
            </div>

            {/* 3. DESIGN OPTIONS & APPLIANCES */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                3. Design Options & Inclusions
              </h3>

              <div className="space-y-2 text-xs">
                {/* Finish Picker */}
                <div>
                  <label className="text-slate-400 block mb-1">Aluminium Finish</label>
                  <select
                    value={options.finish}
                    onChange={(e) => setOptions({ ...options, finish: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="Matte Black Anodized Aluminium">Matte Black Anodized</option>
                    <option value="Champagne Gold Aluminium">Champagne Gold</option>
                    <option value="Dark Bronze Architectural">Dark Bronze Architectural</option>
                    <option value="Pure White Powder Coated">Pure White Powder Coated</option>
                  </select>
                </div>

                {/* Toggle cards */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.topCabinets}
                      onChange={(e) => setOptions({ ...options, topCabinets: e.target.checked })}
                      className="rounded accent-sky-500"
                    />
                    <span className="text-slate-300">Top Wall Units</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.granite}
                      onChange={(e) => setOptions({ ...options, granite: e.target.checked })}
                      className="rounded accent-sky-500"
                    />
                    <span className="text-slate-300">Granite Worktop</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.electricalPlumbing}
                      onChange={(e) =>
                        setOptions({ ...options, electricalPlumbing: e.target.checked })
                      }
                      className="rounded accent-sky-500"
                    />
                    <span className="text-slate-300">Wiring/Plumbing</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.island.enabled}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          island: { ...options.island, enabled: e.target.checked },
                        })
                      }
                      className="rounded accent-sky-500"
                    />
                    <span className="text-slate-300">Centre Island</span>
                  </label>
                </div>

                {/* Refrigerator & Tall Options */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Refrigerator</label>
                    <select
                      value={options.refrigerator}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          refrigerator: e.target.value as 'none' | 'freestanding' | 'enclosed',
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs"
                    >
                      <option value="none">None</option>
                      <option value="enclosed">Enclosed Housing</option>
                      <option value="freestanding">Freestanding</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Tall Pantry</label>
                    <select
                      value={options.tallPantry}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          tallPantry: e.target.value as 'none' | '600' | '900' | 'custom',
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs"
                    >
                      <option value="none">None</option>
                      <option value="600">600 mm Unit</option>
                      <option value="900">900 mm Unit</option>
                    </select>
                  </div>
                </div>

                {/* Island Parameters if enabled */}
                {options.island.enabled && (
                  <div className="p-3 bg-sky-950/20 border border-sky-900/40 rounded-xl space-y-2 mt-2">
                    <span className="text-xs font-bold text-sky-300 block">Island Geometry</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block">Length (mm)</label>
                        <input
                          type="number"
                          value={options.island.length}
                          onChange={(e) =>
                            setOptions({
                              ...options,
                              island: { ...options.island, length: Number(e.target.value) },
                            })
                          }
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Depth (mm)</label>
                        <input
                          type="number"
                          value={options.island.depth}
                          onChange={(e) =>
                            setOptions({
                              ...options,
                              island: { ...options.island, depth: Number(e.target.value) },
                            })
                          }
                          className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cabinet Inspector Panel if Cabinet Selected */}
            {selectedCabinet && (
              <CabinetInspector
                cabinet={selectedCabinet}
                onClose={() => setSelectedCabinet(null)}
                onUpdateCabinet={handleUpdateCabinet}
                onDeleteCabinet={handleDeleteCabinet}
              />
            )}
          </div>

          {/* Quick Pricing Summary Footer in Sidebar */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Linear Foot Summary:</span>
              <span className="font-mono text-slate-200">
                {pricing.baseLF}B / {pricing.topLF}T / {pricing.tallLF}Tall
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Customer Price:
              </span>
              <span className="text-lg font-black text-sky-400">
                LKR {pricing.customerPrice.grandTotal.toLocaleString()}
              </span>
            </div>

            {/* OWNER CONFIDENTIAL PREVIEW */}
            {isOwnerRole && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300 flex justify-between">
                <span>Fabricator Cost: LKR {pricing.fabricatorCost.totalCost.toLocaleString()}</span>
                <span>Margin: {pricing.marginPercent}%</span>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT MAIN VISUALIZATION & OUTPUT CANVAS */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
          {/* Navigation Tabs Bar */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('plan')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'plan'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Plan View (2D)
              </button>

              <button
                onClick={() => setActiveTab('elevationB')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'elevationB'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Wall B Elevation
              </button>

              {(options.shape === 'L' || options.shape === 'U') && (
                <button
                  onClick={() => setActiveTab('elevationA')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'elevationA'
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Wall A Elevation
                </button>
              )}

              {options.shape === 'U' && (
                <button
                  onClick={() => setActiveTab('elevationC')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'elevationC'
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Wall C Elevation
                </button>
              )}

              <button
                onClick={() => setActiveTab('isometric')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'isometric'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                3D Isometric Wireframe
              </button>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => setActiveTab('quote')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'quote'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-emerald-400 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Customer Quote (PDF)
              </button>

              <button
                onClick={() => setActiveTab('fabrication')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'fabrication'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" /> Fabrication Sheet
              </button>
            </div>
          </div>

          {/* Canvas Rendering Zone */}
          <div className="flex-1 overflow-auto p-6 flex flex-col justify-center items-center">
            {activeTab === 'plan' && (
              <PlanViewSvg
                walls={walls}
                cabinets={cabinets}
                shape={options.shape}
                island={options.island}
                selectedCabinetId={selectedCabinet?.id}
                onSelectCabinet={setSelectedCabinet}
              />
            )}

            {activeTab === 'elevationB' && (
              <ElevationSvg
                wall={walls.find((w) => w.id === 'B')!}
                cabinets={cabinets}
                selectedCabinetId={selectedCabinet?.id}
                onSelectCabinet={setSelectedCabinet}
              />
            )}

            {activeTab === 'elevationA' && (
              <ElevationSvg
                wall={walls.find((w) => w.id === 'A')!}
                cabinets={cabinets}
                selectedCabinetId={selectedCabinet?.id}
                onSelectCabinet={setSelectedCabinet}
              />
            )}

            {activeTab === 'elevationC' && (
              <ElevationSvg
                wall={walls.find((w) => w.id === 'C')!}
                cabinets={cabinets}
                selectedCabinetId={selectedCabinet?.id}
                onSelectCabinet={setSelectedCabinet}
              />
            )}

            {activeTab === 'isometric' && (
              <IsometricSvg
                walls={walls}
                cabinets={cabinets}
                shape={options.shape}
                island={options.island}
              />
            )}

            {activeTab === 'quote' && (
              <div className="w-full h-full overflow-y-auto">
                <QuoteDocument
                  project={project}
                  pricing={pricing}
                  options={options}
                  cabinets={cabinets}
                  walls={walls}
                  settings={pricingSettings}
                  isOwnerRole={isOwnerRole}
                />
              </div>
            )}

            {activeTab === 'fabrication' && (
              <div className="w-full h-full overflow-y-auto">
                <FabricationSheet
                  project={project}
                  cabinets={cabinets}
                  walls={walls}
                  pricing={pricing}
                  options={options}
                  isOwnerRole={isOwnerRole}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- CONFIDENTIAL OWNER SETTINGS MODAL --- */}
      <OwnerSettingsModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        settings={pricingSettings}
        onSaveSettings={setPricingSettings}
        isOwnerUnlocked={isOwnerRole}
        onUnlockOwner={handleUnlockOwner}
      />
    </div>
  );
}

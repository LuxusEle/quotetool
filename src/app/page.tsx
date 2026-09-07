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
  BOMItem,
} from '@/types/kitchen';
import { generateKitchenLayout } from '@/lib/layoutEngine';
import { calculatePricing, DEFAULT_PRICING_SETTINGS } from '@/lib/pricingEngine';

import { PlanViewSvg } from '@/components/PlanViewSvg';
import { ElevationSvg } from '@/components/ElevationSvg';
import { IsometricSvg } from '@/components/IsometricSvg';
import { SideProfileSvg } from '@/components/SideProfileSvg';
import { ArchitecturalShopDrawing } from '@/components/ArchitecturalShopDrawing';
import { EditableBOMTable } from '@/components/EditableBOMTable';
import { ContractorQuoteDocument } from '@/components/ContractorQuoteDocument';
import { QuoteDocument } from '@/components/QuoteDocument';
import { OwnerSettingsModal } from '@/components/OwnerSettingsModal';

import {
  Ruler,
  Boxes,
  Compass,
  FileSpreadsheet,
  FileText,
  Download,
  Eye,
  Settings2,
  Shield,
  Plus,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  Copy,
  Layers,
  LayoutGrid,
  Maximize2,
  Printer,
  ChevronRight,
  RotateCcw,
  FilePlus,
} from 'lucide-react';

export default function CabinexStudio() {
  // Left Menu Wizard Steps (1 to 5)
  // 1: Room & Walls (A, B, C, Island)
  // 2: Openings (Windows & Doors)
  // 3: Modules (Cabinet Designations)
  // 4: Finishes (Granite, Finish, Hardware, Services)
  // 5: Exports (Prompt, Wireframes, BOM, Customer Quote, Contractor Quote)
  type WizardStep = 1 | 2 | 3 | 4 | 5;
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Right Viewport Display Mode:
  // 'quad' (4-part split: Top, Bottom, Front, Iso auto-updating)
  // Or maximized individual views and full document views
  type ViewportMode =
    | 'quad'
    | 'top'
    | 'front'
    | 'side'
    | 'iso'
    | 'cad_sheet'
    | 'bom'
    | 'customer_quote'
    | 'contractor_quote';
  const [viewportMode, setViewportMode] = useState<ViewportMode>('quad');

  // Selected Wall for Elevation & Section (Strictly Real-World A, B, C, Island order!)
  const [activeWallId, setActiveWallId] = useState<WallId>('A');

  // Project Information
  const [project, setProject] = useState<ProjectDetails>({
    id: 'proj-1',
    refNumber: 'QT-2026-0184',
    revision: 0,
    customerName: 'Mr. Perera',
    mobile: '0771234567',
    location: 'Malabe, Colombo',
    wallHeight: 2743,
    notes: 'Matte black anodized aluminium, feature island with seating overhang.',
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Archetype Selection (6 Pro Types)
  type LayoutArchetype = 'single' | 'L' | 'U' | 'L_island' | 'U_island' | 'U_bar';
  const [archetype, setArchetype] = useState<LayoutArchetype>('L');

  // Wall Dimension String Input Buffers (prevents '60033' typing jump bugs!)
  const [wallInputs, setWallInputs] = useState({
    A: '3650',
    B: '4200',
    C: '3000',
    island: '1800',
    roomHeight: '2743',
    baseHeight: '870',
    topBottomDatum: '1500',
    tallTowerHeight: '2150',
  });

  // Real-world Walls: Wall A is Main Left Run, Wall B is Rear Return, Wall C is Right Run
  // Starts with clean empty room (no ghost obstacles from old projects)
  const [walls, setWalls] = useState<Wall[]>([
    { id: 'A', name: 'Wall A (Main)', length: 3650, height: 2743, openings: [] },
    { id: 'B', name: 'Wall B (Return)', length: 4200, height: 2743, openings: [] },
    { id: 'C', name: 'Wall C (Right)', length: 3000, height: 2743, openings: [] },
  ]);

  // Design Options
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
      enabled: false,
      length: 1800,
      depth: 900,
      hasSink: false,
      hasCooker: false,
      seatingOverhang: true,
      roomOpposingDimension: 3800,
    },
    topCabinets: true,
    highSoffitCabinets: true,
    granite: true,
    electricalPlumbing: true,
    finish: 'Matte Black Anodized Aluminium',
    drawerBankFittings: ['cutlery', 'cup_saucer', 'plate_rack'],
  });

  // New Opening Form Buffer
  const [newOpening, setNewOpening] = useState<{
    wallId: WallId;
    type: Opening['type'];
    distanceFromLeft: string;
    width: string;
    sillHeight: string;
    height: string;
  }>({
    wallId: 'A',
    type: 'window',
    distanceFromLeft: '1200',
    width: '1200',
    sillHeight: '1050',
    height: '1200',
  });

  // Custom BOM items
  const [customBOMItems, setCustomBOMItems] = useState<BOMItem[]>([]);

  // Owner & Pricing Settings
  const [pricingSettings, setPricingSettings] = useState<PricingSettings>(DEFAULT_PRICING_SETTINGS);
  const [isOwnerRole, setIsOwnerRole] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Placed Cabinets
  const [cabinets, setCabinets] = useState<Cabinet[]>(() => {
    const { cabinets: initial } = generateKitchenLayout(walls, options);
    return initial;
  });
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);

  // Copied state for prompt
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Pricing calculation (Deterministic BOM + Higher Price Rule)
  const pricing = useMemo(() => {
    return calculatePricing(cabinets, walls, options, pricingSettings, customBOMItems);
  }, [cabinets, walls, options, pricingSettings, customBOMItems]);

  // Synchronize wall changes automatically in real-time
  const updateWallDimension = (field: 'A' | 'B' | 'C' | 'island', valStr: string) => {
    const nextInputs = { ...wallInputs, [field]: valStr };
    setWallInputs(nextInputs);

    const lenA = Math.max(800, Number(field === 'A' ? valStr : nextInputs.A) || 3650);
    const lenB = Math.max(800, Number(field === 'B' ? valStr : nextInputs.B) || 4200);
    const lenC = Math.max(800, Number(field === 'C' ? valStr : nextInputs.C) || 3000);
    const islandLen = Math.max(900, Number(field === 'island' ? valStr : nextInputs.island) || 1800);

    const updatedWalls: Wall[] = walls.map((w) => {
      if (w.id === 'A') return { ...w, length: lenA };
      if (w.id === 'B') return { ...w, length: lenB };
      if (w.id === 'C') return { ...w, length: lenC };
      return w;
    });
    setWalls(updatedWalls);

    const updatedOptions: DesignOptions = {
      ...options,
      island: { ...options.island, length: islandLen },
    };
    setOptions(updatedOptions);

    // Auto-update layout
    const { cabinets: newCabs } = generateKitchenLayout(updatedWalls, updatedOptions);
    setCabinets(newCabs);
  };

  // Archetype change
  const handleSelectArchetype = (arch: LayoutArchetype) => {
    setArchetype(arch);
    let shape: KitchenShape = 'L';
    let islandEnabled = false;

    if (arch === 'single') {
      shape = 'straight';
    } else if (arch === 'L') {
      shape = 'L';
    } else if (arch === 'U') {
      shape = 'U';
    } else if (arch === 'L_island') {
      shape = 'L';
      islandEnabled = true;
    } else if (arch === 'U_island' || arch === 'U_bar') {
      shape = 'U';
      islandEnabled = true;
    }

    const updatedOptions: DesignOptions = {
      ...options,
      shape,
      island: {
        ...options.island,
        enabled: islandEnabled,
        length: Number(wallInputs.island) || 1800,
      },
    };
    setOptions(updatedOptions);

    const { cabinets: newCabs } = generateKitchenLayout(walls, updatedOptions);
    setCabinets(newCabs);
  };

  // Add Opening
  const handleAddOpening = (e: React.FormEvent) => {
    e.preventDefault();
    const op: Opening = {
      id: `op-${Date.now()}`,
      wallId: newOpening.wallId,
      type: newOpening.type,
      distanceFromLeft: Number(newOpening.distanceFromLeft) || 600,
      width: Number(newOpening.width) || 900,
      sillHeight: Number(newOpening.sillHeight) || 1050,
      height: Number(newOpening.height) || 1200,
    };

    const nextWalls = walls.map((w) =>
      w.id === newOpening.wallId ? { ...w, openings: [...w.openings, op] } : w
    );
    setWalls(nextWalls);
    setActiveWallId(newOpening.wallId);
    const { cabinets: newCabs } = generateKitchenLayout(nextWalls, options);
    setCabinets(newCabs);
  };

  const handleRemoveOpening = (wallId: WallId, opId: string) => {
    const nextWalls = walls.map((w) =>
      w.id === wallId
        ? { ...w, openings: w.openings.filter((op) => op.id !== opId) }
        : w
    );
    setWalls(nextWalls);
    const { cabinets: newCabs } = generateKitchenLayout(nextWalls, options);
    setCabinets(newCabs);
  };

  // Clear All Openings across all walls
  const handleClearAllOpenings = () => {
    const nextWalls = walls.map((w) => ({ ...w, openings: [] }));
    setWalls(nextWalls);
    const { cabinets: newCabs } = generateKitchenLayout(nextWalls, options);
    setCabinets(newCabs);
  };

  // Clear room completely: removes all openings, all cabinets, and resets canvas
  const handleClearRoom = () => {
    const cleanWalls = walls.map((w) => ({ ...w, openings: [] }));
    setWalls(cleanWalls);
    setCabinets([]);
    setCustomBOMItems([]);
    setSelectedCabinet(null);
  };

  // Generate / Auto-Populate Cabinet Layout adapted to current walls & obstacles
  const handleGenerateLayout = () => {
    const { cabinets: newCabs } = generateKitchenLayout(walls, options);
    setCabinets(newCabs);
  };

  // Start New Project & Clear Room completely
  const handleNewProject = () => {
    const newRef = `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setProject((prev) => ({
      ...prev,
      id: `proj-${Date.now()}`,
      refNumber: newRef,
      revision: 0,
      customerName: 'New Client',
      mobile: '',
      location: 'Colombo',
      notes: '',
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const cleanWalls: Wall[] = [
      { id: 'A', name: 'Wall A (Main)', length: 3650, height: 2743, openings: [] },
      { id: 'B', name: 'Wall B (Return)', length: 4200, height: 2743, openings: [] },
      { id: 'C', name: 'Wall C (Right)', length: 3000, height: 2743, openings: [] },
    ];
    setWalls(cleanWalls);
    setWallInputs({
      A: '3650',
      B: '4200',
      C: '3000',
      island: '1800',
      roomHeight: '2743',
      baseHeight: '870',
      topBottomDatum: '1500',
      tallTowerHeight: '2150',
    });
    setArchetype('L');
    const defaultOptions: DesignOptions = {
      ...options,
      shape: 'L',
      island: { ...options.island, enabled: false },
    };
    setOptions(defaultOptions);
    setCabinets([]); // Room starts completely empty and clear!
    setCustomBOMItems([]);
    setSelectedCabinet(null);
    setCurrentStep(1);
    setActiveWallId('A');
    setViewportMode('quad');
  };

  // Quick Add Module on active wall
  const handleQuickAddModule = (label: string, widthMm: number, type: any) => {
    const currentWallCabs = cabinets.filter((c) => c.wallId === activeWallId);
    const lastStart =
      currentWallCabs.length > 0
        ? Math.max(...currentWallCabs.map((c) => c.startMm + c.widthMm))
        : 0;

    const newCab: Cabinet = {
      id: `cab-${Date.now()}`,
      wallId: activeWallId,
      type,
      category: type === 'tall_pantry' || type.startsWith('tall') ? 'tall' : 'base',
      startMm: lastStart,
      widthMm,
      depthMm: 600,
      heightMm: type.startsWith('tall') ? 2150 : 870,
      chargeWidthMm: widthMm,
      label,
      locked: true,
    };

    setCabinets((prev) => [...prev, newCab]);
  };

  // Generate Prompt Text
  const getPromptText = () => {
    return `
# LUXUS CABINEX AI KITCHEN SPECIFICATION PROMPT
Generated: ${new Date().toISOString()}
Project Reference: ${project.refNumber} (Rev ${project.revision})
Client: ${project.customerName} (${project.mobile})
Location: ${project.location}

## 1. ARCHITECTURAL ROOM PARAMETERS (ABC & ISLAND ORDER)
- Kitchen Archetype: ${archetype.toUpperCase()}
- Wall A (Main Run): ${walls.find((w) => w.id === 'A')?.length || 0} mm
- Wall B (Return Run): ${walls.find((w) => w.id === 'B')?.length || 0} mm
- Wall C (Right Run): ${walls.find((w) => w.id === 'C')?.length || 0} mm
- Island / Breakfast Bar: ${options.island.enabled ? `${options.island.length}mm × ${options.island.depth}mm` : 'None'}
- Room Ceiling Height: ${project.wallHeight} mm
- Base Worktop Datum: ${wallInputs.baseHeight} mm
- Overheads Bottom Datum: 1500 mm

## 2. WALL OPENINGS & OBSTACLES
${walls
  .flatMap((w) =>
    w.openings.map(
      (op) =>
        `- Wall ${w.id} ${op.type.toUpperCase()}: Offset = ${op.distanceFromLeft}mm, Width = ${op.width}mm, Sill = ${op.sillHeight}mm, Height = ${op.height}mm`
    )
  )
  .join('\n') || '- None'}

## 3. CABINET MODULE SCHEDULE
Total Modules Placed: ${cabinets.length}
${cabinets
  .map(
    (c, i) =>
      `Bay ${i + 1}: Wall ${c.wallId} | [${c.category.toUpperCase()}] ${c.label} (${c.type}) | Width: ${c.widthMm}mm, Start: ${c.startMm}mm`
  )
  .join('\n')}

## 4. MATERIALS & HARDWARE
- Structure: 100% Anodized Aluminium 40×40 Mechanical Joint Box-Bar Skeleton
- Shutter Finish: ${options.finish}
- Drawer Runners: Tandem Concealed Full-Extension Soft-Close (500mm)
- Hinges: Heavy-Duty 3D Clip-On Soft-Close Hinges (110°)
- Countertop: ${options.granite ? 'Solid Absolute Black Polished Granite (20mm Bullnose)' : 'Customer Provided'}

## 5. FINANCIAL & COMMERCIAL ESTIMATE
- Total Linear Feet: ${pricing.totalCabinetLF} LF (Base: ${pricing.baseLF} LF, Top: ${pricing.topLF} LF, Tall: ${pricing.tallLF} LF)
- Granite Surface Area: ${pricing.graniteSqFt} sq.ft
- Base Factory Production Cost: LKR ${pricing.fabricatorCost.totalCost.toLocaleString()}
- Client Quotation Total: LKR ${pricing.customerPrice.grandTotal.toLocaleString()}
- Gross Commercial Profit: LKR ${pricing.grossProfit.toLocaleString()} (${pricing.marginPercent}% margin)
`;
  };

  // Download AI Specification Prompt (.md)
  const handleDownloadPrompt = () => {
    const promptText = getPromptText();
    const blob = new Blob([promptText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.refNumber}_Kitchen_AI_Prompt.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy Prompt to Clipboard
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(getPromptText());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Download SVG Element
  const handleDownloadSvg = (containerId: string, filename: string) => {
    const container = document.getElementById(containerId);
    const svg = container?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const wallA = walls.find((w) => w.id === 'A') || walls[0];
  const wallB =
    walls.find((w) => w.id === 'B') || {
      id: 'B' as WallId,
      name: 'Wall B (Return)',
      length: Number(wallInputs.B) || 4200,
      height: Number(wallInputs.roomHeight) || 2743,
      openings: [],
    };
  const wallC =
    walls.find((w) => w.id === 'C') || {
      id: 'C' as WallId,
      name: 'Wall C (Right)',
      length: Number(wallInputs.C) || 3000,
      height: Number(wallInputs.roomHeight) || 2743,
      openings: [],
    };

  const activeWall =
    walls.find((w) => w.id === activeWallId) ||
    walls.find((w) => w.id === 'A') ||
    walls[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* ========================================================= */}
      {/* LEFT PANEL: WIZARD FLOW MENU (~390px)                    */}
      {/* ========================================================= */}
      <div className="w-[390px] bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none z-20 shadow-xl">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Title & Branding */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-sky-500/20">
                LX
              </div>
              <div>
                <h1 className="font-black text-xs text-white uppercase tracking-wider leading-none">
                  Cabinex AI Studio
                </h1>
                <span className="text-[9px] font-bold text-sky-400 font-mono tracking-widest">
                  ALL-ALUMINUM & SASH V2.0
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleNewProject}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
                title="Start a new clean kitchen project"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>

              <button
                onClick={handleClearRoom}
                className="flex items-center gap-1 px-2 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition"
                title="Clear all cabinets and obstacles in current room"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                onClick={() => setIsOwnerModalOpen(true)}
                className={`p-1.5 rounded-lg border text-xs transition ${
                  isOwnerRole
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
                title="Owner Confidential Rates"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stepped Wizard Navigation Tabs (1 to 5) */}
          <div className="grid grid-cols-5 gap-1 p-2 bg-slate-950 border-b border-slate-800 text-[10px] font-bold">
            {[
              { s: 1, label: '1. Walls', icon: Ruler },
              { s: 2, label: '2. Openings', icon: Boxes },
              { s: 3, label: '3. Modules', icon: Compass },
              { s: 4, label: '4. Finishes', icon: Settings2 },
              { s: 5, label: '5. Exports', icon: Download },
            ].map((st) => {
              const Icon = st.icon;
              const isActive = currentStep === st.s;
              return (
                <button
                  key={st.s}
                  onClick={() => setCurrentStep(st.s as WizardStep)}
                  className={`py-2 px-1 flex flex-col items-center justify-center gap-1 rounded-lg transition ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Step Content Form (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ---------------------------------------------------- */}
            {/* STEP 1: ROOM & WALLS (Real-World Order: A ➔ B ➔ C ➔ Island) */}
            {/* ---------------------------------------------------- */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Project Reset & Clear Room Controls */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Project: {project.refNumber}</div>
                      <div className="text-[10px] text-slate-400">
                        {cabinets.length > 0 ? `${cabinets.length} cabinets placed` : 'Clean empty room'}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={handleClearRoom}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition"
                        title="Clear all cabinets and openings"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear Room</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateLayout}
                        className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow"
                        title="Generate cabinet layout"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase text-sky-400 tracking-wider mb-2">
                    1. Layout Archetype
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {[
                      { id: 'single', name: '1. Single Wall (A)', desc: 'Straight Run' },
                      { id: 'L', name: '2. L-Shaped (A + B)', desc: 'Corner Run' },
                      { id: 'U', name: '3. U-Shaped (A + B + C)', desc: '3 Walls' },
                      { id: 'L_island', name: '4. L with Island', desc: 'Corner + Island' },
                      { id: 'U_island', name: '5. U with Island', desc: 'U-Shape + Island' },
                      { id: 'U_bar', name: '6. U + Breakfast Bar', desc: 'U-Shape + Bar' },
                    ].map((arch) => (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => handleSelectArchetype(arch.id as LayoutArchetype)}
                        className={`p-2 rounded-xl text-left border transition ${
                          archetype === arch.id
                            ? 'bg-sky-500/20 border-sky-400 text-white font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>{arch.name}</div>
                        <div className="text-[10px] text-slate-500">{arch.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Wall Dimensions (mm) — Real World Order: A, B, C, Island */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase text-sky-400 tracking-wider">
                    2. Wall Dimensions (mm)
                  </h3>

                  <div className="space-y-2 text-xs">
                    {/* Wall A (Main Run) */}
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold flex justify-between">
                        <span>Wall A (Main Run)</span>
                        <span className="text-[10px] text-sky-400 font-mono">Run 1</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={wallInputs.A}
                        onChange={(e) => updateWallDimension('A', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                      />
                    </div>

                    {/* Wall B (Return Run) */}
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold flex justify-between">
                        <span>Wall B (Return Run)</span>
                        <span className="text-[10px] text-sky-400 font-mono">Run 2</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={options.shape === 'straight'}
                        value={options.shape === 'straight' ? '0' : wallInputs.B}
                        onChange={(e) => updateWallDimension('B', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold disabled:opacity-30"
                      />
                    </div>

                    {/* Wall C (Right Run) */}
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold flex justify-between">
                        <span>Wall C (Right Run)</span>
                        <span className="text-[10px] text-sky-400 font-mono">Run 3</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={options.shape !== 'U'}
                        value={options.shape === 'U' ? wallInputs.C : '0'}
                        onChange={(e) => updateWallDimension('C', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold disabled:opacity-30"
                      />
                    </div>

                    {/* Island / Breakfast Bar */}
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold flex justify-between">
                        <span>Island / Breakfast Bar</span>
                        <span className="text-[10px] text-sky-400 font-mono">Zone 4</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={!options.island.enabled}
                        value={options.island.enabled ? wallInputs.island : '0'}
                        onChange={(e) => updateWallDimension('island', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold disabled:opacity-30"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Vertical Datum Heights (mm) */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <h3 className="text-xs font-bold uppercase text-sky-400 tracking-wider">
                    3. Vertical Datum Heights (mm)
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[10px] block">Room Ceiling Height</label>
                      <input
                        type="text"
                        value={wallInputs.roomHeight}
                        onChange={(e) =>
                          setWallInputs({ ...wallInputs, roomHeight: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block">Base Countertop Datum</label>
                      <input
                        type="text"
                        value={wallInputs.baseHeight}
                        onChange={(e) =>
                          setWallInputs({ ...wallInputs, baseHeight: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition shadow"
                >
                  <span>Proceed to Openings</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 2: OPENINGS (Windows & Doors on Wall A, B, C)  */}
            {/* ---------------------------------------------------- */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <form
                  onSubmit={handleAddOpening}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 text-xs"
                >
                  <h3 className="text-xs font-bold uppercase text-sky-400 tracking-wider">
                    Add Opening / Obstacle
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 text-[10px] block">On Wall</label>
                      <select
                        value={newOpening.wallId}
                        onChange={(e) =>
                          setNewOpening({ ...newOpening, wallId: e.target.value as WallId })
                        }
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-semibold"
                      >
                        <option value="A">Wall A (Main)</option>
                        <option value="B">Wall B (Return)</option>
                        {options.shape === 'U' && <option value="C">Wall C (Right)</option>}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block">Type</label>
                      <select
                        value={newOpening.type}
                        onChange={(e) =>
                          setNewOpening({ ...newOpening, type: e.target.value as any })
                        }
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-semibold"
                      >
                        <option value="window">Window</option>
                        <option value="door">Door</option>
                        <option value="opening">Archway</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block">From Left (mm)</label>
                      <input
                        type="text"
                        value={newOpening.distanceFromLeft}
                        onChange={(e) =>
                          setNewOpening({ ...newOpening, distanceFromLeft: e.target.value })
                        }
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block">Width (mm)</label>
                      <input
                        type="text"
                        value={newOpening.width}
                        onChange={(e) =>
                          setNewOpening({ ...newOpening, width: e.target.value })
                        }
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-slate-400 text-[10px] block">
                        Sill Datum from Floor (mm)
                      </label>
                      <input
                        type="text"
                        value={newOpening.sillHeight}
                        onChange={(e) =>
                          setNewOpening({ ...newOpening, sillHeight: e.target.value })
                        }
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Opening
                  </button>
                </form>

                {/* Openings List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Configured Obstacles ({walls.flatMap((w) => w.openings).length}):
                    </h4>
                    {walls.flatMap((w) => w.openings).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllOpenings}
                        className="flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                        title="Remove all obstacles from all walls"
                      >
                        <Trash2 className="w-3 h-3" /> Clear All
                      </button>
                    )}
                  </div>
                  {walls.flatMap((w) => w.openings).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No openings configured. Room is clear.</p>
                  ) : (
                    walls.flatMap((w) =>
                      w.openings.map((op) => (
                        <div
                          key={op.id}
                          className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                        >
                          <div>
                            <span className="font-bold text-sky-400 uppercase">
                              {op.type} on Wall {op.wallId}
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Left: {op.distanceFromLeft}mm | W: {op.width}mm | Sill: {op.sillHeight}mm
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveOpening(op.wallId, op.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    ⟵ Back to Walls
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>Next: Modules</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 3: MODULAR COMPONENT ASSIGNMENT                */}
            {/* ---------------------------------------------------- */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                    Designate Modules on Wall:
                  </span>
                  <div className="flex gap-1">
                    {(['A', 'B', 'C', 'I'] as const).map((wId) => {
                      if (wId === 'B' && options.shape === 'straight') return null;
                      if (wId === 'C' && options.shape !== 'U') return null;
                      if (wId === 'I' && !options.island.enabled) return null;
                      return (
                        <button
                          key={wId}
                          type="button"
                          onClick={() => setActiveWallId(wId)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                            activeWallId === wId
                              ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {wId === 'I' ? 'Island' : `Wall ${wId}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Add Module Buttons */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                    Quick Add to Wall {activeWallId}:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      onClick={() => handleQuickAddModule('Tall Tower 600', 600, 'tall_pantry')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-left font-medium text-xs"
                    >
                      + Tall Tower (600)
                    </button>
                    <button
                      onClick={() => handleQuickAddModule('3-Drawers 600', 600, 'drawer')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-left font-medium text-xs"
                    >
                      + 3-Drawers (600)
                    </button>
                    <button
                      onClick={() => handleQuickAddModule('Cooker Hob 900', 900, 'cooker')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-left font-medium text-xs"
                    >
                      + Cooker Hob (900)
                    </button>
                    <button
                      onClick={() => handleQuickAddModule('Sink Basin 900', 900, 'sink')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-left font-medium text-xs"
                    >
                      + Sink Basin (900)
                    </button>
                    <button
                      onClick={() => handleQuickAddModule('2-Door Base 600', 600, 'base')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-left font-medium text-xs"
                    >
                      + 2-Door Base (600)
                    </button>
                    <button
                      onClick={() => handleQuickAddModule('Bottle Rack 300', 300, 'base')}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-left font-medium text-xs"
                    >
                      + Bottle Rack (300)
                    </button>
                  </div>
                </div>

                {/* Modules on this Wall */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cabinets on Wall {activeWallId}:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {cabinets
                      .filter((c) => c.wallId === activeWallId)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-200">{c.label}</span>
                            <span className="text-[10px] text-slate-500 ml-2 font-mono">
                              {c.widthMm}mm
                            </span>
                          </div>
                          <button
                            onClick={() => setCabinets(cabinets.filter((x) => x.id !== c.id))}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    ⟵ Back to Openings
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>Next: Finishes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 4: FINISHES, GRANITE & HARDWARE                 */}
            {/* ---------------------------------------------------- */}
            {currentStep === 4 && (
              <div className="space-y-4 text-xs">
                {/* Granite Countertop */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400 uppercase">
                      Granite / Solid Countertop
                    </span>
                    <input
                      type="checkbox"
                      checked={options.granite}
                      onChange={(e) => setOptions({ ...options, granite: e.target.checked })}
                      className="accent-sky-500 w-4 h-4"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Countertop Area:</span>
                      <span className="font-bold text-white font-mono">
                        {pricing.graniteSqFt} sq.ft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fabrication Rate:</span>
                      <span className="font-mono text-slate-300">
                        LKR {pricingSettings.graniteInternalRatePerSqFt.toLocaleString()} / sq.ft
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shutter Finish Profile */}
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <span className="font-bold text-sky-400 uppercase block">
                    Aluminium Profile & Shutter Finish
                  </span>
                  <select
                    value={options.finish}
                    onChange={(e) => setOptions({ ...options, finish: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-white font-semibold"
                  >
                    <option value="Matte Black Anodized Aluminium">Matte Black Anodized</option>
                    <option value="Brushed Natural Silver Aluminium">Brushed Natural Silver</option>
                    <option value="Champagne Bronze Anodized Aluminium">Champagne Bronze Anodized</option>
                    <option value="Anthracite Grey Powder-Coated">Anthracite Grey Powder-Coated</option>
                  </select>
                </div>

                {/* Services Provision */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <label className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 cursor-pointer">
                    <span className="text-slate-300 font-semibold">
                      Plumbing & Electrical Provision (Fixed)
                    </span>
                    <input
                      type="checkbox"
                      checked={options.electricalPlumbing}
                      onChange={(e) =>
                        setOptions({ ...options, electricalPlumbing: e.target.checked })
                      }
                      className="accent-sky-500 w-4 h-4"
                    />
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    ⟵ Back to Modules
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Exports</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 5: EXPORTS & HANDOVER                           */}
            {/* ---------------------------------------------------- */}
            {currentStep === 5 && (
              <div className="space-y-3.5 text-xs">
                {/* 1. AI Specification Prompt */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-400 uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> 1. AI Specification Prompt
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">CAD / Render Prompt</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Export complete architectural room data, wall runs, openings, and cabinet module inventory.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopyPrompt}
                      className="flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold rounded-lg border border-slate-700 transition"
                    >
                      {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
                    </button>
                    <button
                      onClick={handleDownloadPrompt}
                      className="flex items-center justify-center gap-1.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition"
                    >
                      <Download className="w-3.5 h-3.5" /> Download (.md)
                    </button>
                  </div>
                </div>

                {/* 2. CAD Wireframe Drawings */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> 2. CAD Wireframe Drawings
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">4-Part Views</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Download vector SVG / PNG wireframes for Top Plan, Front Elevation, Side Profile, and 3D Iso.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleDownloadSvg('viewport-quad-top', `${project.refNumber}_Top_Plan.svg`)}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[11px] font-semibold flex items-center justify-between"
                    >
                      <span>Top Plan</span>
                      <Download className="w-3 h-3 text-sky-400" />
                    </button>
                    <button
                      onClick={() => handleDownloadSvg('viewport-quad-front', `${project.refNumber}_Wall_${activeWall.id}_Elevation.svg`)}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[11px] font-semibold flex items-center justify-between"
                    >
                      <span>Front Elevation</span>
                      <Download className="w-3 h-3 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => handleDownloadSvg('viewport-quad-side', `${project.refNumber}_Side_Profile.svg`)}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[11px] font-semibold flex items-center justify-between"
                    >
                      <span>Side Profile</span>
                      <Download className="w-3 h-3 text-purple-400" />
                    </button>
                    <button
                      onClick={() => handleDownloadSvg('viewport-quad-iso', `${project.refNumber}_3D_Isometric.svg`)}
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-[11px] font-semibold flex items-center justify-between"
                    >
                      <span>3D Isometric</span>
                      <Download className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                  <button
                    onClick={() => setViewportMode('cad_sheet')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-bold rounded-lg border border-amber-500/40 transition text-xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5" /> Open Full CAD Shop Drawing Sheet
                  </button>
                </div>

                {/* 3. Manufacturing BOM */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5" /> 3. Manufacturing BOM
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {pricing.bomItems.length} Line Items
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Detailed fabrication bill of materials with editable unit prices and custom item addition.
                  </p>
                  <button
                    onClick={() => setViewportMode('bom')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Open & Edit BOM Table
                  </button>
                </div>

                {/* 4. Customer Quotation PDF */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> 4. Customer Quotation (PDF)
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">
                      LKR {pricing.customerPrice.grandTotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Clean client quotation with single lump sum investment price (no linear feet displayed) and terms.
                  </p>
                  <button
                    onClick={() => setViewportMode('customer_quote')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> View / Download Client PDF
                  </button>
                </div>

                {/* 5. Contractor Zero-Margin Quote */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400 uppercase flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> 5. Contractor Factory Quote (0% Margin)
                    </span>
                    <span className="text-[10px] text-rose-400 font-bold font-mono">
                      LKR {pricing.fabricatorCost.totalCost.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Factory production settlement order for contractor / workshop assembly.
                  </p>
                  <button
                    onClick={() => setViewportMode('contractor_quote')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
                  >
                    <Building2 className="w-3.5 h-3.5" /> View Factory Order PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Live Real-World Order Dimension Ticker */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
          <span>A: {wallInputs.A}mm</span>
          <span>B: {wallInputs.B}mm</span>
          <span>C: {options.shape === 'U' ? wallInputs.C : '0'}mm</span>
          <span>ISL: {options.island.enabled ? wallInputs.island : '0'}mm</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT WORKSPACE: 4-PART VIEWPORT / AUTO-UPDATING CAD      */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Top Viewport Navigation Bar */}
        <div className="h-12 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 text-xs">
          {/* Viewport Quadrant Mode Selectors & Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow text-xs transition"
              title="Start a new clean kitchen project"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>+ New Project</span>
            </button>

            <button
              onClick={handleClearRoom}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-300 border border-slate-700 hover:border-rose-500/40 rounded-lg text-xs font-semibold transition"
              title="Clear all cabinets and obstacles in room"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Room</span>
            </button>

            <button
              onClick={handleGenerateLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-sm text-xs transition"
              title="Generate cabinet modules fitting walls and openings"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Generate Layout</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewportMode('quad')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-bold transition ${
                  viewportMode === 'quad'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="4-Part Quad Viewport (Wall A, Wall B, Wall C, 3D Iso)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>4-Part (A, B, C, Iso)</span>
              </button>

              <button
                onClick={() => setViewportMode('front')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  viewportMode === 'front'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Wall Elevation
              </button>

              <button
                onClick={() => setViewportMode('top')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  viewportMode === 'top'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top (Plan)
              </button>

              <button
                onClick={() => setViewportMode('iso')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  viewportMode === 'iso'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3D Iso
              </button>
            </div>
          </div>

          {/* Real-World Wall Selector (Strictly A, B, C, Island!) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Wall:</span>
            <div className="flex gap-1">
              {(['A', 'B', 'C', 'I'] as const).map((wId) => {
                if (wId === 'B' && options.shape === 'straight') return null;
                if (wId === 'C' && options.shape !== 'U') return null;
                if (wId === 'I' && !options.island.enabled) return null;
                return (
                  <button
                    key={wId}
                    onClick={() => setActiveWallId(wId)}
                    className={`px-2.5 py-1 rounded text-xs font-bold font-mono transition ${
                      activeWallId === wId
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {wId === 'I' ? 'Island' : `Wall ${wId}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Header Exports */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPrompt}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded border border-slate-700 transition"
              title="Download AI Specification Prompt"
            >
              <Copy className="w-3.5 h-3.5" /> Prompt
            </button>

            <button
              onClick={() => setViewportMode('bom')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded border transition ${
                viewportMode === 'bom'
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800 text-indigo-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> BOM
            </button>

            <button
              onClick={() => setViewportMode('customer_quote')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded border transition ${
                viewportMode === 'customer_quote'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Quote
            </button>
          </div>
        </div>

        {/* ======================================================= */}
        {/* VIEWPORTS RENDER AREA                                  */}
        {/* ======================================================= */}
        <div className="flex-1 overflow-hidden p-3 bg-slate-950">
          {/* --- QUAD VIEW MODE (4-PART: WALL A, WALL B, WALL C & 3D ISO) --- */}
          {viewportMode === 'quad' && (
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2.5">
              {/* QUAD 1: WALL A FRONT ELEVATION (Top-Left) */}
              <div
                id="viewport-quad-wall-a"
                className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow"
              >
                <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Eye className="w-3.5 h-3.5" /> 1. WALL A ELEVATION (MAIN RUN)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">
                      L: {wallA.length}mm • H: {project.wallHeight}mm
                    </span>
                    <button
                      onClick={() => handleDownloadSvg('viewport-quad-wall-a', `${project.refNumber}_Wall_A_Elevation.svg`)}
                      className="p-1 hover:text-white transition"
                      title="Download Wall A Elevation SVG"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveWallId('A');
                        setViewportMode('front');
                      }}
                      className="p-1 hover:text-white transition"
                      title="Maximize Wall A"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
                  <ElevationSvg
                    wall={wallA}
                    cabinets={cabinets}
                    selectedCabinetId={selectedCabinet?.id}
                    onSelectCabinet={setSelectedCabinet}
                  />
                </div>
              </div>

              {/* QUAD 2: WALL B FRONT ELEVATION (Top-Right) */}
              <div
                id="viewport-quad-wall-b"
                className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow"
              >
                <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Eye className="w-3.5 h-3.5" /> 2. WALL B ELEVATION (RETURN RUN)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">
                      L: {wallB.length}mm • H: {project.wallHeight}mm
                    </span>
                    <button
                      onClick={() => handleDownloadSvg('viewport-quad-wall-b', `${project.refNumber}_Wall_B_Elevation.svg`)}
                      className="p-1 hover:text-white transition"
                      title="Download Wall B Elevation SVG"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveWallId('B');
                        setViewportMode('front');
                      }}
                      className="p-1 hover:text-white transition"
                      title="Maximize Wall B"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
                  <ElevationSvg
                    wall={wallB}
                    cabinets={cabinets}
                    selectedCabinetId={selectedCabinet?.id}
                    onSelectCabinet={setSelectedCabinet}
                  />
                </div>
              </div>

              {/* QUAD 3: WALL C ELEVATION / ISLAND (Bottom-Left) */}
              <div
                id="viewport-quad-wall-c"
                className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow"
              >
                <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  <span className="flex items-center gap-1.5 text-purple-400">
                    <Eye className="w-3.5 h-3.5" /> 3. {options.shape === 'U' ? 'WALL C ELEVATION (RIGHT RUN)' : options.island.enabled ? 'ISLAND ELEVATION' : 'WALL C / TOP PLAN'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">
                      {options.shape === 'U' ? `L: ${wallC.length}mm` : options.island.enabled ? `L: ${options.island.length}mm` : `A: ${wallA.length}mm`}
                    </span>
                    <button
                      onClick={() => handleDownloadSvg('viewport-quad-wall-c', `${project.refNumber}_Zone_3.svg`)}
                      className="p-1 hover:text-white transition"
                      title="Download SVG"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (options.shape === 'U') {
                          setActiveWallId('C');
                          setViewportMode('front');
                        } else {
                          setViewportMode('top');
                        }
                      }}
                      className="p-1 hover:text-white transition"
                      title="Maximize"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
                  {options.shape === 'U' ? (
                    <ElevationSvg
                      wall={wallC}
                      cabinets={cabinets}
                      selectedCabinetId={selectedCabinet?.id}
                      onSelectCabinet={setSelectedCabinet}
                    />
                  ) : options.island.enabled ? (
                    <ElevationSvg
                      wall={{
                        id: 'I' as WallId,
                        name: 'Island Unit',
                        length: options.island.length,
                        height: 870,
                        openings: [],
                      }}
                      cabinets={cabinets}
                      selectedCabinetId={selectedCabinet?.id}
                      onSelectCabinet={setSelectedCabinet}
                    />
                  ) : (
                    <PlanViewSvg
                      walls={walls}
                      cabinets={cabinets}
                      shape={options.shape}
                      island={options.island}
                      selectedCabinetId={selectedCabinet?.id}
                      onSelectCabinet={setSelectedCabinet}
                    />
                  )}
                </div>
              </div>

              {/* QUAD 4: 3D ISO WIREFRAME (Bottom-Right) */}
              <div
                id="viewport-quad-iso"
                className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow"
              >
                <div className="px-3 py-1.5 bg-slate-950/90 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Layers className="w-3.5 h-3.5" /> 4. 3D ISO (AXONOMETRIC WIREFRAME)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">3D Assembly</span>
                    <button
                      onClick={() => handleDownloadSvg('viewport-quad-iso', `${project.refNumber}_3D_Iso.svg`)}
                      className="p-1 hover:text-white transition"
                      title="Download 3D Iso SVG"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setViewportMode('iso')}
                      className="p-1 hover:text-white transition"
                      title="Maximize 3D Iso"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-2 flex items-center justify-center">
                  <IsometricSvg
                    walls={walls}
                    cabinets={cabinets}
                    shape={options.shape}
                    island={options.island}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- SINGLE FULL MAXIMIZED VIEWPORTS --- */}
          {viewportMode === 'top' && (
            <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-sky-400">Architectural 2D Plan View (Maximized)</span>
                <button
                  onClick={() => setViewportMode('quad')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                >
                  ⟵ Back to 4-Part Quad View
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <PlanViewSvg
                  walls={walls}
                  cabinets={cabinets}
                  shape={options.shape}
                  island={options.island}
                  selectedCabinetId={selectedCabinet?.id}
                  onSelectCabinet={setSelectedCabinet}
                />
              </div>
            </div>
          )}

          {viewportMode === 'front' && (
            <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-400">Front Elevation Wall {activeWall.id} (Maximized)</span>
                <button
                  onClick={() => setViewportMode('quad')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                >
                  ⟵ Back to 4-Part Quad View
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <ElevationSvg
                  wall={activeWall}
                  cabinets={cabinets}
                  selectedCabinetId={selectedCabinet?.id}
                  onSelectCabinet={setSelectedCabinet}
                />
              </div>
            </div>
          )}

          {viewportMode === 'side' && (
            <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-purple-400">Architectural Side Profile & Section (Maximized)</span>
                <button
                  onClick={() => setViewportMode('quad')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                >
                  ⟵ Back to 4-Part Quad View
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <SideProfileSvg
                  project={project}
                  options={options}
                  baseHeightMm={Number(wallInputs.baseHeight) || 870}
                  ceilingHeightMm={Number(wallInputs.roomHeight) || 2743}
                />
              </div>
            </div>
          )}

          {viewportMode === 'iso' && (
            <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-bold text-amber-400">3D Axonometric Wireframe (Maximized)</span>
                <button
                  onClick={() => setViewportMode('quad')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                >
                  ⟵ Back to 4-Part Quad View
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                <IsometricSvg
                  walls={walls}
                  cabinets={cabinets}
                  shape={options.shape}
                  island={options.island}
                />
              </div>
            </div>
          )}

          {/* --- FULL ARCHITECTURAL CAD SHOP DRAWING SHEET --- */}
          {viewportMode === 'cad_sheet' && (
            <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs shrink-0">
                <span className="font-bold text-amber-400">Full Architectural Engineering CAD Sheet</span>
                <button
                  onClick={() => setViewportMode('quad')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                >
                  ⟵ Back to 4-Part Quad View
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <ArchitecturalShopDrawing
                  walls={walls}
                  cabinets={cabinets}
                  project={project}
                  options={options}
                />
              </div>
            </div>
          )}

          {/* --- EDITABLE MANUFACTURING BOM TABLE --- */}
          {viewportMode === 'bom' && (
            <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs shrink-0">
                <span className="font-bold text-indigo-400">Manufacturing Bill of Materials (BOM)</span>
                <button
                  onClick={() => setViewportMode('quad')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                >
                  ⟵ Back to 4-Part Quad View
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <EditableBOMTable
                  project={project}
                  initialItems={pricing.bomItems}
                  onSaveBOM={(updated) => {
                    setCustomBOMItems(updated.filter((it) => it.isCustom));
                  }}
                  onResetBOM={() => {
                    setCustomBOMItems([]);
                  }}
                />
              </div>
            </div>
          )}

          {/* --- CUSTOMER QUOTATION DOCUMENT --- */}
          {viewportMode === 'customer_quote' && (
            <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs shrink-0">
                <span className="font-bold text-emerald-400">Customer Quotation Document (Single Lump Sum Investment)</span>
                <button
                  onClick={() => setViewportMode('quad')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                >
                  ⟵ Back to 4-Part Quad View
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex justify-center">
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
            </div>
          )}

          {/* --- CONTRACTOR ZERO-MARGIN QUOTE DOCUMENT --- */}
          {viewportMode === 'contractor_quote' && (
            <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs shrink-0">
                <span className="font-bold text-rose-400">Contractor / Factory Production Cost Order (0% Margin)</span>
                <button
                  onClick={() => setViewportMode('quad')}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-xs transition"
                >
                  ⟵ Back to 4-Part Quad View
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex justify-center">
                <ContractorQuoteDocument
                  project={project}
                  pricing={pricing}
                  options={options}
                  cabinets={cabinets}
                  walls={walls}
                  settings={pricingSettings}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CONFIDENTIAL OWNER SETTINGS MODAL --- */}
      <OwnerSettingsModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        settings={pricingSettings}
        onSaveSettings={setPricingSettings}
        isOwnerUnlocked={isOwnerRole}
        onUnlockOwner={(pin) => {
          if (pin === '1234') {
            setIsOwnerRole(true);
            return true;
          }
          return false;
        }}
      />
    </div>
  );
}

// Core types for LUXUS Aluminium Kitchen Quote Designer (Cabinex Studio)

export type KitchenShape = 'straight' | 'L' | 'U';

export type WallId = 'A' | 'B' | 'C' | 'I';

export interface Opening {
  id: string;
  wallId: WallId;
  type: 'window' | 'door' | 'opening';
  distanceFromLeft: number; // mm
  width: number; // mm
  height: number; // mm
  sillHeight: number; // mm (for windows)
}

export interface Wall {
  id: WallId;
  name: string;
  length: number; // mm
  height: number; // mm
  openings: Opening[];
}

export type DrawerFitting = 'cutlery' | 'cup_saucer' | 'plate_rack' | 'bottle_holder';

export type CabinetType =
  | 'base'
  | 'drawer'
  | 'sink'
  | 'cooker'
  | 'corner'
  | 'filler_base'
  | 'top'
  | 'hood'
  | 'filler_top'
  | 'tall_pantry'
  | 'tall_ref_enclosed'
  | 'tall_ref_free'
  | 'island_base';

export interface Cabinet {
  id: string;
  wallId: WallId;
  type: CabinetType;
  category: 'base' | 'top' | 'tall';
  startMm: number; // position from left of wall in mm
  widthMm: number; // 300, 450, 600, 900, etc.
  depthMm: number; // 600 for base, 350 for top
  heightMm: number; // 870 for base, 700 for top, 2150 for tall
  chargeWidthMm: number; // used for linear-foot billing
  label: string;
  notes?: string;
  locked?: boolean;
  drawerFittings?: DrawerFitting[];
  hasGlassDoor?: boolean;
}

export interface BOMItem {
  id: string;
  code: string;
  name: string;
  category: 'profiles' | 'fittings' | 'hardware' | 'countertop' | 'consumables' | 'custom';
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  isCustom?: boolean;
}

export interface IslandConfig {
  enabled: boolean;
  length: number; // mm
  depth: number; // mm
  hasSink: boolean;
  hasCooker: boolean;
  seatingOverhang: boolean; // 300mm bar overhang
  roomOpposingDimension?: number; // mm to check aisle clearance
}

export interface DesignOptions {
  shape: KitchenShape;
  sink: boolean;
  sinkWall: WallId | 'auto';
  cooker: boolean;
  cookerWidth: 600 | 900;
  hood: boolean;
  refrigerator: 'none' | 'freestanding' | 'enclosed';
  refrigeratorWidth: number; // default 900 mm
  tallPantry: 'none' | '600' | '900' | 'custom';
  tallPantryWidth: number;
  island: IslandConfig;
  topCabinets: boolean;
  highSoffitCabinets?: boolean; // High overhead tier matching shop drawing
  granite: boolean;
  electricalPlumbing: boolean;
  finish: string; // e.g. 'Matte Black Anodized Aluminium', 'Champagne Gold', 'Dark Bronze', 'Pure White'
  drawerBankFittings?: DrawerFitting[];
}

export interface ProjectDetails {
  id: string;
  refNumber: string; // e.g. QT-2026-0184
  revision: number; // 0, 1, 2...
  customerName: string;
  mobile: string;
  location: string;
  wallHeight: number; // default 2700 mm
  notes: string;
  status: 'Draft' | 'Quoted' | 'Confirmed';
  createdAt: string;
  updatedAt: string;
}

export interface PricingSettings {
  // Confidential Fabricator Cost rates (LKR)
  cabinetType: 'full_box' | 'bottom_frame';
  baseInternalRatePerLF: number;        // 15500 (full box) or 13500 (bottom frame)
  bottomFrameInternalRatePerLF: number; // 13500
  topInternalRatePerLF: number;         // 15500
  tallInternalRatePerLF: number;        // 15500
  graniteInternalRatePerSqFt: number;   // 3000 (LKR 3,000 / sq.ft)
  servicesFixedCost: number;            // 50000 (Fixed LKR 50,000)
  transportFixedCost: number;           // 7000 (Fixed LKR 7,000)

  // Client Selling Price Rules (Higher-Price Rule)
  markupMultiplier: number;             // Option A: Cost * 1.35 (default 1.35)
  fixedMarkupAddition: number;          // Option B: Cost + 200,000 (default 200000)
  roundingIncrement: number;            // Clean rounding increment (e.g. 5000 or 10000)

  // Quotation Defaults
  advancePercent: number; // 85%
  leadTimeDays: number;   // 21 days
  bankDetails: string;
}

export interface CalculatedPricing {
  baseLF: number;
  topLF: number;
  tallLF: number;
  totalCabinetLF: number;
  uniqueRunLF: number;
  graniteSqFt: number;

  // Confidential Fabricator Cost Breakdown (Owner only)
  fabricatorCost: {
    baseCost: number;
    topCost: number;
    tallCost: number;
    cabinetsTotal: number;
    graniteCost: number;
    servicesCost: number;
    transportCost: number;
    totalCost: number;
  };

  // Selling Price Calculation (Option A vs Option B Higher Price Rule)
  sellingCalculation: {
    optionACostMarkup: number;
    optionBFixedAddition: number;
    higherRuleChosen: 'Option A (Cost × Multiplier)' | 'Option B (Cost + Fixed Markup)';
    unroundedPrice: number;
    cleanRoundedPrice: number;
  };

  // Customer Quotation Pricing (One clean client-facing amount)
  customerPrice: {
    grandTotal: number;
  };

  // Manufacturing Bill of Materials (BOM)
  bomItems: BOMItem[];

  // Owner Margin Analysis
  grossProfit: number;
  marginPercent: number;
}

export interface DesignWarning {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  wallId?: WallId;
}

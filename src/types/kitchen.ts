// Core types for LUXUS Aluminium Kitchen Quote Designer

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
  widthMm: number;
  depthMm: number;
  heightMm: number;
  chargeWidthMm: number; // actual linear feet charge basis (e.g. deductions on corner overlaps)
  locked: boolean;
  label: string;
  notes?: string;
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
  sinkWall: 'auto' | 'A' | 'B' | 'C' | 'I';
  cooker: boolean;
  cookerWidth: 600 | 900;
  hood: boolean;
  refrigerator: 'none' | 'freestanding' | 'enclosed';
  refrigeratorWidth: number; // default 900 mm
  tallPantry: 'none' | '600' | '900' | 'custom';
  tallPantryWidth: number;
  island: IslandConfig;
  topCabinets: boolean;
  granite: boolean;
  electricalPlumbing: boolean;
  finish: string; // e.g. 'Matte Black Anodized Aluminium', 'Champagne Gold', 'Dark Bronze', 'Pure White'
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
  baseInternalRatePerLF: number; // 15500
  topInternalRatePerLF: number;  // 15500
  tallInternalRatePerLF: number; // 15500
  graniteInternalRatePerSqFt: number; // 300
  servicesRatePerLF: number;     // 1200
  servicesMaxCap: number;        // 50000
  serviceCalcBasis: 'unique_run' | 'total_lf'; // default 'unique_run'

  // Customer Selling Rates (LKR)
  baseSellingRatePerLF: number; // e.g. 24500
  topSellingRatePerLF: number;  // e.g. 22500
  tallSellingRatePerLF: number; // e.g. 29500
  graniteSellingRatePerSqFt: number; // e.g. 1450
  servicesSellingRatePerLF: number;  // e.g. 1800
  servicesSellingMaxCap: number;     // e.g. 75000

  // Quotation Defaults
  advancePercent: number; // 85%
  leadTimeDays: number; // 21 days
  bankDetails: string;
}

export interface CalculatedPricing {
  baseLF: number;
  topLF: number;
  tallLF: number;
  totalCabinetLF: number;
  uniqueRunLF: number;
  graniteSqFt: number;

  // Internal Cost Breakdown (Owner only)
  fabricatorCost: {
    baseCost: number;
    topCost: number;
    tallCost: number;
    cabinetsTotal: number;
    graniteCost: number;
    servicesCost: number;
    totalCost: number;
  };

  // Customer Quotation Pricing
  customerPrice: {
    baseSell: number;
    topSell: number;
    tallSell: number;
    cabinetsSellTotal: number;
    graniteSell: number;
    servicesSell: number;
    grandTotal: number;
  };

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

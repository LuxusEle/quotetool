import {
  Cabinet,
  DesignOptions,
  PricingSettings,
  CalculatedPricing,
  Wall,
} from '@/types/kitchen';

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  // Confidential Internal Fabricator Rates (LKR)
  baseInternalRatePerLF: 15500,
  topInternalRatePerLF: 15500,
  tallInternalRatePerLF: 15500,
  graniteInternalRatePerSqFt: 300,
  servicesRatePerLF: 1200,
  servicesMaxCap: 50000,
  serviceCalcBasis: 'unique_run',

  // Client Selling Rates (LKR)
  baseSellingRatePerLF: 24800,
  topSellingRatePerLF: 21500,
  tallSellingRatePerLF: 28500,
  graniteSellingRatePerSqFt: 1450,
  servicesSellingRatePerLF: 1800,
  servicesSellingMaxCap: 75000,

  advancePercent: 85,
  leadTimeDays: 21,
  bankDetails:
    'Commercial Bank of Ceylon\nAccount Name: LUXUS ELEMENTE (PVT) LTD\nAccount No: 1000 8945 2201\nBranch: Kollupitiya',
};

const MM_PER_LINEAR_FOOT = 304.8;
const MM2_PER_SQFT = 92903.04;

/**
 * Deterministically calculates all Linear Feet, Granite sq ft,
 * Internal Fabricator costs, and Customer Selling Price based strictly
 * on placed cabinet instances.
 */
export function calculatePricing(
  cabinets: Cabinet[],
  walls: Wall[],
  options: DesignOptions,
  settings: PricingSettings = DEFAULT_PRICING_SETTINGS
): CalculatedPricing {
  // 1. Calculate Linear Feet from actual placed cabinet charge widths
  const baseChargeMm = cabinets
    .filter((c) => c.category === 'base')
    .reduce((sum, c) => sum + c.chargeWidthMm, 0);

  const topChargeMm = cabinets
    .filter((c) => c.category === 'top')
    .reduce((sum, c) => sum + c.chargeWidthMm, 0);

  const tallChargeMm = cabinets
    .filter((c) => c.category === 'tall')
    .reduce((sum, c) => sum + c.chargeWidthMm, 0);

  const baseLF = Number((baseChargeMm / MM_PER_LINEAR_FOOT).toFixed(2));
  const topLF = Number((topChargeMm / MM_PER_LINEAR_FOOT).toFixed(2));
  const tallLF = Number((tallChargeMm / MM_PER_LINEAR_FOOT).toFixed(2));
  const totalCabinetLF = Number((baseLF + topLF + tallLF).toFixed(2));

  // 2. Unique Physical Run calculation for Services (Wiring + Plumbing)
  // One run along a wall shouldn't count twice if it has both top and base.
  let uniqueRunMm = 0;
  const activeWallIds = Array.from(new Set(cabinets.map((c) => c.wallId)));
  for (const wId of activeWallIds) {
    const wallCabs = cabinets.filter((c) => c.wallId === wId);
    if (wallCabs.length > 0) {
      const minStart = Math.min(...wallCabs.map((c) => c.startMm));
      const maxEnd = Math.max(...wallCabs.map((c) => c.startMm + c.widthMm));
      uniqueRunMm += Math.max(0, maxEnd - minStart);
    }
  }
  const uniqueRunLF = Number((uniqueRunMm / MM_PER_LINEAR_FOOT).toFixed(2));

  // 3. Granite Countertop Surface Area (Gross mm² / 92,903.04)
  let graniteAreaMm2 = 0;
  if (options.granite) {
    // Perimeter base runs (depth ~ 600mm)
    const perimeterBaseChargeMm = cabinets
      .filter((c) => c.category === 'base' && c.wallId !== 'I')
      .reduce((sum, c) => sum + c.chargeWidthMm, 0);

    graniteAreaMm2 += perimeterBaseChargeMm * 620; // 600 depth + 20mm overhang

    // Island granite
    if (options.island.enabled) {
      const islandLen = options.island.length;
      // Overhang if seating
      const islandDep = options.island.seatingOverhang
        ? options.island.depth + 300
        : options.island.depth;
      graniteAreaMm2 += islandLen * islandDep;
    }
  }
  const graniteSqFt = Number((graniteAreaMm2 / MM2_PER_SQFT).toFixed(2));

  // 4. Fabricator Costs (CONFIDENTIAL)
  const baseCost = Math.round(baseLF * settings.baseInternalRatePerLF);
  const topCost = Math.round(topLF * settings.topInternalRatePerLF);
  const tallCost = Math.round(tallLF * settings.tallInternalRatePerLF);
  const cabinetsTotal = baseCost + topCost + tallCost;

  const graniteCost = options.granite
    ? Math.round(graniteSqFt * settings.graniteInternalRatePerSqFt)
    : 0;

  const serviceLfBasis =
    settings.serviceCalcBasis === 'unique_run' ? uniqueRunLF : totalCabinetLF;

  const rawServiceCost = options.electricalPlumbing
    ? Math.round(serviceLfBasis * settings.servicesRatePerLF)
    : 0;
  const servicesCost = Math.min(rawServiceCost, settings.servicesMaxCap);

  const totalCost = cabinetsTotal + graniteCost + servicesCost;

  // 5. Customer Quotation Selling Price
  const baseSell = Math.round(baseLF * settings.baseSellingRatePerLF);
  const topSell = Math.round(topLF * settings.topSellingRatePerLF);
  const tallSell = Math.round(tallLF * settings.tallSellingRatePerLF);
  const cabinetsSellTotal = baseSell + topSell + tallSell;

  const graniteSell = options.granite
    ? Math.round(graniteSqFt * settings.graniteSellingRatePerSqFt)
    : 0;

  const rawServiceSell = options.electricalPlumbing
    ? Math.round(serviceLfBasis * settings.servicesSellingRatePerLF)
    : 0;
  const servicesSell = Math.min(rawServiceSell, settings.servicesSellingMaxCap);

  const grandTotal = cabinetsSellTotal + graniteSell + servicesSell;

  // 6. Margins
  const grossProfit = grandTotal - totalCost;
  const marginPercent =
    grandTotal > 0 ? Number(((grossProfit / grandTotal) * 100).toFixed(1)) : 0;

  return {
    baseLF,
    topLF,
    tallLF,
    totalCabinetLF,
    uniqueRunLF,
    graniteSqFt,
    fabricatorCost: {
      baseCost,
      topCost,
      tallCost,
      cabinetsTotal,
      graniteCost,
      servicesCost,
      totalCost,
    },
    customerPrice: {
      baseSell,
      topSell,
      tallSell,
      cabinetsSellTotal,
      graniteSell,
      servicesSell,
      grandTotal,
    },
    grossProfit,
    marginPercent,
  };
}

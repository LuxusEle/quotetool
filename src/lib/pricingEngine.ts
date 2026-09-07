import {
  Cabinet,
  DesignOptions,
  PricingSettings,
  CalculatedPricing,
  Wall,
  BOMItem,
} from '@/types/kitchen';

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  // Confidential Internal Fabricator Rates (LKR)
  cabinetType: 'full_box',
  baseInternalRatePerLF: 15500,        // LKR 15,500 / ft for Full-box cabinets
  bottomFrameInternalRatePerLF: 13500, // LKR 13,500 / ft for Bottom frame
  topInternalRatePerLF: 15500,         // LKR 15,500 / ft
  tallInternalRatePerLF: 15500,        // LKR 15,500 / ft
  graniteInternalRatePerSqFt: 3000,    // LKR 3,000 / sq.ft
  servicesFixedCost: 50000,            // Fixed LKR 50,000 (Plumbing + Electrical)
  transportFixedCost: 7000,            // Fixed LKR 7,000

  // Client Selling Price Rules (Higher-Price Rule)
  markupMultiplier: 1.35,              // Option A: Cost × 1.35
  fixedMarkupAddition: 200000,         // Option B: Cost + LKR 200,000
  roundingIncrement: 5000,             // Clean rounding to nearest LKR 5,000 / 10,000

  advancePercent: 85,
  leadTimeDays: 21,
  bankDetails:
    'Commercial Bank of Ceylon\nAccount Name: LUXUS ELEMENTE (PVT) LTD\nAccount No: 1000 8945 2201\nBranch: Kollupitiya',
};

const MM_PER_LINEAR_FOOT = 304.8;
const MM2_PER_SQFT = 92903.04;

/**
 * Generates an itemized manufacturing Bill of Materials (BOM)
 * based on the placed cabinet modules, hardware schedules, and countertop.
 */
export function generateBOM(
  cabinets: Cabinet[],
  walls: Wall[],
  options: DesignOptions,
  settings: PricingSettings = DEFAULT_PRICING_SETTINGS,
  customItems: BOMItem[] = []
): BOMItem[] {
  const items: BOMItem[] = [];

  const baseChargeMm = cabinets
    .filter((c) => c.category === 'base')
    .reduce((sum, c) => sum + c.chargeWidthMm, 0);

  const topChargeMm = cabinets
    .filter((c) => c.category === 'top')
    .reduce((sum, c) => sum + c.chargeWidthMm, 0);

  const tallChargeMm = cabinets
    .filter((c) => c.category === 'tall')
    .reduce((sum, c) => sum + c.chargeWidthMm, 0);

  const totalBaseLF = Number((baseChargeMm / MM_PER_LINEAR_FOOT).toFixed(1));
  const totalTopLF = Number((topChargeMm / MM_PER_LINEAR_FOOT).toFixed(1));
  const totalTallLF = Number((tallChargeMm / MM_PER_LINEAR_FOOT).toFixed(1));
  const totalLF = Number((totalBaseLF + totalTopLF + totalTallLF).toFixed(1));

  // 1. Aluminium Box Carcass Extrusions
  const carcassProfileMeters = Math.ceil(totalLF * 3.2);
  items.push({
    id: 'bom-prof-1',
    code: 'ALU-BX-4040',
    name: 'Aluminium Heavy-Duty Box Carcass Profile (40×40 Anodized)',
    category: 'profiles',
    quantity: carcassProfileMeters,
    unit: 'meters',
    unitCost: 1450,
    totalCost: carcassProfileMeters * 1450,
  });

  // 2. Door Shutter Frame Profile
  const doorShutterMeters = Math.ceil(totalLF * 2.6);
  items.push({
    id: 'bom-prof-2',
    code: 'ALU-SH-2045',
    name: `Aluminium Door Shutter Frame Profile (${options.finish})`,
    category: 'profiles',
    quantity: doorShutterMeters,
    unit: 'meters',
    unitCost: 1250,
    totalCost: doorShutterMeters * 1250,
  });

  // 3. ACP Composite Panel Lining
  const acpSheets = Math.ceil((totalLF * 0.8) / 2.88);
  items.push({
    id: 'bom-prof-3',
    code: 'ACP-4MM-EXT',
    name: '4mm Aluminium Composite Sheet (Waterproof Inner Lining & Shelves)',
    category: 'profiles',
    quantity: acpSheets,
    unit: 'sheets (8×4 ft)',
    unitCost: 8500,
    totalCost: acpSheets * 8500,
  });

  // 4. Heavy Duty Soft-Close Hinges
  const standardCabinetsCount = cabinets.filter(
    (c) => c.type !== 'drawer' && c.type !== 'hood' && !c.type.includes('filler')
  ).length;
  const hingePairs = Math.max(6, standardCabinetsCount * 2);
  items.push({
    id: 'bom-hw-1',
    code: 'HD-HNG-110',
    name: 'Heavy-Duty German 110° Clip-On Soft-Close Hinges',
    category: 'hardware',
    quantity: hingePairs * 2,
    unit: 'pcs',
    unitCost: 850,
    totalCost: hingePairs * 2 * 850,
  });

  // 5. Drawer Runners
  const drawerUnits = cabinets.filter((c) => c.type === 'drawer');
  const drawerRunnerPairs = Math.max(3, drawerUnits.length * 3);
  items.push({
    id: 'bom-hw-2',
    code: 'DR-RUN-500',
    name: 'Concealed Tandem Full-Extension Soft-Close Drawer Runners (500mm)',
    category: 'hardware',
    quantity: drawerRunnerPairs,
    unit: 'pairs',
    unitCost: 4200,
    totalCost: drawerRunnerPairs * 4200,
  });

  // 6. Specialized Functional Fittings (Matching User Shop Drawing Wire Diagram)
  items.push({
    id: 'bom-fit-1',
    code: 'ORG-SS-CUTLERY',
    name: 'Stainless Steel 304 Modular Cutlery Tray Organizer Insert',
    category: 'fittings',
    quantity: 1,
    unit: 'set',
    unitCost: 8500,
    totalCost: 8500,
  });

  items.push({
    id: 'bom-fit-2',
    code: 'ORG-SS-CUPSAUCER',
    name: 'Stainless Steel Cup & Saucer Wire Rack System',
    category: 'fittings',
    quantity: 1,
    unit: 'set',
    unitCost: 9500,
    totalCost: 9500,
  });

  items.push({
    id: 'bom-fit-3',
    code: 'ORG-SS-PLATE',
    name: 'Stainless Steel Deep Plate Rack Organizer System',
    category: 'fittings',
    quantity: 1,
    unit: 'set',
    unitCost: 11500,
    totalCost: 11500,
  });

  items.push({
    id: 'bom-fit-4',
    code: 'ORG-SS-BOTTLE',
    name: 'Side-Mounted 2-Tier Stainless Steel Bottle & Spice Pullout Basket',
    category: 'fittings',
    quantity: 1,
    unit: 'set',
    unitCost: 14500,
    totalCost: 14500,
  });

  // 7. Granite Countertop
  if (options.granite) {
    let graniteAreaMm2 = baseChargeMm * 610;
    if (options.island.enabled) {
      graniteAreaMm2 += options.island.length * (options.island.depth + (options.island.seatingOverhang ? 300 : 0));
    }
    const graniteSqFt = Number((graniteAreaMm2 / MM2_PER_SQFT).toFixed(1));
    items.push({
      id: 'bom-cnt-1',
      code: 'GRN-SLAB-20',
      name: 'High-Grade Solid Granite Countertop Slab (20mm Bullnose Polished)',
      category: 'countertop',
      quantity: graniteSqFt,
      unit: 'sq.ft',
      unitCost: settings.graniteInternalRatePerSqFt || 3000,
      totalCost: Math.round(graniteSqFt * (settings.graniteInternalRatePerSqFt || 3000)),
    });
  }

  // 8. Consumables & Fasteners
  items.push({
    id: 'bom-cns-1',
    code: 'FST-BRK-SS',
    name: 'Stainless Steel Internal Rigid Corner Angle Brackets & Screws',
    category: 'consumables',
    quantity: Math.ceil(totalLF * 4),
    unit: 'sets',
    unitCost: 220,
    totalCost: Math.ceil(totalLF * 4) * 220,
  });

  items.push({
    id: 'bom-cns-2',
    code: 'SL-NEUT-CLR',
    name: 'Anti-Fungal Neutral Silicone Sealant & Assembly Adhesive Cartridges',
    category: 'consumables',
    quantity: 4,
    unit: 'tubes',
    unitCost: 1650,
    totalCost: 4 * 1650,
  });

  // 9. Transport
  items.push({
    id: 'bom-cns-3',
    code: 'LOG-TRN-COL',
    name: 'Workshop Direct Site Delivery & Logistics Handling',
    category: 'consumables',
    quantity: 1,
    unit: 'trip',
    unitCost: settings.transportFixedCost || 7000,
    totalCost: settings.transportFixedCost || 7000,
  });

  // Append any custom items entered by user
  for (const cust of customItems) {
    items.push({
      ...cust,
      totalCost: Math.round(cust.quantity * cust.unitCost),
      isCustom: true,
    });
  }

  return items;
}

/**
 * Deterministically calculates all Linear Feet, Granite sq ft,
 * Internal Fabricator costs, Manufacturing BOM, and Customer Selling Price.
 */
export function calculatePricing(
  cabinets: Cabinet[],
  walls: Wall[],
  options: DesignOptions,
  settings: PricingSettings = DEFAULT_PRICING_SETTINGS,
  customBOMItems: BOMItem[] = []
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

  // 2. Unique Physical Run calculation for perimeter runs
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
    const perimeterBaseChargeMm = cabinets
      .filter((c) => c.category === 'base' && c.wallId !== 'I')
      .reduce((sum, c) => sum + c.chargeWidthMm, 0);

    graniteAreaMm2 += perimeterBaseChargeMm * 610; // 610mm depth (2.0 ft)

    if (options.island.enabled) {
      const islandLen = options.island.length;
      const islandDep = options.island.seatingOverhang
        ? options.island.depth + 300
        : options.island.depth;
      graniteAreaMm2 += islandLen * islandDep;
    }
  }
  const graniteSqFt = Number((graniteAreaMm2 / MM2_PER_SQFT).toFixed(2));

  // 4. Fabricator Costs (CONFIDENTIAL)
  const baseRate =
    settings.cabinetType === 'bottom_frame'
      ? settings.bottomFrameInternalRatePerLF
      : settings.baseInternalRatePerLF;

  const baseCost = Math.round(baseLF * baseRate);
  const topCost = Math.round(topLF * settings.topInternalRatePerLF);
  const tallCost = Math.round(tallLF * settings.tallInternalRatePerLF);
  const cabinetsTotal = baseCost + topCost + tallCost;

  const graniteCost = options.granite
    ? Math.round(graniteSqFt * settings.graniteInternalRatePerSqFt)
    : 0;

  const servicesCost = options.electricalPlumbing
    ? settings.servicesFixedCost
    : 0;

  const transportCost = settings.transportFixedCost;

  // Custom items total
  const customItemsCost = customBOMItems.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitCost),
    0
  );

  const totalCost = cabinetsTotal + graniteCost + servicesCost + transportCost + customItemsCost;

  // 5. Generate Manufacturing BOM
  const bomItems = generateBOM(cabinets, walls, options, settings, customBOMItems);

  // 6. Selling Price Calculation (Option A vs Option B Higher Price Rule)
  const optionACostMarkup = Number((totalCost * (settings.markupMultiplier || 1.35)).toFixed(2));
  const optionBFixedAddition = totalCost + (settings.fixedMarkupAddition || 200000);

  const higherRuleChosen =
    optionACostMarkup >= optionBFixedAddition
      ? 'Option A (Cost × Multiplier)'
      : 'Option B (Cost + Fixed Markup)';

  const unroundedPrice = Math.max(optionACostMarkup, optionBFixedAddition);

  // Clean rounding
  const roundInc = settings.roundingIncrement || 5000;
  const cleanRoundedPrice = Math.ceil(unroundedPrice / roundInc) * roundInc;

  // 7. Margins
  const grandTotal = cleanRoundedPrice;
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
      transportCost,
      totalCost,
    },
    sellingCalculation: {
      optionACostMarkup,
      optionBFixedAddition,
      higherRuleChosen,
      unroundedPrice,
      cleanRoundedPrice,
    },
    customerPrice: {
      grandTotal,
    },
    bomItems,
    grossProfit,
    marginPercent,
  };
}

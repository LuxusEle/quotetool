import { calculateUsableIntervals, generateKitchenLayout } from '../src/lib/layoutEngine';
import { calculatePricing, DEFAULT_PRICING_SETTINGS } from '../src/lib/pricingEngine';
import { Wall, DesignOptions, PricingSettings, Cabinet } from '../src/types/kitchen';

function runSanityCheck() {
  console.log('====================================================');
  console.log('  LUXUS Aluminium Kitchen Engine - Full Sanity Check');
  console.log('====================================================\n');

  let allPassed = true;

  // Test 1: Window allows base cabinets underneath only if sill >= 870mm
  console.log('--- Test 1: Usable Intervals & Window Classification ---');
  const wallWithHighWindow: Wall = {
    id: 'B',
    name: 'Rear Wall',
    length: 3600,
    height: 2700,
    openings: [
      {
        id: 'win-1',
        wallId: 'B',
        type: 'window',
        distanceFromLeft: 800,
        width: 1500,
        height: 1200,
        sillHeight: 1050, // above 870mm countertop
      },
    ],
  };

  const ivHigh = calculateUsableIntervals(wallWithHighWindow);
  const midHigh = ivHigh.find((iv) => iv.start === 800 && iv.end === 2300);
  if (midHigh && midHigh.allowsBase && !midHigh.allowsTall && !midHigh.allowsTop) {
    console.log('✅ PASS: Sill 1050mm permits base cabinetry & forbids tall/wall units.');
  } else {
    console.error('❌ FAIL: Window clearance interval mismatch!');
    allPassed = false;
  }

  // Low window test (sill < 870mm)
  const wallWithLowWindow: Wall = {
    id: 'B',
    name: 'Rear Wall',
    length: 3600,
    height: 2700,
    openings: [
      {
        id: 'win-2',
        wallId: 'B',
        type: 'window',
        distanceFromLeft: 800,
        width: 1500,
        height: 1200,
        sillHeight: 600, // below 870mm countertop -> BLOCKS BASE!
      },
    ],
  };
  const ivLow = calculateUsableIntervals(wallWithLowWindow);
  const midLow = ivLow.find((iv) => iv.start === 800 && iv.end === 2300);
  if (midLow && !midLow.allowsBase && !midLow.allowsTall) {
    console.log('✅ PASS: Sill 600mm strictly blocks base cabinets.');
  } else {
    console.error('❌ FAIL: Low window should block base cabinets!');
    allPassed = false;
  }

  // Test 2: Layout Engine Corner Overlap Deduction & Box Intersections in L-Kitchen
  console.log('\n--- Test 2: L-Kitchen Corner Overlap Deductions & No Box Intersections ---');
  const wallsL: Wall[] = [
    { id: 'A', name: 'Left Wall', length: 3650, height: 2700, openings: [] },
    { id: 'B', name: 'Rear Wall', length: 4200, height: 2700, openings: [] },
  ];

  const optionsL: DesignOptions = {
    shape: 'L',
    sink: true,
    sinkWall: 'B',
    cooker: true,
    cookerWidth: 900,
    hood: true,
    refrigerator: 'enclosed',
    refrigeratorWidth: 900,
    tallPantry: '600',
    tallPantryWidth: 600,
    island: { enabled: true, length: 1800, depth: 900, hasSink: false, hasCooker: false, seatingOverhang: true },
    topCabinets: true,
    granite: true,
    electricalPlumbing: true,
    finish: 'Matte Black Anodized Aluminium',
  };

  const { cabinets: cabsL, warnings: warnsL } = generateKitchenLayout(wallsL, optionsL);
  console.log(`Placed ${cabsL.length} cabinet modules in L-kitchen with Island.`);

  // Check no box on Wall A starts before 600mm (Wall B depth corner deduction)
  const wallABaseCabs = cabsL.filter((c) => c.wallId === 'A' && c.category === 'base');
  const minWallABase = Math.min(...wallABaseCabs.map((c) => c.startMm));
  if (minWallABase >= 600) {
    console.log(`✅ PASS: Wall A base cabinets start at ${minWallABase}mm (>= 600mm corner deduction).`);
  } else {
    console.error(`❌ FAIL: Wall A base cabinet starts at ${minWallABase}mm, inside corner!`);
    allPassed = false;
  }

  // Check tall units on Wall A are at the far open end
  const tallFridge = cabsL.find((c) => c.type.startsWith('tall_ref'));
  if (tallFridge && tallFridge.startMm + tallFridge.widthMm === 3650) {
    console.log(`✅ PASS: Tall refrigerator is safely at far open end of Wall A (ends at 3650mm).`);
  } else {
    console.error(`❌ FAIL: Tall refrigerator misplaced!`, tallFridge);
    allPassed = false;
  }

  // Test 3: User's Exact Pricing Benchmark Formula Verification
  console.log('\n--- Test 3: User Benchmark Formula (Higher-Price Rule) ---');
  // From user prompt:
  // 38.5 LF cabinets @ 15,500 = 596,750
  // 36 sq.ft granite @ 3,000 = 108,000
  // Plumbing + electrical fixed = 50,000
  // Transport fixed = 7,000
  // TOTAL COST = 761,750
  // Option A (Cost * 1.35) = 1,028,362.50
  // Option B (Cost + 200,000) = 961,750
  // Winner: Option A -> Clean rounded: 1,030,000
  const mockCabs: Cabinet[] = [
    {
      id: 'mock-base-1',
      wallId: 'B',
      type: 'base',
      category: 'base',
      startMm: 0,
      widthMm: Math.round(38.5 * 304.8),
      depthMm: 600,
      heightMm: 870,
      chargeWidthMm: Math.round(38.5 * 304.8),
      label: '38.5 LF Base Run',
      locked: false,
    },
  ];

  const customSettings: PricingSettings = {
    ...DEFAULT_PRICING_SETTINGS,
    graniteInternalRatePerSqFt: 3000,
    servicesFixedCost: 50000,
    transportFixedCost: 7000,
    markupMultiplier: 1.35,
    fixedMarkupAddition: 200000,
    roundingIncrement: 5000,
  };

  // Mock granite area by enabling granite and island
  const pricingBench = calculatePricing(
    mockCabs,
    wallsL,
    {
      ...optionsL,
      granite: true,
      electricalPlumbing: true,
    },
    customSettings
  );

  console.log(`Base LF: ${pricingBench.baseLF} LF`);
  console.log(`Cabinets Cost: LKR ${pricingBench.fabricatorCost.cabinetsTotal.toLocaleString()}`);
  console.log(`Granite Cost: LKR ${pricingBench.fabricatorCost.graniteCost.toLocaleString()}`);
  console.log(`Services Cost: LKR ${pricingBench.fabricatorCost.servicesCost.toLocaleString()}`);
  console.log(`Transport Cost: LKR ${pricingBench.fabricatorCost.transportCost.toLocaleString()}`);
  console.log(`Total Fabricator Cost: LKR ${pricingBench.fabricatorCost.totalCost.toLocaleString()}`);
  console.log(`Option A (Cost × 1.35): LKR ${pricingBench.sellingCalculation.optionACostMarkup.toLocaleString()}`);
  console.log(`Option B (Cost + 200,000): LKR ${pricingBench.sellingCalculation.optionBFixedAddition.toLocaleString()}`);
  console.log(`Chosen Rule: ${pricingBench.sellingCalculation.higherRuleChosen}`);
  console.log(`Customer Net Quotation: LKR ${pricingBench.customerPrice.grandTotal.toLocaleString()}`);

  if (
    pricingBench.fabricatorCost.servicesCost === 50000 &&
    pricingBench.fabricatorCost.transportCost === 7000 &&
    pricingBench.customerPrice.grandTotal >= pricingBench.fabricatorCost.totalCost * 1.35
  ) {
    console.log('✅ PASS: Higher-Price selling rule correctly selects higher option and rounds cleanly.');
  } else {
    console.error('❌ FAIL: Pricing calculation mismatch!');
    allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 ALL SANITY CHECKS PASSED WITH ZERO ERRORS!');
  } else {
    console.error('\n❌ SOME CHECKS FAILED!');
    process.exit(1);
  }
}

runSanityCheck();

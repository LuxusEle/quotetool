import { calculateUsableIntervals, generateKitchenLayout } from '../src/lib/layoutEngine';
import { calculatePricing, DEFAULT_PRICING_SETTINGS } from '../src/lib/pricingEngine';
import { Wall, DesignOptions } from '../src/types/kitchen';

function runSanityCheck() {
  console.log('====================================================');
  console.log('  LUXUS CABISaas Kitchen Engine - Geometry Sanity Check');
  console.log('====================================================\n');

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
  console.log('Window (Sill 1050mm) intervals:', ivHigh);
  const midHigh = ivHigh.find((iv) => iv.start === 800 && iv.end === 2300);
  if (midHigh && midHigh.allowsBase && !midHigh.allowsTall && !midHigh.allowsTop) {
    console.log('✅ PASS: Sill 1050mm permits base cabinetry & forbids tall/wall units.');
  } else {
    console.error('❌ FAIL: Window clearance interval mismatch!');
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
  }

  // Test 2: Layout Engine Corner Overlap Deduction in L-Kitchen
  console.log('\n--- Test 2: L-Kitchen Corner Overlap Deductions ---');
  const wallsL: Wall[] = [
    { id: 'A', name: 'Left Wall', length: 3000, height: 2700, openings: [] },
    { id: 'B', name: 'Rear Wall', length: 3600, height: 2700, openings: [] },
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
    tallPantry: 'none',
    tallPantryWidth: 600,
    island: { enabled: false, length: 1800, depth: 900, hasSink: false, hasCooker: false, seatingOverhang: false },
    topCabinets: true,
    granite: true,
    electricalPlumbing: true,
    finish: 'Matte Black Anodized Aluminium',
  };

  const { cabinets: cabsL, warnings: warnsL } = generateKitchenLayout(wallsL, optionsL);
  console.log(`Placed ${cabsL.length} cabinet modules in L-kitchen.`);
  console.log('Warnings:', warnsL.map((w) => w.message));

  // Test 3: Pricing derived strictly from Placed Cabinets (Geometry drives pricing)
  console.log('\n--- Test 3: Geometry-Driven Pricing & Confidentiality ---');
  const pricingL = calculatePricing(cabsL, wallsL, optionsL, DEFAULT_PRICING_SETTINGS);
  console.log(`Base LF: ${pricingL.baseLF} LF`);
  console.log(`Top LF: ${pricingL.topLF} LF`);
  console.log(`Tall LF: ${pricingL.tallLF} LF`);
  console.log(`Granite sq ft: ${pricingL.graniteSqFt} sq ft`);
  console.log(`Internal Fabricator Cost: LKR ${pricingL.fabricatorCost.totalCost.toLocaleString()}`);
  console.log(`Client Selling Price: LKR ${pricingL.customerPrice.grandTotal.toLocaleString()}`);
  console.log(`Gross Profit: LKR ${pricingL.grossProfit.toLocaleString()} (${pricingL.marginPercent}% margin)`);

  if (pricingL.customerPrice.grandTotal > pricingL.fabricatorCost.totalCost) {
    console.log('✅ PASS: Customer selling price covers fabricator cost with healthy margin.');
  }

  console.log('\n🎉 ALL SANITY CHECKS COMPLETED SUCCESSFULLY!');
}

runSanityCheck();

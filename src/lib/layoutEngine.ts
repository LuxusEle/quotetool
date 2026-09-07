import {
  Wall,
  WallId,
  Opening,
  Cabinet,
  DesignOptions,
  DesignWarning,
  CabinetType,
} from '@/types/kitchen';

export interface UsableInterval {
  start: number;
  end: number;
  length: number;
  allowsBase: boolean;
  allowsTop: boolean;
  allowsTall: boolean;
}

const COUNTERTOP_HEIGHT_MM = 870; // 850 base + 20 countertop
const WALL_CABINET_BOTTOM_MM = 1450; // starts 580mm above countertop
const STANDARD_BASE_DEPTH = 600;
const STANDARD_TOP_DEPTH = 350;
const STANDARD_TALL_DEPTH = 600;

/**
 * Calculates usable intervals along a single wall considering openings.
 */
export function calculateUsableIntervals(wall: Wall): UsableInterval[] {
  const points = new Set<number>([0, wall.length]);
  for (const op of wall.openings) {
    points.add(Math.max(0, Math.min(wall.length, op.distanceFromLeft)));
    points.add(Math.max(0, Math.min(wall.length, op.distanceFromLeft + op.width)));
  }

  const sortedPoints = Array.from(points).sort((a, b) => a - b);
  const intervals: UsableInterval[] = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    const length = end - start;
    if (length < 10) continue; // ignore tiny slivers

    let allowsBase = true;
    let allowsTop = true;
    let allowsTall = true;

    // Check which openings intersect this interval
    const mid = (start + end) / 2;
    for (const op of wall.openings) {
      const opStart = op.distanceFromLeft;
      const opEnd = op.distanceFromLeft + op.width;

      if (mid >= opStart && mid <= opEnd) {
        if (op.type === 'door' || op.type === 'opening') {
          // Doors and open archways block everything from floor to ceiling
          allowsBase = false;
          allowsTop = false;
          allowsTall = false;
        } else if (op.type === 'window') {
          // Tall units are strictly blocked by windows
          allowsTall = false;

          // Base cabinets can pass under window only if sill height is above countertop
          if (op.sillHeight < COUNTERTOP_HEIGHT_MM) {
            allowsBase = false;
          }

          // Top/wall cabinets can only fit if window top is below wall cabinet bottom
          const windowTop = op.sillHeight + op.height;
          if (op.sillHeight < 2100 && windowTop > WALL_CABINET_BOTTOM_MM) {
            allowsTop = false;
          }
        }
      }
    }

    intervals.push({
      start,
      end,
      length,
      allowsBase,
      allowsTop,
      allowsTall,
    });
  }

  return intervals;
}

/**
 * Deterministic Kitchen Layout Engine
 * Converts room geometry, openings, and options into exact cabinet boxes without overlaps or gaps.
 */
export function generateKitchenLayout(
  walls: Wall[],
  options: DesignOptions,
  existingCabinets: Cabinet[] = []
): { cabinets: Cabinet[]; warnings: DesignWarning[] } {
  const warnings: DesignWarning[] = [];
  const cabinets: Cabinet[] = [];

  // Keep manually locked cabinets from existing layout
  const lockedCabinets = existingCabinets.filter((c) => c.locked);
  cabinets.push(...lockedCabinets);

  const activeWallIds: WallId[] =
    options.shape === 'straight'
      ? ['A']
      : options.shape === 'L'
      ? ['A', 'B']
      : ['A', 'B', 'C'];
  if (options.island.enabled && !activeWallIds.includes('I')) {
    activeWallIds.push('I');
  }

  const activeWalls = walls.filter((w) => activeWallIds.includes(w.id));

  // Corner Deductions:
  // Convention:
  // Corner 1: Wall A meets Wall B at corner.
  // Wall B runs from x=0 to x=lengthB (left to right).
  // Wall A runs from the corner (y=0) towards the front room (y=lengthA).
  // So at the A-B corner: Wall B starts at x=0. Wall A starts at y=STANDARD_BASE_DEPTH (600mm)
  // so Wall A cabinets do NOT collide with Wall B depth (600mm).
  const cornerDeductions: Record<WallId, { startBase: number; endBase: number; startTop: number; endTop: number }> = {
    A: { startBase: 0, endBase: 0, startTop: 0, endTop: 0 },
    B: { startBase: 0, endBase: 0, startTop: 0, endTop: 0 },
    C: { startBase: 0, endBase: 0, startTop: 0, endTop: 0 },
    I: { startBase: 0, endBase: 0, startTop: 0, endTop: 0 },
  };

  if (options.shape === 'L' || options.shape === 'U') {
    // Wall A starts after Wall B base cabinet depth (600mm) and top depth (350mm)
    cornerDeductions['A'].startBase = STANDARD_BASE_DEPTH;
    cornerDeductions['A'].startTop = STANDARD_TOP_DEPTH;
  }

  if (options.shape === 'U') {
    // Wall C starts after Wall B depth at the other corner
    cornerDeductions['C'].startBase = STANDARD_BASE_DEPTH;
    cornerDeductions['C'].startTop = STANDARD_TOP_DEPTH;
  }

  // --- 1. SINK PLACEMENT ---
  let sinkPlaced = lockedCabinets.some((c) => c.type === 'sink');
  let targetSinkWallId: WallId = activeWallIds[0];

  if (!sinkPlaced && options.sink) {
    if (options.sinkWall !== 'auto' && options.sinkWall !== 'I') {
      targetSinkWallId = options.sinkWall;
    } else if (options.sinkWall === 'I' && options.island.enabled) {
      targetSinkWallId = 'I';
    } else {
      // Find wall with a suitable window
      const wallWithWindow = activeWalls.find((w) =>
        w.openings.some((op) => op.type === 'window' && op.sillHeight >= COUNTERTOP_HEIGHT_MM)
      );
      if (wallWithWindow) {
        targetSinkWallId = wallWithWindow.id;
      } else {
        targetSinkWallId = activeWallIds[0];
      }
    }

    const sinkWidth = 900;
    const targetWall = walls.find((w) => w.id === targetSinkWallId);

    if (targetWall) {
      const intervals = calculateUsableIntervals(targetWall);
      const baseIntervals = intervals.filter((iv) => iv.allowsBase);
      const windowOp = targetWall.openings.find((op) => op.type === 'window');

      let sinkStart = -1;

      if (windowOp) {
        if (windowOp.sillHeight < COUNTERTOP_HEIGHT_MM) {
          warnings.push({
            id: 'sink-window-low',
            type: 'warning',
            message: `Window on Wall ${targetWall.id} sill (${windowOp.sillHeight}mm) is below countertop height (${COUNTERTOP_HEIGHT_MM}mm). Sink cannot fit underneath.`,
            wallId: targetWall.id,
          });
        } else {
          // Center sink under window
          const windowCenter = windowOp.distanceFromLeft + windowOp.width / 2;
          const candidateStart = Math.round(windowCenter - sinkWidth / 2);

          const candidateIv = baseIntervals.find(
            (iv) => candidateStart >= iv.start && candidateStart + sinkWidth <= iv.end
          );

          if (candidateIv) {
            const minStart = candidateIv.start + cornerDeductions[targetWall.id].startBase;
            const maxStart = candidateIv.end - cornerDeductions[targetWall.id].endBase - sinkWidth;
            if (maxStart >= minStart) {
              sinkStart = Math.max(minStart, Math.min(maxStart, candidateStart));
            }
          }
        }
      }

      // Fallback: place in largest base interval on this wall
      if (sinkStart < 0) {
        const sorted = [...baseIntervals].sort((a, b) => b.length - a.length);
        if (sorted.length > 0 && sorted[0].length >= sinkWidth) {
          sinkStart = sorted[0].start + cornerDeductions[targetWall.id].startBase + 100;
        }
      }

      if (
        sinkStart >= 0 &&
        sinkStart + sinkWidth <= targetWall.length - cornerDeductions[targetWall.id].endBase
      ) {
        cabinets.push({
          id: `sink-${targetWall.id}`,
          wallId: targetWall.id,
          type: 'sink',
          category: 'base',
          startMm: sinkStart,
          widthMm: sinkWidth,
          depthMm: STANDARD_BASE_DEPTH,
          heightMm: COUNTERTOP_HEIGHT_MM,
          chargeWidthMm: sinkWidth,
          locked: false,
          label: '900 Sink Unit',
          notes: 'Double bowl stainless sink with mixer cutout',
        });
        sinkPlaced = true;
      }
    }
  }

  // --- 2. REFRIGERATOR & TALL UNITS PLACEMENT ---
  // Preferred at END OF WALL RUN (far edge of Wall A or far edge of Wall B)
  // Wall A end is wallA.length. Placing tall units at wallA.length puts them safely at the end of run.
  const wallForTall = activeWalls.find((w) => w.id === 'A') || activeWalls.find((w) => w.id === 'B');

  if (wallForTall) {
    const intervals = calculateUsableIntervals(wallForTall);
    const tallIntervals = intervals.filter((iv) => iv.allowsTall);

    // Refrigerator
    if (options.refrigerator !== 'none' && !cabinets.some((c) => c.type.startsWith('tall_ref'))) {
      const refWidth = options.refrigeratorWidth || 900;
      const refType: CabinetType =
        options.refrigerator === 'enclosed' ? 'tall_ref_enclosed' : 'tall_ref_free';

      const lastIv = [...tallIntervals].reverse().find((iv) => iv.length >= refWidth);
      if (lastIv) {
        const placePos = lastIv.end - refWidth;
        cabinets.push({
          id: `ref-${wallForTall.id}`,
          wallId: wallForTall.id,
          type: refType,
          category: 'tall',
          startMm: placePos,
          widthMm: refWidth,
          depthMm: STANDARD_TALL_DEPTH,
          heightMm: 2150,
          chargeWidthMm: options.refrigerator === 'enclosed' ? refWidth : 0,
          locked: false,
          label: options.refrigerator === 'enclosed' ? `${refWidth} Ref Housing` : `${refWidth} Freestanding Ref`,
          notes: options.refrigerator === 'enclosed' ? 'Full height enclosed cabinet' : 'Customer appliance space',
        });
      }
    }

    // Tall Pantry (placed right next to refrigerator)
    if (options.tallPantry !== 'none' && !cabinets.some((c) => c.type === 'tall_pantry')) {
      const pantryWidth = options.tallPantryWidth || 600;
      const refCab = cabinets.find((c) => c.wallId === wallForTall.id && c.type.startsWith('tall_ref'));

      let pantryStart = -1;
      if (refCab) {
        const tryLeft = refCab.startMm - pantryWidth;
        const fitsLeft = tallIntervals.some((iv) => tryLeft >= iv.start && tryLeft + pantryWidth <= iv.end);
        if (fitsLeft && tryLeft >= cornerDeductions[wallForTall.id].startBase) {
          pantryStart = tryLeft;
        }
      }

      if (pantryStart >= 0) {
        cabinets.push({
          id: `pantry-${wallForTall.id}`,
          wallId: wallForTall.id,
          type: 'tall_pantry',
          category: 'tall',
          startMm: pantryStart,
          widthMm: pantryWidth,
          depthMm: STANDARD_TALL_DEPTH,
          heightMm: 2150,
          chargeWidthMm: pantryWidth,
          locked: false,
          label: `${pantryWidth} Tall Pantry`,
          notes: 'Aluminium carcass with pull-out internal drawers',
        });
      }
    }
  }

  // --- 3. COOKER / HOB PLACEMENT ---
  let cookerPlaced = cabinets.some((c) => c.type === 'cooker');
  if (!cookerPlaced && options.cooker) {
    const cookerWidth = options.cookerWidth || 900;
    const minLanding = 300;

    // Preferred on Wall B if sink is not occupying the middle, or Wall A
    const sinkCab = cabinets.find((c) => c.type === 'sink');
    const targetWalls = activeWalls.filter((w) => w.id === 'B').concat(activeWalls.filter((w) => w.id !== 'B'));

    for (const wall of targetWalls) {
      if (cookerPlaced) break;
      const intervals = calculateUsableIntervals(wall);
      const cookerViable = intervals.filter((iv) => {
        if (!iv.allowsBase) return false;
        const wallWindows = wall.openings.filter((op) => op.type === 'window');
        return !wallWindows.some(
          (op) => !(iv.end <= op.distanceFromLeft || iv.start >= op.distanceFromLeft + op.width)
        );
      });

      for (const iv of cookerViable) {
        const occupied = cabinets.filter((c) => c.wallId === wall.id && c.category !== 'top');
        const startBound = iv.start + cornerDeductions[wall.id].startBase;
        const endBound = iv.end - cornerDeductions[wall.id].endBase;

        // Try candidate positions with landing space
        const step = 50;
        for (let pos = startBound + minLanding; pos <= endBound - minLanding - cookerWidth; pos += step) {
          const collides = occupied.some(
            (c) => !(pos + cookerWidth <= c.startMm || pos >= c.startMm + c.widthMm)
          );
          if (!collides) {
            cabinets.push({
              id: `cooker-${wall.id}`,
              wallId: wall.id,
              type: 'cooker',
              category: 'base',
              startMm: pos,
              widthMm: cookerWidth,
              depthMm: STANDARD_BASE_DEPTH,
              heightMm: COUNTERTOP_HEIGHT_MM,
              chargeWidthMm: cookerWidth,
              locked: false,
              label: `${cookerWidth} Hob/Cooker Unit`,
              notes: 'Heat-resistant aluminium frame with gas/induction provision',
            });

            if (options.hood) {
              cabinets.push({
                id: `hood-${wall.id}`,
                wallId: wall.id,
                type: 'hood',
                category: 'top',
                startMm: pos,
                widthMm: cookerWidth,
                depthMm: STANDARD_TOP_DEPTH,
                heightMm: 700,
                chargeWidthMm: cookerWidth,
                locked: false,
                label: `${cookerWidth} Chimney Hood Unit`,
                notes: 'Upper hood housing with ducting pathway',
              });
            }

            cookerPlaced = true;
            break;
          }
        }
      }
    }
  }

  // --- 4. FILL REMAINING SECTIONS SEAMLESSLY (NO GAPS, NO OVERLAPS) ---
  for (const wall of activeWalls) {
    const intervals = calculateUsableIntervals(wall);

    // BASE FILL
    for (const iv of intervals.filter((i) => i.allowsBase)) {
      const startLimit = iv.start + cornerDeductions[wall.id].startBase;
      const endLimit = iv.end - cornerDeductions[wall.id].endBase;
      if (endLimit <= startLimit) continue;

      // Occupied segments on this wall (base or tall)
      const occupied = cabinets
        .filter((c) => c.wallId === wall.id && (c.category === 'base' || c.category === 'tall'))
        .sort((a, b) => a.startMm - b.startMm);

      let cursor = startLimit;
      for (const occ of occupied) {
        if (occ.startMm > cursor) {
          const segEnd = Math.min(occ.startMm, endLimit);
          if (segEnd > cursor) {
            fillModularSegment(wall.id, 'base', cursor, segEnd, cabinets);
          }
        }
        cursor = Math.max(cursor, occ.startMm + occ.widthMm);
      }

      if (cursor < endLimit) {
        fillModularSegment(wall.id, 'base', cursor, endLimit, cabinets);
      }
    }

    // TOP / WALL CABINET FILL
    if (options.topCabinets) {
      for (const iv of intervals.filter((i) => i.allowsTop)) {
        const startLimit = iv.start + cornerDeductions[wall.id].startTop;
        const endLimit = iv.end - cornerDeductions[wall.id].endTop;
        if (endLimit <= startLimit) continue;

        const occupied = cabinets
          .filter((c) => c.wallId === wall.id && (c.category === 'top' || c.category === 'tall'))
          .sort((a, b) => a.startMm - b.startMm);

        let cursor = startLimit;
        for (const occ of occupied) {
          if (occ.startMm > cursor) {
            const segEnd = Math.min(occ.startMm, endLimit);
            if (segEnd > cursor) {
              fillModularSegment(wall.id, 'top', cursor, segEnd, cabinets);
            }
          }
          cursor = Math.max(cursor, occ.startMm + occ.widthMm);
        }

        if (cursor < endLimit) {
          fillModularSegment(wall.id, 'top', cursor, endLimit, cabinets);
        }
      }
    }
  }

  // --- 5. ISLAND LAYOUT ---
  if (options.island.enabled) {
    const islandLen = options.island.length || 1800;
    let remIsland = islandLen;
    let islandCursor = 0;
    const standardModules = [900, 600, 450, 300];

    while (remIsland >= 300) {
      let mod = standardModules.find((m) => m <= remIsland) || 300;
      if (remIsland - mod > 0 && remIsland - mod < 200) {
        mod = 600;
      }
      cabinets.push({
        id: `island-${islandCursor}`,
        wallId: 'I',
        type: 'island_base',
        category: 'base',
        startMm: islandCursor,
        widthMm: mod,
        depthMm: STANDARD_BASE_DEPTH,
        heightMm: COUNTERTOP_HEIGHT_MM,
        chargeWidthMm: mod,
        locked: false,
        label: `${mod} Island Module`,
        notes: 'Double-sided heavy-duty aluminium island unit',
      });
      islandCursor += mod;
      remIsland -= mod;
    }

    if (remIsland > 0) {
      cabinets.push({
        id: `island-filler-${islandCursor}`,
        wallId: 'I',
        type: 'filler_base',
        category: 'base',
        startMm: islandCursor,
        widthMm: remIsland,
        depthMm: STANDARD_BASE_DEPTH,
        heightMm: COUNTERTOP_HEIGHT_MM,
        chargeWidthMm: remIsland,
        locked: false,
        label: `${remIsland} End Panel/Filler`,
      });
    }
  }

  return { cabinets, warnings };
}

/**
 * Fills a free physical segment with standard cabinet boxes (900, 600, 450, 300mm)
 * Guaranteed: Exactly partitions [startMm, endMm] without leaving unallocated gaps.
 */
function fillModularSegment(
  wallId: WallId,
  category: 'base' | 'top',
  startMm: number,
  endMm: number,
  cabinets: Cabinet[]
) {
  let remaining = endMm - startMm;
  let cursor = startMm;
  const standardModules = [900, 600, 450, 300];

  while (remaining >= 300) {
    let mod = standardModules.find((m) => m <= remaining) || 300;

    // Avoid leaving an awkward sliver smaller than 100mm when splitting could do
    if (remaining - mod > 0 && remaining - mod < 150) {
      if (mod === 900 && remaining >= 900) mod = 600;
      else if (mod === 600 && remaining >= 600) mod = 450;
    }

    const isDrawer = category === 'base' && (mod === 600 || mod === 450);
    const type: CabinetType =
      category === 'base' ? (isDrawer ? 'drawer' : 'base') : 'top';

    cabinets.push({
      id: `${category}-${wallId}-${cursor}`,
      wallId,
      type,
      category,
      startMm: cursor,
      widthMm: mod,
      depthMm: category === 'base' ? STANDARD_BASE_DEPTH : STANDARD_TOP_DEPTH,
      heightMm: category === 'base' ? COUNTERTOP_HEIGHT_MM : 700,
      chargeWidthMm: mod,
      locked: false,
      label: `${mod} ${type === 'drawer' ? 'Drawer Bank' : category === 'base' ? 'Base Unit' : 'Wall Unit'}`,
      notes: category === 'base' ? 'Soft-close aluminium carcass' : 'Adjustable interior glass shelving',
    });

    cursor += mod;
    remaining -= mod;
  }

  // If any exact architectural remaining gap exists (e.g. 50mm, 150mm), add matching filler panel
  if (remaining > 0) {
    cabinets.push({
      id: `filler-${category}-${wallId}-${cursor}`,
      wallId,
      type: category === 'base' ? 'filler_base' : 'filler_top',
      category,
      startMm: cursor,
      widthMm: remaining,
      depthMm: category === 'base' ? STANDARD_BASE_DEPTH : STANDARD_TOP_DEPTH,
      heightMm: category === 'base' ? COUNTERTOP_HEIGHT_MM : 700,
      chargeWidthMm: remaining,
      locked: false,
      label: `${remaining} Filler Panel`,
      notes: 'Custom cut-to-fit aluminium scribe filler',
    });
  }
}

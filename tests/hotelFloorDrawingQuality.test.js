const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { renderFloorPlan } = require('../js/svg/floorPlanRenderer');
const { validateFloorPlanQuality } = require('../js/layout/floorPlanQualityMetrics');

function createSet() { return planHotelFloors({ building: { rooms: { guestRooms: 180 }, floors: { aboveGround: 8 }, hotelType: 'spa' } }); }

test('Step9-4C typical guest floor has exam-level density and drawing quality', () => {
  const set = createSet();
  const typ = set.floors.find((f) => f.floorId === 'TYP');
  const svg = renderFloorPlan(typ, { highQuality: true });
  const result = validateFloorPlanQuality({ floorPlan: typ, svg });
  assert.equal(result.isValid, true, result.errors.join(','));
  assert.ok(result.metrics.paperUsageRatio >= 0.72 && result.metrics.paperUsageRatio <= 0.80);
  assert.ok(result.metrics.roomUsageRatio >= 0.80);
  assert.ok(result.metrics.guestRoomCount >= 24);
  assert.equal(result.metrics.svgGuestRoomCount, result.metrics.guestRoomCount);
  assert.ok(typ.rooms.some((r) => r.zone === 'guest' && r.x <= typ.footprint.width * 0.05));
  assert.ok(typ.rooms.some((r) => r.zone === 'guest' && r.x + r.width >= typ.footprint.width * 0.95));
  const core = typ.rooms.find((r) => r.roomId === 'CORE');
  assert.ok(typ.rooms.some((r) => r.zone === 'guest' && r.x + r.width < core.x));
  assert.ok(typ.rooms.some((r) => r.zone === 'guest' && r.x > core.x + core.width));
  assert.ok(result.metrics.guestPlacementRatio >= 0.95);
  assert.ok(result.metrics.unusedAreaRatio <= 0.15);
  assert.ok(result.metrics.furnishedGuestRoomCount === result.metrics.guestRoomCount);
  assert.ok(typ.furniture.some((f) => f.type === 'bed'));
  assert.ok(typ.furniture.some((f) => f.type === 'bath'));
  assert.ok(typ.furniture.some((f) => f.type === 'basin'));
  assert.ok(typ.furniture.some((f) => f.type === 'toilet'));
  assert.ok(typ.rooms.filter((r) => r.zone === 'guest').every((r) => r.roomNumber && r.roomType && r.area));
  assert.match(svg, /客室801/);
  assert.match(svg, /room-type-G801/);
  assert.ok(typ.elevators.length >= 2);
  assert.ok(typ.stairs.length >= 2);
  assert.ok(result.metrics.shaftCount >= 3);
  assert.ok(result.metrics.dimensionCount >= 8);
  assert.match(svg, /stroke-width="0\.18"/);
  assert.match(svg, /stroke-width="0\.10"|stroke-width="0\.1"/);
  assert.match(svg, /fire-compartment/);
  assert.ok((svg.match(/egress-arrow/g) || []).length >= 2);
  assert.match(svg, /凡例/);
  assert.match(svg, /title-block/);
  assert.doesNotMatch(svg, /font-size="1\./);
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test('Step9-4C first floor usage and repeated generation are stable', () => {
  const set = createSet();
  const first = set.floors.find((f) => f.floorId === '1');
  const result = validateFloorPlanQuality({ floorPlan: first, svg: renderFloorPlan(first, { highQuality: true }) });
  assert.ok(result.metrics.paperUsageRatio >= 0.72 && result.metrics.paperUsageRatio <= 0.80);
  for (let i = 0; i < 100; i += 1) assert.doesNotThrow(() => createSet());
});

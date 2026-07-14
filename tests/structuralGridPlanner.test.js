const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { planStructuralGrid, STANDARD_SPANS } = require('../js/planner/structuralGridPlanner');

test('Step10-4は用途別標準スパンから柱芯・通り芯・梁・耐力壁候補を生成する', () => {
  const result = planStructuralGrid({ buildingUse: 'office', footprint: { width: 54000, depth: 32400 } });
  assert.ok(STANDARD_SPANS.office.includes(result.grid.selectedSpan));
  assert.ok(result.grid.xAxes.length >= 2);
  assert.ok(result.columns.some((c) => c.section === '800x800'));
  assert.ok(result.beams.every((b) => b.status === '成立'));
  assert.ok(result.seismicWallCandidates.some((w) => w.type === '耐力壁候補'));
  assert.ok(result.score >= 95);
});

test('Step10-4はコア・EV・階段・EPS/PS/DSをStep9設備配置と共有できる形式で生成する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 160 }, floors: { aboveGround: 8 } } });
  const result = planStructuralGrid({ buildingUse: 'hotel', floorPlan });
  assert.equal(result.core.type, '中央コア');
  ['EPS', 'PS', 'DS', 'MDF', 'IDF'].forEach((type) => {
    assert.ok(result.shafts.some((s) => s.type === type && s.step9Connection), `${type} exists`);
  });
  assert.ok(result.elevators.some((e) => e.type === '非常EV'));
  assert.ok(result.elevators.some((e) => e.barrierFree));
  assert.ok(result.stairs.every((s) => s.egressDistanceOk));
  assert.ok(result.quality.checks.examQuality);
});

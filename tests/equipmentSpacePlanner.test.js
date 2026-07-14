const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { planEquipmentSpaces } = require('../js/planner/equipmentSpacePlanner');

test('Step9-5はEPS・PS・DSの上下階整合を優先して設備スペースJSONを生成する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 180 }, floors: { aboveGround: 9 } } });
  const result = planEquipmentSpaces({ floorPlan, totalFloorArea: 18000, buildingUse: 'hotel' });
  assert.ok(result.equipmentSpaces.some((s) => s.type === 'EPS'));
  assert.ok(result.equipmentSpaces.some((s) => s.type === 'PS'));
  assert.ok(result.equipmentSpaces.some((s) => s.type === 'DS'));
  assert.equal(result.score.verticalAlignmentRatio, 1);
  assert.ok(result.checklist.epsAligned);
  assert.ok(result.shaftNetwork.edges.length >= 3);
});

test('Step9-5は機械室・電気室・屋上機器・保守動線とASCII図を出力する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 128 } } });
  const result = planEquipmentSpaces({ floorPlan, totalFloorArea: 12000 });
  ['熱源機械室', 'ポンプ室', '受変電室', '電気室', '発電機室', '冷却塔', '屋外機置場', '搬入口'].forEach((type) => {
    assert.ok(result.equipmentSpaces.some((s) => s.type === type), `${type} exists`);
  });
  assert.ok(result.maintenanceRoutes.every((r) => r.exchangePossible && r.inspectionPossible));
  assert.match(result.ascii.eps, /EPS配置図/);
  assert.ok(result.score.total >= 80);
});

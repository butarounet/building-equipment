const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { planEquipmentSpaces } = require('../js/planner/equipmentSpacePlanner');
const { planPlumbing } = require('../js/planner/plumbingPlacementEngine');

test('Step9-7は設備スペースを利用して給排水衛生設備ネットワークを生成する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 150 }, floors: { aboveGround: 8 } } });
  const equipmentSpace = planEquipmentSpaces({ floorPlan, totalFloorArea: 15000, buildingUse: 'hotel' });
  const result = planPlumbing({ floorPlan, equipmentSpace, buildingUse: 'hotel', plumbingConditions: { dailyUseFactor: 1.1 } });
  assert.ok(result.fixtureAnalysis.length > 20);
  assert.ok(result.waterSupply.receivingTank.capacityM3 > 0);
  assert.ok(result.waterSupply.elevatedTank.capacityM3 > 0);
  assert.ok(result.waterSupply.risers.length > 0);
  assert.ok(result.hotWater.pipes.length > 0);
  assert.ok(result.drainage.branches.every((b) => b.slopeOk));
  assert.ok(result.vent.risers.length > 0);
  assert.ok(result.pipeNetwork.routes.some((r) => r.system === '給水'));
  assert.match(result.ascii.waterSupply, /給水系統図/);
  assert.ok(result.score.total >= 80);
});

test('Step9-7は雨水・消火・配管一覧・Quality Checkerを出力する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 220 }, floors: { aboveGround: 10 } }, options: { hotelType: 'conference' } });
  const result = planPlumbing({ floorPlan, buildingUse: 'hotel' });
  assert.ok(result.storm.length > 0);
  assert.ok(result.storm.some((s) => s.roofDrains.length >= 2));
  assert.ok(result.fireProtection.hydrants.length > 0);
  assert.ok(result.fireProtection.sprinklers.length > 0);
  assert.ok(result.pipeSchedule.every((p) => p.id && p.lengthMm >= 0));
  assert.ok(result.equipmentLayout.some((e) => e.type === '排水槽'));
  assert.equal(result.checklist.waterSupplyEstablished, true);
  assert.equal(result.checklist.drainageSlopeEstablished, true);
  assert.equal(result.checklist.fireProtectionEstablished, true);
  assert.ok(result.improvements.length > 0);
});

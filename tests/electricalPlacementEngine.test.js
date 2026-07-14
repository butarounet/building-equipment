const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { planEquipmentSpaces } = require('../js/planner/equipmentSpacePlanner');
const { planElectrical } = require('../js/planner/electricalPlacementEngine');

test('Step9-8は設備スペースとEPSを利用して電気設備を自動配置する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 150 }, floors: { aboveGround: 8 } } });
  const equipmentSpace = planEquipmentSpaces({ floorPlan, totalFloorArea: 15000, buildingUse: 'hotel' });
  const result = planElectrical({ floorPlan, equipmentSpace, buildingUse: 'hotel', electricalConditions: { demandFactor: 0.82 } });
  assert.ok(result.powerReceiving.capacityKva >= 300);
  assert.ok(result.transformers.length >= 2);
  assert.ok(result.panelBoards.some((p) => p.type === '分電盤'));
  assert.ok(result.cableNetwork.some((r) => r.system === '幹線' && r.via === 'EPS'));
  assert.ok(result.cableRacks.length > 0);
  assert.ok(result.lighting.length > 20);
  assert.match(result.singleLineDiagram, /単線結線図/);
  assert.ok(result.score.total >= 80);
});

test('Step9-8は防災・弱電設備とQuality Checkerを出力する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 220 }, floors: { aboveGround: 10 } }, options: { hotelType: 'conference' } });
  const result = planElectrical({ floorPlan, buildingUse: 'hotel' });
  assert.ok(result.generator.capacityKva > 0);
  assert.ok(result.ups.capacityKva > 0);
  assert.ok(result.emergencyLighting.length > 0);
  assert.ok(result.exitSigns.length > 0);
  assert.ok(result.fireAlarm.length > 0);
  assert.ok(result.broadcast.length > 0);
  assert.ok(result.lan.every((l) => l.ports >= 1));
  assert.equal(result.checklist.mainRouteEstablished, true);
  assert.equal(result.checklist.epsUsed, true);
  assert.equal(result.checklist.generatorEstablished, true);
  assert.equal(result.checklist.examLevelCompatible, true);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { planEquipmentSpaces } = require('../js/planner/equipmentSpacePlanner');
const { planHVAC } = require('../js/planner/hvacPlacementEngine');

test('Step9-6は設備スペースを利用して空調機器・ダクト・配管ネットワークを生成する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 150 }, floors: { aboveGround: 8 } } });
  const equipmentSpace = planEquipmentSpaces({ floorPlan, totalFloorArea: 15000, buildingUse: 'hotel' });
  const result = planHVAC({ floorPlan, equipmentSpace, buildingUse: 'hotel', hvacConditions: { diversityFactor: 0.9 } });
  assert.ok(result.roomLoads.length > 20);
  assert.ok(result.equipment.airHandlingUnits.length + result.equipment.packageUnits.length > 0);
  assert.ok(result.ductNetwork.routes.some((r) => r.kind === 'duct-main'));
  assert.ok(result.pipeNetwork.routes.some((r) => r.kind === '冷温水配管'));
  assert.ok(result.diffusers.length > 20);
  assert.ok(result.returnAir.length > 20);
  assert.match(result.ascii.system, /空調ASCII系統図/);
  assert.ok(result.score.total >= 70);
});

test('Step9-6はVAV/CAV・防火ダンパー・風量一覧・改善案を出力する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 220 }, floors: { aboveGround: 10 } }, options: { hotelType: 'conference' } });
  const result = planHVAC({ floorPlan, buildingUse: 'hotel' });
  assert.ok(result.airSystemSelections.some((s) => /AHU\+VAV|AHU\+CAV/.test(s.system)));
  assert.ok(result.equipment.fireDampers.length > 0);
  assert.ok(result.equipment.accessories.some((a) => a.type === '風量測定口'));
  assert.ok(result.airflowSchedule.every((a) => a.airflowCmh > 0));
  assert.ok(result.improvements.length > 0);
});

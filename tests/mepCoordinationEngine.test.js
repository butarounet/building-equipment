const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { planEquipmentSpaces } = require('../js/planner/equipmentSpacePlanner');
const { planHVAC } = require('../js/planner/hvacPlacementEngine');
const { planPlumbing } = require('../js/planner/plumbingPlacementEngine');
const { planElectrical } = require('../js/planner/electricalPlacementEngine');
const { coordinateMEP } = require('../js/planner/mepCoordinationEngine');

test('Step9-9は空調・衛生・電気をGraph構造へ統合し干渉補正結果を出力する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 150 }, floors: { aboveGround: 8 } } });
  const equipmentSpace = planEquipmentSpaces({ floorPlan, totalFloorArea: 15000, buildingUse: 'hotel' });
  const hvac = planHVAC({ floorPlan, equipmentSpace, buildingUse: 'hotel' });
  const plumbing = planPlumbing({ floorPlan, equipmentSpace, buildingUse: 'hotel' });
  const electrical = planElectrical({ floorPlan, equipmentSpace, buildingUse: 'hotel' });
  const result = coordinateMEP({ floorPlan, equipmentSpace, hvac, plumbing, electrical, buildingUse: 'hotel' });
  assert.equal(result.engine, 'Step9-9 MEP Coordination Engine');
  assert.ok(result.mep.graph.nodes.length > 0);
  assert.ok(result.mep.graph.edges.length > 0);
  assert.ok(result.mep.integratedModel.hvac.ductNetwork.routes.length > 0);
  assert.ok(Array.isArray(result.clashes));
  assert.ok(Array.isArray(result.corrections));
  assert.ok(result.score.total >= 70);
  assert.ok(result.finalModel.readyFor.includes('Step9-10 系統図生成'));
});

test('Step9-9はシャフト容量・天井内納まり・Quality Checkerを判定する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 220 }, floors: { aboveGround: 10 } }, options: { hotelType: 'conference' } });
  const equipmentSpace = planEquipmentSpaces({ floorPlan, totalFloorArea: 22000, buildingUse: 'hotel' });
  const result = coordinateMEP({
    floorPlan,
    equipmentSpace,
    hvac: planHVAC({ floorPlan, equipmentSpace, buildingUse: 'hotel' }),
    plumbing: planPlumbing({ floorPlan, equipmentSpace, buildingUse: 'hotel' }),
    electrical: planElectrical({ floorPlan, equipmentSpace, buildingUse: 'hotel' })
  });
  assert.ok(result.mep.shaftCapacity.some((c) => c.type === 'EPS'));
  assert.ok(result.mep.shaftCapacity.some((c) => c.type === 'PS'));
  assert.ok(result.mep.shaftCapacity.some((c) => c.type === 'DS'));
  assert.equal(result.checklist.find((c) => c.label === '天井内納まりOK').ok, true);
  assert.equal(result.checklist.find((c) => c.label === '防火区画OK').ok, true);
  assert.ok(result.checklist.find((c) => c.label === '建築設備士第二次試験レベル適合'));
});

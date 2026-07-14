const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { planEquipmentSpaces } = require('../js/planner/equipmentSpacePlanner');
const { planHVAC } = require('../js/planner/hvacPlacementEngine');
const { planPlumbing } = require('../js/planner/plumbingPlacementEngine');
const { planElectrical } = require('../js/planner/electricalPlacementEngine');
const { coordinateMEP } = require('../js/planner/mepCoordinationEngine');
const { generateSystemDiagrams } = require('../js/planner/systemDiagramGenerator');

test('Step9-10は統合MEPモデルから空調・衛生・電気系統図を生成する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 120 }, floors: { aboveGround: 6 } } });
  const equipmentSpace = planEquipmentSpaces({ floorPlan, totalFloorArea: 12000, buildingUse: 'hotel' });
  const hvac = planHVAC({ floorPlan, equipmentSpace, buildingUse: 'hotel' });
  const plumbing = planPlumbing({ floorPlan, equipmentSpace, buildingUse: 'hotel' });
  const electrical = planElectrical({ floorPlan, equipmentSpace, buildingUse: 'hotel' });
  const integrated = coordinateMEP({ floorPlan, equipmentSpace, hvac, plumbing, electrical, buildingUse: 'hotel' });
  const result = generateSystemDiagrams({ mep: integrated.mep });
  assert.ok(result.hvacDiagram.nodes.length > 0);
  assert.ok(result.plumbingDiagram.edges.some((e) => /給水|排水|給湯|通気/.test(e.system)));
  assert.ok(result.electricalDiagram.edges.some((e) => /幹線|受変電|非常電源/.test(e.system)));
  assert.ok(result.svg.startsWith('<svg'));
  assert.ok(result.asciiDiagram.includes('空調設備系統図'));
  assert.ok(result.legend.length >= 6);
  assert.ok(result.score.total >= 80);
});

test('Step9-10はラベル・リスト・Quality Checkerを出力する', () => {
  const floorPlan = planHotelFloors({ building: { rooms: { guestRooms: 80 }, floors: { aboveGround: 4 } } });
  const equipmentSpace = planEquipmentSpaces({ floorPlan, totalFloorArea: 9000, buildingUse: 'hotel' });
  const result = generateSystemDiagrams({
    hvac: planHVAC({ floorPlan, equipmentSpace, buildingUse: 'hotel' }),
    plumbing: planPlumbing({ floorPlan, equipmentSpace, buildingUse: 'hotel' }),
    electrical: planElectrical({ floorPlan, equipmentSpace, buildingUse: 'hotel' })
  });
  assert.ok(result.labelList.every((l) => l.text && Number.isFinite(l.x) && Number.isFinite(l.y)));
  assert.ok(result.pipeList.length > 0);
  assert.ok(result.cableList.length > 0);
  assert.equal(result.qualityReport.checklist.find((c) => c.label === '凡例生成').ok, true);
  assert.equal(result.qualityReport.checklist.find((c) => c.label === '建築設備士第二次試験レベル適合').ok, true);
});

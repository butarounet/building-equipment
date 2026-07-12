const assert = require('node:assert/strict');
const { test } = require('node:test');
const { planHotelProject } = require('../js/planner/buildingPlanner');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterials } = require('../js/generator/materialGenerator');
const { generateDrawings, validateDrawings } = require('../js/generator/drawingGenerator');

function fixture() {
  const plan = planHotelProject({ hotelType: '国際会議対応ホテル', random: () => 0.53 });
  const building = generateBuilding({ plan, random: () => 0.53 });
  const equipment = generateEquipment(building);
  const materials = generateMaterials({ plan, building, equipment });
  const drawings = generateDrawings({ plan, building, equipment, materials });
  return { plan, building, equipment, materials, drawings };
}

test('generateDrawings returns the required drawing set structure', () => {
  const { drawings } = fixture();

  assert.ok(drawings.drawingSetId);
  assert.equal(drawings.sheetSize, 'A3-landscape');
  assert.equal(drawings.unit, 'mm');
  for (const key of ['scalePolicy', 'sitePlan', 'floorPlans', 'blankPlans', 'detailDrawings', 'answerSheets', 'legends', 'titleBlocks', 'metadata']) {
    assert.ok(drawings[key], `${key}が必要です。`);
  }
});

test('generateDrawings creates a site plan with required layers', () => {
  const { drawings } = fixture();
  const sitePlan = drawings.sitePlan;

  for (const key of ['siteBoundary', 'roads', 'orientation', 'buildingOutline', 'placementDimensions', 'porteCochere', 'parking', 'loadingDock', 'pedestrianEntrance', 'serviceRoute', 'outdoorEquipmentYard', 'utilityConnections', 'greenArea', 'scale', 'frame']) {
    assert.ok(sitePlan[key], `配置図に${key}が必要です。`);
  }
});

test('generateDrawings creates required floor plans and vertical shafts', () => {
  const { drawings } = fixture();
  const floorIds = drawings.floorPlans.map((floor) => floor.floorId);

  assert.deepEqual(floorIds, ['B1', '1', '2', '3', '4-10', 'PH', 'RF']);
  for (const floor of drawings.floorPlans) {
    for (const key of ['gridLines', 'columns', 'walls', 'doors', 'windows', 'stairs', 'elevators', 'rooms', 'dimensions', 'equipmentSpaces', 'shafts', 'annotations']) {
      assert.ok(floor[key], `${floor.floorId}に${key}が必要です。`);
    }
    assert.deepEqual(floor.shafts.map((shaft) => shaft.shaftType), ['EPS', 'PS', 'DS']);
  }
});

test('generateDrawings creates blank plans without equipment elements', () => {
  const { drawings } = fixture();

  assert.deepEqual(drawings.blankPlans.map((floor) => floor.floorId), drawings.floorPlans.map((floor) => floor.floorId));
  for (const blankPlan of drawings.blankPlans) {
    assert.equal(Object.prototype.hasOwnProperty.call(blankPlan, 'equipmentSpaces'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(blankPlan, 'shafts'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(blankPlan, 'pipes'), false);
    assert.ok(blankPlan.columns);
    assert.ok(blankPlan.rooms);
  }
});

test('generateDrawings creates details, answer sheets, legends, and title blocks', () => {
  const { drawings } = fixture();

  assert.ok(drawings.detailDrawings.length >= 10);
  assert.ok(drawings.detailDrawings.some((detail) => detail.title === 'EPS詳細'));
  assert.equal(drawings.answerSheets.length, 5);
  assert.ok(drawings.answerSheets.every((sheet) => sheet.fields.some((field) => field.name === '採点者記入欄')));
  assert.equal(drawings.legends.length, 6);
  assert.ok(drawings.titleBlocks.length >= drawings.floorPlans.length);
});

test('validateDrawings validates generated drawings and detects blank plan contamination', () => {
  const input = fixture();
  const validation = validateDrawings(input.drawings, input);

  assert.equal(validation.isValid, true, validation.errors.join('\n'));
  assert.equal(validation.checks.requiredDrawings, true);
  assert.equal(validation.checks.blankPlansClean, true);

  const invalid = structuredClone(input.drawings);
  invalid.blankPlans[0].equipmentSpaces = [{ name: '設備機器' }];
  const invalidValidation = validateDrawings(invalid, input);

  assert.equal(invalidValidation.isValid, false);
  assert.equal(invalidValidation.checks.blankPlansClean, false);
});

test('drawing generator integrates with existing generators', () => {
  const { plan, building, equipment, materials } = fixture();
  const drawings = generateDrawings({ plan, building, equipment, materials });

  assert.equal(drawings.projectTitle, building.building.name);
  assert.equal(drawings.sitePlan.loadingDock.location, '東側サービスヤード');
  assert.equal(drawings.answerSheets[0].title, '建築設備基本計画');
  assert.equal(validateDrawings(drawings, { plan, building, equipment, materials }).isValid, true);
});

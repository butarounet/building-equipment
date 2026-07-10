const assert = require('node:assert/strict');
const { test } = require('node:test');
const { planHotelProject } = require('../js/planner/buildingPlanner');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterial1 } = require('../js/generator/material1Generator');
const { generateMaterials, validateMaterials } = require('../js/generator/materialGenerator');

function fixture() {
  const plan = planHotelProject({ hotelType: '温浴施設付きホテル', random: () => 0.42 });
  const building = generateBuilding({ plan, random: () => 0.42 });
  const equipment = generateEquipment(building);
  return { plan, building, equipment };
}

test('generateMaterials returns material 1 through 5 with an index', () => {
  const result = generateMaterials(fixture());

  assert.equal(result.materials.length, 5);
  assert.deepEqual(result.materials.map((material) => material.materialId), ['material-1', 'material-2', 'material-3', 'material-4', 'material-5']);
  assert.equal(result.index.material1, '資料1 計画条件');
  assert.equal(result.index.material5, '資料5 答案用紙');
});

test('generateMaterials uses existing material1Generator for material 1', () => {
  const input = fixture();
  const result = generateMaterials(input);
  const material1 = generateMaterial1(input);

  assert.deepEqual(result.materials[0], material1);
});

test('material 2 through 5 include required structured data', () => {
  const { materials } = generateMaterials(fixture());
  const [, material2, material3, material4, material5] = materials;

  for (const key of ['siteConditions', 'roadConditions', 'buildingPlacement', 'porteCochere', 'loadingDock', 'outdoorEquipmentYard', 'utilityConnectionPoints', 'orientation', 'dimensions']) {
    assert.ok(material2[key], `資料2に${key}が必要です。`);
  }

  assert.ok(material3.floors.some((floor) => floor.label === '地下1階'));
  assert.ok(material3.floors.some((floor) => floor.label === '塔屋'));
  assert.ok(material3.verticalShafts.EPS);
  assert.ok(material3.equipmentSpaces.mechanicalRoom);

  assert.deepEqual(material4.floors.map((floor) => floor.floorId), material3.floors.map((floor) => floor.floorId));
  assert.ok(material4.floors.every((floor) => floor.writableEquipmentLayer));
  assert.ok(material4.floors.every((floor) => floor.excludedLayers.includes('配管')));

  assert.ok(material5.answerSheets.some((sheet) => sheet.title === '建築設備基本計画'));
  for (const key of ['description', 'calculation', 'systemDiagram', 'equipmentSchedule', 'legend']) {
    assert.ok(material5.fields[key], `資料5に${key}欄が必要です。`);
  }
});

test('validateMaterials validates consistency and detects invalid materials', () => {
  const result = generateMaterials(fixture());
  const validation = validateMaterials(result);

  assert.equal(validation.isValid, true, validation.errors.join('\n'));
  assert.equal(validation.checks.allMaterialsExist, true);
  assert.equal(validation.checks.material3And4FloorConsistency, true);

  const invalid = { materials: result.materials.slice(0, 4) };
  const invalidValidation = validateMaterials(invalid);

  assert.equal(invalidValidation.isValid, false);
  assert.equal(invalidValidation.checks.allMaterialsExist, false);
});

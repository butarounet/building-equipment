const assert = require('node:assert/strict');
const { test } = require('node:test');
const { planHotelProject } = require('../js/planner/buildingPlanner');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterial1, validateMaterial1 } = require('../js/generator/material1Generator');

function fixture() {
  const plan = planHotelProject({ hotelType: '温浴施設付きホテル', random: () => 0.42 });
  const building = generateBuilding({ plan, random: () => 0.42 });
  const equipment = generateEquipment(building);
  return { plan, building, equipment };
}

test('generateMaterial1 returns a valid material 1 object', () => {
  const material1 = generateMaterial1(fixture());
  const result = validateMaterial1(material1);

  assert.equal(material1.materialId, 'material-1');
  assert.equal(material1.title, '資料1 計画条件');
  assert.equal(result.isValid, true, result.errors.join('\n'));
});

test('generateMaterial1 includes required sections', () => {
  const material1 = generateMaterial1(fixture());

  for (const key of ['projectTitle', 'buildingOutline', 'equipmentOutline', 'hvacConditions', 'plumbingConditions', 'electricalConditions', 'fireSafetyConditions', 'notes']) {
    assert.ok(material1[key]);
  }
  assert.ok(material1.buildingOutline.length >= 4);
  assert.ok(material1.equipmentOutline.length >= 6);
});

test('generateMaterial1 is viable as a hotel exam assignment', () => {
  const material1 = generateMaterial1(fixture());
  const text = JSON.stringify(material1);

  assert.match(text, /ホテル|宿泊/);
  assert.match(text, /客室/);
  assert.match(text, /宴会|レストラン/);
  assert.match(text, /給湯|SPA/);
  assert.match(text, /非常用発電|防災/);
});

test('validateMaterial1 detects missing and inconsistent material', () => {
  const material1 = generateMaterial1(fixture());
  assert.equal(validateMaterial1(material1).isValid, true);

  const invalid = { ...material1, hvacConditions: [], sourceSummary: { ...material1.sourceSummary, equipmentSystemIds: [] } };
  const result = validateMaterial1(invalid);

  assert.equal(result.isValid, false);
  assert.equal(result.checks.disciplineConditions, false);
  assert.equal(result.checks.sourceConsistency, false);
});

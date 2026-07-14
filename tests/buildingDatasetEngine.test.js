const assert = require('node:assert/strict');
const { test } = require('node:test');
const { BuildingDatasetEngine, createRandom } = require('../js/layout/buildingDatasetEngine');
const { generateBuilding, validateBuilding } = require('../js/generator/buildingGenerator');

const TYPES = ['hotel','hospital','school','office','research','museum','government','commercial','distribution','mixeduse'];

test('BuildingDatasetEngine loads every exam building dataset', () => {
  const engine = new BuildingDatasetEngine();
  for (const buildingType of TYPES) {
    const result = engine.generate({ buildingType, difficulty: 'standard', randomSeed: `${buildingType}-seed` });
    assert.equal(result.dataset.buildingType, buildingType);
    assert.ok(result.dataset.patterns.length >= 3);
    assert.ok(result.building.name);
    assert.ok(result.pattern.floorVariations.length >= 5);
    assert.ok(result.pattern.roomVariations.length >= 3);
    assert.ok(result.pattern.equipmentVariation.hvac);
    assert.ok(result.score.score >= 95);
  }
});

test('BuildingDatasetEngine is deterministic for the same randomSeed', () => {
  const engine = new BuildingDatasetEngine();
  const a = engine.generate({ buildingType: 'hotel', difficulty: 'hard', randomSeed: 'same-seed' });
  const b = engine.generate({ buildingType: 'hotel', difficulty: 'hard', randomSeed: 'same-seed' });
  assert.deepEqual(a.building.datasetPattern.fingerprint, b.building.datasetPattern.fingerprint);
  assert.deepEqual(a.building.totalFloorArea, b.building.totalFloorArea);
});

test('BuildingDatasetEngine mutates consecutive seeds to avoid identical plans', () => {
  const engine = new BuildingDatasetEngine();
  const fingerprints = new Set(Array.from({ length: 50 }, (_, i) => engine.generate({ buildingType: 'hotel', randomSeed: `seed-${i}` }).building.datasetPattern.fingerprint));
  assert.ok(fingerprints.size >= 48);
});

test('generateBuilding uses dataset engine while preserving equipment generator compatibility', () => {
  const generated = generateBuilding({ randomSeed: 'generator-dataset' });
  assert.equal(generated.buildingType, 'hotel');
  assert.ok(generated.datasetEngine.score >= 95);
  assert.equal(validateBuilding(generated).isValid, true);
});

test('createRandom returns repeatable normalized values', () => {
  const a = createRandom('x');
  const b = createRandom('x');
  assert.equal(a(), b());
  assert.ok(a() >= 0 && a() < 1);
});

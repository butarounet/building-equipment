const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateBuilding, validateBuilding, randomInt, pick } = require('../js/generator/buildingGenerator');
const { generateEquipment, validateEquipment } = require('../js/generator/equipmentGenerator');

test('generateBuilding returns a valid hotel building object', () => {
  const generated = generateBuilding();
  assert.equal(generated.schemaVersion, '1.0.0');
  assert.equal(generated.buildingType, 'hotel');
  assert.equal(generated.building.use, '宿泊施設（シティホテル）');
  assert.ok(generated.building.concept);
  assert.ok(generated.building.siteCondition);
  assert.ok(generated.building.zoning);
  assert.ok(generated.building.buildingArea.value > 0);
  assert.ok(generated.building.rooms.guestRooms >= 120);
  assert.ok(validateBuilding(generated).isValid);
});

test('generateBuilding varies numeric values between generations', () => {
  const samples = Array.from({ length: 8 }, () => generateBuilding().building);
  assert.ok(new Set(samples.map((b) => b.totalFloorArea.value)).size > 1);
  assert.ok(new Set(samples.map((b) => b.rooms.guestRooms)).size > 1);
});

test('validateBuilding detects invalid planning conditions', () => {
  const generated = generateBuilding();
  generated.building.totalFloorArea.value = 50000;
  generated.building.rooms.guestRooms = 20;
  generated.building.equipmentSpaces.mechanicalRoom.area.value = 10;
  const result = validateBuilding(generated);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.length >= 1);
  assert.equal(result.checks.guestRoomCapacity, false);
});


test('randomInt clamps edge random values within inclusive range', () => {
  assert.equal(randomInt(0, 2, () => 0), 0);
  assert.equal(randomInt(0, 2, () => 0.999999), 2);
  assert.equal(randomInt(0, 2, () => 1), 2);
  assert.equal(randomInt(0, 2, () => 2), 2);
  assert.equal(randomInt(0, 2, () => -1), 0);
  assert.ok(randomInt(0, 2, () => NaN) >= 0 && randomInt(0, 2, () => NaN) <= 2);
  assert.ok(randomInt(0, 2, () => Infinity) >= 0 && randomInt(0, 2, () => Infinity) <= 2);
  assert.equal(randomInt(2, 0, () => 0), 0);
  assert.equal(randomInt(2, 0, () => 1), 2);
});

test('pick handles invalid collections and falls back from undefined item', () => {
  assert.equal(pick(null, () => 0), undefined);
  assert.equal(pick([], () => 0), undefined);
  const first = { id: 'first' };
  assert.equal(pick([first, undefined], () => 1), first);
});

test('generateBuilding tolerates invalid random inputs and always returns zoning', () => {
  const randomValues = [0, 0.999999, 1, 2, -1, NaN, Infinity];
  for (const value of randomValues) {
    const generated = generateBuilding({ random: () => value });
    assert.ok(generated.building.zoning);
    assert.ok(generated.building.legal.maxBuildingCoverageRatio);
    assert.ok(validateBuilding(generated).isValid);
  }
});

test('generateBuilding uses Math.random when options.random is not a function', () => {
  const generated = generateBuilding({ random: 1 });
  assert.ok(generated.building.zoning);
  assert.ok(validateBuilding(generated).isValid);
});

test('generateBuilding does not produce undefined zoning in 1000 consecutive generations', () => {
  for (let i = 0; i < 1000; i += 1) {
    const generated = generateBuilding({ random: () => (i % 7 === 0 ? 1 : (i % 1000) / 999) });
    assert.ok(generated.building.zoning);
    assert.notEqual(generated.building.zoning, undefined);
  }
});

test('generateBuilding output can generate valid equipment', () => {
  const building = generateBuilding({ random: () => 1 });
  const equipment = generateEquipment(building);
  assert.ok(equipment.equipment.hvac.systems.length > 0);
  assert.equal(validateEquipment(equipment, building).isValid, true);
});

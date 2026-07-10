const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateBuilding, validateBuilding } = require('../js/generator/buildingGenerator');

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

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment, validateEquipment } = require('../js/generator/equipmentGenerator');

function fixedBuilding(overrides = {}) {
  const building = generateBuilding({ random: () => 0.72 });
  Object.assign(building.building, overrides);
  return building;
}

test('generateEquipment returns a valid hotel equipment object', () => {
  const building = generateBuilding();
  const equipment = generateEquipment(building);
  const result = validateEquipment(equipment, building);

  assert.equal(equipment.schemaVersion, '1.0.0');
  assert.equal(equipment.buildingType, 'hotel');
  assert.equal(equipment.sourceBuilding.guestRooms, building.building.rooms.guestRooms);
  assert.equal(result.isValid, true, result.errors.join('\n'));
});

test('generateEquipment adds kitchen, spa, and banquet systems when rooms exist', () => {
  const building = fixedBuilding();
  const equipment = generateEquipment(building);
  const systems = Object.values(equipment.equipment).flatMap((group) => group.systems || []);
  const ids = new Set(systems.map((system) => system.id));

  assert.ok(ids.has('kitchen-ventilation'));
  assert.ok(ids.has('banquet-zone-air-handling'));
  assert.match(equipment.equipment.hotWater.systems[0].name, /SPA/);
});

test('generateEquipment scales capacities and elevator quantity by guest rooms', () => {
  const compact = fixedBuilding();
  compact.building.rooms.guestRooms = 160;
  compact.building.totalFloorArea.value = 14000;
  const large = fixedBuilding();
  large.building.rooms.guestRooms = 360;
  large.building.totalFloorArea.value = 32000;

  const compactEquipment = generateEquipment(compact);
  const largeEquipment = generateEquipment(large);

  assert.ok(largeEquipment.equipment.receivingTransformer.systems[0].capacity.value > compactEquipment.equipment.receivingTransformer.systems[0].capacity.value);
  assert.ok(largeEquipment.equipment.transportation.systems[0].quantity > compactEquipment.equipment.transportation.systems[0].quantity);
});

test('validateEquipment detects missing or undersized equipment conditions', () => {
  const building = generateBuilding();
  const equipment = generateEquipment(building);
  equipment.equipment.hvac.systems = equipment.equipment.hvac.systems.filter((system) => system.id !== 'kitchen-ventilation');
  equipment.equipment.receivingTransformer.systems[0].capacity.value = 100;

  const result = validateEquipment(equipment, building);
  assert.equal(result.isValid, false);
  assert.equal(result.checks.kitchenVentilation, false);
  assert.equal(result.checks.equipmentCapacity, false);
});

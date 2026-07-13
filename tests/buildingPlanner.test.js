const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HOTEL_TYPES, HOTEL_TYPE_LABELS, HOTEL_TYPE_CONFIGS, planHotelProject, validateHotelPlan } = require('../js/planner/buildingPlanner');
const { generateBuilding, validateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment, validateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterials } = require('../js/generator/materialGenerator');
const { generateDrawings } = require('../js/generator/drawingGenerator');
const { generateExam, validateExam } = require('../js/generator/examGenerator');

test('planHotelProject returns a valid hotel project plan', () => {
  const plan = planHotelProject();
  assert.equal(plan.projectType, 'hotel');
  assert.ok(plan.hotelType);
  assert.ok(plan.designTheme);
  assert.ok(plan.siteCondition);
  assert.ok(plan.zoningPolicy);
  assert.ok(plan.scalePolicy);
  assert.ok(plan.floorPolicy);
  assert.ok(plan.guestRoomPolicy);
  assert.ok(plan.banquetPolicy);
  assert.ok(plan.restaurantPolicy);
  assert.ok(plan.spaPolicy);
  assert.ok(plan.backyardPolicy);
  assert.ok(plan.equipmentSpacePolicy);
  assert.ok(['standard', 'hard'].includes(plan.examDifficulty));
  assert.equal(validateHotelPlan(plan).isValid, true);
});

test('planHotelProject respects specified hotelType', () => {
  const plan = planHotelProject({ hotelType: '温浴施設付きホテル' });
  assert.equal(plan.hotelType, 'spa');
  assert.equal(plan.hotelTypeName, '温浴施設付きホテル');
  assert.equal(plan.spaPolicy.required, true);
  assert.equal(validateHotelPlan(plan).isValid, true);
});

test('validateHotelPlan detects invalid plans', () => {
  const plan = planHotelProject({ hotelType: '都市型シティホテル' });
  plan.hotelType = '無効なホテル';
  plan.floorPolicy.aboveGround.min = 2;
  plan.guestRoomPolicy.guestRooms.max = 40;
  const result = validateHotelPlan(plan);
  assert.equal(result.isValid, false);
  assert.equal(result.checks.hotelType, false);
  assert.equal(result.checks.floorPolicy, false);
  assert.equal(result.checks.guestRoomPolicy, false);
  assert.ok(result.errors.length >= 1);
});


test('planHotelProject is defensive and normalizes hotelType inputs', () => {
  for (let i = 0; i < 100; i += 1) {
    const plan = planHotelProject();
    assert.equal(validateHotelPlan(plan).isValid, true);
  }

  for (const key of HOTEL_TYPES) {
    const plan = planHotelProject({ hotelType: key });
    assert.equal(plan.hotelType, key);
    assert.ok(HOTEL_TYPE_CONFIGS[key].theme);
    assert.equal(plan.designTheme, HOTEL_TYPE_CONFIGS[key].theme);
  }

  for (const [key, label] of Object.entries(HOTEL_TYPE_LABELS)) {
    const plan = planHotelProject({ hotelType: label });
    assert.equal(plan.hotelType, key);
    assert.equal(plan.hotelTypeName, label);
    assert.equal(plan.designTheme, HOTEL_TYPE_CONFIGS[key].theme);
  }

  for (const hotelType of ['', null, undefined, '存在しないhotelType']) {
    const plan = planHotelProject({ hotelType });
    assert.equal(plan.hotelType, 'city');
    assert.equal(plan.hotelTypeName, '都市型シティホテル');
    assert.equal(validateHotelPlan(plan).isValid, true);
  }
});

test('generateBuilding reflects a supplied plan', () => {
  const plan = planHotelProject({ hotelType: '国際会議対応ホテル', examDifficulty: 'hard' });
  const generated = generateBuilding({ plan });
  const building = generated.building;
  assert.equal(building.planningSource.hotelType, 'conference');
  assert.equal(building.planningSource.hotelTypeName, '国際会議対応ホテル');
  assert.equal(building.planningSource.examDifficulty, 'hard');
  assert.match(building.use, /国際会議対応ホテル/);
  assert.equal(building.concept, plan.designTheme);
  assert.ok(building.floors.aboveGround >= plan.floorPolicy.aboveGround.min);
  assert.ok(building.floors.aboveGround <= plan.floorPolicy.aboveGround.max);
  assert.ok(building.rooms.guestRooms >= plan.guestRoomPolicy.guestRooms.min);
  assert.ok(building.rooms.guestRooms <= plan.guestRoomPolicy.guestRooms.max);
  assert.ok(validateBuilding(generated).isValid);
});


test('mock exam generation pipeline completes without exceptions', () => {
  assert.doesNotThrow(() => {
    const plan = planHotelProject({ hotelType: 'conference', random: () => 0.53 });
    const building = generateBuilding({ plan, random: () => 0.53 });
    const equipment = generateEquipment(building);
    assert.ok(equipment.equipment);
    assert.equal(validateEquipment(equipment, building).isValid, true);
    const materials = generateMaterials({ plan, building, equipment });
    const drawings = generateDrawings({ plan, building, equipment, materials });
    const exam = generateExam({ plan, building, equipment, materials, drawings });
    assert.ok(exam.examId);
    assert.equal(validateExam(exam, { plan, building, equipment, materials, drawings }).isValid, true);
  });
});

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { planHotelProject, validateHotelPlan } = require('../js/planner/buildingPlanner');
const { generateBuilding, validateBuilding } = require('../js/generator/buildingGenerator');

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
  assert.equal(plan.hotelType, '温浴施設付きホテル');
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

test('generateBuilding reflects a supplied plan', () => {
  const plan = planHotelProject({ hotelType: '国際会議対応ホテル', examDifficulty: 'hard' });
  const generated = generateBuilding({ plan });
  const building = generated.building;
  assert.equal(building.planningSource.hotelType, '国際会議対応ホテル');
  assert.equal(building.planningSource.examDifficulty, 'hard');
  assert.match(building.use, /国際会議対応ホテル/);
  assert.equal(building.concept, plan.designTheme);
  assert.ok(building.floors.aboveGround >= plan.floorPolicy.aboveGround.min);
  assert.ok(building.floors.aboveGround <= plan.floorPolicy.aboveGround.max);
  assert.ok(building.rooms.guestRooms >= plan.guestRoomPolicy.guestRooms.min);
  assert.ok(building.rooms.guestRooms <= plan.guestRoomPolicy.guestRooms.max);
  assert.ok(validateBuilding(generated).isValid);
});

test('planHotelProject handles missing, empty, and invalid hotelType defensively', () => {
  const defaultPlan = planHotelProject();
  assert.ok(defaultPlan.designTheme);
  assert.equal(validateHotelPlan(defaultPlan).isValid, true);

  const emptyPlan = planHotelProject({ hotelType: '' });
  assert.ok(emptyPlan.designTheme);
  assert.equal(validateHotelPlan(emptyPlan).isValid, true);

  const invalidPlan = planHotelProject({ hotelType: '存在しないホテル' });
  assert.equal(invalidPlan.hotelType, '都市型シティホテル');
  assert.ok(invalidPlan.designTheme);
  assert.ok(invalidPlan.warnings.some((warning) => warning.includes('フォールバック')));
  assert.equal(validateHotelPlan(invalidPlan).isValid, true);
});

test('all defined hotel types have themes and valid presets', () => {
  const { HOTEL_TYPES, PLAN_PRESETS } = require('../js/planner/buildingPlanner');
  for (const hotelType of HOTEL_TYPES) {
    assert.ok(PLAN_PRESETS[hotelType], `${hotelType}のpresetが必要です。`);
    assert.ok(PLAN_PRESETS[hotelType].theme, `${hotelType}のthemeが必要です。`);
    const plan = planHotelProject({ hotelType });
    assert.equal(plan.hotelType, hotelType);
    assert.ok(plan.designTheme);
    assert.ok(plan.floorPolicy.aboveGround);
  }
});

test('planHotelProject can generate 100 consecutive valid plans without throwing', () => {
  for (let i = 0; i < 100; i += 1) {
    const plan = planHotelProject({ random: () => (i % 101) / 100 });
    assert.ok(plan.designTheme);
    assert.equal(validateHotelPlan(plan).isValid, true);
  }
});

test('mock exam generation reaches Building and Equipment Generator with default planner options', () => {
  const plan = planHotelProject();
  const building = generateBuilding({ plan });
  const equipment = require('../js/generator/equipmentGenerator').generateEquipment(building);
  assert.ok(building.building.name);
  assert.ok(equipment.equipment.hvac.systems.length > 0);
});

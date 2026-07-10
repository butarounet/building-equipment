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

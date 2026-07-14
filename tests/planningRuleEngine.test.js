const assert = require('node:assert/strict');
const { test } = require('node:test');
const { listBuildingUses, getPatterns, getPattern, normalizeUse } = require('../js/planner/buildingPatternLibrary');
const { selectPattern, getPlanningRules, validatePattern, checkPlanningQuality, createPlanningPackage } = require('../js/planner/planningRuleEngine');
const { generateBuilding } = require('../js/generator/buildingGenerator');

test('BuildingPatternLibrary exposes exam target building uses and hotel program', () => {
  const uses = listBuildingUses();
  assert.equal(uses.length, 10);
  assert.equal(normalizeUse('ホテル'), 'hotel');
  const hotel = getPattern('hotel_city_large', 'hotel');
  assert.ok(hotel.program.includes('客室モジュール'));
  assert.ok(hotel.flows.includes('サービス動線'));
  assert.ok(getPatterns('病院')[0].program.includes('手術部'));
});

test('PatternSelector selects by building use, area, and floors', () => {
  const pattern = selectPattern({ buildingUse: 'hotel', totalFloorArea: 24000, floors: 10, occupants: 600 });
  assert.equal(pattern.patternId, 'hotel_city_large');
});

test('PlanningRuleEngine returns use-specific rules and validates hotel plan', () => {
  const rules = getPlanningRules('hotel');
  assert.ok(rules.some((r) => r.description.includes('客室は外周')));
  const plan = {
    patternId: 'hotel_city_large',
    footprint: { width: 64000, depth: 25200 },
    rooms: [
      { roomId: 'CORE', name: '中央コア', x: 28000, y: 9000, width: 8000, height: 7200, zone: 'core' },
      { roomId: 'COR', name: '中廊下', x: 0, y: 11600, width: 64000, height: 2000, zone: 'corridor' },
      { roomId: 'G801', name: '客室801', x: 0, y: 0, width: 3600, height: 11600, zone: 'guest' },
      { roomId: 'G821', name: '客室821', x: 0, y: 13600, width: 3600, height: 11600, zone: 'guest' }
    ],
    corridors: [{ id: 'COR', x: 0, y: 11600, width: 64000, height: 2000 }]
  };
  const validation = validatePattern(plan, { buildingUse: 'hotel' });
  assert.equal(validation.isValid, true);
  assert.ok(checkPlanningQuality(plan, { buildingUse: 'hotel' }).planningScore >= 95);
});

test('generateBuilding includes selected pattern package output', () => {
  const generated = generateBuilding({ random: () => 0.5 });
  assert.equal(generated.building.planningPattern.patternId, 'hotel_city_large');
  assert.ok(generated.building.planningPattern.planningRules.length > 0);
  assert.ok(generated.building.planningPattern.planningScore >= 90);
  assert.deepEqual(createPlanningPackage({ buildingUse: 'office', totalFloorArea: 12000, floors: 8 }).patternId, 'office_urban_core');
});

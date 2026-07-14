const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createHotelFloorTemplates } = require('../js/layout/floorTemplateEngine');
const { generateBuildingCropViews, CropPlanner, CropRuleLibrary, ViewSelector, ScaleOptimizer, CropQualityChecker } = require('../js/generator/buildingCropGenerator');

test('Step10-6 Building Crop Generator creates exam crop views for Q03-Q05', () => {
  const floors = createHotelFloorTemplates();
  const questions = [
    { questionId: 'Q03', title: '7階客室階平面図', prompt: '客室6室を対象にFCU配管図を作成せよ。', roomType: '客室' },
    { questionId: 'Q04', title: '男子便所部分詳細図', prompt: '男子便所の衛生設備図を作成せよ。', roomType: '男子便所' },
    { questionId: 'Q05', title: '宴会場照明設備図', prompt: '宴会場及びレストランの電気設備図を作成せよ。', roomType: '宴会場' }
  ];
  const result = generateBuildingCropViews({ floorPlans: Object.values(floors), questions, buildingType: 'hotel' });

  assert.equal(result.cropViews.length, 3);
  assert.equal(result.cropViews[0].id, 'Q03');
  assert.equal(result.cropViews[0].scale, '1/100');
  assert.ok(result.cropViews[0].rooms.filter((r) => /客室/.test(r.name)).length >= 6);
  assert.equal(result.cropViews[1].scale, '1/50');
  assert.ok(result.cropViews.every((v) => v.svg.includes('<svg')));
  assert.ok(result.cropViews.every((v) => v.answerSheetFrame && v.metadata.noEquipment));
  assert.equal(result.quality.score, 100);
});

test('Step10-6 exposes CropPlanner, rules, selector, scale optimizer and quality checker', () => {
  const floor = createHotelFloorTemplates().typicalGuestFloor;
  const rule = CropRuleLibrary.get('hotel', 'Q03');
  const selected = ViewSelector.select(floor, { questionId: 'Q03', roomType: '客室' }, rule);
  const plan = CropPlanner.plan({ floorPlan: floor, question: { questionId: 'Q03', roomType: '客室' }, buildingType: 'hotel' });

  assert.ok(rule.requiredRooms.includes('客室6室'));
  assert.ok(selected.rooms.length >= 6);
  assert.equal(ScaleOptimizer.choose(plan.cropArea, { requiredScale: '1/100' }), '1/100');
  assert.ok(CropQualityChecker.check({ cropViews: [{ ...plan, id: 'Q03', rooms: selected.rooms, columns: floor.columns, metadata: { noEquipment: true }, answerSheetFrame: {} }] }).score >= 90);
});

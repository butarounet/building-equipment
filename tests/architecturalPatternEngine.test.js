const test = require('node:test');
const assert = require('node:assert/strict');
const { createFloorTemplate } = require('../js/layout/floorTemplateEngine');
const { enhance, FloorCompositionPlanner, ArchitecturalPatternChecker } = require('../js/layout/architecturalPatternEngine');
const { selectPattern } = require('../js/layout/architecturalPatternLibrary');
const { generateBuildingCropViews } = require('../js/generator/buildingCropGenerator');
const { generateQuestionBlankPlans } = require('../js/generator/questionBlankPlanGenerator');

function plan() {
  const p = createFloorTemplate({ buildingUse: 'hotel', floorId: '7', floorName: '7階 客室階' });
  p.rooms = [{ id: 'r1', roomId: 'r1', name: '廊下', x: 0, y: 12000, width: 48000, height: 2400 }];
  p.elevators = [{ id: 'ev1', name: 'EV', x: 23000, y: 9000, width: 2400, height: 2400 }];
  p.shafts = [{ id: 'ps1', shaftType: 'PS', name: 'PS', x: 26000, y: 9000, width: 1200, height: 1200 }, { id: 'eps1', shaftType: 'EPS', name: 'EPS', x: 27400, y: 9000, width: 1200, height: 1200 }];
  p.equipmentSpaces = [{ id: 'eq1', name: '空調機械室', x: 36000, y: 25000, width: 6000, height: 4000 }];
  return p;
}

test('ArchitecturalPatternLibrary selects hotel template and floor composition', () => {
  const pattern = selectPattern({ buildingType: 'シティホテル' });
  assert.equal(pattern.use, 'hotel');
  assert.ok(pattern.zones.includes('基準客室階'));
  const composition = FloorCompositionPlanner.plan({ buildingType: 'hotel' }, [plan()], pattern);
  assert.ok(composition.some((f) => f.role === '宴会場階'));
});

test('ArchitecturalPatternEngine adds exam-like use-specific rooms with API compatibility metadata', () => {
  const src = plan();
  const result = enhance({ building: { name: '試験ホテル', buildingType: 'hotel' }, floorPlans: [src], drawing: src });
  assert.equal(result.drawing.architecturalPatternEngine, 'ArchitecturalPatternEngine');
  assert.equal(result.drawing.patternMetadata.equipmentGeneratorCompatible, true);
  assert.ok(result.drawing.rooms.some((r) => /客室/.test(r.name)));
  assert.ok(result.pattern.composition.some((f) => f.role === '基準客室階'));
  assert.ok(result.score >= 95, result.warnings.join('\n'));
  assert.equal(src.rooms.length, 1, 'source drawing remains compatible and unmutated');
});

test('ArchitecturalPatternChecker warns below 95 for incomplete drawings', () => {
  const report = ArchitecturalPatternChecker.check({ rooms: [] }, selectPattern({ buildingType: 'office' }));
  assert.ok(report.score < 95);
  assert.ok(report.warnings.length > 0);
});

test('Building crop and common question blank plans receive ArchitecturalPatternEngine output', () => {
  const floor = plan();
  const questions = [{ questionId: 'Q03', title: '客室6室の空調平面図', roomType: '客室' }];
  const crop = generateBuildingCropViews({ floorPlans: [floor], questions, buildingType: 'hotel' });
  assert.equal(crop.cropViews[0].metadata.architecturalPatternEngine, true);
  assert.ok(crop.cropViews[0].rooms.some((r) => /客室/.test(r.name)));

  const blanks = generateQuestionBlankPlans({ drawings: { floorPlans: [floor] }, common: questions });
  assert.equal(blanks.q03.blankPlan.metadata.architecturalPatternEngine, true);
});

const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/svg/svgPrimitives');
require('../js/svg/svgSymbols');
require('../js/svg/svgRenderer');
const { createFloorTemplate } = require('../js/layout/floorTemplateEngine');
const { enhance, CirculationPlanner, ServiceFlowPlanner, BuildingRealismChecker } = require('../js/layout/buildingRealismEngine');
const { renderArchitecturalDrawing } = require('../js/svg/architecturalDrawingRenderer');
const { generateQuestionBlankPlans } = require('../js/generator/questionBlankPlanGenerator');

function sampleQuestion(questionId = 'Q03') {
  return { questionId, title: '空調設備図', prompt: '代表客室階の空調設備図を作成せよ', autoSelection: { roomType: '客室', targetFloor: 'typicalGuestFloor', buildingUse: 'ホテル' }, relatedSystems: ['空調'] };
}

test('BuildingRealismEngine improves final drawing realism without mutating RoomLayoutEngine output', () => {
  const plan = createFloorTemplate('typicalGuestFloor');
  const before = JSON.stringify(plan);
  const result = enhance({ building: { name: '試験ホテル', buildingType: 'hotel' }, floorPlans: [plan], drawing: plan });
  assert.equal(JSON.stringify(plan), before);
  assert.equal(result.drawing.buildingRealismEngine, 'BuildingRealismEngine');
  assert.ok(result.score >= 95, `score=${result.score}`);
  assert.deepEqual(result.warnings, []);
  assert.ok(result.drawing.realismMetadata.finalDrawingOnly);
  assert.ok(result.drawing.realismMetadata.equipmentGeneratorCompatible);
  assert.ok(result.drawing.circulationRoutes.some((r) => r.type === '利用者動線'));
  assert.ok(result.drawing.circulationRoutes.some((r) => r.type === 'サービス動線'));
  assert.ok(result.drawing.circulationRoutes.some((r) => r.type === '避難動線'));
  assert.ok(result.drawing.circulationRoutes.some((r) => r.type === '搬入動線'));
  assert.ok(['PS', 'EPS', 'DS', 'MDF', 'IDF'].every((name) => result.drawing.shafts.some((s) => String(s.name || s.shaftType).includes(name))));
  assert.ok(result.drawing.risers.some((r) => /立主管|幹線|竪管/.test(r.name)));
  assert.ok(result.drawing.roomRelationships.some((r) => r.from === '客室' && r.to === '廊下'));
  assert.ok(result.drawing.equipmentSpaces.some((s) => /空調機械室|IDF/.test(s.name)));
  assert.ok(result.drawing.furniture.some((f) => f.type === 'bath' || f.name === 'UB'));
  assert.ok(result.realism.structuralReality.equipmentRouteClear);
  assert.ok(result.realism.coreBalance.distributed);
  assert.ok(result.realism.fireSafety.smokeCompartment);
  assert.ok(result.drawing.fireCompartments.some((f) => /防火|防煙/.test(f.type)));
});

test('BuildingRealismEngine exposes planners and 100 point checker warnings below 95', () => {
  const poor = { rooms: [], columns: [], shafts: [], equipmentSpaces: [] };
  assert.ok(CirculationPlanner.plan(poor).circulationRoutes.length >= 5);
  assert.ok(ServiceFlowPlanner.plan(poor).shafts.some((s) => s.name === 'EPS'));
  const checked = BuildingRealismChecker.check(poor, {});
  assert.ok(checked.score < 95);
  assert.ok(checked.warnings.length > 0);
});

test('Building Preview, Blank Drawing, Common Question crop, and SVG rendering receive realism data', () => {
  const plan = createFloorTemplate('typicalGuestFloor');
  const svg = renderArchitecturalDrawing(plan, { kind: 'floor', highQuality: true, building: { buildingType: 'hotel' } });
  assert.match(svg, /equipment-space-BR-(PS|EPS|DS|IDF|AHU)/);
  assert.match(svg, /fire-compartment|egress-arrow/);
  assert.doesNotMatch(svg, /renderer-error|architectural-renderer-error/);

  const blankSvg = renderArchitecturalDrawing({ ...plan, drawingId: 'blank-plan-1', blankMode: true }, { kind: 'blank', highQuality: true });
  assert.match(blankSvg, /PS|EPS|DS/);
  assert.doesNotMatch(blankSvg, /FCU|renderer-error|architectural-renderer-error/);

  const blankPlans = generateQuestionBlankPlans({ drawings: { floorPlans: [plan] }, common: [sampleQuestion()] });
  const q03 = blankPlans.q03.blankPlan;
  assert.equal(q03.metadata.buildingRealismEngine, true);
  assert.ok(q03.rooms.length > 0);
});

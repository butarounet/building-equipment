const assert = require('node:assert/strict');
const { test } = require('node:test');
const { planHotelProject } = require('../js/planner/buildingPlanner');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterials } = require('../js/generator/materialGenerator');
const { generateDrawings } = require('../js/generator/drawingGenerator');
const { generateExam } = require('../js/generator/examGenerator');
const { generateAnswerSheets, validateAnswerSheets } = require('../js/generator/answerSheetGenerator');
const { renderAnswerSheet, renderAnswerSheetSet } = require('../js/svg/answerSheetRenderer');

function fixture(includeBlankPlanBackground = false) {
  const plan = planHotelProject({ hotelType: '国際会議対応ホテル', random: () => 0.53 });
  const building = generateBuilding({ plan, random: () => 0.53 });
  const equipment = generateEquipment(building);
  const materials = generateMaterials({ plan, building, equipment });
  const drawings = generateDrawings({ plan, building, equipment, materials });
  const exam = generateExam({ plan, building, equipment, materials, drawings });
  const answerSheets = generateAnswerSheets({ exam, materials, drawings, options: { includeBlankPlanBackground } });
  return { exam, answerSheets };
}

test('generateAnswerSheets() が答案用紙一式を返す', () => {
  const { answerSheets } = fixture();
  assert.ok(answerSheets.answerSheetSetId);
  assert.ok(answerSheets.examId);
  assert.equal(answerSheets.sheetSizePolicy.written, 'A4-portrait');
  assert.equal(answerSheets.sheetSizePolicy.drawing, 'A3-landscape');
  for (const key of ['commonFields', 'answerSheet1', 'answerSheet2', 'answerSheet3', 'answerSheet4']) assert.ok(answerSheets[key]);
});

test('共通問題3問すべてにAnswerSheet4答案欄がある', () => {
  const { answerSheets } = fixture();
  assert.equal(answerSheets.answerSheet4.questions.length, 3);
  assert.deepEqual(answerSheets.answerSheet4.questions.map((q) => q.questionId), ['Q03', 'Q04', 'Q05']);
  assert.ok(answerSheets.answerSheet4.questions.every((q) => q.primaryAnswerSheetId));
});

test('空調、衛生、電気の各2問に答案欄がある', () => {
  const { answerSheets } = fixture();
  assert.equal(answerSheets.answerSheet1.questions.length, 2);
  assert.equal(answerSheets.answerSheet2.questions.length, 2);
  assert.equal(answerSheets.answerSheet3.questions.length, 2);
});

test('記述、計算、選択、図示に応じた欄が生成される', () => {
  const { answerSheets } = fixture();
  const all = [...answerSheets.answerSheet1.questions, ...answerSheets.answerSheet2.questions, ...answerSheets.answerSheet3.questions, ...answerSheets.answerSheet4.questions];
  assert.ok(all.find((q) => q.answerType === 'description').areas.description.enabled);
  const calc = all.find((q) => q.answerType === 'calculation');
  assert.ok(calc.areas.calculation.enabled);
  assert.ok(calc.areas.unit.enabled);
  assert.ok(all.find((q) => q.answerType === 'diagram').areas.diagram.enabled);
  assert.ok(answerSheets.answerSheet4.questions.every((q) => q.answerType === 'diagram')); 
});

test('questionIdとanswerSheetIdの対応がありIDが重複しない', () => {
  const { exam, answerSheets } = fixture();
  const expected = [...Object.values(exam.selection).flat(), ...Object.values(exam.common)].map((q) => q.questionId);
  assert.deepEqual(answerSheets.questionAnswerMap.map((m) => m.questionId).sort(), expected.sort());
  const json = JSON.stringify(answerSheets);
  const ids = [...json.matchAll(/"(?:id|sheetId)":"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
});

test('A4/A3/ SVG答案用紙が生成される', () => {
  const { answerSheets } = fixture();
  const html = renderAnswerSheet(answerSheets.answerSheet1, { mode: 'html', showGrid: true });
  assert.match(html, /A4 portrait/);
  assert.match(html, /answer-sheet-page a4/);
  const svg = renderAnswerSheet(answerSheets.answerSheet4, { mode: 'svg', showGrid: true });
  assert.match(svg, /^<svg/);
  assert.match(svg, /420mm/);
  assert.match(renderAnswerSheetSet(answerSheets, { sheetType: 'answerSheet4', mode: 'svg' }), /Q03/);
});



test('AnswerSheet4にQ03/Q04/Q05専用QuestionBlankPlanを埋め込む', () => {
  const { answerSheets } = fixture();
  const plans = [answerSheets.answerSheet4.floorPlanArea, answerSheets.answerSheet4.detailArea, answerSheets.answerSheet4.scheduleLegendArea].map((area) => area.drawing.blankPlan);
  assert.deepEqual(plans.map((p) => p.questionId), ['Q03', 'Q04', 'Q05']);
  assert.ok(plans.every((p) => p.cropBox && p.metadata.targetOnly));
  assert.ok(plans.every((p) => p.metadata.noEquipment));
  assert.ok(plans[0].excludedEquipment.includes('ducts'));
  assert.ok(plans[1].excludedEquipment.includes('drainage'));
  assert.ok(plans[2].excludedEquipment.includes('wiring'));
  assert.equal(plans[0].discipline, 'hvac');
  assert.equal(plans[1].discipline, 'plumbing');
  assert.equal(plans[2].discipline, 'electrical');
  assert.ok(plans[0].includePolicy.includes('EPS'));
  assert.ok(plans[1].includePolicy.includes('sanitaryFixtureOutlines'));
  assert.ok(plans[2].includePolicy.includes('furniture'));
  assert.ok(plans.every((p) => p.questionMetadata.recommendedScale));
  assert.ok(plans.every((p) => p.metadata.dynamicCropEngine && p.metadata.dynamicScaleEngine));
  assert.ok(plans.every((p) => p.sheetLayout.adaptive && p.sheetLayout.printQualityDpi >= 300));
});

test('白図背景を切り替えられ、模範解答を含まない', () => {
  const off = fixture(false).answerSheets;
  const on = fixture(true).answerSheets;
  assert.equal(off.metadata.includeBlankPlanBackground, false);
  assert.equal(on.metadata.includeBlankPlanBackground, true);
  assert.equal(JSON.stringify(on).includes('模範解答:'), false);
  assert.equal(JSON.stringify(on).includes('modelAnswer'), false);
});

test('validateAnswerSheets() が正常に動く', () => {
  const { exam, answerSheets } = fixture();
  const result = validateAnswerSheets(answerSheets, exam);
  assert.equal(result.isValid, true, result.errors.join('\n'));
  assert.ok(result.checks.length > 0);
});

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
  const expected = [...Object.values(exam.selection).flat(), ...exam.common].map((q) => q.questionId);
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

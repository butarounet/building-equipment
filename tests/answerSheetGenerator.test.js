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
  for (const key of ['commonFields', 'mandatoryPlanningSheet', 'hvacSheet', 'plumbingSheet', 'electricalSheet', 'commonDescriptionSheet']) assert.ok(answerSheets[key]);
});

test('必須問題11問すべてに答案欄がある', () => {
  const { answerSheets } = fixture();
  assert.equal(answerSheets.mandatoryPlanningSheet.questions.length, 11);
  assert.ok(answerSheets.mandatoryPlanningSheet.questions.every((q) => q.primaryAnswerSheetId));
});

test('空調、衛生、電気の各5問に答案欄がある', () => {
  const { answerSheets } = fixture();
  assert.equal(answerSheets.hvacSheet.questions.length, 5);
  assert.equal(answerSheets.plumbingSheet.questions.length, 5);
  assert.equal(answerSheets.electricalSheet.questions.length, 5);
});

test('記述、計算、選択、図示に応じた欄が生成される', () => {
  const { answerSheets } = fixture();
  const all = [...answerSheets.mandatoryPlanningSheet.questions, ...answerSheets.hvacSheet.questions];
  assert.ok(all.find((q) => q.answerType === 'description').areas.description.enabled);
  const calc = all.find((q) => q.answerType === 'calculation');
  assert.ok(calc.areas.calculation.enabled);
  assert.ok(calc.areas.unit.enabled);
  assert.ok(all.find((q) => q.answerType === 'diagram').areas.diagram.enabled);
  assert.ok(answerSheets.mandatoryPlanningSheet.questions.find((q) => q.answerType === 'selection').areas.selection.enabled);
});

test('questionIdとanswerSheetIdの対応がありIDが重複しない', () => {
  const { exam, answerSheets } = fixture();
  const expected = [...exam.mandatoryQuestions, ...Object.values(exam.electiveSections).flat()].map((q) => q.questionId);
  assert.deepEqual(answerSheets.questionAnswerMap.map((m) => m.questionId).sort(), expected.sort());
  const json = JSON.stringify(answerSheets);
  const ids = [...json.matchAll(/"(?:id|sheetId)":"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
});

test('A4/A3/ SVG答案用紙が生成される', () => {
  const { answerSheets } = fixture();
  const html = renderAnswerSheet(answerSheets.mandatoryPlanningSheet, { mode: 'html', showGrid: true });
  assert.match(html, /A4 portrait/);
  assert.match(html, /answer-sheet-page a4/);
  const svg = renderAnswerSheet(answerSheets.hvacSheet, { mode: 'svg', showGrid: true });
  assert.match(svg, /^<svg/);
  assert.match(svg, /420mm/);
  assert.match(renderAnswerSheetSet(answerSheets, { sheetType: 'electricalSheet', mode: 'svg' }), /受電点/);
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

test('answerSheetRendererはブラウザ側でrequireが存在してもmodule.exportsがなければwindow.svgPrimitivesを使う', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  const source = fs.readFileSync('js/svg/answerSheetRenderer.js', 'utf8');
  const context = {
    require: () => { throw new Error('browser require should not be called'); },
    window: { svgPrimitives: { escapeXml: (v) => String(v), drawRect: () => '<rect/>', drawText: () => '<text/>', drawLine: () => '<line/>' } }
  };
  vm.runInNewContext(source, context);
  assert.equal(typeof context.window.answerSheetRenderer.renderAnswerSheet, 'function');
});

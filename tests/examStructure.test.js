const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelProject } = require('../js/planner/buildingPlanner');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterials } = require('../js/generator/materialGenerator');
const { generateDrawings } = require('../js/generator/drawingGenerator');
const { generateExam, validateExam } = require('../js/generator/examGenerator');
const { generateAnswerSheets, validateAnswerSheets } = require('../js/generator/answerSheetGenerator');
const { generateExamPackage, ExamQualityChecker } = require('../js/generator/examPackageGenerator');

function fixture() {
  const plan = planHotelProject({ hotelType: '国際会議対応ホテル', random: () => 0.53 });
  const building = generateBuilding({ plan, random: () => 0.53 });
  const equipment = generateEquipment(building);
  const materials = generateMaterials({ plan, building, equipment });
  const drawings = generateDrawings({ plan, building, equipment, materials });
  const exam = generateExam({ plan, building, equipment, materials, drawings });
  return { plan, building, equipment, materials, drawings, exam };
}

test('本試験構成: 選択2問×3分野と共通Q03-Q05を生成する', () => {
  const input = fixture();
  const { exam } = input;
  assert.deepEqual(exam.selection.hvac.map((q) => q.questionId), ['A01', 'A02']);
  assert.deepEqual(exam.selection.plumbing.map((q) => q.questionId), ['B01', 'B02']);
  assert.deepEqual(exam.selection.electrical.map((q) => q.questionId), ['C01', 'C02']);
  assert.deepEqual(exam.common.map((q) => [q.questionId, q.type]), [['Q03', 'hvac-room-detail'], ['Q04', 'plumbing-detail'], ['Q05', 'electrical-design']]);
  assert.equal(validateExam(exam, input).isValid, true);
});

test('AnswerSheet1-4と対応表が本試験構成に一致する', () => {
  const input = fixture();
  const answerSheets = generateAnswerSheets(input);
  assert.equal(answerSheets.answerSheet1.questions.length, 2);
  assert.equal(answerSheets.answerSheet2.questions.length, 2);
  assert.equal(answerSheets.answerSheet3.questions.length, 2);
  assert.equal(answerSheets.answerSheet4.questions.length, 3);
  assert.deepEqual(answerSheets.answerSheet4.questions.map((q) => q.questionId), ['Q03', 'Q04', 'Q05']);
  assert.equal(validateAnswerSheets(answerSheets, input.exam).isValid, true);
});

test('JSON Schema、Exam Package、Quality Checkerが本試験構成を保持する', () => {
  const input = fixture();
  const pkg = generateExamPackage(input);
  const report = ExamQualityChecker.check(pkg);
  assert.ok(pkg.examBooklet.pages.some((p) => p.questionId === 'Q03'));
  assert.ok(pkg.answerSheets.answerSheet4);
  assert.equal(report.checklist.find((c) => c.label === 'AnswerSheet4')?.ok, true);
  assert.equal(report.checklist.find((c) => c.label === '共通問題3問')?.ok, true);
  assert.equal(report.isValid, true, report.errors.join('\n'));
});

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { planHotelProject } = require('../js/planner/buildingPlanner');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterials } = require('../js/generator/materialGenerator');
const { generateDrawings } = require('../js/generator/drawingGenerator');
const { generateExam, createQuestionFingerprint, checkQuestionDuplication, validateExam } = require('../js/generator/examGenerator');

function fixture() {
  const plan = planHotelProject({ hotelType: '国際会議対応ホテル', random: () => 0.53 });
  const building = generateBuilding({ plan, random: () => 0.53 });
  const equipment = generateEquipment(building);
  const materials = generateMaterials({ plan, building, equipment });
  const drawings = generateDrawings({ plan, building, equipment, materials });
  const exam = generateExam({ plan, building, equipment, materials, drawings, options: { applicableLawDate: '2026-01-01' } });
  return { plan, building, equipment, materials, drawings, exam };
}

test('generateExam() が試験データを生成する', () => {
  const { exam } = fixture();
  assert.ok(exam.examId);
  assert.equal(exam.version, '1.0');
  assert.equal(exam.durationMinutes, 330);
  assert.ok(exam.projectTitle);
});

test('各選択設備2問、共通3問を生成する', () => {
  const { exam } = fixture();
  assert.equal(exam.selection.hvac.length, 2);
  assert.equal(exam.selection.plumbing.length, 2);
  assert.equal(exam.selection.electrical.length, 2);
  assert.equal(Object.values(exam.common).length, 3);
  assert.equal(Object.prototype.hasOwnProperty.call(exam, 'mandatoryQuestions'), false);
});

test('表紙、注意事項、設計課題、計画条件、計算条件、製図要求、答案参照が存在する', () => {
  const { exam } = fixture();
  for (const key of ['cover', 'instructions', 'designTask', 'planningConditions', 'calculationConditions', 'drawingRequirements', 'answerSheetReferences']) {
    assert.ok(exam[key], `${key}が必要です。`);
  }
  assert.equal(exam.cover.learningLabel, '学習用模擬試験');
  assert.ok(exam.instructions.some((item) => item.includes('模範解答')));
  assert.ok(exam.drawingRequirements.blankPlanReferences.length > 0);
});

test('模範解答を含まない', () => {
  const { exam } = fixture();
  assert.equal(Object.prototype.hasOwnProperty.call(exam, 'modelAnswers'), false);
  assert.equal(JSON.stringify(exam).includes('模範解答:'), false);
});

test('重複検査が動作する', () => {
  const { exam } = fixture();
  const fp = createQuestionFingerprint(exam.selection.hvac[0]);
  assert.equal(fp.id, 'A01');
  assert.ok(fp.keywords.length > 0);
  const duplication = checkQuestionDuplication([exam.selection.hvac[0], { ...exam.selection.hvac[0], questionId: 'X01' }]);
  assert.equal(duplication.hasDuplication, true);
});

test('validateExam() が正常に動く', () => {
  const input = fixture();
  const validation = validateExam(input.exam, input);
  assert.equal(validation.isValid, true, validation.errors.join('\n'));
  assert.equal(validation.checks.selectionCounts, true);
  assert.equal(validation.checks.commonCount, true);
});

test('無効な建物データを検出する', () => {
  const input = fixture();
  const invalidBuilding = structuredClone(input.building);
  invalidBuilding.building.rooms.guestRooms += 99;
  const validation = validateExam(input.exam, { ...input, building: invalidBuilding });
  assert.equal(validation.isValid, false);
  assert.equal(validation.checks.buildingConsistency, false);
});

test('存在しない階の出題を検出する', () => {
  const input = fixture();
  const invalidExam = structuredClone(input.exam);
  invalidExam.drawingRequirements.targetFloors = ['99'];
  const validation = validateExam(invalidExam, input);
  assert.equal(validation.isValid, false);
  assert.equal(validation.checks.existingFloors, false);
});

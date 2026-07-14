const test = require('node:test');
const assert = require('node:assert/strict');
const { reproduceRealExam, createTemplateScaffolds } = require('../js/exam/realExamReproductionEngine');
const { checkQuestionNumbers, SECTION_ORDER } = require('../js/exam/questionLayoutEngine');
const { DRAWING_ORDER } = require('../js/exam/drawingLayoutEngine');
const { FIXED_PAGE_ORDER } = require('../js/exam/paginationEngine');

function questions(prefix, count) { return Array.from({ length: count }, (_, i) => ({ questionId: `${prefix}${String(i + 1).padStart(2, '0')}`, title: `${prefix} question ${i + 1}`, prompt: '本試験テンプレートの文章量を維持する。' })); }

test('STEP10-15 reproduces fixed real exam structure and quality gates', () => {
  const report = reproduceRealExam({
    exam: { mandatory: questions('M', 11), selectionQuestions: questions('S', 5), commonQuestions: questions('C', 11) },
    drawings: { 配置図: [{}], 各階平面図: [{}, {}], 屋上: [{}], 断面: [{}], 白図: [{}], 設備図: [{}], 模範図: [{}] },
    answerSheets: {},
    templates: createTemplateScaffolds(),
    outputs: [{ type: 'pdf', path: 'submission.pdf' }]
  });
  assert.equal(report.passed, true);
  assert.deepEqual(report.questionLayout.sectionOrder, SECTION_ORDER);
  assert.deepEqual(report.drawingLayout.drawingOrder, DRAWING_ORDER);
  assert.deepEqual(report.pagination.pageOrder, FIXED_PAGE_ORDER);
  assert.equal(report.questionLayout.questionCounts.mandatory, 11);
  assert.equal(report.questionLayout.questionCounts.selection, 5);
  assert.equal(report.questionLayout.questionCounts.common, 11);
  assert.equal(report.templateSimilarity.passed, true);
  assert.equal(report.layoutSimilarity.score >= 95, true);
  for (const gate of ['TemplateSimilarity','QuestionCount','DrawingCount','PageCount','Layout','AnswerSheet','CommonQuestions','PrintLayout','SVG','PDF']) assert.equal(report.qualityGate[gate], true, gate);
});

test('Question Number Checker rejects missing and duplicate questions', () => {
  const report = reproduceRealExam({ exam: { mandatory: questions('M', 10), selectionQuestions: questions('S', 5), commonQuestions: [...questions('C', 10), { questionId: 'C10' }] } });
  const checked = checkQuestionNumbers(report.questionLayout);
  assert.equal(checked.passed, false);
  assert.ok(checked.duplicates.includes('C10'));
});

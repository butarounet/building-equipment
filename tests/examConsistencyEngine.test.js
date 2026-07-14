const test = require('node:test');
const assert = require('node:assert/strict');
const { ExamConsistencyEngine, checkExamConsistency } = require('../js/quality/examConsistencyEngine');
const { generateQuestionBlankPlans } = require('../js/generator/questionBlankPlanGenerator');

function q(questionId, type, title, prompt, conditions, room, systems = []) {
  return { questionId, id: questionId, number: Number(questionId.replace(/\D/g, '')), category: '共通問題', title, prompt, answerType: 'diagram', type, conditions, relatedRooms: [room], relatedSystems: systems, autoSelection: { roomType: room, targetFloor: room.includes('7階') ? '7' : 'B1', equipmentCondition: systems } };
}
function fixture() {
  const exam = {
    selection: { hvac: [{ questionId: 'A01' }, { questionId: 'A02' }], plumbing: [{ questionId: 'B01' }, { questionId: 'B02' }], electrical: [{ questionId: 'C01' }, { questionId: 'C02' }] },
    common: {
      q03: q('Q03', 'hvac-detail', 'FCU四管式詳細図', '7階客室を対象にFCU四管式配管詳細図を作成せよ。', ['FCU四管式'], '7階客室', ['FCU四管式']),
      q04: q('Q04', 'plumbing-detail', '男子便所配管詳細図', '男子便所を対象に給水、給湯、排水、通気を作図せよ。', ['給水', '給湯', '排水'], '男子便所'),
      q05: q('Q05', 'electrical-equipment', '地下食堂電気設備図', '地下食堂を対象に照明、感知器、非常放送、誘導灯、コンセント、配線、警戒範囲を作図せよ。', ['照明', '感知器', '非常放送', '誘導灯', 'コンセント', '配線', '警戒範囲'], '地下食堂')
    }
  };
  const drawings = { floorPlans: [
    { drawingId: 'floor-plan-7', floorId: '7', floorName: '7階', scale: '1/200', columns: [{}], walls: [{}], rooms: [{ name: '7階客室' }, { name: '男子便所' }], doors: [], windows: [], gridLines: {}, dimensions: [] },
    { drawingId: 'floor-plan-B1', floorId: 'B1', floorName: '地下1階', scale: '1/200', columns: [{}], walls: [{}], rooms: [{ name: '地下食堂' }], doors: [], windows: [], gridLines: {}, dimensions: [] }
  ], blankPlans: [
    { drawingId: 'blank-plan-7', floorId: '7', floorName: '7階', scale: '1/200', columns: [{}], walls: [{}], rooms: [{ name: '7階客室' }, { name: '男子便所' }] },
    { drawingId: 'blank-plan-B1', floorId: 'B1', floorName: '地下1階', scale: '1/200', columns: [{}], walls: [{}], rooms: [{ name: '地下食堂' }] }
  ] };
  const plans = generateQuestionBlankPlans({ drawings, common: exam.common });
  const answerSheets = { answerSheet4: { questions: [{ questionId: 'Q03' }, { questionId: 'Q04' }, { questionId: 'Q05' }], floorPlanArea: { questionId: 'Q03', drawing: plans.q03 }, detailArea: { questionId: 'Q04', drawing: plans.q04 }, scheduleLegendArea: { questionId: 'Q05', drawing: plans.q05 } } };
  const modelAnswers = { q03: '7階客室 FCU四管式 模範図', q04: '男子便所 給水 給湯 排水 通気 模範図', q05: '地下食堂 照明 感知器 非常放送 誘導灯 コンセント 配線 警戒範囲 模範図' };
  const scoring = { CQ03: '7階客室 FCU四管式 採点基準', CQ04: '男子便所 採点基準', CQ05: '地下食堂 採点基準' };
  const materials = [{ title: '資料1 問題冊子' }, { title: '資料2 建築基本設計図' }, { title: '資料3 模範解答' }, { title: '資料4 設備模範図' }, { title: '資料5 答案用紙' }];
  return { exam, drawings, answerSheets, modelAnswers, scoring, materials };
}

test('ExamConsistencyEngine validates CQ03 HVAC, CQ04 Plumbing, CQ05 Electrical and templates', () => {
  const report = new ExamConsistencyEngine().check(fixture());
  assert.equal(report.passed, true, report.errors.join('\n'));
  assert.equal(report.score, 100);
  for (const label of ['CQ03 HVAC方式', 'CQ04 Plumbing用途', 'CQ05 Electrical項目', 'AnswerSheet4共通問題専用']) {
    assert.equal(report.checks.find((c) => c.name === label)?.ok, true, label);
  }
});

test('ExamConsistencyEngine rejects forbidden A03 and mismatched AnswerSheet4', () => {
  const input = fixture();
  input.exam.selection.hvac.push({ questionId: 'A03' });
  input.answerSheets.answerSheet4.detailArea.drawing.blankPlan.questionMetadata.roomType = '厨房';
  const report = checkExamConsistency(input);
  assert.equal(report.passed, false);
  assert.ok(report.errors.some((e) => e.includes('A03')));
  assert.ok(report.errors.some((e) => e.includes('答案用紙')));
});

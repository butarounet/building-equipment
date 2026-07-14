const test = require('node:test');
const assert = require('node:assert/strict');
const { ExamState } = require('../js/ui/examState');
const { ExamPipeline } = require('../js/ui/examPipeline');
const { DownloadManager } = require('../js/ui/downloadManager');

function deps(report = { passed: true, score: 100, errors: [], warnings: [] }) {
  const calls = [];
  const q = (id) => ({ questionId: id, title: id, prompt: `${id} prompt`, relatedRooms: ['客室'], relatedSystems: ['FCU四管式'], autoSelection: { roomType: '客室' } });
  return {
    calls,
    dependencies: {
      planHotelProject: () => (calls.push('Plan'), { hotelType: 'city' }),
      generateBuilding: () => (calls.push('BuildingGenerator'), { building: { name: 'B', rooms: { guestRooms: 200 } } }),
      generateEquipment: () => (calls.push('EquipmentGenerator'), { equipment: { hvac: { systems: [{ id: 'guestroom-fcu' }] } } }),
      generateMaterials: () => (calls.push('MaterialGenerator'), { materials: [{ materialId: 'material-1' }, { materialId: 'material-5' }] }),
      generateExam: () => (calls.push('QuestionGenerator'), { examId: 'E1', selection: { hvac: [q('A01'), q('A02')], plumbing: [q('B01'), q('B02')], electrical: [q('C01'), q('C02')] }, common: { q03: q('Q03'), q04: q('Q04'), q05: q('Q05') } }),
      generateDrawings: () => (calls.push('BuildingDrawingGenerator', 'EquipmentDrawingGenerator', 'BlankDrawingGenerator'), { drawingSetId: 'D1', sitePlan: { drawingId: 'site' }, floorPlans: [{ floorId: '1' }], equipmentPlans: [{ floorId: '1', equipment: true }], blankPlans: [{ drawingId: 'blank-1', floorId: '1' }], detailDrawings: [], legends: [] }),
      generateAnswerSheets: () => (calls.push('AnswerSheetGenerator'), { answerSheet1: { questions: [q('A01'), q('A02')] }, answerSheet2: { questions: [q('B01'), q('B02')] }, answerSheet3: { questions: [q('C01'), q('C02')] }, answerSheet4: { questions: [q('Q03'), q('Q04'), q('Q05')] }, questionAnswerMap: [] }),
      generateModelAnswers: () => (calls.push('ModelAnswerGenerator'), { answers: ['FCU四管式 客室'] }),
      checkExamConsistency: () => (calls.push('ExamConsistencyEngine'), report)
    }
  };
}

test('ExamPipeline generates one synchronized ExamState in dependency order', async () => {
  const state = new ExamState();
  const fixture = deps();
  const progress = [];
  const result = await new ExamPipeline({ state, dependencies: fixture.dependencies, onProgress: (e) => progress.push(e.step) }).generate();
  assert.deepEqual(fixture.calls, ['Plan', 'BuildingGenerator', 'EquipmentGenerator', 'MaterialGenerator', 'QuestionGenerator', 'BuildingDrawingGenerator', 'EquipmentDrawingGenerator', 'BlankDrawingGenerator', 'AnswerSheetGenerator', 'ModelAnswerGenerator', 'ExamConsistencyEngine']);
  assert.equal(result.building.building.name, 'B');
  assert.equal(result.answerSheets.answerSheet4.questions.length, 3);
  assert.equal(result.printPackage.printable, true);
  assert.deepEqual(progress, ['Building...', 'Equipment...', 'Materials...', 'Questions...', 'Drawings...', 'Blank...', 'Answer...', 'Checking...', 'Complete']);
});

test('DownloadManager blocks PDF when quality check fails but keeps JSON/SVG available', async () => {
  const state = new ExamState();
  const fixture = deps({ passed: false, score: 80, errors: ['NG'], warnings: [] });
  await new ExamPipeline({ state, dependencies: fixture.dependencies }).generate();
  const manager = new DownloadManager(state);
  assert.throws(() => manager.pdf(), /PDF生成は禁止/);
  assert.match(manager.json(), /"consistency"/);
  assert.match(manager.svg(), /"blankDrawing"/);
});

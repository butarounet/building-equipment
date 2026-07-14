const assert = require('node:assert/strict');
const { test } = require('node:test');
const { analyzeQuestionRequirement, analyzeDrawingInstructions, validateDrawingInstructionAnalysis } = require('../js/generator/questionBlankPlanGenerator');

test('Drawing Instruction AnalyzerはHVAC作図要素を抽出する', () => {
  const question = { questionId: 'Q03', prompt: '客室6室を対象にSA・RAダクト、ダクトサイズ、吹出口、吸込口、FD、VD、VAV、FCU、点検口、保温を作図せよ。' };
  const drawingRequirement = analyzeQuestionRequirement({ question });
  const analysis = analyzeDrawingInstructions({ question, drawingRequirement });
  assert.equal(analysis.discipline, 'HVAC');
  assert.ok(analysis.elements.ducts.some((x) => x.label === 'SAダクト'));
  assert.ok(analysis.elements.ducts.some((x) => x.label === 'RAダクト'));
  assert.ok(analysis.elements.airOutlets.some((x) => x.label === '吹出口'));
  assert.ok(analysis.elements.airInlets.some((x) => x.label === '吸込口'));
  assert.ok(analysis.elements.dampers.some((x) => x.label === 'FD'));
  assert.ok(analysis.elements.notes.some((x) => x.label === '保温'));
  assert.equal(validateDrawingInstructionAnalysis(analysis, { drawingRequirement }).isValid, true);
});

test('Drawing Instruction Analyzerは衛生と電気の作図要素をスキーマ別に抽出する', () => {
  const plumbing = analyzeDrawingInstructions({ question: { questionId: 'Q04', prompt: '厨房の給水、給湯、排水、通気、雨水、消火、器具、弁、金物、グリース阻集器、トラップ、通気立管、配管径を示せ。' }, drawingRequirement: { drawingType: 'PLUMBING', questionId: 'Q04' } });
  assert.ok(plumbing.elements.pipes.some((x) => x.label === '給水配管'));
  assert.ok(plumbing.elements.valves.some((x) => x.label === '弁'));
  assert.ok(plumbing.elements.plumbingFixtures.some((x) => x.label === 'グリース阻集器'));
  assert.ok(plumbing.elements.dimensions.some((x) => x.label === '配管径'));

  const electrical = analyzeDrawingInstructions({ question: { questionId: 'Q05', prompt: '照明、非常照明、誘導灯、感知器、スピーカー、コンセント、スイッチ、LAN、電話、受信機、発信機、配線、配線番号、警戒範囲、照度計算を示せ。' }, drawingRequirement: { drawingType: 'ELECTRICAL', questionId: 'Q05' } });
  assert.ok(electrical.elements.lightingFixtures.some((x) => x.label === '照明'));
  assert.ok(electrical.elements.emergencyLights.some((x) => x.label === '非常照明'));
  assert.ok(electrical.elements.exitSigns.some((x) => x.label === '誘導灯'));
  assert.ok(electrical.elements.cableRoutes.some((x) => x.label === 'LAN'));
  assert.ok(electrical.elements.notes.some((x) => x.label === '照度計算'));
});

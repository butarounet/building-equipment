const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateQuestionNarrative, normalizeSystem } = require('../js/generator/questionNarrativeGenerator');

test('QuestionScenarioNormalizerは設備方式を標準形式へ変換する', () => {
  assert.equal(normalizeSystem('AHU', 'HVAC'), 'AHU_VAV');
  assert.equal(normalizeSystem('FCU', 'HVAC'), 'FCU_4Pipe');
  assert.equal(normalizeSystem('PAC', 'HVAC'), 'PAC_IndoorOutdoor');
  assert.equal(normalizeSystem('LoopVent', 'PLUMBING'), 'LoopVentDrainage');
});

test('HVAC AHU+VAVの本試験風問題文と作図対象を生成する', () => {
  const out = generateQuestionNarrative({ scenario: { discipline: 'HVAC', questionNo: 'Q03', room: '宴会場', system: 'AHU', drawingType: 'duct', scale: '1/100', difficulty: 'standard' } });
  assert.match(out.questionText, /第3問/);
  assert.match(out.questionText, /1階宴会場平面図（S=1:100）/);
  assert.match(out.questionText, /AHU単一ダクトVAV方式/);
  assert.ok(out.conditions.some((c) => c.includes('SA、RA、EA及びOA')));
  assert.ok(out.drawingInstruction.includes('FD'));
  assert.ok(out.drawingInstruction.includes('点検口'));
  assert.equal(out.drawingRequirement.drawingType, 'HVAC');
  assert.equal(out.quality.isValid, true, out.quality.errors.join('\n'));
});

test('衛生と電気の条件不足を防ぎAnalyzerへ渡せるJSONを生成する', () => {
  const plumbing = generateQuestionNarrative({ scenario: { discipline: 'Plumbing', questionNo: 'Q04', room: '厨房', system: 'Kitchen_Drainage', scale: '1/50' } });
  assert.match(plumbing.questionText, /給水・給湯・排水・通気配管図/);
  assert.ok(plumbing.conditions.some((c) => c.includes('グリース阻集器')));
  assert.ok(plumbing.conditions.some((c) => c.includes('通気')));
  assert.equal(plumbing.drawingRequirement.drawingType, 'PLUMBING');

  const electrical = generateQuestionNarrative({ scenario: { discipline: 'Electrical', questionNo: 'Q05', room: '従業員食堂', system: 'Lighting', scale: '1/100' } });
  assert.match(electrical.questionText, /照明器具配置図/);
  assert.ok(electrical.conditions.some((c) => c.includes('設計照度')));
  assert.ok(electrical.requiredElements.includes('照明台数計算表'));
  assert.equal(electrical.drawingRequirement.drawingType, 'ELECTRICAL');
});

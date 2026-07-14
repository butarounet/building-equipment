const assert = require('node:assert/strict');
const { test } = require('node:test');
const { analyzeQuestionRequirement, checkDrawingRequirementQuality } = require('../js/generator/questionBlankPlanGenerator');

test('Question Requirement AnalyzerはQ03 FCU配管図要求をDrawing Requirementへ変換する', () => {
  const req = analyzeQuestionRequirement({ question: { questionId: 'Q03', prompt: '客室6室を対象にFCU配管図を作成せよ。冷温水、ドレンを示すこと。', relatedSystems: ['guestroom-fcu'] }, buildingType: 'ホテル', difficulty: 'hard' });
  assert.equal(req.drawingType, 'HVAC');
  assert.equal(req.requiredScale, '1/100');
  assert.ok(req.requiredRooms.includes('客室6室'));
  assert.ok(req.hiddenEquipment.includes('FCU'));
  assert.ok(req.requiredFixtures.includes('UB'));
});

test('Question Requirement Analyzerは厨房排水と会議室照明の表示・非表示を決める', () => {
  const kitchen = analyzeQuestionRequirement({ question: { questionId: 'Q04', prompt: '厨房排水配管図を作成せよ。グリース阻集器位置を示すこと。' } });
  assert.equal(kitchen.drawingType, 'PLUMBING');
  assert.ok(kitchen.requiredFixtures.includes('厨房器具輪郭'));
  assert.ok(kitchen.hiddenEquipment.includes('drainage'));
  assert.ok(kitchen.requiredEquipmentSymbols.includes('グリース阻集器位置'));
  const meeting = analyzeQuestionRequirement({ question: { questionId: 'Q05', prompt: '会議室照明設備図を作成し、照明台数計算表を示せ。' }, roomType: '会議室' });
  assert.equal(meeting.drawingType, 'ELECTRICAL');
  assert.equal(meeting.requiredFurniture, true);
  assert.ok(meeting.hiddenEquipment.includes('lighting'));
  assert.ok(meeting.hiddenEquipment.includes('detectors'));
  assert.ok(meeting.requiredTables.includes('計算表'));
});

test('Drawing Requirement Quality Checkerは本試験レベルの整合項目を検査する', () => {
  const req = analyzeQuestionRequirement({ question: { questionId: 'Q05', prompt: '会議室照明設備図を作成し、照明台数計算表を示せ。' }, roomType: '会議室', equipmentSystem: ['lighting-control'] });
  const report = checkDrawingRequirementQuality({ drawingRequirement: req, questionMetadata: { roomType: '会議室' }, scale: req.requiredScale, cropBox: { x: 0, y: 0, width: 1, height: 1 }, metadata: { targetOnly: true }, excludedEquipment: req.hiddenEquipment, sheetLayout: { frame: '本試験答案レイアウト', adaptive: true } });
  assert.equal(report.isValid, true, report.errors.join('\n'));
  assert.deepEqual(report.checks.map((c) => c.label), ['問題文と白図一致', '問題文と縮尺一致', '問題文と切り出し範囲一致', '問題文と設備方式一致', '問題文と表示情報一致', '本試験レベル一致']);
});

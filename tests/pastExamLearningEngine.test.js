const test = require('node:test');
const assert = require('node:assert/strict');
const { PastExamLearningEngine, learnPastExams } = require('../js/learning/pastExamLearningEngine');

test('PastExamLearningEngine learns Reiwa 2 through Reiwa 7 exam style knowledge', () => {
  const result = learnPastExams();
  assert.equal(result.pattern.examCount, 6);
  assert.ok(result.pattern.questionCount >= 30);
  assert.ok(result.questionTrend.style.endings['述べよ'] > 0);
  assert.ok(result.drawingTrend.trend.some((item) => item.type === '白図'));
  assert.ok(result.equipmentTrend.trend.length > 0);
  assert.ok(result.difficulty.score >= 0);
  assert.ok(result.score >= 95);
  assert.equal(result.quality.passed, true);
});

test('PastExamLearningEngine scores generated candidates and exposes warning below threshold', () => {
  const engine = new PastExamLearningEngine();
  const result = engine.analyze({ common: { q03: { prompt: '白図を用いて設備図を作成せよ。必要事項を述べよ。', relatedSystems: ['FCU'], relatedRooms: ['客室'] } } });
  assert.ok(result.examStyle);
  assert.ok(result.quality.candidate.score <= 100);
  assert.ok(result.quality.similarity >= 95);
  assert.equal(result.quality.threshold, 95);
});

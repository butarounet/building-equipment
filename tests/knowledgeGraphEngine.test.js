const test = require('node:test');
const assert = require('node:assert/strict');
const { KnowledgeGraphEngine } = require('../js/knowledge/knowledgeGraphEngine');

test('KnowledgeGraphEngine loads all generator graph files and validates chain', () => {
  const graph = KnowledgeGraphEngine.fromRepository();
  const report = graph.validate({ BuildingGenerator: {}, EquipmentGenerator: {}, QuestionGenerator: {}, DrawingGenerator: {}, AnswerSheetGenerator: {}, Scoring: {} });
  assert.equal(report.passed, true, report.errors.join('\n'));
  assert.ok(report.score >= 95);
  assert.equal(graph.findNode('equipment:ahu-1').type, 'Equipment');
  assert.equal(graph.findByType('Question').length, 1);
});

test('KnowledgeGraphEngine traces AHU impact to room, duct, drawing, question, answer, and scoring', () => {
  const graph = KnowledgeGraphEngine.fromRepository();
  const impactedIds = graph.getImpact('equipment:ahu-1').map((item) => item.node.id);
  for (const id of ['system:ahu-vav', 'room:7:guestroom', 'system:duct-supply', 'drawing:hvac:7f', 'question:cq03', 'answer:sheet4:cq03', 'scoring:cq03']) {
    assert.ok(impactedIds.includes(id), `${id} should be impacted`);
  }
});

test('KnowledgeGraphEngine resolves dependencies and auto-generates missing standard links', () => {
  const graph = new KnowledgeGraphEngine({ nodes: [
    { id: 'drawing:x', type: 'Drawing' },
    { id: 'question:x', type: 'Question' },
    { id: 'answer:x', type: 'AnswerSheet' },
    { id: 'model:x', type: 'ModelAnswer' },
    { id: 'scoring:x', type: 'Scoring' }
  ] });
  const generated = graph.generateDependencies();
  assert.ok(generated.some((e) => e.type === 'draws'));
  assert.ok(generated.some((e) => e.type === 'answers'));
  assert.ok(generated.some((e) => e.type === 'scores'));
  const deps = graph.getDependencies('scoring:x').map((node) => node.id);
  assert.ok(deps.includes('model:x'));
  assert.ok(deps.includes('answer:x'));
});

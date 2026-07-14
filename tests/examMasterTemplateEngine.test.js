const test = require('node:test');
const assert = require('node:assert/strict');
const { ExamMasterTemplateEngine } = require('../js/exam/examMasterTemplateEngine');
const { selectExamYear } = require('../js/exam/examYearSelector');

test('selects Reiwa 2 through Reiwa 7 yearly templates', () => {
  for (const year of [2020, 2021, 2022, 2023, 2024, 2025]) {
    assert.equal(selectExamYear({ year }).templateId, `r${year}-master`);
  }
});

test('renders generator values through the selected template', () => {
  const result = new ExamMasterTemplateEngine().generate({ year: 2025, Building: { name: 'hotel' }, Equipment: { system: 'AHU' }, Question: { id: 'CQ03' }, Answer: { sheet: 4 }, Drawing: { items: [{ title: '建築図1' }] } });
  assert.equal(result.passed, true);
  assert.equal(result.selection.templateId, 'r2025-master');
  assert.match(result.rendered.html, /data-template-slot="Building"/);
  assert.match(result.rendered.svg, /drawingFrame/);
  assert.equal(result.validation.similarities.html, 98);
});

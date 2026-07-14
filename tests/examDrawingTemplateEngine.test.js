const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateExamDrawingTemplates, TemplateLibrary, SheetLayoutEngine, ViewportLayoutEngine, TitleBlockGenerator, LegendLayoutEngine, ScaleBarGenerator, DrawingCompositionEngine, TemplateQualityChecker } = require('../js/generator/examDrawingTemplateEngine');

test('Step10-7 Exam Drawing Template Engine creates fixed exam drawing templates', () => {
  const result = generateExamDrawingTemplates({ context: { buildingName: '中央ホテル', buildingUse: 'ホテル' } });
  assert.equal(result.templates.length, 7);
  const floor = result.templates.find((t) => t.drawingNumber === '資料2');
  assert.equal(floor.drawingType, 'floor');
  assert.equal(floor.sheet, 'A3');
  assert.equal(floor.scale, '1/200');
  assert.equal(floor.title, '1階平面図');
  assert.ok(floor.frame.width > 390);
  assert.ok(floor.viewport.centered);
  assert.ok(floor.legend.items.some((i) => i.label === 'EPS'));
  assert.equal(floor.titleBlock.buildingName, '中央ホテル');
  assert.equal(result.quality.score, 100);
});

test('Step10-7 composes common question templates with required scales and quality checks', () => {
  const result = generateExamDrawingTemplates({ includeDefaults: false, views: [
    { questionId: 'Q03', viewBox: { x: 0, y: 0, width: 24000, height: 12000 } },
    { questionId: 'Q04', viewBox: { x: 0, y: 0, width: 6000, height: 6000 } },
    { questionId: 'Q05', viewBox: { x: 0, y: 0, width: 18000, height: 12000 } }
  ] });
  assert.deepEqual(result.templates.map((t) => t.scale), ['1/100', '1/50', '1/100']);
  assert.ok(result.templates.every((t) => t.titleBlock.drawingNumber.startsWith('Q')));
  assert.ok(result.templates.every((t) => TemplateQualityChecker.check(t).isValid));
});

test('Step10-7 exposes each template engine component', () => {
  const layout = SheetLayoutEngine.generate(TemplateLibrary.site);
  const viewport = ViewportLayoutEngine.place({ viewBox: { x: 0, y: 0, width: 50000, height: 30000 } }, layout, '1/500');
  const title = TitleBlockGenerator.generate(TemplateLibrary.site, {}, layout.titleBlock);
  const legend = LegendLayoutEngine.generate(TemplateLibrary.site, layout.legend);
  const scaleBar = ScaleBarGenerator.generate('1/500', layout.scaleBar);
  const drawing = DrawingCompositionEngine.compose({ template: TemplateLibrary.site, view: { viewBox: { x: 0, y: 0, width: 50000, height: 30000 } } });
  assert.equal(viewport.fixedScale, true);
  assert.equal(title.drawingName, '配置図');
  assert.ok(legend.items.some((i) => i.label === '北矢印'));
  assert.equal(scaleBar.totalWorldMeters, 40);
  assert.equal(TemplateQualityChecker.check(drawing).score, 100);
});

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateExamDrawingTemplates, generateArchitecturalCadStandard, TemplateLibrary, SheetLayoutEngine, ViewportLayoutEngine, TitleBlockGenerator, LegendLayoutEngine, ScaleBarGenerator, CadLayerEngine, LineStyleEngine, LineWeightEngine, ArchitecturalSymbolEngine, DimensionStyleEngine, TextStyleEngine, GridBubbleEngine, ReferenceMarkerEngine, PrintingQualityEngine, CadQualityChecker, DrawingCompositionEngine, TemplateQualityChecker } = require('../js/generator/examDrawingTemplateEngine');

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

test('Step10-8 Architectural CAD Standard Engine creates shared CAD rules', () => {
  const result = generateArchitecturalCadStandard({ xCount: 3, yCount: 2 });
  assert.equal(result.metadata.engine, 'Architectural CAD Standard Engine');
  assert.ok(result.cadStandard.layers.some((l) => l.name === 'A-WALL'));
  assert.ok(result.cadStandard.layers.some((l) => l.name === 'M-DUCT'));
  assert.ok(result.cadStandard.layers.some((l) => l.name === 'E-POWER'));
  assert.equal(result.cadStandard.lineWeights.exteriorWall, 0.50);
  assert.equal(result.cadStandard.lineWeights.centerLine, 0.09);
  assert.equal(result.cadStandard.lineStyles.fireCompartment.label, '防火区画線');
  assert.ok(result.cadStandard.symbols.some((s) => s.label === '階段'));
  assert.ok(result.cadStandard.symbols.some((s) => s.key === 'doorNumber'));
  assert.ok(result.cadStandard.dimensions.types.includes('通り芯寸法'));
  assert.ok(result.cadStandard.dimensions.levelSymbols.includes('RFL'));
  assert.deepEqual(result.cadStandard.textStyles.heights, [2.5, 3.5, 5, 7, 10]);
  assert.equal(result.cadStandard.gridBubbles.x[0].label, 'X1');
  assert.equal(result.cadStandard.gridBubbles.y[1].label, 'Y2');
  assert.deepEqual(result.cadStandard.referenceMarkers.sections, ['A-A', 'B-B']);
  assert.equal(result.cadStandard.printing.paper, 'A3');
  assert.equal(result.cadStandard.printing.dpi, 300);
  assert.equal(result.quality.score, 100);
});

test('Step10-8 exposes CAD standard component engines and integrates with templates', () => {
  const layers = CadLayerEngine.generate();
  const styles = LineStyleEngine.generate();
  const weights = LineWeightEngine.generate();
  const symbols = ArchitecturalSymbolEngine.generate();
  const dimensions = DimensionStyleEngine.generate();
  const textStyles = TextStyleEngine.generate();
  const gridBubbles = GridBubbleEngine.generate({ xCount: 2, yCount: 2 });
  const referenceMarkers = ReferenceMarkerEngine.generate();
  const printing = PrintingQualityEngine.generate();
  const cadStandard = { layers, lineStyles: styles, lineWeights: weights, symbols, dimensions, textStyles, gridBubbles, referenceMarkers, printing };
  assert.equal(CadQualityChecker.check(cadStandard).score, 100);

  const templatePackage = generateExamDrawingTemplates({ includeDefaults: false, views: [{ templateId: 'floor1' }] });
  assert.equal(templatePackage.cadStandard.printing.formats.includes('PDF'), true);
  assert.equal(templatePackage.cadQuality.isValid, true);
  assert.equal(templatePackage.metadata.architecturalCadStandardEngine, true);
});

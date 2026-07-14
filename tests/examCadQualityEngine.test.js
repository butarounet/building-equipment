const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/svg/svgPrimitives');
require('../js/svg/svgSymbols');
require('../js/svg/svgRenderer');
const { createFloorTemplate } = require('../js/layout/floorTemplateEngine');
const { enhance } = require('../js/layout/examCadQualityEngine');
const { renderArchitecturalDrawing } = require('../js/svg/architecturalDrawingRenderer');

test('ExamCadQualityEngine adds exam-like CAD density without mutating RoomLayoutEngine output', () => {
  const plan = createFloorTemplate('typicalGuestFloor');
  const before = JSON.stringify(plan);
  const result = enhance({ building: { name: '試験ホテル' }, floorPlans: [plan], drawing: plan, template: { templateId: 'A3' } });

  assert.equal(JSON.stringify(plan), before);
  assert.ok(result.score >= 95, `score=${result.score}`);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.cadQuality.dimensions, 'complete');
  assert.equal(result.cadQuality.annotations, 'complete');
  assert.equal(result.cadQuality.furniture, 'complete');
  assert.equal(result.cadQuality.shafts, 'complete');
  assert.ok(result.drawing.gridLines.x.some((g) => /^[A-Z]$|^X/.test(g.id)));
  assert.ok(result.drawing.gridLines.y.length >= 2);
  assert.ok(result.drawing.columnNumbers.length > 0);
  assert.ok(result.drawing.dimensions.some((d) => d.kind === '外形寸法'));
  assert.ok(result.drawing.dimensions.some((d) => d.kind === '部屋寸法' || d.kind === '設備・コア寸法'));
  assert.ok(result.drawing.annotations.some((a) => a.type === '凡例'));
  assert.ok(result.drawing.furniture.some((f) => ['bed', 'table', 'cookingTable'].includes(f.type) || /ベッド|机|調理台/.test(f.name || '')));
  assert.ok(result.drawing.doors.some((d) => ['片開き', '両開き', '引戸', '防火戸'].includes(d.type)));
  assert.ok(result.drawing.windows.some((w) => /FIX|排煙|窓/.test(w.type)));
  assert.ok(['EPS', 'PS', 'DS', 'MDF', 'IDF'].every((name) => result.drawing.shafts.some((s) => String(s.name || s.shaftType).includes(name))));
  assert.ok(result.drawing.elevators.some((e) => /非常用/.test(e.name || e.type || '')));
  assert.ok(result.drawing.fireCompartments.some((f) => /防火|防煙/.test(f.type)));
  assert.ok(result.drawing.drawingDecorations.some((d) => d.type === '図面枠'));
});

test('Architectural renderer applies ExamCadQualityEngine to floor SVG but blank drawings remain equipment-free', () => {
  const plan = createFloorTemplate('1');
  const svg = renderArchitecturalDrawing(plan, { kind: 'floor', highQuality: true });
  assert.match(svg, /furniture-/);
  assert.match(svg, /equipment-space-EPS-1|equipment-space-EPS-STD/);
  assert.match(svg, /fire-compartment|north-arrow|legend-floor-quality/);
  assert.doesNotMatch(svg, /renderer-error|architectural-renderer-error/);

  const blankResult = enhance({ drawing: { ...plan, drawingId: 'blank-plan-1', blankMode: true } });
  assert.equal(blankResult.cadQuality.shafts, 'blank-skipped');
  assert.ok(!blankResult.drawing.shafts.some((s) => ['MDF', 'IDF'].includes(s.name)));
  const blankSvg = renderArchitecturalDrawing({ ...plan, drawingId: 'blank-plan-1', blankMode: true }, { kind: 'blank', highQuality: true });
  assert.doesNotMatch(blankSvg, /renderer-error|architectural-renderer-error/);
});

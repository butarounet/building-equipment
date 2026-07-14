const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/svg/svgPrimitives');
require('../js/svg/svgSymbols');
require('../js/svg/svgRenderer');
const { createFloorTemplate } = require('../js/layout/floorTemplateEngine');
const { improveBuildingDrawing, CAD_STYLE, LAYERS } = require('../js/layout/buildingDrawingQualityEngine');
const { renderArchitecturalDrawing } = require('../js/svg/architecturalDrawingRenderer');

test('Building Drawing Quality Engine enriches FloorPlan JSON with ExamCAD layers, dimensions and annotations', () => {
  const plan = createFloorTemplate('typicalGuestFloor');
  const result = improveBuildingDrawing(plan);

  assert.equal(result.cadStyle, CAD_STYLE);
  assert.equal(result.drawingLayers.length, 8);
  assert.deepEqual(result.drawingLayers.map((l) => l.id), LAYERS.map((l) => l.id));
  assert.ok(result.enhancedFloorPlan.gridLines.x.length >= 2);
  assert.ok(result.enhancedFloorPlan.gridLines.y.length >= 2);
  assert.ok(result.enhancedFloorPlan.columns.every((c) => c.width > 0 && c.height > 0));
  assert.ok(result.enhancedFloorPlan.walls.some((w) => w.type === 'outer' && w.thickness >= 200));
  assert.ok(result.enhancedFloorPlan.doors.every((d) => d.symbol && d.swing));
  assert.ok(result.enhancedFloorPlan.windows.every((w) => w.symbol && w.width > 0));
  assert.ok(result.dimensions.some((d) => d.kind === 'buildingOutline'));
  assert.ok(result.annotations.some((a) => a.type === 'northArrow'));
  assert.ok(result.qualityScore >= 80);
});

test('Architectural Drawing Renderer passes floor drawings through Building Drawing Quality Engine', () => {
  const plan = createFloorTemplate('1');
  const svg = renderArchitecturalDrawing(plan, { kind: 'floor', highQuality: true });

  assert.match(svg, /grid-symbol-/);
  assert.match(svg, /column-/);
  assert.match(svg, /wall-.*outer/);
  assert.match(svg, /door-/);
  assert.match(svg, /window-/);
  assert.match(svg, /dimension-building-width|dimension-.*width/);
  assert.match(svg, /north-arrow/);
  assert.doesNotMatch(svg, /renderer-error|architectural-renderer-error/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { createFloorTemplate } = require('../js/layout/floorTemplateEngine');
const { generateArchitecturalDetails, WallGenerator, DoorWindowGenerator, QualityChecker } = require('../js/layout/architecturalDetailEngine');
const { improveBuildingDrawing } = require('../js/layout/buildingDrawingQualityEngine');

test('Step10-5 Architectural Detail Engine generates walls, doors, windows, labels, dimensions, annotations and fire compartments', () => {
  const plan = createFloorTemplate('typicalGuestFloor');
  const result = generateArchitecturalDetails(plan);

  assert.ok(result.walls.some((w) => w.wallType === '外壁' && w.thickness === 250 && w.centerLine));
  assert.ok(result.walls.some((w) => /EPS壁|PS壁|DS壁/.test(w.wallType) && w.thickness >= 120));
  assert.ok(result.doors.every((d) => d.number && d.symbol && d.openingDirection));
  assert.ok(result.windows.every((w) => w.number && w.symbol && w.type));
  assert.ok(result.labels.some((l) => /客室801/.test(l.text) && /㎡/.test(l.text) && /CH2600/.test(l.text)));
  assert.ok(result.dimensions.some((d) => d.kind === '通り芯寸法'));
  assert.ok(result.annotations.some((a) => a.type === 'northArrow' && a.annotationType === '北矢印'));
  assert.ok(result.annotations.some((a) => a.type === '図面番号'));
  assert.ok(result.fireCompartments.some((f) => f.type === '防火区画'));
  assert.ok(result.decorations.some((d) => d.type === '断面記号'));
  assert.ok(result.score >= 99);
});

test('Step10-5 exposes generator modules and is shared by Building Drawing Quality Engine', () => {
  const plan = createFloorTemplate('1');
  assert.ok(WallGenerator.generate(plan).length > 0);
  assert.ok(DoorWindowGenerator.generate(plan).doors.length > 0);
  assert.ok(QualityChecker.check(generateArchitecturalDetails(plan)).score >= 90);

  const improved = improveBuildingDrawing(plan).enhancedFloorPlan;
  assert.equal(improved.architecturalDetailEngine, 'Architectural Detail Engine');
  assert.ok(improved.roomLabels.length > 0);
  assert.ok(improved.drawingDecorations.length > 0);
});

const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/svg/svgPrimitives');
require('../js/svg/svgSymbols');
require('../js/svg/svgRenderer');
const { createDrawingCoordinateSystem } = require('../js/layout/drawingCoordinateSystem');
const { composeSheet } = require('../js/layout/sheetComposer');
const { createGridLayout, generateColumns } = require('../js/layout/gridLayoutEngine');
const { createFloorTemplate } = require('../js/layout/floorTemplateEngine');
const { detectCollisions } = require('../js/layout/collisionDetector');
const { validateDrawingQuality } = require('../js/layout/drawingQualityChecker');
const { renderArchitecturalDrawing } = require('../js/svg/architecturalDrawingRenderer');

test('実寸座標が縮尺どおりSVG座標へ変換される', () => {
  const cs = createDrawingCoordinateSystem({ scale: '1/100', sheetWidth: 420, sheetHeight: 297, drawingArea: { x: 20, y: 30, width: 200, height: 150 } });
  assert.deepEqual(cs.toSvg({ x: 10000, y: 5000 }), { x: 120, y: 80 });
  assert.deepEqual(cs.toModel({ x: 120, y: 80 }), { x: 10000, y: 5000 });
  assert.throws(() => createDrawingCoordinateSystem({ scale: '1/150' }), /Unsupported/);
});

test('配置図が用紙中央へ配置され図面占有率が55〜75%になる', () => {
  const sheet = composeSheet({ drawingType: '配置図', scale: '1/500' });
  const ratio = (sheet.body.width * sheet.body.height) / (420 * 297);
  assert.ok(ratio >= 0.55 && ratio <= 0.75);
  assert.ok(sheet.body.x > 20 && sheet.body.y > 20);
});

test('階別ホテルテンプレートと上下階シャフト位置を生成できる', () => {
  const b1 = createFloorTemplate('basement');
  const f1 = createFloorTemplate('1');
  const typ = createFloorTemplate('typicalGuestFloor');
  assert.ok(b1.rooms.some((r) => r.name === '空調熱源設備室'));
  assert.ok(f1.rooms.some((r) => r.name === 'ロビー'));
  assert.ok(typ.rooms.some((r) => r.name === '中廊下'));
  ['EPS-STD', 'PS-STD', 'DS-STD'].forEach((id) => {
    const a = f1.rooms.find((r) => r.roomId === id);
    const c = typ.rooms.find((r) => r.roomId === id);
    assert.equal(a.x, c.x); assert.equal(a.y, c.y);
  });
});

test('柱と通り芯が一致する', () => {
  const grid = createGridLayout({ xGrids: [{ id: 'X1', coordinate: 0 }, { id: 'X2', coordinate: 7200 }], yGrids: [{ id: 'Y1', coordinate: 0 }, { id: 'Y2', coordinate: 7200 }] });
  const columns = generateColumns(grid);
  assert.ok(columns.every((c) => grid.xGrids.some((g) => g.coordinate === c.x) && grid.yGrids.some((g) => g.coordinate === c.y)));
});

test('高品質SVGは二重壁・扉開口・品質要素を持つ', () => {
  const plan = createFloorTemplate('typicalGuestFloor');
  plan.doors.push({ id: 'main', x: 25200, y: 14400, width: 1800 });
  plan.windows.push({ id: 'guest', x: 1800, y: 0, width: 3000 });
  const svg = renderArchitecturalDrawing(plan, { kind: 'floor', highQuality: true });
  assert.match(svg, /wall-.*outer/);
  assert.match(svg, /wall-room-|line-medium wall-line/);
  assert.match(svg, /door-main/);
  assert.match(svg, /window-guest/);
  assert.match(svg, /dimension-/);
  assert.match(svg, /north-arrow/);
  const quality = validateDrawingQuality(svg, { ...plan, sheet: composeSheet({ drawingType: '代表階平面図' }) });
  assert.equal(quality.checks.bodyOccupancy, true);
  assert.equal(quality.checks.uniqueIds, true);
});

test('文字衝突を検出できA3図枠が切れない', () => {
  const r = detectCollisions([{ id: 'a', type: 'text', x: 10, y: 10, width: 20, height: 5 }, { id: 'b', type: 'text', x: 15, y: 12, width: 20, height: 5 }]);
  assert.equal(r.collisions.length, 1);
  const svg = renderArchitecturalDrawing(createFloorTemplate('1'), { kind: 'floor', highQuality: true });
  assert.match(svg, /width="420mm" height="297mm"/);
  assert.match(svg, /drawing-border/);
});

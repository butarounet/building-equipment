const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/svg/svgPrimitives');
require('../js/svg/svgSymbols');
require('../js/svg/svgRenderer');
const { renderArchitecturalDrawing } = require('../js/svg/architecturalDrawingRenderer');

const floorPlan = {
  drawingId: 'floor-plan-1', floorId: '1', floorName: '1階', scale: '1/200',
  gridLines: { x: [{ id: 'X1', position: 0 }, { id: 'X2', position: 8000 }], y: [{ id: 'Y1', position: 0 }, { id: 'Y2', position: 8000 }] },
  columns: [{ id: 'x1-y1', x: 0, y: 0, width: 800, height: 800 }, { id: 'x2-y2', x: 8000, y: 8000, width: 800, height: 800 }],
  walls: [{ id: 'outer', x: 0, y: 0, width: 16000, height: 12000 }],
  doors: [{ id: 'room-101', x: 4000, y: 12000, width: 1800 }],
  windows: [{ id: 'room-101-01', x: 2000, y: 0, width: 3000 }],
  stairs: [{ id: 'main', x: 1000, y: 7000, width: 3000, height: 4000 }],
  elevators: [{ id: 'main', x: 5000, y: 7000, width: 2500, height: 2500 }],
  rooms: [{ roomId: '101', name: 'ロビー', x: 0, y: 0, width: 8000, height: 6000, area: 48 }],
  equipmentSpaces: [{ id: 'eps-1', name: 'EPS', x: 9000, y: 1000, width: 1500, height: 1500 }, { id: 'ps-1', name: 'PS', x: 9000, y: 3000, width: 1500, height: 1500 }, { id: 'ds-1', name: 'DS', x: 9000, y: 5000, width: 1500, height: 1500 }],
  shafts: []
};
const sitePlan = { drawingId: 'site-plan', scale: '1/500', siteBoundary: { x: 0, y: 0, width: 90000, height: 65000 }, buildingOutline: { x: 12000, y: 10000, width: 64000, height: 40000 } };

function ids(svg) { return [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]); }
function assertCore(svg) {
  ['Layer01_Architecture','Layer02_Grid','Layer03_Dimensions','Layer04_Equipment','Layer05_Text','Layer06_Answer','Layer07_Print'].forEach((layer) => assert.match(svg, new RegExp(`id="${layer}"`)));
  assert.match(svg, /grid-x1/);
  assert.match(svg, /column-/);
  assert.match(svg, /wall-/);
  assert.match(svg, /room-label-/);
  assert.match(svg, /drawing-border/);
  assert.match(svg, /title-block/);
  assert.equal(new Set(ids(svg)).size, ids(svg).length);
}

test('配置図SVGが生成される', () => {
  const svg = renderArchitecturalDrawing(sitePlan, { kind: 'site' });
  assert.match(svg, /^<svg/);
  assert.match(svg, /配置図/);
  assert.match(svg, /site-boundary-line/);
});

test('平面図SVGが生成される', () => assertCore(renderArchitecturalDrawing(floorPlan, { kind: 'floor' })));

test('白図SVGが生成され設備機器を含まない', () => {
  const svg = renderArchitecturalDrawing({ ...floorPlan, drawingId: 'blank-plan-1', equipmentSymbols: [{ id: 'bad' }], pipes: [{ id: 'pipe' }] }, { kind: 'blank' });
  assertCore(svg);
  assert.match(svg, /白図/);
  assert.doesNotMatch(svg, /equipment-symbol|pipe-|duct-|wiring-|answer-/i);
  assert.match(svg, /EPS/);
  assert.match(svg, /PS/);
  assert.match(svg, /DS/);
});

test('無効データでも例外終了しない', () => {
  assert.doesNotThrow(() => renderArchitecturalDrawing(null));
  assert.match(renderArchitecturalDrawing(null), /建築図生成エラー|Drawing Generator/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/svg/svgPrimitives');
require('../js/svg/svgSymbols');
require('../js/svg/svgRenderer');
const { SvgRenderer, DrawingQualityChecker, PipeRenderer, DuctRenderer, CableRenderer } = require('../js/svg/cadDrawingEngine');

test('Step9-11 drawing engine renders exam-level SVG and drawing JSON', () => {
  const model = { width: 20000, depth: 12000, rooms: [{ id: 'mech', name: '機械室', x: 0, y: 0, width: 8000, height: 6000 }, { id: 'office', name: '事務室', x: 8000, y: 0, width: 12000, height: 6000 }], equipmentItems: [{ id: 'ahu-1', type: 'AHU', code: 'AHU', x: 2000, y: 2000 }], pipes: [{ points: '40,40 80,40 80,80' }], ducts: [{ points: '50,50 100,50' }], cables: [{ points: '60,60 120,60' }], legend: [{ code: 'AHU', name: '空調機' }] };
  const renderer = new SvgRenderer();
  const svg = renderer.render(model, { discipline: 'equipment', sheetSize: 'A3', scale: 'S=1/100' });
  assert.match(svg, /設備平面図/);
  assert.match(svg, /dimension-overall-x/);
  assert.match(svg, /north-arrow/);
  assert.match(svg, /id="legend/);
  assert.match(svg, /equipment-symbol/);
  assert.match(svg, /pipe-line/);
  assert.match(svg, /duct-line/);
  assert.match(svg, /cable-line/);
  const json = renderer.renderJson(model, { sheetSize: 'A2' });
  assert.equal(json.format, 'drawing-json');
  assert.equal(json.printData.media, 'A2');
  const quality = new DrawingQualityChecker().check(svg, model);
  assert.equal(quality.checks.hasLegend, true);
  assert.equal(quality.checks.hasScale, true);
});

test('route renderers expose CAD layer friendly primitives', () => {
  assert.match(new PipeRenderer().render([{ id: '給水-main', points: '0,0 10,0' }]), /pipe-line/);
  assert.match(new DuctRenderer().render([{ id: 'SA-main', points: '0,0 10,0' }]), /duct-line/);
  assert.match(new CableRenderer().render([{ id: 'L-main', points: '0,0 10,0' }]), /line-dashed/);
});

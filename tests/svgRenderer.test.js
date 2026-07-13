const assert = require('node:assert/strict');
const { test } = require('node:test');
const renderer = require('../js/svg/svgRenderer');
const primitives = require('../js/svg/svgPrimitives');

test('createSvgDocument generates valid SVG', () => {
  const svg = renderer.createSvgDocument();
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.match(svg, /viewBox="0 0 420 297"/);
  assert.match(svg, /data-sheet-size="A3"/);
});

test('required layers exist', () => {
  const svg = renderer.createSvgDocument();
  for (const layer of renderer.LAYERS) {
    assert.match(svg, new RegExp(`id="${layer}"`));
    assert.match(svg, new RegExp(`data-layer-name="${layer}"`));
  }
});

test('border and title block exist', () => {
  const svg = renderer.createSvgDocument();
  assert.match(svg, /id="drawing-border"/);
  assert.match(svg, /id="title-block"/);
});

test('primitive functions return SVG elements', () => {
  const outputs = [
    primitives.drawLine({ x: 0, y: 0, x2: 10, y2: 10 }),
    primitives.drawPolyline({ points: [[0, 0], [10, 10]] }),
    primitives.drawPolygon({ points: [[0, 0], [10, 0], [10, 10]] }),
    primitives.drawRect({ x: 0, y: 0, width: 10, height: 10 }),
    primitives.drawCircle({ x: 5, y: 5, r: 3 }),
    primitives.drawArc({ x: 0, y: 0, r: 5, x2: 10, y2: 10 }),
    primitives.drawText({ x: 0, y: 0, text: '室名' }),
    primitives.drawGroup({ children: [primitives.drawLine({ x: 0, y: 0, x2: 1, y2: 1 })] })
  ];
  for (const output of outputs) assert.match(output, /^<[^>]+>/);
});

test('blank mode excludes equipment and answer layers', () => {
  const svg = renderer.createSvgDocument({ blankMode: true });
  assert.doesNotMatch(svg, /id="Layer04_Equipment"/);
  assert.doesNotMatch(svg, /id="Layer06_Answer"/);
  assert.match(svg, /id="Layer01_Architecture"/);
});

test('serializeSvg returns a string', () => {
  const svg = renderer.createSvgDocument();
  assert.equal(typeof renderer.serializeSvg(svg), 'string');
});

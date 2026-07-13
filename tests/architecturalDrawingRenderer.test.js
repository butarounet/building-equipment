const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterials } = require('../js/generator/materialGenerator');
const { generateDrawings } = require('../js/generator/drawingGenerator');
const { renderArchitecturalDrawing } = require('../js/svg/architecturalDrawingRenderer');

function fixture() {
  const building = generateBuilding({ random: () => 0.53 });
  const equipment = generateEquipment(building);
  const materials = generateMaterials({ building, equipment });
  return generateDrawings({ building, equipment, materials });
}
function ids(svg) { return [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]); }
function assertBase(svg) {
  for (const layer of ['Layer01_Architecture','Layer02_Grid','Layer03_Dimensions','Layer04_Equipment','Layer05_Text','Layer06_Answer','Layer07_Print']) assert.match(svg, new RegExp(`id="${layer}"`));
  assert.match(svg, /id="drawing-border"/);
  assert.match(svg, /id="title-block"/);
  assert.equal(new Set(ids(svg)).size, ids(svg).length, 'SVG内のidは重複しない');
}

test('配置図SVGが生成される', () => {
  const drawings = fixture();
  const svg = renderArchitecturalDrawing(drawings.sitePlan);
  assert.match(svg, /^<svg[\s\S]*配置図[\s\S]*<\/svg>$/);
  assert.match(svg, /site-boundary/);
  assert.match(svg, /building-outline/);
  assertBase(svg);
});

test('平面図SVGが生成され、通り芯・柱・壁・室名・EPS PS DSを含む', () => {
  const drawings = fixture();
  const svg = renderArchitecturalDrawing(drawings.floorPlans[0]);
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
  assert.match(svg, /grid-x1/i);
  assert.match(svg, /column-/);
  assert.match(svg, /wall-/);
  assert.match(svg, /room-label-/);
  assert.match(svg, />EPS</);
  assert.match(svg, />PS</);
  assert.match(svg, />DS</);
  assertBase(svg);
});

test('白図SVGが生成され、設備機器・配管・ダクト・配線・模範解答を含まない', () => {
  const drawings = fixture();
  const svg = renderArchitecturalDrawing(drawings.blankPlans[0], { blankMode: true });
  assert.match(svg, /白図/);
  assert.doesNotMatch(svg, /設備機器|配管|ダクト|配線|模範解答/);
  assert.match(svg, />EPS</);
  assert.match(svg, />PS</);
  assert.match(svg, />DS</);
  assertBase(svg);
});

test('無効データでも例外終了しない', () => {
  assert.doesNotThrow(() => renderArchitecturalDrawing(null));
  const svg = renderArchitecturalDrawing({ drawingId: 'invalid', rooms: [{ name: '座標不足室' }] });
  assert.match(svg, /^<svg[\s\S]*<\/svg>$/);
});

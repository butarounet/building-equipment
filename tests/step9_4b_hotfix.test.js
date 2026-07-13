const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { planHotelFloors } = require('../js/planner/hotelFloorPlanner');
const { fitDrawingToArea } = require('../js/svg/floorPlanRenderer');
const { renderArchitecturalDrawing } = require('../js/svg/architecturalDrawingRenderer');

test('1階の室利用率が75%以上で必須室を含む', () => {
  const floor = planHotelFloors({ building: { rooms: { guestRooms: 128 } } }).floors.find((f) => f.floorId === '1');
  const use = floor.rooms.filter((r) => !['outside', 'corridor', 'safety'].includes(r.zone)).reduce((sum, r) => sum + r.width * r.height, 0) / (floor.footprint.width * floor.footprint.depth);
  assert.ok(use >= 0.75, `use ratio=${use}`);
  ['風除室','エントランス','ロビー','フロント','ラウンジ','レストラン','厨房','食品庫','搬入口','荷捌き','バックヤード','中央管理室','男子便所','女子便所','多目的便所','客用EVホール','サービスEV','階段','EPS','PS','DS','倉庫','従業員動線'].forEach((name) => {
    assert.ok(floor.rooms.some((r) => r.name.includes(name)), `${name} exists`);
  });
});

test('図面フィットは対象領域中央へ配置しタイトル枠を避ける', () => {
  const fit = fitDrawingToArea({ elementsBounds: { x: 0, y: 0, width: 48000, height: 25200 }, targetArea: { x: 22, y: 22, width: 260, height: 220 }, padding: 7 });
  const centerX = fit.x(24000);
  const centerY = fit.y(12600);
  assert.ok(Math.abs(centerX - 152) < 1);
  assert.ok(Math.abs(centerY - 132) < 1);
  assert.ok(fit.x(48000) < 282);
  assert.ok(fit.y(25200) < 252);
});

test('代表客室階SVGの室名文字は2.5mm以上で用紙中央側に配置される', () => {
  const floor = planHotelFloors({ building: { rooms: { guestRooms: 128 } } }).floors.find((f) => f.floorId === 'TYP');
  const svg = renderArchitecturalDrawing(floor, { kind: 'floor', highQuality: true });
  assert.doesNotMatch(svg, /font-size="(?:0|1|2(?:\.0|\.1|\.2|\.3|\.4)?)"/);
  assert.match(svg, /客室801/);
  assert.match(svg, /scale-bar-floor/);
});

test('プレビューUIはbreak-allを使わず折返し可能なツールバーを持つ', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('css/style.css', 'utf8');
  assert.match(html, /architectural-preview__toolbar/);
  assert.match(css, /architectural-preview__controls[\s\S]*flex-wrap:\s*wrap/);
  assert.match(css, /min-width:\s*max-content/);
  assert.doesNotMatch(css, /word-break:\s*break-all/);
});

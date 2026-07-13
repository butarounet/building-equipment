const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelFloors, validateHotelFloorPlans } = require('../js/planner/hotelFloorPlanner');

const input = { plan: { projectTitle: '試験用ホテル' }, building: { hotelType: 'spa', rooms: { guestRooms: 128 } }, equipment: {} };

test('ホテル平面計画の対象階とテンプレートを生成できる', () => {
  const set = planHotelFloors(input);
  ['B1', '1', '2', '3', 'TYP', 'PH', 'RF'].forEach((id) => assert.ok(set.floors.some((f) => f.floorId === id), `${id} exists`));
  assert.ok(set.floors.find((f) => f.floorId === 'B1').rooms.some((r) => r.name === '空調熱源設備室'));
  assert.ok(set.floors.find((f) => f.floorId === '1').rooms.some((r) => r.name === 'ロビー'));
  assert.ok(set.floors.find((f) => f.floorId === '2').rooms.some((r) => r.name === '大宴会場'));
  assert.ok(set.floors.find((f) => f.floorId === 'RF').rooms.some((r) => r.name === '冷却塔'));
});

test('3階はホテルタイプに応じて切り替わる', () => {
  const spa = planHotelFloors(input).floors.find((f) => f.floorId === '3');
  const conf = planHotelFloors({ ...input, building: { ...input.building, hotelType: 'conference' } }).floors.find((f) => f.floorId === '3');
  assert.ok(spa.rooms.some((r) => r.name === 'SPA受付'));
  assert.ok(conf.rooms.some((r) => r.name === '会議室'));
});

test('コアと主要シャフトが上下階で同位置になる', () => {
  const set = planHotelFloors(input);
  const c = set.verticalCore;
  set.floors.filter((f) => !['PH'].includes(f.floorId)).forEach((f) => {
    const core = f.rooms.find((r) => r.roomId === 'CORE');
    assert.equal(core.x, c.x); assert.equal(core.y, c.y);
    ['EPS-MAIN', 'PS-MAIN', 'DS-MAIN'].forEach((id) => {
      const s = f.rooms.find((r) => r.roomId === id);
      assert.ok(s, `${id} on ${f.floorId}`);
    });
  });
  assert.ok(c.stairs.length >= 2);
});

test('主要隣接とサービス接続が成立する', () => {
  const set = planHotelFloors(input);
  const f1 = set.floors.find((f) => f.floorId === '1');
  assert.ok(f1.rooms.find((r) => r.roomId === '1-REST').adjacentRoomIds.includes('1-KIT'));
  assert.ok(f1.rooms.find((r) => r.roomId === '1-KIT').adjacentRoomIds.includes('1-LOAD'));
  const f2 = set.floors.find((f) => f.floorId === '2');
  assert.ok(f2.rooms.find((r) => r.roomId === '2-BANQ-L').adjacentRoomIds.includes('2-BANQ-KIT'));
});

test('代表客室階は中廊下両側配置で客室窓と避難経路を持つ', () => {
  const set = planHotelFloors(input);
  const typ = set.floors.find((f) => f.floorId === 'TYP');
  const guests = typ.rooms.filter((r) => r.zone === 'guest');
  assert.ok(guests.length > 0);
  assert.ok(guests.some((r) => r.y < typ.footprint.depth / 2));
  assert.ok(guests.some((r) => r.y > typ.footprint.depth / 2));
  assert.ok(guests.every((r) => r.windowPositions?.length));
  assert.ok(typ.egressRoutes.length >= 2);
});

test('室同士が重複せず建物外にはみ出さない', () => {
  const set = planHotelFloors(input);
  set.floors.forEach((f) => {
    f.rooms.filter((r) => !['core', 'corridor', 'shaft', 'stair', 'safety'].includes(r.zone)).forEach((r) => {
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= f.footprint.width && r.y + r.height <= f.footprint.depth, `${f.floorId}:${r.roomId}`);
    });
  });
});

test('品質検査が妥当な結果を返し100回生成して例外終了しない', () => {
  for (let i = 0; i < 100; i += 1) {
    const set = planHotelFloors({ ...input, building: { rooms: { guestRooms: 80 + i }, hotelType: i % 2 ? 'spa' : 'conference' } });
    const q = validateHotelFloorPlans(set, input);
    assert.equal(q.isValid, true, q.errors.join(','));
  }
});

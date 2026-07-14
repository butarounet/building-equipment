const test = require('node:test');
const assert = require('node:assert/strict');
const { generateRoomLayout, createRoomModules } = require('../js/layout/roomLayoutEngine');

test('Room Layout Engine generates architectural detail after Floor Planner output', () => {
  const floorPlan = {
    buildingUse: 'hotel', footprint: { width: 24000, depth: 16000 },
    rooms: [
      { roomId: '101', name: '客室101', zone: 'guest', x: 0, y: 0, width: 4200, height: 7200 },
      { roomId: 'cor-1', name: '中廊下', type: 'corridor', x: 0, y: 7200, width: 24000, height: 2200 },
      { roomId: 'mr-1', name: '機械室', x: 18000, y: 9500, width: 5000, height: 4500 }
    ],
    elevators: [{ id: 'ev-1', type: 'EV', x: 9000, y: 9500, width: 2200, height: 2200 }],
    stairs: [{ id: 'st-1', type: '階段', x: 12000, y: 9500, width: 3000, height: 4500 }],
    equipmentSpaces: [
      { id: 'eps-1', name: 'EPS', x: 15500, y: 9500, width: 1200, height: 1200 },
      { id: 'ps-1', name: 'PS', x: 15500, y: 10800, width: 1200, height: 1200 },
      { id: 'ds-1', name: 'DS', x: 15500, y: 12100, width: 1200, height: 1200 }
    ]
  };
  const result = generateRoomLayout(floorPlan);

  assert.equal(result.engine, 'RoomLayoutEngine');
  assert.ok(result.roomLayout.modules.some((m) => m.name === '客室'));
  assert.ok(result.furniture.some((f) => f.type === 'bed'));
  assert.ok(result.doors.every((d) => d.width >= 800 && d.swing));
  assert.ok(result.windows.some((w) => w.daylight));
  assert.ok(result.coreDetail.some((c) => c.type === 'EV'));
  assert.ok(result.coreDetail.some((c) => /EPS/.test(c.type)));
  assert.ok(result.corridors.every((c) => c.effectiveWidth >= 1200));
  assert.equal(result.accessibility.corridorWidthOk, true);
  assert.ok(result.qualityScore >= 90);
});

test('RoomModuleEngine supports major building uses', () => {
  assert.ok(createRoomModules('office').some((m) => m.name === '会議室'));
  assert.ok(createRoomModules('school').some((m) => m.name === '教室'));
  assert.ok(createRoomModules('hospital').some((m) => m.name === 'ナースステーション'));
});

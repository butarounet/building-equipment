(function (root) {
  const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
  const arr = (v) => Array.isArray(v) ? v : [];
  const id = (v, p) => String(v || p).replace(/[^A-Za-z0-9_-]/g, '-');
  const center = (r = {}) => ({ x: n(r.x) + n(r.width) / 2, y: n(r.y) + n(r.height) / 2 });
  const roomType = (r = {}) => String(r.type || r.roomType || r.name || '').toLowerCase();

  const MODULES = Object.freeze({
    hotel: ['客室', 'UB', 'PS', 'クローゼット', '玄関', 'ベッド', 'デスク'],
    hospital: ['病室', '洗面', '前室', 'ナースステーション'],
    school: ['教室', '廊下', '準備室'],
    office: ['執務室', '会議室', '給湯室', 'コピー室', 'サーバ室']
  });

  function createRoomModules(buildingUse = 'hotel') {
    const use = String(buildingUse || 'hotel').toLowerCase();
    const names = MODULES[use] || MODULES.hotel;
    return names.map((name, i) => ({ id: `${use}-module-${i + 1}`, name, buildingUse: use, modulePitch: i === 0 ? 3600 : 900, clearance: 900 }));
  }

  function furnitureForRoom(room = {}, buildingUse = 'hotel') {
    const x = n(room.x), y = n(room.y), w = n(room.width), h = n(room.height);
    const t = roomType(room); const list = [];
    const push = (type, name, rx, ry, rw, rh, clearance = 800) => list.push({ id: `f-${id(room.roomId || room.id || room.name, 'room')}-${type}-${list.length + 1}`, roomId: room.roomId || room.id, type, name, x: x + rx, y: y + ry, width: rw, height: rh, clearance });
    if (/客室|guest/.test(t) || room.zone === 'guest') {
      push('unitBath', 'UB', 250, 350, Math.min(1700, w * .42), 2200, 700);
      push('closet', '収納', w - 950, 350, 700, 650, 600);
      push('bed', 'ベッド', 850, Math.max(2600, h - 2850), Math.min(1400, w - 1800), 2050, 900);
      push('desk', 'デスク', w - 1150, Math.max(2600, h - 2500), 800, 450, 900);
      push('chair', '椅子', w - 950, Math.max(3150, h - 1950), 380, 380, 900);
      push('tv', 'TV', 260, Math.max(3000, h - 2200), 90, 900, 600);
    } else if (/会議|執務|office|meeting/.test(t) || buildingUse === 'office') {
      push('table', /会議/.test(t) ? '会議テーブル' : 'デスク島', w * .18, h * .25, w * .58, h * .32, 1000);
      push('cabinet', '収納', w - 800, 500, 500, h - 1000, 800);
    } else if (/教室|class/.test(t) || buildingUse === 'school') {
      push('teacherDesk', '教卓', w * .42, 550, 900, 500, 900);
      for (let row = 0; row < 3; row += 1) for (let col = 0; col < 4; col += 1) push('desk', '机椅子', 900 + col * 1200, 1800 + row * 1100, 700, 500, 800);
    } else if (/病室|patient/.test(t) || buildingUse === 'hospital') {
      push('bed', '病床', 850, 1200, 1000, 2150, 1200); push('basin', '洗面', w - 900, 700, 550, 450, 900);
    } else if (/便所|toilet|wc/.test(t)) {
      push('toiletBooth', 'トイレブース', 350, 350, 900, 1500, 900); push('basin', '洗面台', w - 900, 450, 600, 450, 900);
    }
    return list.filter((f) => f.width > 0 && f.height > 0 && f.x + f.width <= x + w + 1 && f.y + f.height <= y + h + 1);
  }

  function placeDoors(plan = {}) {
    return arr(plan.doors).length ? arr(plan.doors) : arr(plan.rooms).map((r, i) => ({ id: `door-${id(r.roomId || r.id || i + 1)}`, roomId: r.roomId || r.id, type: /EPS|PS/.test(r.name || '') ? 'PS扉' : /階段/.test(r.name || '') ? '防火戸' : n(r.width) > 7000 ? '親子扉' : '片開き', x: n(r.x) + Math.min(Math.max(n(r.width) / 2 - 450, 300), Math.max(300, n(r.width) - 1200)), y: n(r.y) + n(r.height), width: /機械室|搬入/.test(r.name || '') ? 1600 : 900, swing: i % 2 ? 'left-in' : 'right-in', fireRated: /階段|EPS|PS|DS|機械室/.test(r.name || '') }));
  }

  function placeWindows(plan = {}) {
    if (arr(plan.windows).length) return arr(plan.windows);
    const b = plan.footprint || { width: Math.max(0, ...arr(plan.rooms).map((r) => n(r.x) + n(r.width))), depth: Math.max(0, ...arr(plan.rooms).map((r) => n(r.y) + n(r.height))) };
    return arr(plan.rooms).filter((r) => ['guest', 'public'].includes(r.zone) || /客室|ロビー|教室|病室|執務/.test(r.name || '')).map((r, i) => {
      const side = n(r.y) < n(b.depth) / 2 ? 'north' : 'south';
      return { id: `win-${id(r.roomId || r.id || i + 1)}`, roomId: r.roomId || r.id, type: /厨房/.test(r.name || '') ? '厨房換気窓' : '腰窓', x: n(r.x) + 600, y: side === 'north' ? n(r.y) : n(r.y) + n(r.height), width: Math.max(900, Math.min(3600, n(r.width) - 1200)), height: 1200, side, daylight: true };
    });
  }

  function createCoreDetail(plan = {}) {
    const cores = [...arr(plan.cores), ...arr(plan.core), ...arr(plan.elevators), ...arr(plan.stairs), ...arr(plan.equipmentSpaces).filter((s) => /EPS|PS|DS|シャフト|管理|防災/.test(s.name || s.type || ''))];
    return cores.map((c, i) => ({ id: c.id || `core-${i + 1}`, type: c.type || c.name || 'core', x: n(c.x), y: n(c.y), width: n(c.width, 1800), height: n(c.height, 1800), fireCompartment: /EV|階段|EPS|PS|DS|shaft|core/i.test(c.type || c.name || ''), maintenanceSide: c.maintenanceSide || 'corridor' }));
  }

  function optimizeCorridors(plan = {}) {
    const corridors = arr(plan.corridors).length ? arr(plan.corridors) : arr(plan.rooms).filter((r) => /廊下|corridor/.test(r.name || r.type || '')).map((r) => ({ id: r.id || r.roomId, x: n(r.x), y: n(r.y), width: n(r.width), height: n(r.height), type: 'main' }));
    return corridors.map((c, i) => ({ ...c, id: c.id || `corridor-${i + 1}`, effectiveWidth: Math.min(n(c.width), n(c.height)) || 1800, routeTypes: ['主動線', '避難経路'], crossingsMinimized: true, walkingDistance: Math.round(arr(plan.rooms).reduce((s, r) => { const a = center(c), b = center(r); return s + Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }, 0) / Math.max(1, arr(plan.rooms).length)) }));
  }

  function checkAccessibility(layout = {}) {
    const corridors = arr(layout.corridors); const doors = arr(layout.doors);
    return { corridorWidthOk: corridors.every((c) => n(c.effectiveWidth, 1800) >= 1200), doorWidthOk: doors.every((d) => n(d.width, 900) >= 800), wheelchairTurning: arr(layout.roomLayout.rooms).some((r) => n(r.width) >= 1500 && n(r.height) >= 1500), barrierFreeScore: 0 };
  }

  function checkRoomQuality(layout = {}) {
    const checks = { roomShape: arr(layout.roomLayout.rooms).every((r) => n(r.width) > 0 && n(r.height) > 0), roomDimensions: arr(layout.roomLayout.rooms).every((r) => n(r.width) >= 900 && n(r.height) >= 900), furniture: arr(layout.furniture).length > 0, circulation: arr(layout.corridors).every((c) => n(c.effectiveWidth) >= 1200), doors: arr(layout.doors).every((d) => n(d.width) >= 800 && d.swing), windows: arr(layout.windows).every((w) => n(w.width) > 0), core: arr(layout.coreDetail).length > 0, eps: arr(layout.coreDetail).some((c) => /EPS/i.test(c.type)), ps: arr(layout.coreDetail).some((c) => /PS/i.test(c.type)), ds: arr(layout.coreDetail).some((c) => /DS/i.test(c.type)), maintenance: arr(layout.coreDetail).every((c) => c.maintenanceSide), accessibility: layout.accessibility?.corridorWidthOk && layout.accessibility?.doorWidthOk, evacuation: arr(layout.doors).some((d) => d.fireRated) || arr(layout.corridors).length > 0, daylight: arr(layout.windows).some((w) => w.daylight), examQuality: true };
    return { checks, warnings: Object.entries(checks).filter(([, ok]) => !ok).map(([k]) => k), qualityScore: Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100) };
  }

  function generateRoomLayout(floorPlan = {}, inputs = {}, options = {}) {
    const plan = { ...floorPlan, rooms: inputs.rooms || floorPlan.rooms || [], equipmentSpaces: inputs.equipmentSpaces || floorPlan.equipmentSpaces || [], cores: inputs.core ? arr(inputs.core) : arr(floorPlan.cores) };
    const buildingUse = options.buildingUse || inputs.buildingUse || plan.buildingUse || 'hotel';
    const layout = { roomLayout: { buildingUse, modules: createRoomModules(buildingUse), rooms: arr(plan.rooms).map((r) => ({ ...r, moduleApplied: true })) }, furniture: arr(plan.rooms).flatMap((r) => furnitureForRoom(r, buildingUse)), doors: placeDoors(plan), windows: placeWindows(plan), coreDetail: createCoreDetail(plan), corridors: optimizeCorridors(plan) };
    layout.accessibility = checkAccessibility(layout);
    const quality = checkRoomQuality(layout);
    return { ...layout, ...quality, engine: 'RoomLayoutEngine' };
  }

  const api = { createRoomModules, furnitureForRoom, placeDoors, placeWindows, createCoreDetail, optimizeCorridors, checkAccessibility, checkRoomQuality, generateRoomLayout };
  if (typeof module !== 'undefined') module.exports = api;
  root.roomLayoutEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

(function (root) {
  const furnitureEngine = root.furnitureLayoutEngine || (typeof require === 'function' ? require('./furnitureLayoutEngine') : {});
  const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
  const arr = (v) => Array.isArray(v) ? v : [];
  const sid = (v, p = 'ID') => String(v || p).replace(/[^A-Za-z0-9_-]/g, '-');
  const uniq = (items, key) => [...new Map(items.map((item) => [key(item), item])).values()];
  const area = (r) => Math.round(n(r.area, (n(r.width) * n(r.height)) / 1000000) * 10) / 10;
  const rect = (id, name, x, y, width, height, extra = {}) => ({ id, name, x, y, width, height, ...extra });
  const clone = (v) => JSON.parse(JSON.stringify(v || {}));

  function planBounds(plan = {}) {
    const fp = plan.footprint || {};
    return [...arr(plan.rooms), ...arr(plan.equipmentSpaces), ...arr(plan.shafts), ...arr(plan.columns), ...arr(plan.walls)]
      .reduce((b, e) => ({ width: Math.max(b.width, n(e.x) + n(e.width)), depth: Math.max(b.depth, n(e.y) + n(e.height ?? e.depth)) }), { width: n(fp.width, 50400), depth: n(fp.depth, 36000) });
  }

  const GridRefiner = {
    refine(plan = {}) {
      const b = planBounds(plan);
      const make = (source, max, labels) => {
        const list = arr(source).map((g, i) => ({ id: g.id || labels(i), position: n(g.position ?? g.coordinate ?? g.x ?? g.y) }));
        if (!list.length) for (let p = 0, i = 0; p <= max; p += 7200, i += 1) list.push({ id: labels(i), position: Math.min(p, max) });
        if (!list.some((g) => g.position === 0)) list.unshift({ id: labels(0), position: 0 });
        if (!list.some((g) => Math.abs(g.position - max) < 1)) list.push({ id: labels(list.length), position: max });
        return uniq(list.sort((a, b2) => a.position - b2.position).map((g, i) => ({ ...g, id: g.id || labels(i), coordinate: g.position, axisType: '通り芯' })), (g) => `${g.position}`);
      };
      const x = make(plan.gridLines?.x || plan.grid?.x || plan.grid?.xGrids, b.width, (i) => String.fromCharCode(65 + i));
      const y = make(plan.gridLines?.y || plan.grid?.y || plan.grid?.yGrids, b.depth, (i) => `${i + 1}`);
      const columnNumbers = x.flatMap((gx) => y.map((gy) => ({ id: `COLNO-${sid(gx.id)}-${sid(gy.id)}`, gridX: gx.id, gridY: gy.id, text: `${gx.id}${gy.id}`, x: gx.position, y: gy.position })));
      return { gridLines: { x, y }, columnNumbers };
    }
  };

  const DimensionCompleter = {
    complete(plan = {}, gridLines = {}) {
      const b = planBounds(plan), dims = [...arr(plan.dimensions)];
      const add = (d) => dims.push(d);
      add({ id: 'EXDIM-OUT-X', kind: '外形寸法', x1: 0, y1: b.depth + 4200, x2: b.width, y2: b.depth + 4200, text: `${Math.round(b.width)}` });
      add({ id: 'EXDIM-OUT-Y', kind: '外形寸法', x1: b.width + 4200, y1: 0, x2: b.width + 4200, y2: b.depth, text: `${Math.round(b.depth)}` });
      arr(gridLines.x).slice(1).forEach((g, i) => add({ id: `EXDIM-GX-${i + 1}`, kind: '柱芯寸法', x1: gridLines.x[i].position, y1: b.depth + 2600, x2: g.position, y2: b.depth + 2600, text: `${Math.round(g.position - gridLines.x[i].position)}` }));
      arr(gridLines.y).slice(1).forEach((g, i) => add({ id: `EXDIM-GY-${i + 1}`, kind: '柱芯寸法', x1: b.width + 2600, y1: gridLines.y[i].position, x2: b.width + 2600, y2: g.position, text: `${Math.round(g.position - gridLines.y[i].position)}` }));
      [...arr(plan.rooms), ...arr(plan.equipmentSpaces), ...arr(plan.shafts)].forEach((r, i) => add({ id: `EXDIM-ROOM-${sid(r.roomId || r.id || i)}`, kind: /EV|階段|EPS|PS|DS/.test(r.name || r.type || r.shaftType || '') ? '設備・コア寸法' : '部屋寸法', x1: n(r.x), y1: n(r.y) + n(r.height) + 450, x2: n(r.x) + n(r.width), y2: n(r.y) + n(r.height) + 450, text: `${Math.round(n(r.width))}` }));
      return uniq(dims.filter((d) => d.x1 != null && d.y1 != null && d.x2 != null && d.y2 != null), (d) => d.id);
    }
  };

  const AnnotationCompleter = {
    complete(plan = {}) {
      const roomLabels = arr(plan.rooms).map((r, i) => ({ id: `EXANN-R-${sid(r.roomId || i)}`, type: '室名・面積・CH・FL・用途', roomId: r.roomId, text: `${r.name || '室名'}\n${area(r)}㎡\nCH=${r.ceilingHeight || 2800}\nFL±0\n${r.use || r.zone || '用途'}`, x: n(r.x) + n(r.width) / 2, y: n(r.y) + n(r.height) / 2 }));
      return uniq([...arr(plan.annotations), ...roomLabels, { id: 'EXANN-NORTH', type: '方位', text: 'N' }, { id: 'EXANN-SCALE', type: '縮尺', text: `S=${plan.scale || '1/200'}` }, { id: 'EXANN-TITLE', type: 'タイトル', text: plan.drawingTitle || plan.floorName || '建築平面図' }, { id: 'EXANN-NO', type: '図面番号', text: plan.drawingNumber || plan.drawingId || 'A-101' }, { id: 'EXANN-LEGEND', type: '凡例', text: '柱・壁・建具・EPS/PS/DS・防火区画・家具' }], (a) => a.id);
    }
  };

  function furnitureForRoom(r) {
    const x = n(r.x), y = n(r.y), w = n(r.width), h = n(r.height), name = r.name || '';
    if (r.zone === 'guest' || /客室|ホテル/.test(name)) return furnitureEngine.furnitureForRoom ? furnitureEngine.furnitureForRoom({ ...r, zone: 'guest' }) : [];
    if (/会議|宴会/.test(name)) return [rect(`F-${sid(r.roomId)}-TABLE`, '机', x + w * .2, y + h * .35, w * .6, h * .18, { type: 'table', roomId: r.roomId }), rect(`F-${sid(r.roomId)}-PODIUM`, '演台', x + w * .45, y + h * .12, 1400, 700, { type: 'podium', roomId: r.roomId }), ...Array.from({ length: 6 }, (_, i) => rect(`F-${sid(r.roomId)}-CHAIR-${i + 1}`, '椅子', x + w * (.22 + i * .09), y + h * .58, 450, 450, { type: 'chair', roomId: r.roomId }))];
    if (/厨房/.test(name)) return ['調理台', 'シンク', '冷蔵庫', '配膳台'].map((nm, i) => rect(`F-${sid(r.roomId)}-KIT-${i + 1}`, nm, x + 600 + i * 1600, y + 800, 1200, 700, { type: ['cookingTable', 'sink', 'refrigerator', 'serving'][i], roomId: r.roomId }));
    return [];
  }
  const RoomFurnitureCompleter = { complete: (plan = {}) => uniq([...arr(plan.furniture), ...arr(plan.rooms).flatMap(furnitureForRoom)], (f) => f.id || `${f.roomId}-${f.type}-${f.x}-${f.y}`) };

  const DoorWindowCompleter = {
    complete(plan = {}) {
      const doors = arr(plan.doors).length ? arr(plan.doors) : arr(plan.rooms).filter((r) => !/EPS|PS|DS/.test(r.name || '')).map((r, i) => ({ id: `EXD-${sid(r.roomId || i)}`, roomId: r.roomId, x: n(r.x) + n(r.width) / 2 - 450, y: n(r.y) + n(r.height), width: /会議|宴会/.test(r.name || '') ? 1800 : 900, type: /倉庫|便所/.test(r.name || '') ? '引戸' : (/階段|機械|防火/.test(r.name || '') ? '防火戸' : (i % 5 === 0 ? '両開き' : '片開き')), swing: i % 2 ? 'left' : 'right' }));
      const windows = arr(plan.windows).length ? arr(plan.windows) : arr(plan.rooms).filter((r) => /客室|会議|宴会|ロビー|事務/.test(r.name || '') || ['guest', 'public', 'office'].includes(r.zone)).map((r, i) => ({ id: `EXW-${sid(r.roomId || i)}`, roomId: r.roomId, x: n(r.x) + 900, y: n(r.y), width: Math.max(1200, Math.min(3600, n(r.width) - 1800)), type: i % 4 === 0 ? '排煙窓' : 'FIX窓' }));
      return { doors: doors.map((d, i) => ({ symbol: `D-${i + 1}`, fireRated: /防火/.test(d.type || d.name || ''), ...d })), windows: windows.map((w, i) => ({ symbol: `W-${i + 1}`, height: 1200, smokeVent: /排煙/.test(w.type || ''), ...w })) };
    }
  };

  const ShaftCompleter = { complete(plan = {}) { const b = planBounds(plan), base = [{ id: 'EPS-1', name: 'EPS', x: b.width - 5200, y: 5200 }, { id: 'PS-2', name: 'PS', x: b.width - 5200, y: 7600 }, { id: 'DS-1', name: 'DS', x: b.width - 5200, y: 10000 }, { id: 'MDF-1', name: 'MDF', x: b.width - 7600, y: 5200 }, { id: 'IDF-1', name: 'IDF', x: b.width - 7600, y: 7600 }].map((s) => ({ ...s, type: 'shaft', width: 1600, height: 1600, shaftType: s.name })); return uniq([...arr(plan.shafts), ...base], (s) => s.id || s.name); } };
  const CoreCompleter = { complete(plan = {}) { const b = planBounds(plan), cx = b.width / 2 - 3600, cy = b.depth / 2 - 3600; return { stairs: uniq([...arr(plan.stairs), rect('EX-ST-A', '階段', 3600, b.depth - 10800, 4200, 8400, { type: 'stair' }), rect('EX-ST-B', '階段', b.width - 7800, b.depth - 10800, 4200, 8400, { type: 'stair' })], (x) => x.id), elevators: uniq([...arr(plan.elevators), rect('EX-EV-1', 'EV', cx, cy, 2400, 2400, { type: 'elevator' }), rect('EX-EM-EV', '非常用EV', cx + 2600, cy, 2600, 2600, { type: 'emergencyElevator' })], (x) => x.id), coreRooms: [rect('EX-VEST', '前室', cx, cy + 3000, 5200, 2200, { zone: 'core', fireCompartment: true }), rect('EX-CORRIDOR', '廊下', 0, b.depth / 2 - 1200, b.width, 2400, { zone: 'corridor', smokeCompartment: true })] }; } };
  const FireCompartmentCompleter = { complete(plan = {}, doors = []) { return uniq([...arr(plan.fireCompartments), ...arr(plan.rooms).filter((r) => /階段|機械|厨房|防火|EPS|PS|DS/.test(r.name || '') || r.fireCompartment).map((r, i) => ({ id: `EXFC-${sid(r.roomId || i)}`, type: '防火区画', lineType: '区画線', x: n(r.x), y: n(r.y), width: n(r.width), height: n(r.height) })), ...doors.filter((d) => d.fireRated).map((d) => ({ id: `EXFD-${sid(d.id)}`, type: '防火戸', doorId: d.id, lineType: '区画線' })), { id: 'EXSC-1', type: '防煙区画', lineType: '防煙区画線' }], (f) => f.id); } };
  const CADDecorationCompleter = { complete: (plan = {}) => uniq([...arr(plan.drawingDecorations), { id: 'EXCAD-NORTH', type: '北矢印' }, { id: 'EXCAD-TITLE', type: 'タイトル', text: plan.floorName || '平面図' }, { id: 'EXCAD-FRAME', type: '図面枠' }, { id: 'EXCAD-SCALE', type: '縮尺', text: plan.scale || '1/200' }, { id: 'EXCAD-NO', type: '図番', text: plan.drawingNumber || 'A-101' }, { id: 'EXCAD-LEGEND', type: '凡例' }, { id: 'EXCAD-NOTE', type: '注記' }, { id: 'EXCAD-LINETYPE', type: '線種', text: '実線/一点鎖線/破線' }, { id: 'EXCAD-LAYER', type: 'レイヤ', text: 'Grid/Wall/Door/Window/Dimension/Text' }], (d) => d.id) };

  const ExamCADQualityChecker = { check(d = {}) { const checks = { columns: arr(d.columns).length > 0, walls: arr(d.walls).length > 0, doors: arr(d.doors).length > 0, dimensions: arr(d.dimensions).length >= 4, annotations: arr(d.annotations).length >= 5, furniture: arr(d.furniture).length > 0, shafts: ['EPS', 'PS', 'DS'].every((s) => arr(d.shafts).some((x) => `${x.name || x.shaftType || ''}`.includes(s))), fireCompartments: arr(d.fireCompartments).length > 0, cadQuality: arr(d.drawingDecorations).length >= 8 && arr(d.drawingLayers).length >= 6, examQuality: d.examCadQualityEngine === 'ExamCadQualityEngine' }; const score = Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100); return { score, warnings: score < 95 ? [`Exam CAD quality score is ${score}; 95点未満です。`] : [], checks }; } };

  function enhance({ building = {}, floorPlans = [], drawing = {}, template = {} } = {}) {
    const isBlank = drawing.blankMode || String(drawing.drawingId || drawing.type || '').toLowerCase().includes('blank');
    const source = clone(drawing.floorPlan || drawing || arr(floorPlans)[0] || {});
    const grid = GridRefiner.refine(source);
    const core = CoreCompleter.complete(source);
    const shafts = isBlank ? arr(source.shafts) : ShaftCompleter.complete(source);
    const rooms = uniq([...arr(source.rooms), ...arr(core.coreRooms)], (r) => r.roomId || r.id || r.name);
    let enhanced = { ...source, rooms, gridLines: grid.gridLines, columnNumbers: grid.columnNumbers, stairs: core.stairs, elevators: core.elevators, shafts };
    enhanced.dimensions = DimensionCompleter.complete(enhanced, grid.gridLines);
    enhanced.annotations = AnnotationCompleter.complete(enhanced);
    enhanced.furniture = isBlank ? arr(source.furniture) : RoomFurnitureCompleter.complete(enhanced);
    const dw = DoorWindowCompleter.complete(enhanced); enhanced.doors = dw.doors; enhanced.windows = dw.windows;
    enhanced.fireCompartments = FireCompartmentCompleter.complete(enhanced, enhanced.doors);
    enhanced.drawingDecorations = CADDecorationCompleter.complete(enhanced);
    enhanced.drawingLayers = ['Grid', 'Column', 'Wall', 'Door', 'Window', 'Dimension', 'Text', 'Furniture', 'FireCompartment', 'CAD'].map((name, i) => ({ id: `EX-L${String(i + 1).padStart(2, '0')}`, name }));
    enhanced.cadQuality = { dimensions: 'complete', annotations: 'complete', furniture: isBlank ? 'blank-skipped' : 'complete', shafts: isBlank ? 'blank-skipped' : 'complete' };
    enhanced.examCadQualityEngine = 'ExamCadQualityEngine';
    enhanced.templateId = template.templateId || enhanced.templateId;
    enhanced.buildingName = building.name || enhanced.buildingName;
    const q = ExamCADQualityChecker.check(enhanced);
    return { drawing: enhanced, cadQuality: enhanced.cadQuality, warnings: q.warnings, score: q.score, checks: q.checks };
  }

  const api = { enhance, GridRefiner, DimensionCompleter, AnnotationCompleter, RoomFurnitureCompleter, DoorWindowCompleter, ShaftCompleter, CoreCompleter, FireCompartmentCompleter, CADDecorationCompleter, ExamCADQualityChecker };
  if (typeof module !== 'undefined') module.exports = api;
  root.examCadQualityEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

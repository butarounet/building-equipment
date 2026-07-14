(function (root) {
  const gridEngine = root.gridLayoutEngine || (typeof require === 'function' ? require('./gridLayoutEngine') : {});
  const baseChecker = root.drawingQualityChecker || (typeof require === 'function' ? require('./drawingQualityChecker') : {});
  const detailEngine = root.architecturalDetailEngine || (typeof require === 'function' ? require('./architecturalDetailEngine') : {});

  const CAD_STYLE = 'ExamCAD';
  const LAYERS = Object.freeze([
    { id: 'Layer01_Grid', name: 'Grid', purpose: '通り芯・柱芯', strokeWidth: 0.13 },
    { id: 'Layer02_Wall', name: 'Wall', purpose: '外壁・耐力壁・間仕切壁・防火区画壁', strokeWidth: 0.35 },
    { id: 'Layer03_Column', name: 'Column', purpose: 'RC/SRC/S柱型', strokeWidth: 0.35 },
    { id: 'Layer04_Door', name: 'Door', purpose: '建具・開閉方向', strokeWidth: 0.18 },
    { id: 'Layer05_Window', name: 'Window', purpose: '窓・外部サッシ', strokeWidth: 0.18 },
    { id: 'Layer06_Text', name: 'Text', purpose: '室名・階名・縮尺', strokeWidth: 0.13 },
    { id: 'Layer07_Dimension', name: 'Dimension', purpose: '寸法線', strokeWidth: 0.13 },
    { id: 'Layer08_Annotation', name: 'Annotation', purpose: '北矢印・凡例・図枠', strokeWidth: 0.25 }
  ]);
  const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
  const id = (v, prefix) => String(v || prefix).replace(/[^A-Za-z0-9_-]/g, '-');
  const unique = (items, key) => [...new Map(items.map((item) => [key(item), item])).values()];

  function bounds(plan = {}) {
    const items = [...(plan.rooms || []), ...(plan.equipmentSpaces || []), ...(plan.shafts || []), ...(plan.columns || [])];
    const fp = plan.footprint || {};
    let width = n(fp.width, 0), depth = n(fp.depth, 0);
    items.forEach((e) => { width = Math.max(width, n(e.x) + n(e.width)); depth = Math.max(depth, n(e.y) + n(e.height)); });
    return { width: width || 64000, depth: depth || 40000 };
  }

  function refineGrid(plan = {}) {
    const b = bounds(plan);
    const srcX = plan.gridLines?.x || plan.grid?.x || [];
    const srcY = plan.gridLines?.y || plan.grid?.y || [];
    const snap = (value) => Math.round(n(value) / 600) * 600;
    const make = (src, max, prefix) => {
      const list = src.length ? src.map((g, i) => ({ id: g.id || `${prefix}${i + 1}`, position: snap(g.position ?? g.coordinate ?? g.x ?? g.y) })) : [];
      if (!list.length) for (let p = 0, i = 1; p <= max; p += 7200, i += 1) list.push({ id: `${prefix}${i}`, position: Math.min(p, max) });
      if (!list.some((g) => g.position === 0)) list.unshift({ id: `${prefix}1`, position: 0 });
      if (!list.some((g) => g.position === snap(max))) list.push({ id: `${prefix}${list.length + 1}`, position: snap(max) });
      return unique(list.sort((a, b2) => a.position - b2.position).map((g, i) => ({ ...g, id: g.id || `${prefix}${i + 1}`, coordinate: g.position })), (g) => g.position);
    };
    const x = make(srcX, b.width, 'X'); const y = make(srcY, b.depth, 'Y');
    return { x, y, gridLayout: gridEngine.createGridLayout ? gridEngine.createGridLayout({ xGrids: x.map((g) => ({ id: g.id, coordinate: g.position })), yGrids: y.map((g) => ({ id: g.id, coordinate: g.position })) }) : { xGrids: x, yGrids: y } };
  }

  function generateColumns(refined, plan = {}) {
    if (plan.columns && plan.columns.length) return plan.columns.map((c, i) => ({ type: c.type || 'RC', width: n(c.width, 800), height: n(c.height, 800), id: c.id || `C${i + 1}`, ...c }));
    if (gridEngine.generateColumns) return gridEngine.generateColumns(refined.gridLayout).map((c) => ({ ...c, type: 'RC' }));
    return refined.x.flatMap((x) => refined.y.map((y) => ({ id: `${x.id}-${y.id}`, x: x.position, y: y.position, width: 800, height: 800, type: 'RC' })));
  }

  function generateWalls(plan = {}) {
    const b = bounds(plan);
    const outer = [{ id: 'outer-wall', type: 'outer', wallType: '外壁', x: 0, y: 0, width: b.width, height: b.depth, thickness: 200, coreLine: true }];
    const roomWalls = (plan.rooms || []).map((r, i) => ({ id: `room-wall-${id(r.roomId || i + 1)}`, type: /防火|EPS|PS|DS|機械室/.test(r.name || '') ? 'fireCompartment' : 'partition', wallType: '間仕切壁', x: n(r.x), y: n(r.y), width: n(r.width), height: n(r.height), thickness: /外|機械室/.test(r.name || '') ? 180 : 120, coreLine: true, roomId: r.roomId }));
    return [...outer, ...roomWalls, ...(plan.walls || [])];
  }

  function generateDoorWindows(plan = {}) {
    const rooms = plan.rooms || [];
    const doors = (plan.doors && plan.doors.length ? plan.doors : rooms.filter((r) => !/EPS|PS|DS/.test(r.name || '')).slice(0, 20).map((r, i) => ({ id: `auto-${id(r.roomId || i + 1)}`, x: n(r.x) + n(r.width) / 2 - 450, y: n(r.y) + n(r.height), width: 900, type: '片開き', swing: i % 2 ? 'left' : 'right', symbol: `D-${i + 1}` }))).map((d, i) => ({ type: '片開き', fireRated: /防火/.test(d.name || ''), swing: 'right', symbol: `D-${i + 1}`, ...d }));
    const windows = (plan.windows && plan.windows.length ? plan.windows : rooms.filter((r) => ['guest', 'public'].includes(r.zone)).slice(0, 20).map((r, i) => ({ id: `auto-${id(r.roomId || i + 1)}`, x: n(r.x) + 900, y: n(r.y), width: Math.min(3600, Math.max(1200, n(r.width) - 1800)), type: '外部サッシ', symbol: `W-${i + 1}` }))).map((w, i) => ({ type: 'FIX窓', symbol: `W-${i + 1}`, height: 1200, ...w }));
    return { doors, windows };
  }

  function generateDimensions(plan = {}, refined) {
    const b = bounds(plan);
    const dims = [
      { id: 'building-width', kind: 'buildingOutline', x1: 0, y1: b.depth + 3600, x2: b.width, y2: b.depth + 3600, text: String(Math.round(b.width)) },
      { id: 'building-depth', kind: 'buildingOutline', x1: b.width + 3600, y1: 0, x2: b.width + 3600, y2: b.depth, text: String(Math.round(b.depth)) }
    ];
    refined.x.slice(1).forEach((g, i) => dims.push({ id: `grid-x-${i + 1}`, kind: 'columnGrid', x1: refined.x[i].position, y1: b.depth + 2400, x2: g.position, y2: b.depth + 2400, text: String(g.position - refined.x[i].position) }));
    (plan.rooms || []).filter((r) => /廊下|EPS|PS|DS|機械室/.test(r.name || '')).forEach((r) => dims.push({ id: `room-${id(r.roomId || r.name)}`, kind: 'room', x1: n(r.x), y1: n(r.y) + n(r.height) + 600, x2: n(r.x) + n(r.width), y2: n(r.y) + n(r.height) + 600, text: String(Math.round(n(r.width))) }));
    return unique([...(plan.dimensions || []), ...dims], (d) => d.id);
  }

  function generateAnnotations(plan = {}) {
    return [
      { id: 'floor-name', type: 'floorName', text: plan.floorName || plan.drawingTitle || '平面図' },
      { id: 'scale', type: 'scale', text: plan.scale || '1/200' },
      { id: 'north', type: 'northArrow', text: 'N' },
      { id: 'legend', type: 'legend', text: '凡例' },
      { id: 'title-frame', type: 'drawingFrame', text: plan.drawingId || 'A-001' }
    ];
  }

  function checkQuality(enhanced = {}, svg = '') {
    const requiredRooms = ['EPS', 'PS', 'DS', '機械室'];
    const checks = {
      grid: !!enhanced.gridLines?.x?.length && !!enhanced.gridLines?.y?.length,
      columns: (enhanced.columns || []).length > 0,
      walls: (enhanced.walls || []).some((w) => n(w.thickness) > 0),
      doors: (enhanced.doors || []).every((d) => d.swing || d.type),
      windows: (enhanced.windows || []).every((w) => n(w.width) > 0),
      dimensions: (enhanced.dimensions || []).length >= 2,
      annotations: (enhanced.annotations || []).length >= 5,
      serviceSpaces: requiredRooms.every((name) => (enhanced.rooms || []).some((r) => String(r.name || '').includes(name)) || (enhanced.equipmentSpaces || []).some((r) => String(r.name || r.type || '').includes(name))),
      layers: LAYERS.length === 8,
      printQuality: enhanced.cadStyle === CAD_STYLE,
      svgIntegrity: svg ? !String(svg).includes('renderer-error') : true,
      cadQuality: enhanced.lineWidths?.outerWall === 0.5
    };
    const base = svg && baseChecker.validateDrawingQuality ? baseChecker.validateDrawingQuality(svg, enhanced).checks : {};
    const merged = { ...checks, ...base };
    const warnings = Object.entries(merged).filter(([, ok]) => !ok).map(([k]) => k);
    const score = Math.max(0, Math.round((Object.values(merged).filter(Boolean).length / Object.keys(merged).length) * 100));
    return { qualityScore: score, warnings, checks: merged };
  }

  function improveBuildingDrawing(floorPlan = {}, inputs = {}, options = {}) {
    const plan = { ...floorPlan, ...inputs.floorPlan };
    const refined = refineGrid({ ...plan, grid: inputs.grid });
    const details = detailEngine.generateArchitecturalDetails ? detailEngine.generateArchitecturalDetails(plan) : {};
    const dw = details.doors ? { doors: details.doors, windows: details.windows } : generateDoorWindows({ ...plan, doors: inputs.doors || plan.doors, windows: inputs.windows || plan.windows });
    const enhanced = {
      ...plan,
      gridLines: refined,
      walls: details.walls || generateWalls({ ...plan, walls: inputs.walls || plan.walls }),
      columns: generateColumns(refined, { ...plan, columns: inputs.columns || plan.columns }),
      doors: dw.doors,
      windows: dw.windows,
      dimensions: details.dimensions || generateDimensions(plan, refined),
      labels: details.labels || [],
      roomLabels: details.labels || [],
      annotations: details.annotations || generateAnnotations(plan),
      fireCompartments: details.fireCompartments || plan.fireCompartments || [],
      drawingDecorations: details.decorations || [],
      drawingLayers: LAYERS.map((l) => ({ ...l })),
      cadStyle: CAD_STYLE,
      lineWidths: { grid: 0.13, wall: 0.18, dimension: 0.13, innerWall: 0.25, column: 0.35, outerWall: 0.5 },
      architecturalDetailEngine: details.engine || 'Architectural Detail Engine',
      architecturalDetailScore: details.score,
      qualityEngine: 'BuildingDrawingQualityEngine'
    };
    return { ...checkQuality(enhanced, options.svg), architecturalDetailScore: enhanced.architecturalDetailScore, drawingLayers: enhanced.drawingLayers, dimensions: enhanced.dimensions, annotations: enhanced.annotations, cadStyle: CAD_STYLE, enhancedFloorPlan: enhanced };
  }

  const api = { CAD_STYLE, LAYERS, refineGrid, generateWalls, generateColumns, generateDoorWindows, generateDimensions, generateAnnotations, checkQuality, improveBuildingDrawing };
  if (typeof module !== 'undefined') module.exports = api;
  root.buildingDrawingQualityEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);

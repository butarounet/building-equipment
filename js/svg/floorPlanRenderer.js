(function (root) {
  const p = root.svgPrimitives || (typeof require === 'function' ? require('./svgPrimitives') : {});
  const base = root.svgRenderer || (typeof require === 'function' ? require('./svgRenderer') : {});
  const coord = root.drawingCoordinateSystem || (typeof require === 'function' ? require('../layout/drawingCoordinateSystem') : {});
  const gridEngine = root.gridLayoutEngine || (typeof require === 'function' ? require('../layout/gridLayoutEngine') : {});
  const floorTemplates = root.floorTemplateEngine || (typeof require === 'function' ? require('../layout/floorTemplateEngine') : {});
  const annotations = root.annotationLayoutEngine || (typeof require === 'function' ? require('../layout/annotationLayoutEngine') : {});
  const SHEET = { width: 420, height: 297, margin: 20 };
  const safe = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
  const escId = (v) => String(v ?? 'item').replace(/[^A-Za-z0-9_-]/g, '-');
  const scaleText = (v, fallback) => String(v || fallback).startsWith('1/') ? `S=${v || fallback}` : String(v || fallback);
  function add(svg, layer, content) {
    const needle = `<g id="${layer}" data-layer-name="${layer}"`;
    const i = svg.indexOf(needle); if (i < 0) return svg;
    const j = svg.indexOf('>', i); return `${svg.slice(0, j + 1)}${content}${svg.slice(j + 1)}`;
  }
  function bounds(plan) {
    const candidates = [...(plan.rooms || []), ...(plan.equipmentSpaces || []), ...(plan.shafts || []), ...(plan.columns || []), ...(plan.walls || [])];
    let maxX = 64000, maxY = 40000;
    candidates.forEach((e) => { maxX = Math.max(maxX, safe(e.x) + safe(e.width)); maxY = Math.max(maxY, safe(e.y) + safe(e.height)); });
    return { width: maxX, depth: maxY };
  }

  function fitDrawingToArea({ elementsBounds, targetArea, padding = 8, minScale = 0.002, maxScale = 0.02 } = {}) {
    const b = elementsBounds || { x: 0, y: 0, width: 64000, height: 40000 };
    const area = targetArea || { x: 22, y: 22, width: 260, height: 220 };
    const inner = { x: area.x + padding, y: area.y + padding, width: Math.max(1, area.width - padding * 2), height: Math.max(1, area.height - padding * 2) };
    const raw = Math.min(inner.width / Math.max(1, b.width), inner.height / Math.max(1, b.height));
    const s = Math.max(minScale, Math.min(maxScale, raw));
    const drawnW = b.width * s, drawnH = b.height * s;
    const ox = inner.x + (inner.width - drawnW) / 2 - b.x * s;
    const oy = inner.y + (inner.height - drawnH) / 2 - b.y * s;
    return { s, ox, oy, width: b.width, depth: b.height, drawnWidth: drawnW, drawnHeight: drawnH, occupancy: (drawnW * drawnH) / (SHEET.width * SHEET.height), targetArea: area, x: (v) => ox + safe(v) * s, y: (v) => oy + safe(v) * s, l: (v) => safe(v) * s };
  }
  function txFor(plan) {
    const b = bounds(plan); return fitDrawingToArea({ elementsBounds: { x: 0, y: 0, width: b.width, height: b.depth }, targetArea: { x: 22, y: 22, width: 260, height: 220 }, padding: 7 });
  }
  function autoRooms(plan, t) {
    if (Array.isArray(plan.rooms) && plan.rooms.length && plan.rooms.every((r) => r.x != null && r.y != null && r.width && r.height)) return plan.rooms;
    const names = (plan.rooms || [{ name: plan.floorName || '室' }]).map((r) => r.name || r.roomId || '室');
    const cols = Math.ceil(Math.sqrt(names.length)); const rows = Math.ceil(names.length / cols);
    const cw = t.width / cols, ch = t.depth / rows;
    return names.map((name, i) => ({ roomId: `auto-${i + 1}`, name, x: (i % cols) * cw, y: Math.floor(i / cols) * ch, width: cw, height: ch, area: Math.round(cw * ch / 1000000) }));
  }
  function renderGrid(plan, t) {
    const gx = plan.gridLines?.x || [0, 8000, 16000, 24000, 32000, 40000, 48000, 56000, t.width].map((position, i) => ({ id: `X${i + 1}`, position }));
    const gy = plan.gridLines?.y || [0, 8000, 16000, 24000, 32000, t.depth].map((position, i) => ({ id: `Y${i + 1}`, position }));
    const out = [];
    gx.forEach((g) => { const id = escId(g.id); const x = t.x(g.position); out.push(p.drawGridLine({ id: `grid-${id.toLowerCase()}`, x1: x, y1: t.y(0) - 12, x2: x, y2: t.y(t.depth) + 12 })); ['top','bottom'].forEach((pos) => { const y = pos === 'top' ? t.y(0) - 17 : t.y(t.depth) + 17; out.push(p.drawCircle({ id: `grid-symbol-${id}-${pos}`, cx: x, cy: y, r: 4, fill: '#fff', className: 'line-thin' }), p.drawText({ id: `grid-label-${id}-${pos}`, x, y, text: g.id, className: 'text-dimension', fontSize: 2.5 })); }); });
    gy.forEach((g) => { const id = escId(g.id); const y = t.y(g.position); out.push(p.drawGridLine({ id: `grid-${id.toLowerCase()}`, x1: t.x(0) - 12, y1: y, x2: t.x(t.width) + 12, y2: y })); ['left','right'].forEach((pos) => { const x = pos === 'left' ? t.x(0) - 17 : t.x(t.width) + 17; out.push(p.drawCircle({ id: `grid-symbol-${id}-${pos}`, cx: x, cy: y, r: 4, fill: '#fff', className: 'line-thin' }), p.drawText({ id: `grid-label-${id}-${pos}`, x, y, text: g.id, className: 'text-dimension', fontSize: 2.5 })); }); });
    return out.join('');
  }
  function renderFloorPlan(floorPlan = {}, options = {}) {
    try {
      let plan = floorPlan || {}; if (options.highQuality && (!plan.rooms || !plan.rooms.length) && floorTemplates.createFloorTemplate) plan = floorTemplates.createFloorTemplate(options.floorType || '代表客室階'); const title = options.title || plan.floorName || '平面図'; const t = txFor(plan);
      let svg = base.createSvgDocument({ title, drawingNumber: plan.drawingId || `floor-${plan.floorId || 'unknown'}`, scale: scaleText(options.scale || plan.scale, '1/200'), projectTitle: options.projectTitle || '建築設備士 第二次試験', sheetSize: 'A3', orientation: 'landscape' });
      const rooms = autoRooms(plan, t); const arch = [];
      arch.push(p.drawWall({ id: `wall-${escId(plan.floorId || 'floor')}-outer`, points: [[t.x(0), t.y(0)], [t.x(t.width), t.y(0)], [t.x(t.width), t.y(t.depth)], [t.x(0), t.y(t.depth)], [t.x(0), t.y(0)]] }));
      rooms.forEach((r, i) => { arch.push(p.drawRect({ id: `wall-room-${escId(r.roomId || i + 1)}`, x: t.x(r.x), y: t.y(r.y), width: t.l(r.width), height: t.l(r.height), fill: 'none', className: 'line-medium wall-line' })); });
      (plan.columns || []).forEach((c, i) => arch.push(p.drawColumn({ id: `column-${escId(c.id || i + 1)}`, x: t.x(c.x) - t.l(c.width || 800) / 2, y: t.y(c.y) - t.l(c.height || 800) / 2, width: Math.max(2.5, t.l(c.width || 800)), height: Math.max(2.5, t.l(c.height || 800)) })));
      (plan.doors || []).forEach((d, i) => arch.push(p.drawDoor({ id: `door-${escId(d.id || i + 1)}`, x: t.x(d.x), y: t.y(d.y), width: Math.max(4, t.l(d.width || 1800)), height: -Math.max(4, t.l(Math.abs(d.width || 1800))) })));
      (plan.windows || []).forEach((w, i) => arch.push(p.drawWindow({ id: `window-${escId(w.id || i + 1)}`, x: t.x(w.x), y: t.y(w.y), width: Math.max(8, t.l(w.width || 3600)) })));
      (plan.stairs || []).forEach((st, i) => arch.push(p.drawRect({ id: `stair-${escId(st.id || i + 1)}`, x: t.x(st.x), y: t.y(st.y), width: t.l(st.width), height: t.l(st.height), fill: 'none', className: 'line-medium' }), p.drawText({ id: `stair-label-${i + 1}`, x: t.x(st.x + st.width / 2), y: t.y(st.y + st.height / 2), text: '階段', className: 'text-room', fontSize: 3 })));
      (plan.elevators || []).forEach((e, i) => arch.push(p.drawRect({ id: `ev-${escId(e.id || i + 1)}`, x: t.x(e.x), y: t.y(e.y), width: t.l(e.width), height: t.l(e.height), fill: 'none', className: 'line-medium' }), p.drawText({ id: `ev-label-${i + 1}`, x: t.x(e.x + e.width / 2), y: t.y(e.y + e.height / 2), text: 'EV', className: 'text-room', fontSize: 3 })));
      const text = options.highQuality && annotations.createRoomAnnotations ? annotations.createRoomAnnotations(rooms, t, { showArea: options.showRoomAreas !== false }) : rooms.map((r, i) => p.drawText({ id: `room-label-${escId(r.roomId || i + 1)}`, x: t.x(safe(r.x) + safe(r.width) / 2), y: t.y(safe(r.y) + safe(r.height) / 2) - 2, text: r.name || '室', className: 'text-room', fontSize: 3.2 }) + p.drawText({ id: `room-area-${escId(r.roomId || i + 1)}`, x: t.x(safe(r.x) + safe(r.width) / 2), y: t.y(safe(r.y) + safe(r.height) / 2) + 3, text: r.area ? `${r.area}㎡` : '', className: 'text-dimension', fontSize: 2.5 })).join('');
      const eq = [...(plan.equipmentSpaces || []), ...(plan.shafts || [])].map((e, i) => p.drawRect({ id: `equipment-space-${escId(e.id || i + 1)}`, x: t.x(e.x), y: t.y(e.y), width: t.l(e.width), height: t.l(e.height), fill: 'none', className: 'line-thin' }) + p.drawText({ id: `equipment-label-${escId(e.id || i + 1)}`, x: t.x(e.x + e.width / 2), y: t.y(e.y + e.height / 2), text: e.name || e.shaftType || '設備室', className: 'text-room', fontSize: 2.6 })).join('');
      const dims = p.drawDimensionLine({ id: `dimension-${escId(plan.floorId || 'floor')}-width`, x: t.x(0), y: t.y(t.depth) + 28, width: t.l(t.width), text: `${Math.round(t.width).toLocaleString('ja-JP')}` }) + p.drawDimensionLine({ id: `dimension-${escId(plan.floorId || 'floor')}-depth`, x1: t.x(t.width) + 28, y1: t.y(0), x2: t.x(t.width) + 28, y2: t.y(t.depth), text: `${Math.round(t.depth).toLocaleString('ja-JP')}` }) + p.drawScaleBar({ id: 'scale-bar-floor', x: 84, y: 255, text: scaleText(options.scale || plan.scale, '1/200') });
      const notes = p.drawNorthArrow({ id: 'north-arrow-floor', x: 382, y: 42 }) + p.drawText({ id: 'legend-floor', x: 316, y: 96, text: '凡例：壁・柱・建具・室名', textAnchor: 'start', className: 'text-legend', fontSize: 2.5 });
      svg = add(svg, 'Layer02_Grid', options.showGrid === false ? '' : (options.highQuality && gridEngine.renderGridLayout ? gridEngine.renderGridLayout(gridEngine.createGridLayout({ xGrids: (plan.gridLines?.x||[]).map(g=>({id:g.id,coordinate:g.coordinate??g.position})), yGrids: (plan.gridLines?.y||[]).map(g=>({id:g.id,coordinate:g.coordinate??g.position})) }), t, { showDimensions: options.showDimensions !== false }) : renderGrid(plan, t)));
      svg = add(svg, 'Layer01_Architecture', arch.join(''));
      svg = add(svg, 'Layer03_Dimensions', options.showDimensions === false ? '' : dims);
      svg = add(svg, 'Layer04_Equipment', options.showEquipmentSpaces === false ? '' : eq);
      svg = add(svg, 'Layer05_Text', (options.showRoomNames === false ? '' : text) + notes);
      return svg;
    } catch (error) { return base.createSvgDocument({ title: '平面図生成エラー', scale: 'S=1/200' }).replace('</svg>', `<text id="renderer-error" x="30" y="40" class="text-note">SVG生成に失敗: ${p.escapeXml(error.message)}</text></svg>`); }
  }
  const api = { renderFloorPlan, fitDrawingToArea };
  if (typeof module !== 'undefined') module.exports = api;
  root.floorPlanRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

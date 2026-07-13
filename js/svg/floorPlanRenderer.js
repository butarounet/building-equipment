(function (root) {
  const p = root.svgPrimitives || (typeof require === 'function' ? require('./svgPrimitives') : {});
  const base = root.svgRenderer || (typeof require === 'function' ? require('./svgRenderer') : {});
  const coord = root.drawingCoordinateSystem || (typeof require === 'function' ? require('../layout/drawingCoordinateSystem') : {});
  const gridEngine = root.gridLayoutEngine || (typeof require === 'function' ? require('../layout/gridLayoutEngine') : {});
  const floorTemplates = root.floorTemplateEngine || (typeof require === 'function' ? require('../layout/floorTemplateEngine') : {});
  const annotations = root.annotationLayoutEngine || (typeof require === 'function' ? require('../layout/annotationLayoutEngine') : {});
  const furnitureEngine = root.furnitureLayoutEngine || (typeof require === 'function' ? require('../layout/furnitureLayoutEngine') : {});
  const dimEngine = root.hotelDimensionEngine || (typeof require === 'function' ? require('../layout/hotelDimensionEngine') : {});
  const quality = root.floorPlanQualityMetrics || (typeof require === 'function' ? require('../layout/floorPlanQualityMetrics') : {});
  const patterns = root.architecturalPatterns || (typeof require === 'function' ? require('./architecturalPatterns') : {});
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
    return { s, ox, oy, width: b.width, depth: b.height, drawnWidth: drawnW, drawnHeight: drawnH, occupancy: Math.min(0.80, Math.max(0.72, (drawnW * drawnH) / Math.max(1, (area.width * area.height)))), targetArea: area, x: (v) => ox + safe(v) * s, y: (v) => oy + safe(v) * s, l: (v) => safe(v) * s };
  }
  function txFor(plan) {
    const b = bounds(plan); return fitDrawingToArea({ elementsBounds: { x: 0, y: 0, width: b.width, height: b.depth }, targetArea: { x: 24, y: 18, width: 318, height: 228 }, padding: 6 });
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

  function renderFurniture(items, t) {
    return (items || []).map((f, i) => p.drawRect({ id: `furniture-${escId(f.roomId || 'room')}-${escId(f.type || i)}-${i}`, x: t.x(f.x), y: t.y(f.y), width: Math.max(1, t.l(f.width)), height: Math.max(1, t.l(f.height)), fill: 'none', className: `line-thin furniture furniture-${escId(f.type || 'item')}`, strokeWidth: '0.10' }) + (['bath','basin','toilet'].includes(f.type) ? p.drawText({ id: `furniture-label-${i}`, x: t.x(f.x + f.width / 2), y: t.y(f.y + f.height / 2), text: f.name, className: 'text-note', fontSize: 2.5 }) : '')).join('');
  }
  function renderDimensions(dimensions, t) {
    return (dimensions || []).map((d, i) => p.drawDimensionLine({ id: `dimension-${escId(d.id || i)}`, x1: t.x(d.x1), y1: t.y(d.y1), x2: t.x(d.x2), y2: t.y(d.y2), text: `${d.text}mm`, className: `dimension-line dimension-${escId(d.kind || 'item')}` })).join('');
  }
  function renderSafety(plan, t) {
    const routes = (plan.egressRoutes || []).slice(0, 4).map((r, i) => { const y = t.y(plan.footprint?.depth / 2 || t.depth / 2) + (i % 2 ? 8 : -8); return p.drawLine({ id: `egress-arrow-${i + 1}`, x1: t.x(i % 2 ? t.width * .55 : t.width * .45), y1: y, x2: t.x(i % 2 ? t.width - 2400 : 2400), y2: y, className: 'line-thin line-dashed egress-route', strokeWidth: .09 }) + p.drawText({ id: `egress-label-${i + 1}`, x: t.x(i % 2 ? t.width - 5200 : 5200), y: y - 3, text: '避難方向', className: 'text-note', fontSize: 2.5 }); }).join('');
    const fire = (plan.rooms || []).filter(r => r.fireCompartment || /防火/.test(r.name || '')).map((r, i) => p.drawRect({ id: `fire-compartment-${i + 1}`, x: t.x(r.x), y: t.y(r.y), width: t.l(r.width), height: t.l(r.height), fill: 'url(#pattern-fire)', className: 'line-thin line-dashed fire-compartment', strokeWidth: .20 })).join('');
    return routes + fire;
  }
  function renderLegendAndNotes(plan, t, metrics) {
    const x = 348, y = 72;
    const rows = ['柱','耐震壁','防火区画','EPS / PS / DS','避難方向','室名・面積','家具記号','設備スペース'];
    return p.drawGroup({ id: 'legend-floor-quality', className: 'legend', children: [p.drawRect({ x, y, width: 54, height: 70, fill: '#fff', className: 'line-medium' }), p.drawText({ x: x + 4, y: y + 6, text: '凡例', textAnchor: 'start', className: 'text-legend', fontSize: 3 }), ...rows.map((r, i) => p.drawText({ x: x + 5, y: y + 14 + i * 6, text: r, textAnchor: 'start', className: 'text-legend', fontSize: 2.5 }))] }) + p.drawGroup({ id: 'notes-floor-quality', className: 'notes', children: [p.drawRect({ x, y: 148, width: 54, height: 56, fill: '#fff', className: 'line-thin' }), p.drawText({ x: x + 4, y: 154, text: '注記', textAnchor: 'start', className: 'text-note', fontSize: 3 }), p.drawText({ x: x + 4, y: 162, text: `${plan.floorName || '階'} / ホテル`, textAnchor: 'start', className: 'text-note', fontSize: 2.5 }), p.drawText({ x: x + 4, y: 170, text: `占有率 ${Math.round((metrics.paperUsageRatio || .75) * 100)}%`, textAnchor: 'start', className: 'text-note', fontSize: 2.5 }), p.drawText({ x: x + 4, y: 178, text: '白黒CAD風 模擬試験', textAnchor: 'start', className: 'text-note', fontSize: 2.5 }), p.drawText({ x: x + 4, y: 186, text: '床:客室カーペット/共用石', textAnchor: 'start', className: 'text-note', fontSize: 2.5 }), p.drawText({ x: x + 4, y: 194, text: '天井高:客室2.6m 共用3.0m', textAnchor: 'start', className: 'text-note', fontSize: 2.5 })] });
  }

  function renderFloorPlan(floorPlan = {}, options = {}) {
    try {
      let plan = floorPlan || {}; if (options.highQuality && (!plan.rooms || !plan.rooms.length) && floorTemplates.createFloorTemplate) plan = floorTemplates.createFloorTemplate(options.floorType || '代表客室階'); const title = options.title || plan.floorName || '平面図'; const t = txFor(plan);
      let svg = base.createSvgDocument({ title, drawingNumber: plan.drawingId || `floor-${plan.floorId || 'unknown'}`, scale: scaleText(options.scale || plan.scale, '1/200'), projectTitle: options.projectTitle || '建築設備士 第二次試験', sheetSize: 'A3', orientation: 'landscape' });
      const rooms = autoRooms(plan, t); plan.furniture = plan.furniture || (furnitureEngine.createFurnitureLayout ? furnitureEngine.createFurnitureLayout(plan) : []); plan.dimensions = plan.dimensions || (dimEngine.createHotelDimensions ? dimEngine.createHotelDimensions(plan) : []); plan.paperUsageRatio = t.occupancy; const metrics = quality.calculateFloorPlanQualityMetrics ? quality.calculateFloorPlanQualityMetrics({ floorPlan: plan }) : { paperUsageRatio: t.occupancy }; let svgDefs = patterns.createArchitecturalPatterns ? patterns.createArchitecturalPatterns() : ''; const arch = [];
      arch.push(p.drawWall({ id: `wall-${escId(plan.floorId || 'floor')}-outer`, points: [[t.x(0), t.y(0)], [t.x(t.width), t.y(0)], [t.x(t.width), t.y(t.depth)], [t.x(0), t.y(t.depth)], [t.x(0), t.y(0)]] }));
      rooms.forEach((r, i) => { arch.push(p.drawRect({ id: `wall-room-${escId(r.roomId || i + 1)}`, x: t.x(r.x), y: t.y(r.y), width: t.l(r.width), height: t.l(r.height), fill: /PS|DS|EPS|浴室|便所|洗面/.test(r.name||'') ? 'url(#pattern-wet)' : 'none', className: r.zone === 'shaft' ? 'line-thin shaft-line' : 'line-medium wall-line', strokeWidth: r.zone === 'guest' ? 0.18 : r.zone === 'shaft' ? 0.22 : undefined })); (r.windowPositions||[]).forEach((wpos, wi)=>arch.push(p.drawWindow({ id: `window-${escId(r.roomId)}-${wi}`, x: t.x(wpos.x), y: t.y(wpos.y), width: Math.max(5,t.l(wpos.width||1800)) }))); if(r.zone==='guest') arch.push(p.drawDoor({ id: `door-${escId(r.roomId)}`, x: t.x(r.x+r.width/2-450), y: t.y(r.y< t.depth/2 ? r.y+r.height : r.y), width: Math.max(3,t.l(900)), height: r.y<t.depth/2 ? 5 : -5 })); });
      (plan.columns || []).forEach((c, i) => arch.push(p.drawColumn({ id: `column-${escId(c.id || i + 1)}`, x: t.x(c.x) - t.l(c.width || 800) / 2, y: t.y(c.y) - t.l(c.height || 800) / 2, width: Math.max(2.5, t.l(c.width || 800)), height: Math.max(2.5, t.l(c.height || 800)) })));
      (plan.doors || []).forEach((d, i) => arch.push(p.drawDoor({ id: `door-${escId(d.id || i + 1)}`, x: t.x(d.x), y: t.y(d.y), width: Math.max(4, t.l(d.width || 1800)), height: -Math.max(4, t.l(Math.abs(d.width || 1800))) })));
      (plan.windows || []).forEach((w, i) => arch.push(p.drawWindow({ id: `window-${escId(w.id || i + 1)}`, x: t.x(w.x), y: t.y(w.y), width: Math.max(8, t.l(w.width || 3600)) })));
      (plan.stairs || []).forEach((st, i) => arch.push(p.drawRect({ id: `stair-${escId(st.id || i + 1)}`, x: t.x(st.x), y: t.y(st.y), width: t.l(st.width), height: t.l(st.height), fill: 'none', className: 'line-medium' }), p.drawText({ id: `stair-label-${i + 1}`, x: t.x(st.x + st.width / 2), y: t.y(st.y + st.height / 2), text: '階段', className: 'text-room', fontSize: 3 })));
      (plan.elevators || []).forEach((e, i) => arch.push(p.drawRect({ id: `ev-${escId(e.id || i + 1)}`, x: t.x(e.x), y: t.y(e.y), width: t.l(e.width), height: t.l(e.height), fill: 'none', className: 'line-medium' }), p.drawText({ id: `ev-label-${i + 1}`, x: t.x(e.x + e.width / 2), y: t.y(e.y + e.height / 2), text: 'EV', className: 'text-room', fontSize: 3 })));
      const text = options.highQuality && annotations.createRoomAnnotations ? annotations.createRoomAnnotations(rooms, t, { showArea: options.showRoomAreas !== false }) : rooms.map((r, i) => p.drawText({ id: `room-label-${escId(r.roomId || i + 1)}`, x: t.x(safe(r.x) + safe(r.width) / 2), y: t.y(safe(r.y) + safe(r.height) / 2) - 2, text: r.name || '室', className: 'text-room', fontSize: 3.2 }) + p.drawText({ id: `room-area-${escId(r.roomId || i + 1)}`, x: t.x(safe(r.x) + safe(r.width) / 2), y: t.y(safe(r.y) + safe(r.height) / 2) + 3, text: r.area ? `${r.area}㎡` : '', className: 'text-dimension', fontSize: 2.5 })).join('');
      const eq = [...(plan.equipmentSpaces || []), ...(plan.shafts || [])].map((e, i) => p.drawRect({ id: `equipment-space-${escId(e.id || i + 1)}`, x: t.x(e.x), y: t.y(e.y), width: t.l(e.width), height: t.l(e.height), fill: 'none', className: 'line-thin' }) + p.drawText({ id: `equipment-label-${escId(e.id || i + 1)}`, x: t.x(e.x + e.width / 2), y: t.y(e.y + e.height / 2), text: e.name || e.shaftType || '設備室', className: 'text-room', fontSize: 2.6 })).join('');
      const dims = renderDimensions(plan.dimensions, t) + p.drawDimensionLine({ id: `dimension-${escId(plan.floorId || 'floor')}-width`, x: t.x(0), y: t.y(t.depth) + 28, width: t.l(t.width), text: `${Math.round(t.width).toLocaleString('ja-JP')}` }) + p.drawDimensionLine({ id: `dimension-${escId(plan.floorId || 'floor')}-depth`, x1: t.x(t.width) + 28, y1: t.y(0), x2: t.x(t.width) + 28, y2: t.y(t.depth), text: `${Math.round(t.depth).toLocaleString('ja-JP')}` }) + p.drawScaleBar({ id: 'scale-bar-floor', x: 84, y: 255, text: scaleText(options.scale || plan.scale, '1/200') });
      const notes = p.drawNorthArrow({ id: 'north-arrow-floor', x: 382, y: 42 }) + p.drawScaleBar({ id: 'scale-bar-quality', x: 348, y: 218, text: scaleText(options.scale || plan.scale, '1/200') }) + renderLegendAndNotes(plan, t, metrics);
      svg = add(svg, 'Layer02_Grid', options.showGrid === false ? '' : (options.highQuality && gridEngine.renderGridLayout ? gridEngine.renderGridLayout(gridEngine.createGridLayout({ xGrids: (plan.gridLines?.x||[]).map(g=>({id:g.id,coordinate:g.coordinate??g.position})), yGrids: (plan.gridLines?.y||[]).map(g=>({id:g.id,coordinate:g.coordinate??g.position})) }), t, { showDimensions: options.showDimensions !== false }) : renderGrid(plan, t)));
      svg = svg.replace('<defs>', `<defs>${svgDefs}`);
      svg = add(svg, 'Layer01_Architecture', arch.join('') + (options.showFurniture === false ? '' : renderFurniture(plan.furniture, t)) + (options.showFireCompartment === false ? '' : renderSafety(plan, t)));
      svg = add(svg, 'Layer03_Dimensions', options.showDimensions === false ? '' : dims);
      svg = add(svg, 'Layer04_Equipment', options.showEquipmentSpaces === false ? '' : eq);
      svg = add(svg, 'Layer05_Text', (options.showRoomNames === false ? '' : text) + notes);
      return svg.replace('<svg ', `<svg data-paper-usage-ratio="${metrics.paperUsageRatio}" `);
    } catch (error) { return base.createSvgDocument({ title: '平面図生成エラー', scale: 'S=1/200' }).replace('</svg>', `<text id="renderer-error" x="30" y="40" class="text-note">SVG生成に失敗: ${p.escapeXml(error.message)}</text></svg>`); }
  }
  const api = { renderFloorPlan, fitDrawingToArea };
  if (typeof module !== 'undefined') module.exports = api;
  root.floorPlanRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

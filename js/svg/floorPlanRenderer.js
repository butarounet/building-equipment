(function (root) {
  const p = root.svgPrimitives || (typeof require === 'function' ? require('./svgPrimitives') : {});
  const base = root.svgRenderer || (typeof require === 'function' ? require('./svgRenderer') : {});

  const DEFAULTS = { sheetSize: 'A3', orientation: 'landscape', showDimensions: true, showGrid: true, showRoomNames: true, showEquipmentSpaces: true, showTitleBlock: true, scale: '1/200' };
  const SHEET = { width: 420, height: 297, margin: 20, titleX: 250, titleY: 258 };
  const EQUIPMENT_SPACE_NAMES = ['EPS', 'PS', 'DS', '機械室', '電気室', '受変電室', '給水設備室', '空調熱源設備室', '中央監視室'];
  const escId = (v) => String(v ?? 'x').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'x';
  const num = (v, f = 0) => Number.isFinite(Number(v)) ? Number(v) : f;
  const idFactory = () => { const used = new Set(); return (prefix, raw) => { let id = `${prefix}-${escId(raw)}`; let out = id; let i = 2; while (used.has(out)) out = `${id}-${i++}`; used.add(out); return out; }; };
  function layer(svg, name, content) { return svg.replace(new RegExp(`(<g id="${name}"[^>]*>)`), `$1${content}`); }
  function bounds(plan) {
    const all = [...(plan?.rooms || []), ...(plan?.equipmentSpaces || []), ...(plan?.shafts || []), ...(plan?.columns || []), ...(plan?.walls || [])];
    const maxX = Math.max(40000, ...all.map((e) => num(e.x) + num(e.width)));
    const maxY = Math.max(30000, ...all.map((e) => num(e.y) + num(e.height)));
    return { width: maxX, height: maxY };
  }
  function transformFor(plan) {
    const b = bounds(plan); const availableW = 250; const availableH = 190;
    const scale = Math.min(availableW / b.width, availableH / b.height);
    return { scale, offsetX: (SHEET.width - 110 - b.width * scale) / 2, offsetY: (SHEET.height - 70 - b.height * scale) / 2 + 10, b,
      x(v) { return this.offsetX + num(v) * this.scale; }, y(v) { return this.offsetY + num(v) * this.scale; }, l(v) { return num(v) * this.scale; } };
  }
  function autoRooms(plan) {
    const source = Array.isArray(plan?.rooms) ? plan.rooms : [];
    if (source.every((r) => Number.isFinite(Number(r.x)) && Number.isFinite(Number(r.y)) && Number.isFinite(Number(r.width)) && Number.isFinite(Number(r.height)))) return source;
    const cols = Math.ceil(Math.sqrt(Math.max(source.length, 1))); const cellW = 12000; const cellH = 8000;
    return (source.length ? source : [{ roomId: 'auto-main', name: plan?.floorName || '室名未設定', area: 96 }]).map((r, i) => ({ ...r, roomId: r.roomId || r.id || `auto-room-${i + 1}`, x: 4000 + (i % cols) * cellW, y: 4000 + Math.floor(i / cols) * cellH, width: cellW, height: cellH }));
  }
  function drawStair(id, x, y, w, h) { return p.drawGroup({ id, children: Array.from({ length: 6 }, (_, i) => p.drawLine({ x1: x, y1: y + (i + 1) * h / 7, x2: x + w, y2: y + (i + 1) * h / 7, className: 'line-thin' })).concat([p.drawPolyline({ points: [[x+w*.25,y+h*.85],[x+w*.75,y+h*.45],[x+w*.55,y+h*.45],[x+w*.75,y+h*.2]], className: 'line-thin' })]) }); }
  function drawLegend(makeId, x, y, blank) { const items = blank ? ['通り芯','柱','壁','扉','窓','室名','EPS/PS/DS'] : ['通り芯','柱','壁','扉','窓','設備スペース名称']; return p.drawGroup({ id: makeId('legend','floor'), children: [p.drawText({ x, y, text: '凡例', className: 'text-title', fontSize: 4 }), ...items.map((t,i)=>p.drawText({ x, y: y+6+i*5, text: t, textAnchor:'start', className:'text-legend' }))] }); }
  function renderFloorPlan(floorPlan, options = {}) {
    try {
      const opts = { ...DEFAULTS, ...options }; const makeId = idFactory(); const tf = transformFor({ ...floorPlan, rooms: autoRooms(floorPlan) });
      let svg = base.createSvgDocument({ ...opts, title: opts.title || floorPlan?.floorName || '平面図', scale: `S=${opts.scale || floorPlan?.scale || '1/200'}`, drawingNumber: floorPlan?.drawingId || 'A-PLAN', projectTitle: opts.projectTitle || '建築設備士 第二次試験', blankMode: false });
      const rooms = autoRooms(floorPlan); const arch = []; const grid = []; const dims = []; const equip = []; const text = []; const print = [];
      if (opts.showGrid !== false) {
        (floorPlan?.gridLines?.x || [0,8000,16000,24000,32000,40000]).forEach((g,i) => { const pos = num(g.position ?? g); const id = g.id || `X${i+1}`; const x = tf.x(pos); grid.push(p.drawGridLine({ id: makeId('grid', id), x1:x, y1:tf.y(-4000), x2:x, y2:tf.y(tf.b.height+4000) }), p.drawCircle({ id: makeId('grid-bubble-top', id), x, y:tf.y(-5500), r:4, fill:'none', className:'line-grid' }), p.drawCircle({ id: makeId('grid-bubble-bottom', id), x, y:tf.y(tf.b.height+5500), r:4, fill:'none', className:'line-grid' }), p.drawText({ x, y:tf.y(-5500), text:id, className:'text-dimension' }), p.drawText({ x, y:tf.y(tf.b.height+5500), text:id, className:'text-dimension' })); });
        (floorPlan?.gridLines?.y || [0,8000,16000,24000,32000]).forEach((g,i) => { const pos = num(g.position ?? g); const id = g.id || `Y${i+1}`; const y = tf.y(pos); grid.push(p.drawGridLine({ id: makeId('grid', id), x1:tf.x(-4000), y1:y, x2:tf.x(tf.b.width+4000), y2:y }), p.drawCircle({ id: makeId('grid-bubble-left', id), x:tf.x(-5500), y, r:4, fill:'none', className:'line-grid' }), p.drawCircle({ id: makeId('grid-bubble-right', id), x:tf.x(tf.b.width+5500), y, r:4, fill:'none', className:'line-grid' }), p.drawText({ x:tf.x(-5500), y, text:id, className:'text-dimension' }), p.drawText({ x:tf.x(tf.b.width+5500), y, text:id, className:'text-dimension' })); });
      }
      arch.push(p.drawWall({ id: makeId('wall', `${floorPlan?.floorId || 'floor'}-outer`), points: [[tf.x(0),tf.y(0)],[tf.x(tf.b.width),tf.y(0)],[tf.x(tf.b.width),tf.y(tf.b.height)],[tf.x(0),tf.y(tf.b.height)],[tf.x(0),tf.y(0)]] }));
      rooms.forEach((r,i)=>{ arch.push(p.drawRect({ id: makeId('wall-room', r.roomId || r.id || i), x:tf.x(r.x), y:tf.y(r.y), width:tf.l(r.width), height:tf.l(r.height), fill:'none', className:'line-medium' })); if (opts.showRoomNames !== false) text.push(p.drawText({ id: makeId('room-label', r.roomId || r.id || i), x:tf.x(num(r.x)+num(r.width)/2), y:tf.y(num(r.y)+num(r.height)/2)-2, text:r.name || '室名', className:'text-room' }), p.drawText({ id: makeId('room-area', r.roomId || r.id || i), x:tf.x(num(r.x)+num(r.width)/2), y:tf.y(num(r.y)+num(r.height)/2)+4, text:r.area ? `${r.area}㎡` : '', className:'text-dimension' })); });
      (floorPlan?.columns || []).forEach((c,i)=>arch.push(p.drawColumn({ id: makeId('column', c.id || i), x:tf.x(num(c.x)-350), y:tf.y(num(c.y)-350), width:tf.l(c.width || 800), height:tf.l(c.height || 800) })));
      (floorPlan?.doors || []).forEach((d,i)=>arch.push(p.drawDoor({ id: makeId('door', d.id || i), x:tf.x(d.x), y:tf.y(d.y), width:tf.l(d.width || 1800), height:tf.l(d.height || 1800) })));
      (floorPlan?.windows || []).forEach((w,i)=>arch.push(p.drawWindow({ id: makeId('window', w.id || i), x:tf.x(w.x), y:tf.y(w.y), width:tf.l(w.width || 3000) })));
      (floorPlan?.stairs || []).forEach((s,i)=>arch.push(drawStair(makeId('stair', s.id || i), tf.x(s.x), tf.y(s.y), tf.l(s.width || 5000), tf.l(s.height || 7000))));
      (floorPlan?.elevators || []).forEach((e,i)=>arch.push(p.drawGroup({ id: makeId('elevator', e.id || i), children:[p.drawRect({ x:tf.x(e.x), y:tf.y(e.y), width:tf.l(e.width||4000), height:tf.l(e.height||4000), fill:'none', className:'line-medium' }), p.drawText({ x:tf.x(num(e.x)+num(e.width||4000)/2), y:tf.y(num(e.y)+num(e.height||4000)/2), text:'EV', className:'text-note', fontSize:3 })] })));
      const shafts = floorPlan?.shafts || ['EPS','PS','DS'].map((t,i)=>({ id:t, shaftType:t, x:tf.b.width-6000, y:6000+i*3500, width:2500, height:2500 }));
      [...shafts, ...(opts.showEquipmentSpaces === false ? [] : (floorPlan?.equipmentSpaces || []))].forEach((e,i)=>{ const name=e.shaftType||e.name||'設備室'; equip.push(p.drawRect({ id: makeId('equipment-space', e.id || i), x:tf.x(e.x), y:tf.y(e.y), width:tf.l(e.width||3000), height:tf.l(e.height||3000), fill:'none', className:'line-thin' }), p.drawText({ id: makeId('equipment-label', e.id || i), x:tf.x(num(e.x)+num(e.width||3000)/2), y:tf.y(num(e.y)+num(e.height||3000)/2), text:name, className:'text-note' })); });
      if (opts.showDimensions !== false) dims.push(p.drawDimensionLine({ id: makeId('dimension', `${floorPlan?.floorId||'floor'}-width`), x1:tf.x(0), y1:tf.y(tf.b.height+9000), x2:tf.x(tf.b.width), y2:tf.y(tf.b.height+9000), text:`${Math.round(tf.b.width).toLocaleString('ja-JP')}` }), p.drawScaleBar({ id: makeId('scale-bar','floor'), x:300, y:232, text:`S=${floorPlan?.scale || opts.scale}` }));
      text.push(p.drawNorthArrow({ id: makeId('north-arrow','floor'), x:365, y:45 }), drawLegend(makeId, 315, 80, opts.blankMode));
      svg = layer(svg,'Layer01_Architecture',arch.join('')); svg = layer(svg,'Layer02_Grid',grid.join('')); svg = layer(svg,'Layer03_Dimensions',dims.join('')); svg = layer(svg,'Layer04_Equipment',equip.join('')); svg = layer(svg,'Layer05_Text',text.join('')); svg = layer(svg,'Layer06_Answer',''); svg = layer(svg,'Layer07_Print',print.join(''));
      return svg;
    } catch (error) { return base.createSvgDocument({ title: '平面図生成エラー', scale:'S=1/200' }).replace('</svg>', `${p.drawText({ id:'floor-plan-error', x:210, y:145, text:`SVG生成に失敗: ${error.message}`, className:'text-note' })}</svg>`); }
  }
  const api = { renderFloorPlan, EQUIPMENT_SPACE_NAMES };
  if (typeof module !== 'undefined') module.exports = api;
  root.floorPlanRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

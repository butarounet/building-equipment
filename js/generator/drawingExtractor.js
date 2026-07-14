function norm(v) { return String(v || '').toLowerCase(); }
function arr(v) { return Array.isArray(v) ? v : []; }
function overlaps(a, b, pad = 0) {
  const ax2 = Number(a.x || 0) + Number(a.width || 0), ay2 = Number(a.y || 0) + Number(a.height || 0);
  const bx2 = Number(b.x || 0) + Number(b.width || 0), by2 = Number(b.y || 0) + Number(b.height || 0);
  return ax2 >= b.x - pad && a.x <= bx2 + pad && ay2 >= b.y - pad && a.y <= by2 + pad;
}
function bbox(items, fallback) {
  const list = arr(items).filter((e) => e && Number.isFinite(Number(e.x)) && Number.isFinite(Number(e.y)));
  if (!list.length) return fallback;
  const minX = Math.min(...list.map((e) => Number(e.x)));
  const minY = Math.min(...list.map((e) => Number(e.y)));
  const maxX = Math.max(...list.map((e) => Number(e.x) + Number(e.width || 0)));
  const maxY = Math.max(...list.map((e) => Number(e.y) + Number(e.height || 0)));
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}
function floorBounds(plan) { return bbox([...(plan?.rooms || []), ...(plan?.walls || []), ...(plan?.columns || [])], { x: 0, y: 0, width: 64000, height: 40000 }); }
function targetRooms(plan, question) {
  const key = norm(question?.autoSelection?.roomType || question?.relatedRooms?.[0] || question?.title);
  const rooms = arr(plan?.rooms);
  const matched = rooms.filter((r) => key && (norm(r.name).includes(key) || key.includes(norm(r.name))));
  return matched.length ? matched.slice(0, 2) : rooms.slice(0, Math.min(2, rooms.length));
}
function discipline(question) {
  if (question?.questionId === 'Q04' || /plumbing|衛生/.test(question?.type || question?.category || '')) return 'plumbing';
  if (question?.questionId === 'Q05' || /electrical|電気/.test(question?.type || question?.category || '')) return 'electrical';
  return 'hvac';
}
function extractQuestionBlankPlan({ floorPlan, room, question, scale = '1/100', margin, rule } = {}) {
  const source = floorPlan || {};
  const selectedRooms = room ? [room] : targetRooms(source, question);
  const fb = floorBounds(source);
  const crop = bbox(selectedRooms, fb);
  const pad = Number.isFinite(Number(margin)) ? Number(margin) : Math.max(2500, Math.min(crop.width, crop.height) * 0.25);
  const scope = { x: Math.max(fb.x, crop.x - pad), y: Math.max(fb.y, crop.y - pad), width: Math.min(fb.x + fb.width, crop.x + crop.width + pad) - Math.max(fb.x, crop.x - pad), height: Math.min(fb.y + fb.height, crop.y + crop.height + pad) - Math.max(fb.y, crop.y - pad) };
  const within = (items) => arr(items).filter((e) => overlaps(e, scope, 200));
  const d = discipline(question);
  const qid = String(question?.questionId || 'common').toLowerCase();
  const prefix = (items, key = 'id') => arr(items).map((e, i) => ({ ...e, [key]: `${qid}-${e?.[key] || i + 1}` }));
  return {
    drawingId: `question-blank-plan-${String(question?.questionId || 'common').toLowerCase()}`,
    questionId: question?.questionId,
    discipline: d,
    sourceFloorId: source.floorId,
    floorName: source.floorName,
    title: `${question?.questionId || ''} ${question?.title || '共通問題白図'}`.trim(),
    scale,
    cropBox: scope,
    includePolicy: rule?.includePolicy || (d === 'plumbing' ? ['fixtureOutlines', 'sanitaryFixturePositions', 'PS', 'columns', 'walls', 'doors', 'dimensions'] : d === 'electrical' ? ['columns', 'walls', 'doors', 'windows', 'roomNames', 'dimensions', 'furniture'] : ['columns', 'walls', 'doors', 'windows', 'EPS', 'PS', 'DS', 'stairs', 'EV', 'roomNames', 'dimensions']),
    excludedEquipment: rule?.excludedEquipment || ['ducts', 'pipes', 'wiring', 'equipmentSymbols', 'lighting', 'detectors', 'speakers', 'receptacles', 'VAV', 'CAV', 'FCU', 'PAC'],
    columns: prefix(within(source.columns)), walls: prefix(within(source.walls)), doors: prefix(within(source.doors)), windows: d === 'plumbing' ? [] : prefix(within(source.windows)), stairs: d === 'hvac' ? prefix(within(source.stairs)) : [], elevators: d === 'hvac' ? prefix(within(source.elevators)) : [], shafts: d === 'electrical' ? [] : prefix(within(source.shafts)), rooms: prefix(selectedRooms), furniture: d === 'electrical' ? prefix(within(source.furniture)) : [], fixtures: d === 'plumbing' ? selectedRooms.map((r, i) => ({ id: `${qid}-fixture-${i + 1}`, type: /便所|toilet/i.test(r.name || '') ? 'toilet' : /浴|UB/i.test(r.name || '') ? 'bath' : 'basin', x: Number(r.x || 0) + Number(r.width || 0) * .62, y: Number(r.y || 0) + Number(r.height || 0) * .45, width: 900, height: 700 })) : [],
    dimensions: prefix(source.dimensions || []),
    metadata: { engine: 'DynamicCropEngine', targetOnly: true, noEquipment: true, margin: pad, rule: rule?.drawingType }
  };
}
module.exports = { extractQuestionBlankPlan };

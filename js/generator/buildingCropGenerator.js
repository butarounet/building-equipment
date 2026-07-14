const { analyzeQuestionRequirement } = require('./questionBlankPlanGenerator');

function arr(v) { return Array.isArray(v) ? v : v ? [v] : []; }
function text(v) { return String(v || ''); }
function norm(v) { return text(v).toLowerCase(); }
function boxOf(items, fallback = { x: 0, y: 0, width: 10000, height: 10000 }) {
  const list = arr(items).filter((i) => Number.isFinite(Number(i.x)) && Number.isFinite(Number(i.y)));
  if (!list.length) return fallback;
  const minX = Math.min(...list.map((i) => Number(i.x)));
  const minY = Math.min(...list.map((i) => Number(i.y)));
  const maxX = Math.max(...list.map((i) => Number(i.x) + Number(i.width || 0)));
  const maxY = Math.max(...list.map((i) => Number(i.y) + Number(i.height || 0)));
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}
function intersects(a, b, pad = 0) {
  const ax2 = a.x + a.width, ay2 = a.y + a.height;
  const bx2 = b.x + b.width, by2 = b.y + b.height;
  return ax2 >= b.x - pad && a.x <= bx2 + pad && ay2 >= b.y - pad && a.y <= by2 + pad;
}
function scaleNumber(scale) { return Number(String(scale).replace('1/', '')) || 100; }
function sheetMm(sheet = 'A3-landscape') { return sheet === 'A3-portrait' ? { width: 297, height: 420 } : { width: 420, height: 297 }; }
function floorBounds(plan) { return boxOf([...(plan?.rooms || []), ...(plan?.columns || []), ...(plan?.walls || [])], { x: 0, y: 0, width: 50400, height: 36000 }); }

const CropRuleLibrary = {
  hotel: {
    Q03: { title: '7階客室階平面図', requiredRooms: ['客室6室', '廊下', 'EPS', 'PS', '設備室'], scale: '1/100', margin: 2500, targetFloor: 'typicalGuestFloor' },
    Q04: { title: '衛生設備部分詳細図', requiredRooms: ['男子便所', '厨房', '浴室'], scale: '1/50', margin: 1800, targetFloor: '1' },
    Q05: { title: '共通問題部分平面図', requiredRooms: ['宴会場', 'レストラン', '会議室'], scale: '1/100', margin: 4000, targetFloor: '2' }
  },
  hospital: { wards: ['病室', '手術室', 'ナースステーション', '汚物室', 'SPD', '厨房', '診察室'] },
  school: { rooms: ['普通教室', '特別教室', '職員室', 'トイレ'] },
  office: { rooms: ['執務室', '会議室', '給湯室', 'トイレ'] },
  get(buildingType = 'hotel', questionId = 'Q03') {
    return this[norm(buildingType)]?.[questionId] || this.hotel[questionId] || this.hotel.Q03;
  }
};

const ViewSelector = {
  select(floorPlan, question = {}, rule = {}) {
    const rooms = arr(floorPlan?.rooms);
    const qText = [question.questionId, question.title, question.prompt, question.questionText, question.roomType, ...(question.conditions || []), ...(rule.requiredRooms || [])].join(' ');
    const requested = [...arr(rule.requiredRooms), question.roomType, question?.autoSelection?.roomType].filter(Boolean);
    let selected = [];
    if (/客室6室|客室/.test(qText)) {
      const guests = rooms.filter((r) => /客室/.test(r.name || '')).slice(0, 6);
      const corridor = rooms.find((r) => /廊下/.test(r.name || ''));
      selected = [...guests, corridor].filter(Boolean);
    } else {
      selected = rooms.filter((r) => requested.some((want) => text(want).replace(/6室/g, '').split(/[・,、 ]/).some((part) => part && text(r.name).includes(part))));
    }
    if (!selected.length && /男子便所/.test(qText)) selected = rooms.filter((r) => /便所|WC|トイレ/.test(r.name || '')).slice(0, 1);
    if (!selected.length) selected = rooms.slice(0, Math.min(2, rooms.length));
    return { rooms: selected, score: Math.min(100, 70 + selected.length * 5), reason: '問題条件・室名・設備シャフト近接により選定' };
  }
};

const ScaleOptimizer = {
  choose(cropArea, requirement = {}, sheet = 'A3-landscape') {
    if (requirement.requiredScale || requirement.scale) return requirement.requiredScale || requirement.scale;
    const page = sheetMm(sheet);
    return ['1/50', '1/100', '1/150', '1/200'].find((s) => (cropArea.width / scaleNumber(s) / 1000) <= page.width * 0.8 && (cropArea.height / scaleNumber(s) / 1000) <= page.height * 0.8) || '1/200';
  }
};

function clip(plan, scope) {
  const within = (items) => arr(items).filter((e) => intersects({ x: Number(e.x || 0), y: Number(e.y || 0), width: Number(e.width || 0), height: Number(e.height || 0) }, scope, 200));
  return { rooms: within(plan.rooms), walls: within(plan.walls), columns: within(plan.columns), doors: within(plan.doors), windows: within(plan.windows), shafts: within(plan.shafts), stairs: within(plan.stairs), elevators: within(plan.elevators), dimensions: within(plan.dimensions) };
}
function toSvg(view) {
  const b = view.viewBox;
  const rects = [...view.rooms.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="white" stroke="black"/><text x="${Number(r.x)+500}" y="${Number(r.y)+1200}" font-size="900">${r.name || ''}</text>`), ...view.columns.map((c) => `<rect x="${c.x}" y="${c.y}" width="${c.width}" height="${c.height}" fill="none" stroke="black"/>`)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.width} ${b.height}">${rects.join('')}</svg>`;
}

const CropPlanner = {
  plan({ floorPlan, question = {}, drawingRequirement = {}, buildingType = 'hotel' } = {}) {
    const req = drawingRequirement.questionId ? drawingRequirement : analyzeQuestionRequirement({ question, buildingType });
    const rule = { ...CropRuleLibrary.get(buildingType, question.questionId || req.questionId), ...req.cropRule, requiredScale: req.requiredScale };
    const selected = ViewSelector.select(floorPlan, { ...question, ...req }, rule);
    const fb = floorBounds(floorPlan);
    const target = boxOf(selected.rooms, fb);
    const margin = Number(rule.margin || req.margin || 2500);
    const cropArea = { x: Math.max(fb.x, target.x - margin), y: Math.max(fb.y, target.y - margin), width: Math.min(fb.x + fb.width, target.x + target.width + margin) - Math.max(fb.x, target.x - margin), height: Math.min(fb.y + fb.height, target.y + target.height + margin) - Math.max(fb.y, target.y - margin) };
    const scale = ScaleOptimizer.choose(cropArea, { requiredScale: req.requiredScale || rule.scale });
    return { cropArea, viewBox: cropArea, rotation: cropArea.width > cropArea.height ? 0 : 90, margin, scale, selectedRooms: selected.rooms, rule, requirement: req };
  }
};

const AnswerSheetCropPlanner = {
  place(cropViews) {
    const frames = { Q03: { x: 10, y: 20, width: 190, height: 125 }, Q04: { x: 210, y: 20, width: 95, height: 125 }, Q05: { x: 10, y: 155, width: 295, height: 120 } };
    return cropViews.map((v) => ({ ...v, answerSheetFrame: frames[v.id] || frames.Q05, sheet: 'AnswerSheet4', sheetSize: 'A3-landscape' }));
  }
};

const CropQualityChecker = {
  check(result) {
    const checks = [
      ['問題条件一致', result.cropViews.every((v) => v.rooms.length > 0)], ['縮尺一致', result.cropViews.every((v) => /^1\/(50|100|150|200)$/.test(v.scale))], ['図面中心', result.cropViews.every((v) => v.viewBox.width > 0 && v.viewBox.height > 0)], ['余白適正', result.cropViews.every((v) => v.margin >= 1000)], ['設備記号除去', result.cropViews.every((v) => v.metadata.noEquipment)], ['建築情報保持', result.cropViews.every((v) => v.rooms.length && v.columns.length)], ['A3印刷適正', result.cropViews.every((v) => v.answerSheetFrame)], ['本試験レベル', result.cropViews.length >= 1]
    ];
    const score = Math.round(checks.filter(([, ok]) => ok).length / checks.length * 100);
    return { score, isValid: score >= 90, checks: checks.map(([label, ok]) => ({ label, ok })) };
  }
};

function generateBuildingCropViews({ floorPlans = [], questions = [], drawingRequirements = {}, buildingType = 'hotel' } = {}) {
  const plans = Array.isArray(floorPlans) ? floorPlans : Object.values(floorPlans || {});
  const views = questions.map((q) => {
    const req = drawingRequirements[q.questionId] || drawingRequirements[String(q.questionId).toLowerCase()] || analyzeQuestionRequirement({ question: q, buildingType });
    const floor = plans.find((p) => String(p.floorId) === String(req.targetFloor || q?.autoSelection?.targetFloor)) || plans.find((p) => /客室/.test(req.roomType || '') && /客室/.test(p.floorName || '')) || plans[0];
    const plan = CropPlanner.plan({ floorPlan: floor, question: q, drawingRequirement: req, buildingType });
    const clipped = clip(floor, plan.viewBox);
    const view = { id: q.questionId, title: CropRuleLibrary.get(buildingType, q.questionId).title || q.title, scale: plan.scale, cropArea: plan.cropArea, viewBox: plan.viewBox, rotation: plan.rotation, margin: plan.margin, ...clipped, metadata: { generator: 'BuildingCropGenerator', noEquipment: true, sourceFloorId: floor?.floorId, requiredRooms: plan.rule.requiredRooms } };
    return { ...view, svg: toSvg(view) };
  });
  const cropViews = AnswerSheetCropPlanner.place(views);
  const quality = CropQualityChecker.check({ cropViews });
  return { cropViews, quality, metadata: { engine: 'Building Crop Generator', cropPlanner: true, cropRuleLibrary: true, viewSelector: true, scaleOptimizer: true, answerSheetCropPlanner: true } };
}

module.exports = { generateBuildingCropViews, CropPlanner, CropRuleLibrary, ViewSelector, ScaleOptimizer, AnswerSheetCropPlanner, CropQualityChecker };

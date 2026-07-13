function getRoot(input, key) {
  return input && input[key] ? input[key] : input;
}

function areaValue(areaLike, fallback = 0) {
  return areaLike && Number.isFinite(areaLike.value) ? areaLike.value : fallback;
}

function getMaterial(materials, id) {
  const list = Array.isArray(materials) ? materials : materials?.materials || [];
  return list.find((material) => material?.materialId === id);
}

function rect(id, type, x, y, width, height, extra = {}) {
  return { id, type, x, y, width, height, ...extra };
}

function floorName(floorId) {
  if (floorId === 'B1') return '地下1階';
  if (floorId === 'PH') return '塔屋';
  if (floorId === 'RF') return '屋上';
  if (floorId === '4-10') return '4〜10階代表階';
  return `${floorId}階`;
}

function normalizeFloorIds(building, material3) {
  const materialFloorIds = (material3?.floors || []).map((floor) => String(floor.floorId));
  const base = materialFloorIds.length ? materialFloorIds : ['B1', '1', '2', '3', '4-10', 'PH'];
  if (!base.includes('RF')) base.push('RF');
  return base;
}

function gridLines(width = 64000, depth = 40000) {
  return {
    x: [0, 8000, 16000, 24000, 32000, 40000, 48000, 56000, width].map((position, index) => ({ id: `X${index + 1}`, position })),
    y: [0, 8000, 16000, 24000, 32000, depth].map((position, index) => ({ id: `Y${index + 1}`, position }))
  };
}

function makeFloorPlan(floorId, sourceFloor, building, equipment) {
  const isBasement = floorId === 'B1';
  const isGround = floorId === '1';
  const isSecond = floorId === '2';
  const isGuest = floorId === '3' || floorId === '4-10';
  const isRoof = floorId === 'PH' || floorId === 'RF';
  const width = isGuest ? 56000 : 64000;
  const depth = isGuest ? 32000 : 40000;
  const rooms = (sourceFloor?.majorRooms || []).map((name, index) => rect(`room-${floorId}-${index + 1}`, 'room', 4000 + (index % 3) * 18000, 4000 + Math.floor(index / 3) * 10000, 15000, 8000, { name }));
  if (!rooms.length) rooms.push(rect(`room-${floorId}-main`, 'room', 4000, 4000, width - 8000, depth - 8000, { name: floorName(floorId) }));

  const equipmentSpaces = [];
  if (isBasement) equipmentSpaces.push(
    rect('eq-heat-source', 'equipmentSpace', 4000, 4000, 16000, 10000, { name: '空調熱源設備室', relatedSystemIds: ['central-heat-source'] }),
    rect('eq-water', 'equipmentSpace', 22000, 4000, 12000, 9000, { name: '給水設備室', relatedSystemIds: ['water-supply'] }),
    rect('eq-mechanical', 'equipmentSpace', 36000, 4000, 14000, 10000, { name: '機械室' })
  );
  if (isGround) equipmentSpaces.push(
    rect('eq-transformer', 'equipmentSpace', 48000, 4000, 10000, 8000, { name: '受変電室', relatedSystemIds: ['receiving-transformer'] }),
    rect('eq-electrical', 'equipmentSpace', 48000, 14000, 9000, 7000, { name: '電気室', relatedSystemIds: ['power-distribution'] }),
    rect('eq-monitoring', 'equipmentSpace', 36000, 4000, 8000, 6000, { name: '中央監視室', relatedSystemIds: ['bems'] })
  );
  if (isRoof) equipmentSpaces.push(rect('eq-outdoor-units', 'equipmentSpace', 10000, 6000, 18000, 10000, { name: '屋外機置場', relatedSystemIds: ['central-heat-source', 'kitchen-ventilation'] }));

  return {
    drawingId: `floor-plan-${floorId}`,
    floorId,
    floorName: sourceFloor?.label || floorName(floorId),
    scale: isRoof ? '1/300' : '1/200',
    gridLines: gridLines(width, depth),
    columns: Array.from({ length: 20 }, (_, index) => rect(`col-${floorId}-${index + 1}`, 'column', (index % 5) * 12000, Math.floor(index / 5) * 8000, 700, 700)),
    walls: [rect(`wall-${floorId}-outer`, 'wall', 0, 0, width, depth, { wallType: 'outer-outline' })],
    doors: [rect(`door-${floorId}-main`, 'door', 30000, depth, 1800, 0, { swing: 'double' })],
    windows: [rect(`window-${floorId}-north`, 'window', 8000, 0, 36000, 0)],
    stairs: [rect(`stair-${floorId}-1`, 'stair', 4000, depth - 9000, 5000, 7000), rect(`stair-${floorId}-2`, 'stair', width - 9000, depth - 9000, 5000, 7000)],
    elevators: [rect(`ev-${floorId}-guest`, 'elevator', 26000, 16000, 6000, 5000, { bank: 'guest' }), rect(`ev-${floorId}-service`, 'elevator', 46000, 24000, 3500, 3500, { bank: 'service' })],
    rooms,
    dimensions: [{ id: `dim-${floorId}-overall-x`, type: 'overall', value: width, unit: 'mm' }, { id: `dim-${floorId}-overall-y`, type: 'overall', value: depth, unit: 'mm' }],
    equipmentSpaces,
    shafts: [rect(`eps-${floorId}`, 'shaft', 52000, 16000, 2500, 2500, { shaftType: 'EPS' }), rect(`ps-${floorId}`, 'shaft', 52000, 19500, 2500, 2500, { shaftType: 'PS' }), rect(`ds-${floorId}`, 'shaft', 52000, 23000, 2500, 2500, { shaftType: 'DS' })],
    annotations: [{ id: `note-${floorId}-maintenance`, text: isGuest ? `客室代表階：客室数約${Math.ceil((building.rooms?.guestRooms || 0) / Math.max(1, (building.floors?.aboveGround || 10) - 3))}室/階` : '保守動線と避難動線を分離' }]
  };
}

function makeBlankPlan(floorPlan) {
  const allowed = ['drawingId', 'floorId', 'floorName', 'scale', 'gridLines', 'columns', 'walls', 'doors', 'windows', 'stairs', 'elevators', 'rooms', 'dimensions', 'annotations'];
  return Object.fromEntries(allowed.map((key) => [key, key === 'drawingId' ? floorPlan.drawingId.replace('floor-plan', 'blank-plan') : floorPlan[key]]));
}

function generateDrawings({ plan = null, building, equipment, materials } = {}) {
  const b = getRoot(building, 'building');
  const e = getRoot(equipment, 'equipment');
  if (!b) throw new Error('buildingが存在しません。');
  if (!e) throw new Error('equipmentが存在しません。');
  const material2 = getMaterial(materials, 'material-2');
  const material3 = getMaterial(materials, 'material-3');
  const material5 = getMaterial(materials, 'material-5');
  const floorIds = normalizeFloorIds(b, material3);
  const floorPlans = floorIds.map((id) => makeFloorPlan(id, (material3?.floors || []).find((floor) => String(floor.floorId) === id), b, e));
  const blankPlans = floorPlans.map(makeBlankPlan);
  const answerFields = ['受験番号欄', '氏名欄', '問題番号', '記述欄', '計算欄', '系統図欄', '平面図欄', '機器表欄', '凡例欄', '採点者記入欄'];

  return {
    drawingSetId: `drawing-set-${Date.now()}`,
    projectTitle: b.name || plan?.hotelTypeName || plan?.hotelType || 'ホテル設備計画',
    sheetSize: 'A3-landscape',
    unit: 'mm',
    scalePolicy: { sitePlan: '1/500', floorPlan: '1/200', detail: '1/50', answerSheet: '1/1' },
    sitePlan: {
      drawingId: 'site-plan', title: '配置図', scale: '1/500', frame: { sheetSize: 'A3-landscape', margin: 10 },
      siteBoundary: rect('site-boundary', 'siteBoundary', 0, 0, Math.round(Math.sqrt(areaValue(b.siteArea)) * 1000), Math.round(Math.sqrt(areaValue(b.siteArea)) * 700)),
      roads: material2?.roadConditions || [{ side: '北側', width: 12, unit: 'm', type: '前面道路' }, { side: '東側', width: 8, unit: 'm', type: 'サービス道路' }],
      orientation: material2?.orientation || { north: '上' },
      buildingOutline: rect('building-outline', 'buildingOutline', 12000, 10000, 64000, 40000, { area: b.buildingArea }),
      placementDimensions: material2?.buildingPlacement?.setback || { north: 6, east: 4, south: 5, west: 4, unit: 'm' },
      porteCochere: { id: 'porte-cochere', location: '北側正面' }, parking: { id: 'parking', bays: Math.max(20, Math.ceil((b.rooms?.guestRooms || 0) * 0.18)), location: '西側外構' }, loadingDock: material2?.loadingDock || { location: '東側サービスヤード' }, pedestrianEntrance: { id: 'pedestrian-entry', location: '北側歩道' }, serviceRoute: { id: 'service-route', connects: ['搬入口', '厨房', 'ランドリー', 'バックヤード'] }, outdoorEquipmentYard: material2?.outdoorEquipmentYard || { location: '屋上及び東側サービスヤード' }, utilityConnections: material2?.utilityConnectionPoints || { electric: '東側道路地中引込', gas: '北側道路', water: '北側道路', sewer: '東側道路', rainwater: '東側道路側溝' }, greenArea: { id: 'green-area', location: '南側・西側外周', area: { value: Math.round(areaValue(b.siteArea) * 0.12), unit: 'm2' } }
    },
    floorPlans,
    blankPlans,
    detailDrawings: ['EPS詳細', 'PS詳細', 'DS詳細', '空調熱源設備室詳細', '給水設備室詳細', '受変電室詳細', '屋上設備置場詳細', '冷却塔周辺詳細', '配管立上り詳細', 'ダクト立上り詳細'].map((title, index) => ({ detailId: `detail-${index + 1}`, title, scale: index < 3 ? '1/30' : '1/50', elements: [{ id: `detail-element-${index + 1}`, type: title.replace('詳細', '') }], dimensions: [{ id: `detail-dim-${index + 1}`, value: 3000, unit: 'mm' }], clearances: [{ id: `clearance-${index + 1}`, value: 600, unit: 'mm', purpose: '保守点検' }], notes: ['保守点検スペースを確保', '上下階のシャフト位置と整合'] })),
    answerSheets: ['建築設備基本計画', '空調換気設備', '給排水衛生設備', '電気設備', '共通記述用紙'].map((title, index) => ({ sheetId: material5?.answerSheets?.[index]?.sheetId || `answer-sheet-${index + 1}`, title, fields: answerFields.map((name, fieldIndex) => ({ fieldId: `field-${index + 1}-${fieldIndex + 1}`, name })) })),
    legends: ['建築記号', '空調換気記号', '給排水衛生記号', '電気記号', '防災記号', '共通記号'].map((category, index) => ({ symbolId: `symbol-${index + 1}`, name: category, category, description: `${category}の図面表記。SVGパスは次Stepで定義する。` })),
    titleBlocks: ['配置図', ...floorPlans.map((floor) => floor.floorName), '部分詳細図', '答案用紙'].map((name, index) => ({ drawingName: name, drawingNumber: `D-${String(index + 1).padStart(3, '0')}`, scale: index === 0 ? '1/500' : '図示', sheetSize: 'A3-landscape', projectTitle: b.name, mockExamLabel: '一級建築士設備設計 模擬試験', createdYear: 2026, pageNumber: index + 1 })),
    metadata: { generator: 'drawingGenerator', schemaVersion: '1.0.0', sourceMaterials: ['material-1', 'material-2', 'material-3', 'material-4', 'material-5'], generatedAt: new Date().toISOString() }
  };
}

function validateDrawings(drawings, { plan = null, building, equipment, materials } = {}) {
  const errors = [];
  const warnings = [];
  const b = getRoot(building, 'building');
  const e = getRoot(equipment, 'equipment');
  const material3 = getMaterial(materials, 'material-3');
  const requiredFloorIds = normalizeFloorIds(b || {}, material3);
  const blankHasEquipment = (drawings?.blankPlans || []).some((floor) => ['equipmentSpaces', 'shafts', 'pipes', 'ducts', 'wiring', 'equipmentSymbols'].some((key) => Object.prototype.hasOwnProperty.call(floor, key)));
  const checks = {
    requiredDrawings: Boolean(drawings?.sitePlan && drawings?.floorPlans?.length && drawings?.blankPlans?.length && drawings?.detailDrawings?.length && drawings?.answerSheets?.length),
    drawingIds: Boolean(drawings?.drawingSetId && drawings?.sitePlan?.drawingId) && (drawings?.floorPlans || []).every((floor) => floor.drawingId || floor.floorId) && (drawings?.detailDrawings || []).every((detail) => detail.detailId),
    sitePlanCore: Boolean(drawings?.sitePlan?.siteBoundary && drawings?.sitePlan?.roads && drawings?.sitePlan?.orientation && drawings?.sitePlan?.buildingOutline),
    requiredFloorPlans: requiredFloorIds.every((id) => (drawings?.floorPlans || []).some((floor) => floor.floorId === id)),
    material3BlankFloorConsistency: JSON.stringify(requiredFloorIds) === JSON.stringify((drawings?.blankPlans || []).map((floor) => floor.floorId)),
    blankPlansClean: !blankHasEquipment,
    shaftsExist: (drawings?.floorPlans || []).every((floor) => ['EPS', 'PS', 'DS'].every((type) => (floor.shafts || []).some((shaft) => shaft.shaftType === type))),
    equipmentRoomConsistency: Boolean(e) && ['空調熱源設備室', '給水設備室', '受変電室'].every((name) => (drawings?.floorPlans || []).some((floor) => (floor.equipmentSpaces || []).some((space) => space.name === name))),
    answerSheetFields: (drawings?.answerSheets || []).length >= 5 && (drawings?.answerSheets || []).every((sheet) => ['受験番号欄', '氏名欄', '問題番号', '記述欄', '計算欄', '系統図欄', '平面図欄', '機器表欄', '凡例欄', '採点者記入欄'].every((name) => (sheet.fields || []).some((field) => field.name === name))),
    scaleSheetFrame: Boolean(drawings?.sheetSize && drawings?.scalePolicy && drawings?.sitePlan?.scale && drawings?.sitePlan?.frame)
  };
  Object.entries(checks).forEach(([key, ok]) => { if (!ok) errors.push(`${key}の整合チェックに失敗しました。`); });
  if ((drawings?.floorPlans || []).length !== requiredFloorIds.length) warnings.push('資料1/資料3で要求される階以外の平面図が含まれている可能性があります。');
  return { isValid: errors.length === 0, errors, warnings, checks };
}

if (typeof module !== 'undefined') module.exports = { generateDrawings, validateDrawings };
if (typeof window !== 'undefined') { window.generateDrawings = generateDrawings; window.validateDrawings = validateDrawings; }

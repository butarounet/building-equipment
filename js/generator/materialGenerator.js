const material1GeneratorApi = typeof require === 'function' ? require('./material1Generator') : (typeof window !== 'undefined' ? window : globalThis);

function getBuildingRoot(buildingJson) {
  return buildingJson && buildingJson.building ? buildingJson.building : buildingJson;
}

function getEquipmentRoot(equipmentJson) {
  return equipmentJson && equipmentJson.equipment ? equipmentJson.equipment : equipmentJson;
}

function areaValue(areaLike) {
  return areaLike && Number.isFinite(areaLike.value) ? areaLike.value : 0;
}

function area(value, unit = 'm2') {
  return { value, unit };
}

function buildingConditions(building) {
  return {
    name: building.name,
    use: building.use,
    location: building.location,
    siteArea: building.siteArea,
    buildingArea: building.buildingArea,
    totalFloorArea: building.totalFloorArea,
    floors: { ...(building.floors || {}) },
    structure: building.structure,
    guestRooms: building.rooms?.guestRooms || 0
  };
}

function floorLabel(floor) {
  if (floor === 'B1') return '地下1階';
  if (floor === 'PH') return '塔屋';
  return `${floor}階`;
}

function floorComposition(building) {
  const aboveGround = building.floors?.aboveGround || 10;
  const floors = ['B1', 1, 2, 3, '4-10', 'PH'];
  return floors.map((floor) => {
    const rooms = floor === 'B1'
      ? ['機械室', '給水設備室', '空調熱源設備室', '排水ポンプ室', '倉庫']
      : floor === 1
        ? ['エントランスロビー', 'フロント', 'レストラン', '厨房', '電気室', '受変電室', '防災センター']
        : floor === 2
          ? ['宴会場', '会議室', '宴会前室', '厨房補助室']
          : floor === 3
            ? ['客室', '管理事務室', 'リネン室']
            : floor === '4-10'
              ? [`客室代表階（4〜${Math.min(10, aboveGround)}階）`, 'リネン室', '客室廊下']
              : ['エレベーター機械室', '屋上設備基礎', '点検スペース'];

    return {
      floorId: String(floor),
      label: floorLabel(floor),
      majorRooms: rooms,
      verticalShafts: ['EPS', 'PS', 'DS'],
      equipmentRooms: ['機械室', '電気室', '受変電室', '給水設備室', '空調熱源設備室'].filter((room) => rooms.includes(room) || floor === 'B1' || floor === 1)
    };
  });
}

function generateMaterial2(building) {
  return {
    materialId: 'material-2',
    title: '資料2 配置図',
    buildingConditions: buildingConditions(building),
    siteConditions: {
      location: building.location,
      zoning: building.zoning,
      siteArea: building.siteArea,
      siteCondition: building.siteCondition
    },
    roadConditions: [
      { side: '北側', width: 12, unit: 'm', type: '前面道路' },
      { side: '東側', width: 8, unit: 'm', type: 'サービス道路' }
    ],
    buildingPlacement: { footprint: building.buildingArea, setback: { north: 6, east: 4, south: 5, west: 4, unit: 'm' } },
    porteCochere: { location: '北側正面', connectedTo: 'エントランスロビー' },
    loadingDock: { location: '東側サービスヤード', connectedTo: ['厨房', 'サービス用EV'] },
    outdoorEquipmentYard: { location: '屋上及び東側サービスヤード', reservedArea: area(Math.max(80, Math.round(areaValue(building.buildingArea) * 0.04))) },
    utilityConnectionPoints: { water: '北側道路', sewer: '東側道路', electric: '東側道路地中引込', gas: '北側道路' },
    orientation: { north: '上' },
    dimensions: { site: building.siteArea, building: building.buildingArea, primaryGrid: '8m×8mを基本' }
  };
}

function generateMaterial3(building) {
  return {
    materialId: 'material-3',
    title: '資料3 建築基本設計図',
    buildingConditions: buildingConditions(building),
    floors: floorComposition(building),
    verticalShafts: { EPS: building.equipmentSpaces?.EPS, PS: building.equipmentSpaces?.PS, DS: building.equipmentSpaces?.DS },
    equipmentSpaces: building.equipmentSpaces || {}
  };
}

function generateMaterial4(building, material3) {
  return {
    materialId: 'material-4',
    title: '資料4 白図',
    buildingConditions: buildingConditions(building),
    floors: material3.floors.map(({ floorId, label, majorRooms, verticalShafts }) => ({
      floorId,
      label,
      majorRooms,
      verticalShafts,
      writableEquipmentLayer: true,
      excludedLayers: ['設備機器', '配管', 'ダクト', '配線']
    })),
    drawingPolicy: '建築情報のみを示し、受験者が設備計画を書き込める白図とする。'
  };
}

function generateMaterial5(building) {
  return {
    materialId: 'material-5',
    title: '資料5 答案用紙',
    buildingConditions: buildingConditions(building),
    answerSheets: [
      { sheetId: 'basic-plan', title: '建築設備基本計画' },
      { sheetId: 'hvac-ventilation', title: '空調換気設備答案用紙' },
      { sheetId: 'plumbing-sanitary', title: '給排水衛生設備答案用紙' },
      { sheetId: 'electrical', title: '電気設備答案用紙' }
    ],
    fields: {
      description: { title: '記述欄' },
      calculation: { title: '計算欄' },
      systemDiagram: { title: '系統図欄' },
      equipmentSchedule: { title: '機器表欄' },
      legend: { title: '凡例欄' }
    }
  };
}

function generateMaterials({ plan = null, building, equipment }) {
  const b = getBuildingRoot(building);
  const e = getEquipmentRoot(equipment);
  if (!b) throw new Error('buildingが存在しません。');
  if (!e) throw new Error('equipmentが存在しません。');

  const material1 = material1GeneratorApi.generateMaterial1({ plan, building, equipment });
  const material2 = generateMaterial2(b);
  const material3 = generateMaterial3(b);
  const material4 = generateMaterial4(b, material3);
  const material5 = generateMaterial5(b);

  return {
    materials: [material1, material2, material3, material4, material5],
    index: {
      material1: '資料1 計画条件',
      material2: '資料2 配置図',
      material3: '資料3 建築基本設計図',
      material4: '資料4 白図',
      material5: '資料5 答案用紙'
    }
  };
}

function sameBuildingConditions(a, b) {
  if (!a || !b) return false;
  return a.name === b.name
    && a.use === b.use
    && a.guestRooms === b.guestRooms
    && a.totalFloorArea?.value === b.totalFloorArea?.value
    && a.floors?.aboveGround === b.floors?.aboveGround
    && a.floors?.basement === b.floors?.basement;
}

function validateMaterials(materials) {
  const errors = [];
  const warnings = [];
  const list = Array.isArray(materials) ? materials : materials?.materials;
  const byId = new Map((list || []).map((material) => [material?.materialId, material]));
  const requiredIds = ['material-1', 'material-2', 'material-3', 'material-4', 'material-5'];
  const material1Conditions = byId.get('material-1')?.sourceSummary;
  const comparable1 = material1Conditions && {
    name: material1Conditions.buildingName,
    use: byId.get('material-2')?.buildingConditions?.use,
    guestRooms: material1Conditions.guestRooms,
    totalFloorArea: material1Conditions.totalFloorArea,
    floors: byId.get('material-2')?.buildingConditions?.floors
  };
  const checks = {
    allMaterialsExist: requiredIds.every((id) => byId.has(id)),
    requiredFields: (list || []).every((material) => material?.materialId && material?.title),
    buildingConditionsConsistency: requiredIds.slice(1).every((id) => sameBuildingConditions(comparable1, byId.get(id)?.buildingConditions)),
    material3And4FloorConsistency: JSON.stringify((byId.get('material-3')?.floors || []).map((floor) => floor.floorId)) === JSON.stringify((byId.get('material-4')?.floors || []).map((floor) => floor.floorId)),
    material5AnswerFields: ['description', 'calculation', 'systemDiagram', 'equipmentSchedule', 'legend'].every((key) => byId.get('material-5')?.fields?.[key])
  };

  if (!checks.allMaterialsExist) errors.push('資料1〜5がすべて存在していません。');
  if (!checks.requiredFields) errors.push('materialIdまたはtitleが不足している資料があります。');
  if (!checks.buildingConditionsConsistency) errors.push('資料1と資料2〜5の建物条件が矛盾しています。');
  if (!checks.material3And4FloorConsistency) errors.push('資料3と資料4の階構成が一致していません。');
  if (!checks.material5AnswerFields) errors.push('資料5に答案用紙として必要な欄が不足しています。');

  return { isValid: errors.length === 0, errors, warnings, checks };
}

if (typeof module !== 'undefined') module.exports = { generateMaterials, validateMaterials };

if (typeof window !== 'undefined') { window.generateMaterials = generateMaterials; window.validateMaterials = validateMaterials; }

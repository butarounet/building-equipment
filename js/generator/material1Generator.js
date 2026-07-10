function numeric(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function areaValue(areaLike) {
  return numeric(areaLike && areaLike.value, 0);
}

function formatArea(areaLike) {
  if (!areaLike || !Number.isFinite(areaLike.value)) return '未設定';
  return `${areaLike.value.toLocaleString('ja-JP')} ${areaLike.unit || 'm2'}`;
}

function formatCapacity(capacity) {
  if (!capacity || !Number.isFinite(capacity.value)) return '';
  return `${capacity.value.toLocaleString('ja-JP')} ${capacity.unit || ''}`.trim();
}

function getBuildingRoot(buildingJson) {
  return buildingJson && buildingJson.building ? buildingJson.building : buildingJson;
}

function getEquipmentRoot(equipmentJson) {
  return equipmentJson && equipmentJson.equipment ? equipmentJson.equipment : equipmentJson;
}

function firstSystem(equipment, groupKey, id) {
  const systems = equipment?.[groupKey]?.systems || [];
  return id ? systems.find((system) => system.id === id) : systems[0];
}

function allSystems(equipment) {
  return Object.values(equipment || {}).flatMap((group) => group && Array.isArray(group.systems) ? group.systems : []);
}

function systemLine(label, system) {
  if (!system) return `${label}は、建物規模に応じて適切な方式を採用する。`;
  const capacity = formatCapacity(system.capacity);
  const quantity = system.quantity ? `${system.quantity}台、` : '';
  const capacityText = capacity ? `、容量は${capacity}程度` : '';
  const location = system.location ? `、設置場所は${system.location}` : '';
  return `${label}は${system.name}（${quantity}${system.category || label}${capacityText}${location}）とする。`;
}

function generateMaterial1({ plan = null, building, equipment }) {
  const b = getBuildingRoot(building);
  const e = getEquipmentRoot(equipment);
  if (!b) throw new Error('buildingが存在しません。');
  if (!e) throw new Error('equipmentが存在しません。');

  const rooms = b.rooms || {};
  const floors = b.floors || {};
  const occupancy = b.occupancy || {};
  const spaces = b.equipmentSpaces || {};
  const guestRooms = numeric(rooms.guestRooms, 0);
  const hotelType = plan?.hotelType || b.use || '都市型ホテル';
  const projectTitle = `${hotelType}の建築設備計画`;
  const hvac = firstSystem(e, 'hvac', 'central-heat-source');
  const guestHvac = firstSystem(e, 'hvac', 'guestroom-fcu');
  const ventilation = firstSystem(e, 'ventilation');
  const kitchenVentilation = firstSystem(e, 'hvac', 'kitchen-ventilation') || allSystems(e).find((system) => system.id === 'kitchen-ventilation');
  const water = firstSystem(e, 'waterSupply');
  const hotWater = firstSystem(e, 'hotWater');
  const drainage = firstSystem(e, 'drainage');
  const fire = firstSystem(e, 'fireSafety');
  const power = firstSystem(e, 'electrical');
  const transformer = firstSystem(e, 'receivingTransformer');
  const generator = firstSystem(e, 'emergencyPower');
  const lighting = firstSystem(e, 'lighting');
  const elevator = firstSystem(e, 'transportation', 'guest-elevator');
  const serviceElevator = firstSystem(e, 'transportation', 'service-elevator');
  const bems = firstSystem(e, 'buildingManagement');

  return {
    materialId: 'material-1',
    title: '資料1 計画条件',
    projectTitle,
    designBrief: [
      `本課題は、${b.location || '商業地'}に計画する${hotelType}について、宿泊、料飲、宴会・会議及び管理部門を備えたホテルの建築設備計画を行うものである。`,
      '利用者の快適性、省エネルギー性、維持管理性及び災害時の事業継続性に配慮し、各設備方式を総合的に計画すること。'
    ],
    buildingOutline: [
      `建物名称は「${b.name || 'ホテル計画'}」とし、用途は${b.use || '宿泊施設'}とする。`,
      `敷地面積は${formatArea(b.siteArea)}、建築面積は${formatArea(b.buildingArea)}、延べ面積は${formatArea(b.totalFloorArea)}とする。`,
      `階数は${floors.description || `地下${floors.basement || 0}階、地上${floors.aboveGround || 0}階`}、構造は${b.structure || '耐火構造'}とする。`,
      `客室数は${guestRooms.toLocaleString('ja-JP')}室、計画利用人員は約${numeric(occupancy.totalDesignPopulation, guestRooms * 2).toLocaleString('ja-JP')}人とする。`,
      `主要室として、宴会場${rooms.banquetHall?.count || 1}室（${formatArea(rooms.banquetHall?.area)}）、レストラン${rooms.restaurant?.count || 1}室（${formatArea(rooms.restaurant?.area)}）、厨房（${formatArea(rooms.kitchen?.area)}）、SPA・温浴部門（${formatArea(rooms.spa?.area)}）を設ける。`,
      `機械室は${spaces.mechanicalRoom?.primaryLocation || '地下階'}、電気室は${spaces.electricalRoom?.primaryLocation || '1階又は地下階'}、受変電室は${spaces.transformerRoom?.primaryLocation || '搬入可能な位置'}に計画し、EPS、PS及びDSは各階で連続させる。`
    ],
    equipmentOutline: [
      systemLine('空調設備', hvac),
      systemLine('客室空調設備', guestHvac),
      systemLine('換気設備', ventilation),
      systemLine('給水設備', water),
      systemLine('給湯設備', hotWater),
      systemLine('排水設備', drainage),
      systemLine('受変電設備', transformer),
      systemLine('非常電源設備', generator),
      systemLine('搬送設備', elevator),
      systemLine('中央監視設備', bems)
    ],
    hvacConditions: [
      'ロビー、宴会場、レストラン等は用途及び使用時間帯に応じて系統を分け、部分負荷運転に対応できる計画とする。',
      '客室は個別の温度調整ができるものとし、廊下及び客室への外気供給、結露防止、騒音対策に留意する。',
      `外気処理及び換気設備は${ventilation?.name || '用途別換気方式'}を基本とし、居室、厨房、便所、機械室の系統を分離する。`,
      kitchenVentilation ? `厨房は${kitchenVentilation.name}とし、排気量${formatCapacity(kitchenVentilation.capacity)}程度を確保して臭気拡散及び給排気バランスに配慮する。` : '厨房を設ける場合は、厨房専用の給排気系統を計画し、臭気及び熱気が客用部に流出しないようにする。'
    ],
    plumbingConditions: [
      `給水は${water?.name || '受水槽方式'}とし、受水槽容量${formatCapacity(water?.capacity)}程度を見込む。`,
      `給湯は${hotWater?.name || '中央給湯方式'}とし、客室、厨房及びSPAのピーク使用に対応できる容量${formatCapacity(hotWater?.capacity)}程度を確保する。`,
      `排水は${drainage?.name || '汚水・雑排水分流方式'}とし、厨房排水にはグリース阻集器等の前処理を設ける。`,
      'PSは客室系統、厨房系統及び通気系統の維持管理が容易となるように配置する。'
    ],
    electricalConditions: [
      `受変電設備は${transformer?.name || '高圧受変電設備'}とし、容量${formatCapacity(transformer?.capacity)}程度を見込む。`,
      `幹線設備は${power?.name || '動力・電灯幹線設備'}とし、客室階、共用部、厨房及び機械設備負荷を用途別に分岐する。`,
      `非常用発電設備は${generator?.name || '非常用発電設備'}とし、防災負荷及び必要な保安負荷へ電源を供給する。`,
      `照明は${lighting?.name || 'LED照明及び制御設備'}を基本とし、共用部、宴会場及び客室で適切な制御区分を設ける。`
    ],
    fireSafetyConditions: [
      `消火設備は${fire?.name || 'スプリンクラー及び屋内消火栓設備'}とし、ポンプ容量${formatCapacity(fire?.capacity)}程度を確保する。`,
      '自動火災報知設備、非常放送、誘導灯、非常照明及び防排煙設備は、ホテル用途の避難安全に適合するように計画する。',
      '防災センター又は中央監視室で、火災、停電、設備異常及び防災負荷の状態を監視できるものとする。',
      '客用エレベーター及びサービス用エレベーターは、停電時及び火災時の管制運転を考慮する。'
    ],
    notes: [
      '設備機器の搬入、更新及び保守スペースを確保し、客動線とサービス動線をできるだけ分離すること。',
      '設備シャフトは上下階で整合させ、梁貫通、天井内納まり及び防火区画貫通処理に留意すること。',
      '省エネルギー、節水、運用時の計量、中央監視及びBEMSによる管理を考慮すること。',
      serviceElevator ? `サービス用エレベーターは${serviceElevator.quantity || 1}台を基本とし、リネン、厨房及び廃棄物搬送を客用動線と分離すること。` : 'リネン、厨房及び廃棄物搬送は客用動線と分離すること。'
    ],
    sourceSummary: {
      buildingName: b.name,
      buildingType: 'hotel',
      guestRooms,
      totalFloorArea: b.totalFloorArea,
      equipmentSystemIds: allSystems(e).map((system) => system.id)
    }
  };
}

function validateMaterial1(material1) {
  const errors = [];
  const warnings = [];
  const arrayKeys = ['buildingOutline', 'equipmentOutline', 'hvacConditions', 'plumbingConditions', 'electricalConditions', 'fireSafetyConditions', 'notes'];
  const checks = {
    requiredFields: Boolean(material1 && material1.materialId === 'material-1' && material1.title && material1.projectTitle),
    buildingOutline: Array.isArray(material1?.buildingOutline) && material1.buildingOutline.length >= 4,
    equipmentOutline: Array.isArray(material1?.equipmentOutline) && material1.equipmentOutline.length >= 6,
    disciplineConditions: arrayKeys.slice(2, 6).every((key) => Array.isArray(material1?.[key]) && material1[key].length > 0),
    hotelViability: /ホテル|宿泊/.test([material1?.projectTitle, ...(material1?.designBrief || []), ...(material1?.buildingOutline || [])].join(' ')),
    sourceConsistency: Boolean(material1?.sourceSummary?.buildingType === 'hotel' && material1.sourceSummary.guestRooms > 0 && material1.sourceSummary.equipmentSystemIds?.includes('central-heat-source') && material1.sourceSummary.equipmentSystemIds?.includes('water-supply') && material1.sourceSummary.equipmentSystemIds?.includes('receiving-transformer')),
    nonEmptyArrays: arrayKeys.every((key) => Array.isArray(material1?.[key]) && material1[key].every((item) => typeof item === 'string' && item.trim().length > 0))
  };

  if (!checks.requiredFields) errors.push('資料1の必須項目が不足しています。');
  if (!checks.buildingOutline) errors.push('建築概要が不足しています。');
  if (!checks.equipmentOutline) errors.push('設備概要が不足しています。');
  if (!checks.disciplineConditions) errors.push('空調、衛生、電気、防災の条件が不足しています。');
  if (!checks.hotelViability) errors.push('ホテル課題として成立する記述が不足しています。');
  if (!checks.sourceConsistency) errors.push('buildingまたはequipmentの内容と整合しない可能性があります。');
  if (!checks.nonEmptyArrays) errors.push('空の条件文が含まれています。');
  if ((material1?.notes || []).length < 3) warnings.push('設計上の注意事項が少ない可能性があります。');

  return { isValid: errors.length === 0, errors, warnings, checks };
}

if (typeof module !== 'undefined') {
  module.exports = { generateMaterial1, validateMaterial1 };
}

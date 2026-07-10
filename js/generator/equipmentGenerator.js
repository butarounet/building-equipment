function numeric(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function areaValue(areaLike) {
  return numeric(areaLike && areaLike.value, 0);
}

function capacity(value, unit) {
  return { value: Math.round(value), unit };
}

function roundTo(value, unit) {
  return Math.round(value / unit) * unit;
}

function getBuildingRoot(buildingJson) {
  return buildingJson && buildingJson.building ? buildingJson.building : buildingJson;
}

function scaleFromGuestRooms(guestRooms) {
  if (guestRooms >= 320) return 'large';
  if (guestRooms >= 220) return 'medium';
  return 'compact';
}

function generateEquipment(buildingJson) {
  const building = getBuildingRoot(buildingJson);
  if (!building) throw new Error('buildingが存在しません。');

  const totalFloorArea = areaValue(building.totalFloorArea);
  const rooms = building.rooms || {};
  const spaces = building.equipmentSpaces || {};
  const floors = building.floors || {};
  const guestRooms = numeric(rooms.guestRooms, 0);
  const scale = scaleFromGuestRooms(guestRooms);
  const hasKitchen = areaValue(rooms.kitchen && rooms.kitchen.area) > 0;
  const hasSpa = areaValue(rooms.spa && rooms.spa.area) > 0;
  const hasBanquet = areaValue(rooms.banquetHall && rooms.banquetHall.area) > 0;
  const designPopulation = numeric(building.occupancy && building.occupancy.totalDesignPopulation, guestRooms * 2);

  const hvacLoadWm2 = scale === 'large' ? 123 : scale === 'medium' ? 116 : 110;
  const heatSourceCapacity = Math.max(900, roundTo(totalFloorArea * hvacLoadWm2 / 1000, 50));
  const ventilationCmh = Math.max(18000, roundTo(designPopulation * 32 + totalFloorArea * 0.9, 500));
  const kitchenExhaustCmh = hasKitchen ? Math.max(8000, roundTo(areaValue(rooms.kitchen.area) * 75, 500)) : 0;
  const hotWaterLitersHourBase = guestRooms * 55 + (hasSpa ? areaValue(rooms.spa.area) * 18 : 0) + (hasKitchen ? areaValue(rooms.kitchen.area) * 8 : 0);
  const hotWaterCapacity = Math.max(9000, roundTo(hotWaterLitersHourBase, 500));
  const waterTankCapacity = Math.max(80, roundTo(designPopulation * 0.35, 5));
  const firePumpCapacity = Math.max(1800, roundTo(totalFloorArea * 0.08, 50));
  const demandKva = Math.max(1400, roundTo(totalFloorArea * (scale === 'large' ? 0.092 : 0.085), 50));
  const transformerCapacity = roundTo(demandKva * 1.22, 50);
  const generatorCapacity = Math.max(500, roundTo(demandKva * 0.38, 25));
  const lightingKw = Math.max(160, roundTo(totalFloorArea * 0.012, 10));
  const guestElevators = scale === 'large' ? 5 : scale === 'medium' ? 4 : 3;

  const mechanicalLocation = spaces.mechanicalRoom && spaces.mechanicalRoom.primaryLocation || (floors.basement ? '地下階' : '屋上階');
  const transformerLocation = spaces.transformerRoom && spaces.transformerRoom.primaryLocation || '1階外壁側または地下階搬入可能位置';

  const hvacSystems = [
    {
      id: 'central-heat-source',
      name: scale === 'compact' ? '空冷ヒートポンプチラー＋温水ボイラ中央熱源方式' : '高効率チラー＋温水ボイラ中央熱源方式',
      category: '空調設備',
      serves: ['ロビー', 'レストラン', '共用部'],
      capacity: capacity(heatSourceCapacity, 'kW'),
      location: mechanicalLocation,
      requirements: ['熱源台数分割', '外気処理系統分離', 'BEMS計量']
    },
    {
      id: 'guestroom-fcu',
      name: guestRooms >= 260 ? '客室ファンコイル＋外気処理空調機方式' : '客室個別空調＋外気処理空調機方式',
      category: '空調設備',
      serves: ['標準客室', 'スイート客室'],
      capacity: capacity(Math.max(guestRooms * 2.4, heatSourceCapacity * 0.35), 'kW'),
      location: '各階PS・客室階天井内',
      requirements: ['客室別温度制御', '廊下給気', '停止時結露防止']
    }
  ];
  if (hasBanquet) hvacSystems.push({ id: 'banquet-zone-air-handling', name: '宴会場単独空調ゾーン方式', category: '空調設備', serves: ['宴会場', '宴会前室'], capacity: capacity(Math.max(250, areaValue(rooms.banquetHall.area) * 0.18), 'kW'), location: mechanicalLocation, requirements: ['大人数ピーク負荷対応', '可変風量制御', '排煙区画整合'] });
  if (hasKitchen) hvacSystems.push({ id: 'kitchen-ventilation', name: '厨房給排気バランス換気方式', category: '換気設備', serves: ['厨房', '宴会厨房'], capacity: capacity(kitchenExhaustCmh, 'm3/h'), location: '厨房DS・屋上排気ファン', requirements: ['給排気バランス', '防火ダンパー', '臭気拡散防止'] });

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    schemaVersion: '1.0.0',
    buildingType: 'hotel',
    sourceBuilding: { name: building.name, guestRooms, totalFloorArea: building.totalFloorArea, scale },
    equipment: {
      hvac: { name: '空調設備', systems: hvacSystems },
      ventilation: { name: '換気設備', systems: [{ id: 'outdoor-air-supply', name: '全熱交換器併用外気処理方式', category: '換気設備', serves: ['客室階', '共用部', '管理部門'], capacity: capacity(ventilationCmh, 'm3/h'), location: '機械室・各階天井内', requirements: ['用途別換気量確保', '居室外気量制御', '厨房系統分離'] }] },
      waterSupply: { name: '給水設備', systems: [{ id: 'water-supply', name: '受水槽＋加圧給水方式', category: '給水設備', capacity: capacity(waterTankCapacity, 'm3'), location: mechanicalLocation, requirements: ['用途別計量', '停電時給水継続', '飲料水衛生管理'] }] },
      hotWater: { name: '給湯設備', systems: [{ id: 'hot-water', name: hasSpa ? '中央給湯循環＋SPA高負荷対応方式' : '中央給湯循環方式', category: '給湯設備', capacity: capacity(hotWaterCapacity, 'L/h'), location: mechanicalLocation, requirements: ['客室ピーク負荷対応', '返湯温度管理', hasSpa ? 'SPA浴槽補給湯対応' : 'レジオネラ対策'] }] },
      drainage: { name: '排水設備', systems: [{ id: 'drainage', name: '汚水・雑排水分流＋厨房除害方式', category: '排水設備', capacity: capacity(Math.max(70, waterTankCapacity * 0.9), 'm3/day'), location: 'PS・地下排水ポンプ室', requirements: ['厨房グリース阻集器', '地下階排水ポンプ', '通気管経路確保'] }] },
      fireSafety: { name: '消火設備', systems: [{ id: 'sprinkler', name: '全館スプリンクラー＋屋内消火栓設備', category: '消火設備', capacity: capacity(firePumpCapacity, 'L/min'), location: mechanicalLocation, requirements: ['全館設置', 'ポンプ非常電源', '末端試験弁配置'] }] },
      electrical: { name: '電気設備', systems: [{ id: 'power-distribution', name: '動力・電灯幹線設備', category: '電気設備', capacity: capacity(demandKva, 'kVA'), location: '電気室・EPS', requirements: ['用途別幹線分岐', 'EPS縦貫', '保守用遮断区分'] }] },
      receivingTransformer: { name: '受変電設備', systems: [{ id: 'receiving-transformer', name: '高圧受変電設備', category: '受変電設備', capacity: capacity(transformerCapacity, 'kVA'), location: transformerLocation, requirements: ['需要率を考慮した変圧器容量', '保守スペース', '搬入経路確保'] }] },
      emergencyPower: { name: '非常電源設備', systems: [{ id: 'emergency-generator', name: '非常用発電設備', category: '非常電源設備', capacity: capacity(generatorCapacity, 'kVA'), location: mechanicalLocation, requirements: ['防災負荷供給', '保安負荷供給', '燃料備蓄72時間検討'] }] },
      lighting: { name: '照明設備', systems: [{ id: 'lighting-control', name: 'LED照明＋中央監視連動制御', category: '照明設備', capacity: capacity(lightingKw, 'kW'), location: '各階EPS・中央監視室', requirements: ['共用部スケジュール制御', '宴会場シーン制御', '客室カード連動'] }] },
      transportation: { name: '搬送設備', systems: [{ id: 'guest-elevator', name: '客用エレベーター', category: '搬送設備', quantity: guestElevators, capacity: { value: 15, unit: 'persons/car' }, location: '客用EVシャフト', requirements: ['ロビー直結', '車いす対応', '停電時管制運転'] }, { id: 'service-elevator', name: 'サービス用エレベーター', category: '搬送設備', quantity: scale === 'large' ? 2 : 1, capacity: { value: 1600, unit: 'kg/car' }, location: 'バックヤードEVシャフト', requirements: ['リネン搬送', '厨房搬送', '客動線との分離'] }] },
      buildingManagement: { name: '中央監視設備', systems: [{ id: 'bems', name: '中央監視・BEMS設備', category: '中央監視設備', capacity: { value: 1, unit: 'set' }, location: '防災センター・中央監視室', requirements: ['空調熱源監視', '受変電監視', '警報履歴管理'] }] }
    }
  };
}

function validateEquipment(equipmentJson, buildingJson) {
  const errors = [];
  const warnings = [];
  const equipment = equipmentJson && equipmentJson.equipment;
  const building = getBuildingRoot(buildingJson);
  if (!equipment) return { isValid: false, errors: ['equipmentが存在しません。'], warnings, checks: {} };
  if (!building) return { isValid: false, errors: ['buildingが存在しません。'], warnings, checks: {} };

  const total = areaValue(building.totalFloorArea);
  const guestRooms = numeric(building.rooms && building.rooms.guestRooms, 0);
  const spaces = building.equipmentSpaces || {};
  const hasKitchen = areaValue(building.rooms && building.rooms.kitchen && building.rooms.kitchen.area) > 0;
  const hasSpa = areaValue(building.rooms && building.rooms.spa && building.rooms.spa.area) > 0;
  const hasBanquet = areaValue(building.rooms && building.rooms.banquetHall && building.rooms.banquetHall.area) > 0;
  const allSystems = Object.values(equipment).flatMap((group) => group.systems || []);
  const byId = new Map(allSystems.map((system) => [system.id, system]));
  const requiredGroups = ['hvac', 'ventilation', 'waterSupply', 'hotWater', 'drainage', 'fireSafety', 'electrical', 'receivingTransformer', 'emergencyPower', 'lighting', 'transportation', 'buildingManagement'];

  const checks = {
    requiredEquipmentGroups: requiredGroups.every((key) => equipment[key] && Array.isArray(equipment[key].systems) && equipment[key].systems.length > 0),
    hotelSystemViability: byId.has('central-heat-source') && byId.has('guestroom-fcu') && byId.has('water-supply') && byId.has('hot-water') && byId.has('receiving-transformer') && byId.has('emergency-generator'),
    buildingScaleConsistency: guestRooms > 0 && byId.get('guest-elevator')?.quantity >= (guestRooms >= 320 ? 5 : guestRooms >= 220 ? 4 : 3),
    equipmentCapacity: (byId.get('central-heat-source')?.capacity?.value || 0) >= total * 0.08 && (byId.get('receiving-transformer')?.capacity?.value || 0) >= total * 0.07 && (byId.get('hot-water')?.capacity?.value || 0) >= guestRooms * 45,
    mechanicalRoomConsistency: Boolean(spaces.mechanicalRoom && spaces.electricalRoom && spaces.transformerRoom && spaces.EPS && spaces.PS && spaces.DS) && allSystems.every((system) => !/機械室|地下階|屋上/.test(system.location || '') || spaces.mechanicalRoom),
    kitchenVentilation: !hasKitchen || byId.has('kitchen-ventilation'),
    spaHotWater: !hasSpa || (byId.get('hot-water')?.name || '').includes('SPA') || (byId.get('hot-water')?.capacity?.value || 0) >= guestRooms * 55 + areaValue(building.rooms.spa.area) * 15,
    banquetHvacZone: !hasBanquet || byId.has('banquet-zone-air-handling')
  };

  if (!checks.requiredEquipmentGroups) errors.push('必要な設備分野が不足しています。');
  if (!checks.hotelSystemViability) errors.push('ホテル用途として必要な設備方式が成立していません。');
  if (!checks.buildingScaleConsistency) errors.push('客室数と搬送設備台数の整合が取れていません。');
  if (!checks.equipmentCapacity) errors.push('建物規模に対する設備容量が不足しています。');
  if (!checks.mechanicalRoomConsistency) errors.push('機械室・電気室・シャフトと設備方式の整合が取れていません。');
  if (!checks.kitchenVentilation) errors.push('厨房がある建物に厨房換気がありません。');
  if (!checks.spaHotWater) errors.push('SPAがある建物に対する給湯設備の強化が不足しています。');
  if (!checks.banquetHvacZone) errors.push('宴会場がある建物に宴会場空調ゾーンがありません。');
  if ((byId.get('emergency-generator')?.capacity?.value || 0) < (byId.get('receiving-transformer')?.capacity?.value || 0) * 0.25) warnings.push('非常用発電機容量に余裕が少ない可能性があります。');

  return { isValid: errors.length === 0, errors, warnings, checks };
}

if (typeof module !== 'undefined') {
  module.exports = { generateEquipment, validateEquipment };
}

const HOTEL_NAMES = ['臨海アーバンホテル計画', '杜の都コンベンションホテル計画', '駅前シティホテル計画', '港湾ゲートホテル計画', '中央公園ホテル計画'];
const CONCEPTS = ['宿泊・宴会・料飲を複合した地域交流型ホテル', '観光客とビジネス客の双方に対応する都市型ホテル', '大規模宴会と滞在快適性を両立するフルサービスホテル'];
const LOCATIONS = ['東京都江東区臨海副都心地区', '神奈川県横浜市みなとみらい地区', '大阪市北区駅前地区', '福岡市博多区都心商業地区'];
const ZONES = [
  { name: '商業地域', maxBuildingCoverageRatio: 0.8, maxFloorAreaRatio: 6.0 },
  { name: '商業地域（指定容積率600%・防火地域）', maxBuildingCoverageRatio: 0.8, maxFloorAreaRatio: 6.0 },
  { name: '商業地域（指定容積率600%・高度利用地区）', maxBuildingCoverageRatio: 0.8, maxFloorAreaRatio: 6.0 }
];
const STRUCTURES = ['鉄骨鉄筋コンクリート造、一部鉄骨造', '鉄骨造、一部鉄筋コンクリート造', '鉄筋コンクリート造、一部鉄骨造'];

function randomInt(min, max, random = Math.random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick(items, random = Math.random) {
  return items[randomInt(0, items.length - 1, random)];
}

function roundTo(value, unit) {
  return Math.round(value / unit) * unit;
}

function area(value) {
  return { value, unit: 'm2' };
}

function generateBuilding(options = {}) {
  const random = options.random || Math.random;
  const zone = pick(ZONES, random);
  const aboveGround = randomInt(8, 12, random);
  const basement = random() < 0.82 ? 1 : 2;
  const penthouse = 1;
  const siteAreaValue = roundTo(randomInt(4200, 6500, random), 10);
  const targetCoverage = Math.min(zone.maxBuildingCoverageRatio - 0.12, randomInt(52, 64, random) / 100);
  const buildingAreaValue = roundTo(siteAreaValue * targetCoverage, 10);
  const averageUpperFloor = buildingAreaValue * (randomInt(70, 82, random) / 100);
  const basementArea = buildingAreaValue * basement * (randomInt(72, 88, random) / 100);
  let totalFloorAreaValue = roundTo(buildingAreaValue + averageUpperFloor * (aboveGround - 1) + basementArea + 120, 10);
  totalFloorAreaValue = Math.min(totalFloorAreaValue, roundTo(siteAreaValue * zone.maxFloorAreaRatio * 0.96, 10));
  const rooms = Math.max(140, Math.min(430, Math.round(totalFloorAreaValue / randomInt(78, 92, random))));
  const banquetArea = roundTo(totalFloorAreaValue * (randomInt(6, 8, random) / 100), 10);
  const restaurantArea = roundTo(totalFloorAreaValue * (randomInt(4, 6, random) / 100), 10);
  const kitchenArea = roundTo((banquetArea + restaurantArea) * (randomInt(32, 42, random) / 100), 10);
  const spaArea = roundTo(totalFloorAreaValue * (randomInt(16, 24, random) / 1000), 10);
  const laundryArea = roundTo(rooms * randomInt(8, 12, random) / 10, 10);
  const mechanicalRoomArea = roundTo(totalFloorAreaValue * (basement >= 1 ? randomInt(42, 55, random) / 1000 : randomInt(55, 65, random) / 1000), 10);
  const electricalRoomArea = roundTo(totalFloorAreaValue * randomInt(12, 18, random) / 1000, 10);
  const transformerRoomArea = roundTo(totalFloorAreaValue * randomInt(10, 15, random) / 1000, 10);
  const epsArea = roundTo(aboveGround * randomInt(8, 12, random), 1);
  const psArea = roundTo(aboveGround * randomInt(10, 15, random), 1);
  const dsArea = roundTo(aboveGround * randomInt(7, 11, random), 1);

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    schemaVersion: '1.0.0',
    buildingType: 'hotel',
    building: {
      name: pick(HOTEL_NAMES, random),
      concept: pick(CONCEPTS, random),
      use: '宿泊施設（シティホテル）',
      location: pick(LOCATIONS, random),
      siteCondition: '前面道路幅員12m以上、サービス動線と歩行者動線を分離可能な整形敷地',
      zoning: zone.name,
      siteArea: area(siteAreaValue),
      buildingArea: area(buildingAreaValue),
      totalFloorArea: area(totalFloorAreaValue),
      structure: pick(STRUCTURES, random),
      floors: { basement, aboveGround, penthouse, description: `地下${basement}階、地上${aboveGround}階、塔屋${penthouse}階` },
      rooms: {
        guestRooms: rooms,
        banquetHall: { count: 1, area: area(banquetArea) },
        restaurant: { count: randomInt(1, 2, random), area: area(restaurantArea) },
        kitchen: { area: area(kitchenArea) },
        spa: { area: area(spaArea) },
        laundry: { area: area(laundryArea) }
      },
      equipmentSpaces: {
        mechanicalRoom: { area: area(mechanicalRoomArea), primaryLocation: basement >= 1 ? '地下階' : '屋上階' },
        electricalRoom: { area: area(electricalRoomArea), primaryLocation: '1階または地下階' },
        transformerRoom: { area: area(transformerRoomArea), primaryLocation: '1階外壁側または地下階搬入可能位置' },
        EPS: { area: area(epsArea), continuity: '各階縦貫' },
        PS: { area: area(psArea), continuity: '客室系統・厨房系統を分離して各階縦貫' },
        DS: { area: area(dsArea), continuity: '厨房排気・排煙を屋上まで縦貫' }
      },
      occupancy: {
        guests: rooms * 2,
        staff: Math.round(rooms * 0.28),
        banquetVisitors: Math.round(banquetArea / 2),
        totalDesignPopulation: rooms * 2 + Math.round(rooms * 0.28) + Math.round(banquetArea / 2),
        unit: 'persons'
      },
      legal: {
        buildingCoverageRatio: Number((buildingAreaValue / siteAreaValue).toFixed(3)),
        floorAreaRatio: Number((totalFloorAreaValue / siteAreaValue).toFixed(3)),
        maxBuildingCoverageRatio: zone.maxBuildingCoverageRatio,
        maxFloorAreaRatio: zone.maxFloorAreaRatio
      }
    }
  };
}

function validateBuilding(buildingJson) {
  const errors = [];
  const warnings = [];
  const b = buildingJson && buildingJson.building;
  if (!b) return { isValid: false, errors: ['buildingが存在しません。'], warnings, checks: {} };

  const total = b.totalFloorArea?.value || 0;
  const site = b.siteArea?.value || 0;
  const footprint = b.buildingArea?.value || 0;
  const floors = b.floors || {};
  const rooms = b.rooms || {};
  const equipment = b.equipmentSpaces || {};
  const legal = b.legal || {};
  const guestRooms = rooms.guestRooms || 0;
  const equipmentArea = ['mechanicalRoom', 'electricalRoom', 'transformerRoom', 'EPS', 'PS', 'DS']
    .reduce((sum, key) => sum + (equipment[key]?.area?.value || 0), 0);

  const checks = {
    legalCompliance: footprint > 0 && site > 0 && footprint / site <= (legal.maxBuildingCoverageRatio || 1) && total / site <= (legal.maxFloorAreaRatio || 10),
    equipmentPlanning: Boolean(equipment.mechanicalRoom && equipment.electricalRoom && equipment.transformerRoom && equipment.EPS && equipment.PS && equipment.DS),
    guestRoomCapacity: total > 0 && guestRooms >= 120 && guestRooms <= 430 && total / guestRooms >= 65 && total / guestRooms <= 110,
    floorPlanning: floors.aboveGround >= 8 && floors.aboveGround <= 12 && floors.basement >= 1 && floors.penthouse >= 1,
    equipmentSpace: total > 0 && equipmentArea / total >= 0.065,
    basementMechanicalConsistency: floors.basement >= 1 && equipment.mechanicalRoom?.primaryLocation?.includes('地下')
  };

  if (!checks.legalCompliance) errors.push('建蔽率または容積率が用途地域の上限を超えています。');
  if (!checks.equipmentPlanning) errors.push('必要な設備スペースが不足しています。');
  if (!checks.guestRoomCapacity) errors.push('延床面積と客室数の整合が取れていません。');
  if (!checks.floorPlanning) errors.push('本試験レベルのホテルとして階数条件が成立していません。');
  if (!checks.equipmentSpace) errors.push('設備スペースの合計面積が不足しています。');
  if (!checks.basementMechanicalConsistency) errors.push('地下階数と機械室配置の整合が取れていません。');
  if ((rooms.kitchen?.area?.value || 0) < ((rooms.banquetHall?.area?.value || 0) + (rooms.restaurant?.area?.value || 0)) * 0.28) warnings.push('厨房面積に余裕が少ない可能性があります。');

  return { isValid: errors.length === 0, errors, warnings, checks };
}

if (typeof module !== 'undefined') {
  module.exports = { generateBuilding, validateBuilding };
}

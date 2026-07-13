const HOTEL_TYPE_LABELS = {
  city: '都市型シティホテル',
  conference: '国際会議対応ホテル',
  banquet: '宴会場併設ホテル',
  spa: '温浴施設付きホテル',
  lodging: '宿泊主体型ホテル'
};

const HOTEL_TYPES = Object.keys(HOTEL_TYPE_LABELS);
const HOTEL_TYPE_DISPLAY_NAMES = Object.values(HOTEL_TYPE_LABELS);

const HOTEL_TYPE_ALIASES = Object.freeze({
  ...Object.fromEntries(Object.keys(HOTEL_TYPE_LABELS).map((key) => [key, key])),
  ...Object.fromEntries(Object.entries(HOTEL_TYPE_LABELS).map(([key, label]) => [label, key])),
  '都市型ホテル': 'city',
  'シティホテル': 'city',
  'コンベンションホテル': 'conference',
  '会議対応ホテル': 'conference',
  '宴会ホテル': 'banquet',
  '温浴ホテル': 'spa',
  '滞在型ホテル': 'spa',
  '宿泊特化ホテル': 'lodging'
});

const HOTEL_TYPE_CONFIGS = {
  city: {
    displayName: HOTEL_TYPE_LABELS.city,
    theme: '都市滞在と地域交流を両立する上質なシティホテル',
    floors: [9, 12], rooms: [220, 340], banquet: [0.05, 0.075], restaurant: [0.045, 0.06], spa: [0.012, 0.02], backyard: [0.045, 0.06], equipment: [0.07, 0.085], basement: [1, 2]
  },
  conference: {
    displayName: HOTEL_TYPE_LABELS.conference,
    theme: '国際会議・展示・宿泊を一体運用するコンベンションホテル',
    floors: [10, 14], rooms: [280, 430], banquet: [0.075, 0.105], restaurant: [0.05, 0.07], spa: [0.01, 0.018], backyard: [0.055, 0.075], equipment: [0.075, 0.095], basement: [1, 2]
  },
  banquet: {
    displayName: HOTEL_TYPE_LABELS.banquet,
    theme: '大宴会・婚礼・地域催事に対応するフルサービスホテル',
    floors: [8, 12], rooms: [200, 340], banquet: [0.08, 0.11], restaurant: [0.045, 0.065], spa: [0.01, 0.018], backyard: [0.055, 0.075], equipment: [0.075, 0.09], basement: [1, 2]
  },
  spa: {
    displayName: HOTEL_TYPE_LABELS.spa,
    theme: '宿泊と温浴・ウェルネス機能を組み合わせた滞在型ホテル',
    floors: [8, 11], rooms: [160, 300], banquet: [0.035, 0.06], restaurant: [0.045, 0.065], spa: [0.035, 0.055], backyard: [0.045, 0.065], equipment: [0.08, 0.1], basement: [1, 2]
  },
  lodging: {
    displayName: HOTEL_TYPE_LABELS.lodging,
    theme: '客室効率と基本料飲機能を重視する宿泊主体型ホテル',
    floors: [8, 12], rooms: [180, 360], banquet: [0.02, 0.04], restaurant: [0.03, 0.05], spa: [0.006, 0.014], backyard: [0.035, 0.055], equipment: [0.068, 0.082], basement: [1, 1]
  }
};

function normalizeHotelType(hotelType) {
  if (typeof hotelType !== 'string') return 'city';
  const value = hotelType.trim();
  if (!value) return 'city';
  return HOTEL_TYPE_ALIASES[value] || value;
}

function randomInt(min, max, random = Math.random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick(items, random = Math.random) {
  return items[randomInt(0, items.length - 1, random)];
}

function rangePolicy(name, range, unit = '') {
  return { name, min: range[0], max: range[1], unit };
}

function planHotelProject(options = {}) {
  const safeOptions = options && typeof options === 'object' ? options : {};
  const random = safeOptions.random || Math.random;
  const fallbackKey = 'city';
  const candidateKey = Object.prototype.hasOwnProperty.call(safeOptions, 'hotelType')
    ? normalizeHotelType(safeOptions.hotelType)
    : pick(HOTEL_TYPES, random);
  const selectedKey = HOTEL_TYPE_CONFIGS[candidateKey]
    ? candidateKey
    : fallbackKey;
  const selectedConfig = HOTEL_TYPE_CONFIGS[selectedKey] || HOTEL_TYPE_CONFIGS[fallbackKey];
  const hotelType = selectedKey;
  const hotelTypeName = selectedConfig.displayName;
  const examDifficulty = safeOptions.examDifficulty === 'hard' ? 'hard' : 'standard';

  return {
    projectType: 'hotel',
    hotelType,
    hotelTypeName,
    designTheme: selectedConfig.theme,
    siteCondition: {
      locationType: hotelType === 'spa' ? '駅近接または観光拠点の商業地' : '都心または駅前の商業地',
      access: '前面道路幅員12m以上、歩行者・サービス動線を分離できる整形敷地',
      zoning: '商業地域',
      siteArea: rangePolicy('敷地面積', examDifficulty === 'hard' ? [4800, 7200] : [4200, 6500], 'm2')
    },
    zoningPolicy: {
      publicLowerFloors: ['ロビー', 'レストラン', '宴会・会議', '管理部門'],
      guestRoomUpperFloors: true,
      serviceSeparation: true,
      verticalShaftContinuity: true
    },
    scalePolicy: {
      totalFloorArea: rangePolicy('延床面積', examDifficulty === 'hard' ? [24000, 39000] : [18000, 32000], 'm2'),
      buildingCoverageRatioTarget: rangePolicy('建蔽率目標', [0.52, 0.68], 'ratio')
    },
    floorPolicy: {
      basement: rangePolicy('地下階数', selectedConfig.basement, 'floors'),
      aboveGround: rangePolicy('地上階数', selectedConfig.floors, 'floors'),
      penthouse: 1,
      publicFloors: hotelType === 'conference' || hotelType === 'banquet' ? [1, 3] : [1, 2]
    },
    guestRoomPolicy: {
      guestRooms: rangePolicy('客室数', selectedConfig.rooms, 'rooms'),
      standardRoomsMain: true,
      guestRoomFloors: '上層階に標準客室を積層し、低層共用部と動線を分離する'
    },
    banquetPolicy: {
      required: hotelType !== 'lodging',
      areaRatio: rangePolicy('宴会・会議面積比率', selectedConfig.banquet, 'ratio'),
      divisible: hotelType === 'conference' || hotelType === 'banquet'
    },
    restaurantPolicy: {
      required: true,
      areaRatio: rangePolicy('料飲面積比率', selectedConfig.restaurant, 'ratio'),
      count: hotelType === 'conference' ? [2, 3] : [1, 2]
    },
    spaPolicy: {
      required: hotelType === 'spa',
      areaRatio: rangePolicy('SPA・温浴面積比率', selectedConfig.spa, 'ratio'),
      hotWaterLoad: hotelType === 'spa' ? 'high' : 'normal'
    },
    backyardPolicy: {
      areaRatio: rangePolicy('バックヤード面積比率', selectedConfig.backyard, 'ratio'),
      serviceElevatorRequired: true,
      kitchenLaundrySeparation: true
    },
    equipmentSpacePolicy: {
      areaRatio: rangePolicy('設備スペース面積比率', selectedConfig.equipment, 'ratio'),
      mechanicalRoomPrimaryLocation: '地下階',
      epsPsDsContinuity: '各階縦貫し用途別系統を分離する'
    },
    examDifficulty
  };
}

function validRange(policy, min, max) {
  return Number.isFinite(policy?.min) && Number.isFinite(policy?.max) && policy.min <= policy.max && policy.min >= min && policy.max <= max;
}

function validateHotelPlan(plan) {
  const errors = [];
  const warnings = [];
  const checks = {
    hotelType: Boolean(HOTEL_TYPE_CONFIGS[normalizeHotelType(plan?.hotelType)]),
    floorPolicy: validRange(plan?.floorPolicy?.aboveGround, 6, 16) && validRange(plan?.floorPolicy?.basement, 1, 3) && plan?.floorPolicy?.penthouse >= 1,
    guestRoomPolicy: validRange(plan?.guestRoomPolicy?.guestRooms, 120, 450),
    typeFacilityConsistency: false,
    examViability: false
  };

  const t = normalizeHotelType(plan?.hotelType);
  const banquet = plan?.banquetPolicy;
  const restaurant = plan?.restaurantPolicy;
  const spa = plan?.spaPolicy;
  const backyard = plan?.backyardPolicy;
  const equipment = plan?.equipmentSpacePolicy;
  checks.typeFacilityConsistency = Boolean(
    banquet && restaurant?.required && spa && backyard && equipment &&
    validRange(banquet.areaRatio, 0.015, 0.12) &&
    validRange(restaurant.areaRatio, 0.025, 0.08) &&
    validRange(spa.areaRatio, 0.004, 0.06) &&
    validRange(backyard.areaRatio, 0.03, 0.08) &&
    validRange(equipment.areaRatio, 0.065, 0.11) &&
    (t !== 'conference' || banquet.areaRatio.min >= 0.07) &&
    (t !== 'banquet' || banquet.required) &&
    (t !== 'spa' || (spa.required && spa.areaRatio.min >= 0.03))
  );
  checks.examViability = checks.hotelType && checks.floorPolicy && checks.guestRoomPolicy && checks.typeFacilityConsistency && ['standard', 'hard'].includes(plan?.examDifficulty);

  if (!checks.hotelType) errors.push('hotelTypeが有効ではありません。');
  if (!checks.floorPolicy) errors.push('階数方針が建築設備士第二次試験のホテル課題として成立しません。');
  if (!checks.guestRoomPolicy) errors.push('客室方針が成立しません。');
  if (!checks.typeFacilityConsistency) errors.push('宴会場、レストラン、SPA、バックヤード、設備スペースの方針がホテルタイプと整合しません。');
  if (!checks.examViability) errors.push('建築設備士第二次試験の模擬課題として成立しません。');
  if (plan?.examDifficulty === 'hard') warnings.push('hardは複合用途・大規模寄りの条件として生成されます。');
  return { isValid: errors.length === 0, errors, warnings, checks };
}

if (typeof module !== 'undefined') {
  module.exports = { HOTEL_TYPES, HOTEL_TYPE_LABELS, HOTEL_TYPE_DISPLAY_NAMES, HOTEL_TYPE_CONFIGS, normalizeHotelType, planHotelProject, validateHotelPlan };
}

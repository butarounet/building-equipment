const STANDARD_HOTEL_TYPE = '都市型シティホテル';

const HOTEL_TYPES = [
  '都市型シティホテル',
  '国際会議対応ホテル',
  '宴会場併設ホテル',
  '温浴施設付きホテル',
  '宿泊主体型ホテル'
];

const PLAN_PRESETS = {
  '都市型シティホテル': {
    theme: '都市滞在と地域交流を両立する上質なシティホテル',
    floors: [9, 12], rooms: [220, 340], banquet: [0.05, 0.075], restaurant: [0.045, 0.06], spa: [0.012, 0.02], backyard: [0.045, 0.06], equipment: [0.07, 0.085], basement: [1, 2]
  },
  '国際会議対応ホテル': {
    theme: '国際会議・展示・宿泊を一体運用するコンベンションホテル',
    floors: [10, 14], rooms: [280, 430], banquet: [0.075, 0.105], restaurant: [0.05, 0.07], spa: [0.01, 0.018], backyard: [0.055, 0.075], equipment: [0.075, 0.095], basement: [1, 2]
  },
  '宴会場併設ホテル': {
    theme: '大宴会・婚礼・地域催事に対応するフルサービスホテル',
    floors: [8, 12], rooms: [200, 340], banquet: [0.08, 0.11], restaurant: [0.045, 0.065], spa: [0.01, 0.018], backyard: [0.055, 0.075], equipment: [0.075, 0.09], basement: [1, 2]
  },
  '温浴施設付きホテル': {
    theme: '宿泊と温浴・ウェルネス機能を組み合わせた滞在型ホテル',
    floors: [8, 11], rooms: [160, 300], banquet: [0.035, 0.06], restaurant: [0.045, 0.065], spa: [0.035, 0.055], backyard: [0.045, 0.065], equipment: [0.08, 0.1], basement: [1, 2]
  },
  '宿泊主体型ホテル': {
    theme: '客室効率と基本料飲機能を重視する宿泊主体型ホテル',
    floors: [8, 12], rooms: [180, 360], banquet: [0.02, 0.04], restaurant: [0.03, 0.05], spa: [0.006, 0.014], backyard: [0.035, 0.055], equipment: [0.068, 0.082], basement: [1, 1]
  }
};

function randomInt(min, max, random = Math.random) {
  const raw = Number(random());
  const safeRandom = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 0.999999999) : 0;
  return Math.floor(safeRandom * (max - min + 1)) + min;
}

function pick(items, random = Math.random) {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  return items[randomInt(0, items.length - 1, random)] || items[0];
}

function resolveHotelType(requestedHotelType, random = Math.random) {
  const warnings = [];
  const requested = typeof requestedHotelType === 'string' ? requestedHotelType.trim() : '';
  let hotelType = requested;
  if (!hotelType) hotelType = pick(HOTEL_TYPES, random);
  if (!HOTEL_TYPES.includes(hotelType)) {
    if (requested) warnings.push(`未定義のhotelType「${requested}」が指定されたため、${STANDARD_HOTEL_TYPE}へフォールバックしました。`);
    hotelType = STANDARD_HOTEL_TYPE;
  }
  const preset = PLAN_PRESETS[hotelType] || PLAN_PRESETS[STANDARD_HOTEL_TYPE];
  if (!PLAN_PRESETS[hotelType]) warnings.push(`${hotelType}の設定が見つからないため、${STANDARD_HOTEL_TYPE}の設定を使用しました。`);
  return { hotelType: PLAN_PRESETS[hotelType] ? hotelType : STANDARD_HOTEL_TYPE, preset, warnings };
}

function rangePolicy(name, range, unit = '') {
  return { name, min: range[0], max: range[1], unit };
}

function planHotelProject(options = {}) {
  const safeOptions = options || {};
  const random = typeof safeOptions.random === 'function' ? safeOptions.random : Math.random;
  const resolved = resolveHotelType(safeOptions.hotelType, random);
  const hotelType = resolved.hotelType;
  const preset = resolved.preset;
  const examDifficulty = safeOptions.examDifficulty === 'hard' ? 'hard' : 'standard';

  return {
    projectType: 'hotel',
    hotelType,
    designTheme: preset.theme,
    siteCondition: {
      locationType: hotelType === '温浴施設付きホテル' ? '駅近接または観光拠点の商業地' : '都心または駅前の商業地',
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
      basement: rangePolicy('地下階数', preset.basement, 'floors'),
      aboveGround: rangePolicy('地上階数', preset.floors, 'floors'),
      penthouse: 1,
      publicFloors: hotelType === '国際会議対応ホテル' || hotelType === '宴会場併設ホテル' ? [1, 3] : [1, 2]
    },
    guestRoomPolicy: {
      guestRooms: rangePolicy('客室数', preset.rooms, 'rooms'),
      standardRoomsMain: true,
      guestRoomFloors: '上層階に標準客室を積層し、低層共用部と動線を分離する'
    },
    banquetPolicy: {
      required: hotelType !== '宿泊主体型ホテル',
      areaRatio: rangePolicy('宴会・会議面積比率', preset.banquet, 'ratio'),
      divisible: hotelType === '国際会議対応ホテル' || hotelType === '宴会場併設ホテル'
    },
    restaurantPolicy: {
      required: true,
      areaRatio: rangePolicy('料飲面積比率', preset.restaurant, 'ratio'),
      count: hotelType === '国際会議対応ホテル' ? [2, 3] : [1, 2]
    },
    spaPolicy: {
      required: hotelType === '温浴施設付きホテル',
      areaRatio: rangePolicy('SPA・温浴面積比率', preset.spa, 'ratio'),
      hotWaterLoad: hotelType === '温浴施設付きホテル' ? 'high' : 'normal'
    },
    backyardPolicy: {
      areaRatio: rangePolicy('バックヤード面積比率', preset.backyard, 'ratio'),
      serviceElevatorRequired: true,
      kitchenLaundrySeparation: true
    },
    equipmentSpacePolicy: {
      areaRatio: rangePolicy('設備スペース面積比率', preset.equipment, 'ratio'),
      mechanicalRoomPrimaryLocation: '地下階',
      epsPsDsContinuity: '各階縦貫し用途別系統を分離する'
    },
    examDifficulty,
    warnings: resolved.warnings
  };
}

function validRange(policy, min, max) {
  return Number.isFinite(policy?.min) && Number.isFinite(policy?.max) && policy.min <= policy.max && policy.min >= min && policy.max <= max;
}

function validateHotelPlan(plan) {
  const errors = [];
  const warnings = [];
  const checks = {
    hotelType: HOTEL_TYPES.includes(plan?.hotelType),
    floorPolicy: validRange(plan?.floorPolicy?.aboveGround, 6, 16) && validRange(plan?.floorPolicy?.basement, 1, 3) && plan?.floorPolicy?.penthouse >= 1,
    guestRoomPolicy: validRange(plan?.guestRoomPolicy?.guestRooms, 120, 450),
    typeFacilityConsistency: false,
    examViability: false
  };

  const t = plan?.hotelType;
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
    (t !== '国際会議対応ホテル' || banquet.areaRatio.min >= 0.07) &&
    (t !== '宴会場併設ホテル' || banquet.required) &&
    (t !== '温浴施設付きホテル' || (spa.required && spa.areaRatio.min >= 0.03))
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
  module.exports = { HOTEL_TYPES, PLAN_PRESETS, STANDARD_HOTEL_TYPE, planHotelProject, validateHotelPlan };
}

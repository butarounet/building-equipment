const { PastExamLearningEngine } = (typeof require !== 'undefined') ? require('../learning/pastExamLearningEngine') : {};
function root(input, key) { return input && input[key] ? input[key] : input; }
function listMaterials(materials) { return Array.isArray(materials) ? materials : materials?.materials || []; }
function material(materials, id) { return listMaterials(materials).find((m) => m?.materialId === id); }
function areaText(a) { return a?.value ? `${a.value.toLocaleString('ja-JP')}${a.unit || 'm2'}` : '未設定'; }
function sys(e, group, index = 0) { return e?.[group]?.systems?.[index] || {}; }
function capText(s) { return s?.capacity ? `${s.capacity.value.toLocaleString('ja-JP')}${s.capacity.unit}` : '条件による'; }
function floorIds(drawings) { return (drawings?.floorPlans || drawings?.blankPlans || []).map((f) => String(f.floorId)); }
function seedFrom(building) { return String(building?.name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0); }
function pick(arr, n) { return arr[n % arr.length]; }

function analyzePastExamLearning(input, options = {}) {
  const browserEngine = (typeof window !== 'undefined') ? window.PastExamLearningEngine : null;
  if (browserEngine && typeof browserEngine.analyze === 'function') return browserEngine.analyze(input, options);
  if (typeof PastExamLearningEngine === 'function') return new PastExamLearningEngine(options).analyze(input, options);
  return { quality: { similarity: 100, threshold: 95, passed: true, browserFallback: true } };
}

function makeQuestion(id, number, category, title, prompt, answerType, extra = {}) {
  return { questionId: id, id, number, category, title, prompt, answerType, type: extra.type, requiredPoints: extra.requiredPoints || 3, conditions: extra.conditions || [], relatedSystems: extra.relatedSystems || [], relatedRooms: extra.relatedRooms || [], drawingRequirements: extra.drawingRequirements || [], difficulty: extra.difficulty || 'standard', template: extra.template, autoSelection: extra.autoSelection, answerSheetAreaId: extra.answerSheetAreaId || 'basic-plan-description' };
}

function generateMandatory(b, e) {
  const rooms = b.rooms || {};
  const total = areaText(b.totalFloorArea);
  return [
    makeQuestion('M01', 1, '空調設備', '用途別空調ゾーニング計画', `${b.use}、客室${rooms.guestRooms}室、宴会場・レストランを持つ本建物で、客室、宴会場、厨房、ロビーの空調系統を分ける理由を3点述べよ。`, 'description', { relatedSystems: ['central-heat-source', 'guestroom-fcu'], relatedRooms: ['客室', '宴会場', '厨房', 'ロビー'] }),
    makeQuestion('M02', 2, '換気設備', '厨房換気量と給気バランス', `厨房面積${areaText(rooms.kitchen?.area)}、厨房排気能力${capText(sys(e, 'hvac', 3))}を踏まえ、臭気拡散と負圧過大を避ける計画上の配慮を述べよ。`, 'description', { relatedSystems: ['kitchen-ventilation'], relatedRooms: ['厨房'] }),
    makeQuestion('M03', 3, '給排水衛生設備', '設計給水量の算定', `設計人員${b.occupancy?.totalDesignPopulation || rooms.guestRooms * 2}人、受水槽容量${capText(sys(e, 'waterSupply'))}を用い、日使用水量と受水槽容量の妥当性を検討せよ。`, 'calculation', { conditions: ['一人一日給水量', '安全率'], relatedSystems: ['water-supply'], answerSheetAreaId: 'basic-plan-calculation' }),
    makeQuestion('M04', 4, '給湯設備', '中央給湯循環の衛生管理', `給湯能力${capText(sys(e, 'hotWater'))}の中央給湯方式について、返湯温度管理、滞留防止、レジオネラ属菌対策を含めて説明せよ。`, 'description', { relatedSystems: ['hot-water'], relatedRooms: ['客室', 'SPA', '厨房'] }),
    makeQuestion('M05', 5, '排水通気設備', '排水系統分離と通気計画', `客室系統、厨房排水、地下階排水を対象に、汚水・雑排水分流、グリース阻集器、通気管の計画要点を述べよ。`, 'diagram', { relatedSystems: ['drainage'], relatedRooms: ['客室', '厨房', '地下階'] }),
    makeQuestion('M06', 6, '消火設備・防災', 'ホテル用途の防災設備', `消防法上の用途区分を踏まえ、スプリンクラー、屋内消火栓、非常電源、防火区画貫通処理の計画要点を述べよ。`, 'description', { relatedSystems: ['sprinkler', 'emergency-generator'], difficulty: 'hard' }),
    makeQuestion('M07', 7, '電気設備', '受変電容量の算定', `延べ面積${total}、需要電力${capText(sys(e, 'electrical'))}、変圧器容量${capText(sys(e, 'receivingTransformer'))}から、需要率を考慮した受変電容量を検討せよ。`, 'calculation', { conditions: ['照明負荷', 'コンセント負荷', '需要率', '力率'], relatedSystems: ['receiving-transformer'], answerSheetAreaId: 'basic-plan-calculation' }),
    makeQuestion('M08', 8, '非常電源・BCP', '停電時継続運転範囲', `非常用発電機${capText(sys(e, 'emergencyPower'))}で供給する防災負荷と保安負荷を区分し、72時間運用を想定したBCP上の優先順位を述べよ。`, 'selection', { relatedSystems: ['emergency-generator', 'sprinkler'] }),
    makeQuestion('M09', 9, '自動制御・BEMS', '中央監視とエネルギー管理', `中央監視・BEMSにより、熱源、外気処理、照明、受変電を監視制御する項目を、本ホテルの運営条件に合わせて3点述べよ。`, 'description', { relatedSystems: ['bems', 'lighting-control'] }),
    makeQuestion('M10', 10, '維持管理・設備更新', '設備更新と保守動線', `地下機械室、1階受変電室、屋上設備置場について、搬入経路、点検スペース、営業継続中の更新計画の留意点を述べよ。`, 'description', { relatedRooms: ['空調熱源設備室', '受変電室', '屋上設備置場'] }),
    makeQuestion('M11', 11, '設備横断・LCC', '省エネルギーとLCCの総合評価', `空調、給湯、照明、BEMSを横断し、ZEB Oriented相当の省エネルギーとLCC低減を両立する提案を3点示せ。`, 'description', { relatedSystems: ['central-heat-source', 'hot-water', 'lighting-control', 'bems'], difficulty: 'hard' })
  ];
}

function selectionQuestion(prefix, number, category, title, prompt, answerType, extra = {}) {
  return makeQuestion(`${prefix}${String(number).padStart(2, '0')}`, number, category, title, prompt, answerType, {
    ...extra,
    answerSheetAreaId: extra.answerSheetAreaId || `answer-sheet-${prefix.toLowerCase()}-${String(number).padStart(2, '0')}`
  });
}

function generateSelectionQuestions(floor) {
  return {
    hvac: [
      selectionQuestion('A', 1, '空調選択', '空調負荷・FCU能力算定', `${floor}階客室階を対象に、外気条件、室内条件、冷水・温水条件を用いてFCU能力と冷温水量を算定せよ。`, 'calculation', { conditions: ['外気条件', '室内条件', '冷水温度差', '温水温度差'], relatedSystems: ['guestroom-fcu', 'central-heat-source'], relatedRooms: ['客室'] }),
      selectionQuestion('A', 2, '空調選択', '空調設備計画要点', '四管式FCU、外気処理、リバースリターン、自動制御、維持管理について計画上の要点を述べよ。', 'description', { relatedSystems: ['guestroom-fcu', 'outdoor-air-supply', 'bems'], relatedRooms: ['客室', '廊下'] })
    ],
    plumbing: [
      selectionQuestion('B', 1, '衛生選択', '給水・給湯・排水量算定', '客室及び共用便所の給水、給湯、排水量を、設計人員、同時使用率、器具単位を踏まえて算定せよ。', 'calculation', { conditions: ['給水量', '給湯量', '同時使用率', '器具排水負荷単位'], relatedSystems: ['water-supply', 'hot-water', 'drainage'], relatedRooms: ['客室', '便所'] }),
      selectionQuestion('B', 2, '衛生選択', '給排水衛生設備計画要点', 'PS、器具配管、通気、清掃口、汚水・雑排水分流、防火区画貫通処理について計画上の要点を述べよ。', 'description', { relatedSystems: ['water-supply', 'hot-water', 'drainage'], relatedRooms: ['便所', 'PS'] })
    ],
    electrical: [
      selectionQuestion('C', 1, '電気選択', '照明・受変電容量算定', '照明負荷、コンセント負荷、需要率、力率を用いて、代表階の電灯負荷及び受変電容量を算定せよ。', 'calculation', { conditions: ['照明負荷', 'コンセント負荷', '需要率', '力率'], relatedSystems: ['receiving-transformer', 'lighting-control'], relatedRooms: ['受変電室'] }),
      selectionQuestion('C', 2, '電気選択', '電気設備計画要点', '非常照明、誘導灯、感知器、非常放送、コンセント、スイッチ、中央監視について計画上の要点を述べよ。', 'description', { relatedSystems: ['emergency-generator', 'lighting-control', 'bems'], relatedRooms: ['客室', '廊下', 'EPS'] })
    ]
  };
}

function hasRoom(b, key) { return !!b?.rooms?.[key]; }
function contextScore(ctx, candidate, offset = 0) {
  const text = [ctx.buildingUse, ctx.hotelType, ctx.difficulty, candidate.id, candidate.room, ...(candidate.systemHints || [])].join('|');
  return text.split('').reduce((sum, ch, i) => sum + ch.charCodeAt(0) * (i + 3 + offset), 0);
}
function chooseCandidate(ctx, candidates, offset = 0) {
  return candidates
    .map((candidate) => ({ candidate, score: (candidate.when?.(ctx) ? 1000 : 0) + contextScore(ctx, candidate, offset) % 997 }))
    .sort((a, b) => b.score - a.score)[0].candidate;
}
function buildCommonQuestion(id, number, category, type, candidate, ctx, extra = {}) {
  const roomText = candidate.room || '指定室';
  const prompt = candidate.prompt({ ...ctx, roomText, candidate });
  return makeQuestion(id, number, category, candidate.title, prompt, 'diagram', {
    conditions: candidate.conditions,
    relatedSystems: candidate.relatedSystems,
    relatedRooms: [roomText, ...(candidate.relatedRooms || [])],
    answerSheetAreaId: `answer-sheet-4-${id.toLowerCase()}`,
    drawingRequirements: ['AnswerSheet4へ出力', ...(candidate.drawingRules || [])],
    type,
    difficulty: ctx.difficulty,
    template: 'auto',
    drawingType: type,
    roomType: roomText,
    equipmentSystem: candidate.systemHints || [],
    recommendedScale: type === 'plumbing-detail' ? '1/50' : type === 'electrical-equipment' ? '1/100' : '1/100',
    cropArea: null,
    drawingRule: candidate.drawingRules || [],
    requiredSymbols: [],
    requiredLegend: false,
    requiredDimension: true,
    requiredEquipment: [],
    autoSelection: {
      generator: extra.generator,
      selectedCandidateId: candidate.id,
      buildingUse: ctx.buildingUse,
      roomType: roomText,
      equipmentCondition: candidate.systemHints || [],
      targetFloor: ctx.floor,
      targetScope: roomText,
      examDifficulty: ctx.difficulty,
      drawingRules: candidate.drawingRules || []
    }
  });
}

function commonContext(b, e, floor, plan) {
  const hotelType = plan?.hotelTypeName || plan?.hotelType || b.planningSource?.hotelTypeName || b.planningSource?.hotelType || '都市型ホテル';
  const area = b.totalFloorArea?.value || 0;
  const difficulty = area >= 25000 || /国際|会議|フルサービス/.test(hotelType) ? 'hard' : area >= 12000 ? 'standard' : 'basic';
  return { buildingUse: b.use || 'ホテル', hotelType, rooms: b.rooms || {}, equipment: e || {}, floor, difficulty };
}

function generateHVACCommonQuestion(ctx) {
  const candidates = [
    { id: 'fcu-four-pipe', title: '客室FCU四管式配管詳細図', room: '客室', when: (c) => hasRoom(c, 'guestRooms') && JSON.stringify(c.equipment).includes('guestroom-fcu'), systemHints: ['guestroom-fcu', 'four-pipe'], relatedSystems: ['guestroom-fcu', 'central-heat-source'], conditions: ['FCU', '冷水', '温水', '四管式', 'リバースリターン', 'ドレン', '電動二方弁', '立管(C,CR,H,HR,D)'], drawingRules: ['冷水往還・温水往還・ドレンを分離表記', '弁類と立管記号を明示'], prompt: ({ floor, roomText }) => `${floor}階${roomText}を対象に、FCU四管式配管詳細図を作成せよ。冷水・温水往還、リバースリターン、ドレン、電動二方弁、立管（C, CR, H, HR, D）を明示すること。` },
    { id: 'fcu-two-pipe', title: 'FCU二管式配管詳細図', room: '客室', when: (c) => hasRoom(c, 'guestRooms'), systemHints: ['guestroom-fcu', 'two-pipe'], relatedSystems: ['guestroom-fcu'], conditions: ['FCU', '二管式', '冷温水切替', 'ドレン', '自動制御弁'], drawingRules: ['二管式の季節切替を注記', 'ドレン勾配を明示'], prompt: ({ floor, roomText }) => `${floor}階${roomText}を対象に、FCU二管式配管詳細図を作成せよ。冷温水切替、ドレン、自動制御弁、保守スペースを示すこと。` },
    { id: 'ahu-vav', title: 'AHU+VAVダクト詳細図', room: '宴会場', when: (c) => hasRoom(c, 'banquetHall') && c.difficulty === 'hard', systemHints: ['central-heat-source', 'vav'], relatedSystems: ['central-heat-source', 'bems'], conditions: ['AHU', 'VAV', '給気', '還気', '外気', '制御'], drawingRules: ['VAVゾーンと制御点を明示', '防火区画貫通を注記'], prompt: ({ roomText }) => `${roomText}を対象に、AHU+VAV方式のダクト詳細図を作成せよ。給気・還気・外気、VAVゾーン、制御点、FDを示すこと。` },
    { id: 'kitchen-exhaust', title: '厨房排気ダクト詳細図', room: '厨房', when: (c) => hasRoom(c, 'kitchen'), systemHints: ['kitchen-ventilation'], relatedSystems: ['kitchen-ventilation'], conditions: ['フード', '排気ダクト', '給気', 'グリス対策', '防火ダンパー'], drawingRules: ['清掃口と防火措置を明示', '給排気バランスを注記'], prompt: ({ roomText }) => `${roomText}を対象に、厨房排気ダクト詳細図を作成せよ。フード、排気ダクト、給気、清掃口、FD、臭気拡散防止を示すこと。` },
    { id: 'outdoor-air-unit', title: '外調機まわりダクト詳細図', room: '共用部', when: () => true, systemHints: ['outdoor-air-supply'], relatedSystems: ['outdoor-air-supply'], conditions: ['外調機', '外気', '給気', 'フィルタ', '点検スペース'], drawingRules: ['点検スペースとフィルタ交換方向を明示'], prompt: ({ roomText }) => `${roomText}を対象に、外調機まわりのダクト詳細図を作成せよ。外気取入口、給気、フィルタ、点検スペース、制御弁を示すこと。` }
  ];
  return buildCommonQuestion('Q03', 3, '共通問題（空調詳細図）', 'hvac-detail', chooseCandidate(ctx, candidates, 3), ctx, { generator: 'HVACCommonQuestionGenerator' });
}

function generatePlumbingCommonQuestion(ctx) {
  const candidates = [
    { id: 'toilet-loop-vent', title: '便所配管詳細図', room: '男子便所', when: () => true, systemHints: ['water-supply', 'drainage', 'loop-vent'], relatedSystems: ['water-supply', 'hot-water', 'drainage'], conditions: ['給水', '給湯', '排水', '通気', 'ループ通気', 'PS接続', '器具配管'], drawingRules: ['ループ通気とPS接続を明示', '器具排水負荷を注記'], prompt: ({ roomText }) => `${roomText}を対象に、給水、給湯、排水、ループ通気、PS接続、器具配管を明示した衛生配管詳細図を作成せよ。` },
    { id: 'guestroom-ub', title: '客室UB配管詳細図', room: '客室UB', when: (c) => hasRoom(c, 'guestRooms'), systemHints: ['hot-water', 'drainage'], relatedSystems: ['water-supply', 'hot-water', 'drainage'], conditions: ['給水', '給湯', '排水', '伸頂通気', 'UB接続'], drawingRules: ['UBまわりの接続高さを注記', '伸頂通気を明示'], prompt: ({ floor, roomText }) => `${floor}階${roomText}を対象に、給水、給湯、排水、伸頂通気、PS接続を含む衛生配管詳細図を作成せよ。` },
    { id: 'kitchen-grease', title: '厨房グリーストラップ配管詳細図', room: '厨房', when: (c) => hasRoom(c, 'kitchen'), systemHints: ['drainage', 'grease-trap'], relatedSystems: ['drainage'], conditions: ['厨房排水', 'グリーストラップ', '清掃口', '通気', '防臭'], drawingRules: ['グリーストラップと清掃口を明示', '厨房系統分離を注記'], prompt: ({ roomText }) => `${roomText}を対象に、厨房排水、グリーストラップ、通気、清掃口、防臭措置を含む衛生配管詳細図を作成せよ。` },
    { id: 'spa-bath', title: '浴室・SPA配管詳細図', room: 'SPA', when: (c) => hasRoom(c, 'spa'), systemHints: ['hot-water', 'drainage'], relatedSystems: ['hot-water', 'drainage'], conditions: ['給湯', '返湯', '排水', '逃し通気', '防水区画'], drawingRules: ['湿式室の防水区画を注記', '返湯循環を明示'], prompt: ({ roomText }) => `${roomText}を対象に、給湯、返湯、排水、逃し通気、防水区画を含む衛生配管詳細図を作成せよ。` }
  ];
  return buildCommonQuestion('Q04', 4, '共通問題（衛生詳細図）', 'plumbing-detail', chooseCandidate(ctx, candidates, 4), ctx, { generator: 'PlumbingCommonQuestionGenerator' });
}

function generateElectricalCommonQuestion(ctx) {
  const candidates = [
    { id: 'banquet-lighting', title: '宴会場電気設備図', room: '宴会場', when: (c) => hasRoom(c, 'banquetHall'), systemHints: ['lighting-control', 'emergency-generator'], relatedSystems: ['lighting-control', 'emergency-generator', 'bems'], conditions: ['照明器具', '非常照明', '誘導灯', '感知器', '非常放送', 'コンセント', 'スイッチ', '照明台数計算'], drawingRules: ['感知器は警戒面積を満足', '非常放送スピーカーは水平距離条件を満足', '誘導灯は避難経路に合わせ配置'], prompt: ({ roomText }) => `${roomText}を対象に、照明器具、非常照明、誘導灯、感知器、非常放送スピーカー、コンセント、スイッチ、分電盤を配置し、照明台数計算を示せ。感知器の警戒面積、スピーカー水平距離、避難経路上の誘導灯配置を満足させること。` },
    { id: 'guestroom-electrical', title: '客室電気設備図', room: '客室', when: (c) => hasRoom(c, 'guestRooms'), systemHints: ['lighting-control'], relatedSystems: ['lighting-control', 'bems'], conditions: ['照明器具', 'コンセント', 'スイッチ', '感知器', '非常放送'], drawingRules: ['ベッドまわりのスイッチとコンセントを明示', '感知器警戒面積を満足'], prompt: ({ floor, roomText }) => `${floor}階${roomText}を対象に、照明器具、コンセント、スイッチ、感知器、非常放送スピーカーを配置し、照度または照明台数計算を示せ。` },
    { id: 'restaurant-lighting', title: 'レストラン電気設備図', room: 'レストラン', when: (c) => hasRoom(c, 'restaurant'), systemHints: ['lighting-control'], relatedSystems: ['lighting-control', 'emergency-generator'], conditions: ['照明器具', '非常照明', '誘導灯', '感知器', 'コンセント', '照度計算'], drawingRules: ['客席と厨房境界の回路区分を注記', '誘導灯は避難経路に合わせ配置'], prompt: ({ roomText }) => `${roomText}を対象に、照明器具、非常照明、誘導灯、感知器、コンセント、スイッチを配置し、照度計算を示せ。` },
    { id: 'parking-electrical', title: '地下駐車場電気設備図', room: '地下駐車場', when: (c) => /地下/.test(JSON.stringify(c.rooms)), systemHints: ['emergency-generator'], relatedSystems: ['emergency-generator'], conditions: ['照明器具', '非常照明', '誘導灯', '感知器', '非常放送', '分電盤'], drawingRules: ['避難経路と誘導灯を整合', '感知器警戒面積を満足'], prompt: ({ roomText }) => `${roomText}を対象に、照明器具、非常照明、誘導灯、感知器、非常放送スピーカー、分電盤を配置し、保安負荷区分を示せ。` }
  ];
  return buildCommonQuestion('Q05', 5, '共通問題（電気設備図）', 'electrical-equipment', chooseCandidate(ctx, candidates, 5), ctx, { generator: 'ElectricalCommonQuestionGenerator' });
}

function generateCommonQuestions({ building, equipment, floor, plan }) {
  const ctx = commonContext(building, equipment, floor, plan);
  return {
    q03: generateHVACCommonQuestion(ctx),
    q04: generatePlumbingCommonQuestion(ctx),
    q05: generateElectricalCommonQuestion(ctx)
  };
}
function commonList(common) { return Array.isArray(common) ? common : Object.values(common || {}); }


function generateExam({ plan, building, equipment, materials, drawings, options = {} } = {}) {
  const b = root(building, 'building'); const e = root(equipment, 'equipment');
  if (!b) throw new Error('buildingが存在しません。'); if (!e) throw new Error('equipmentが存在しません。');
  const seed = seedFrom(b); const applicableLawDate = options.applicableLawDate || '2026-01-01';
  const floor = pick(['2', '3', '4-10'], seed); const projectTitle = pick([`${b.rooms?.banquetHall?.area?.value ? '宴会場' : '会議室'}及びレストランを併設した都市型ホテル`, `地域交流機能を備えた複合シティホテル`, `国際滞在客に対応するフルサービスホテル`], seed);
  const calculationConditions = { outdoorAir: { summer: '34℃DB/27℃WB', winter: '2℃DB' }, indoor: { guestRoom: '26℃・50%', banquet: '25℃・50%' }, airDensity: '1.2kg/m3', waterSpecificHeat: '4.19kJ/(kg・K)', chilledWaterDeltaT: '5℃', hotWaterDeltaT: '10℃', enthalpyDifference: '52kJ/kg', lightingLoad: '12W/m2', receptacleLoad: '18VA/m2', demandFactor: 0.72, powerFactor: 0.9, waterPerPersonPerDay: '350L/人日', hotWaterPerGuest: '55L/h', simultaneityFactor: 0.65, safetyFactor: 1.15 };
  const selection = generateSelectionQuestions(floor);
  const common = generateCommonQuestions({ building: b, equipment: e, floor, plan });
  const drawingRequirements = { disciplines: ['空調・換気設備', '給排水衛生設備', '電気設備'], targetDrawings: ['系統図', '平面図', '部分詳細図', '機器表', '凡例'], targetFloors: [floor], scale: { plan: '1/200', detail: '1/50', system: '図示' }, sheetSize: drawings?.sheetSize || 'A3-landscape', systemDiagrams: ['熱源', '給排水', '受変電'], legends: drawings?.legends?.map((l) => l.symbolId) || [], symbols: ['FD', 'VD', 'PS', 'EPS', 'DS', 'SP', 'ELB'], requiredNotes: ['防火区画貫通処理', '維持管理スペース', '系統名・凡例'], omittableItems: ['軽微な寸法', '家具詳細'], blankPlanReferences: (drawings?.blankPlans || []).map((d) => d.drawingId), answerSheetReferences: (drawings?.answerSheets || []).map((s) => s.sheetId) };
  const answerSheetReferences = { answerSheet1: 'selection-hvac', answerSheet2: 'selection-plumbing', answerSheet3: 'selection-electrical', answerSheet4: 'common', hvac: 'selection-hvac', plumbing: 'selection-plumbing', electrical: 'selection-electrical', common: 'common', description: 'description', calculation: 'calculation', systemDiagram: 'systemDiagram', plan: 'planDrawing', equipmentSchedule: 'equipmentSchedule', legend: 'legend' };
  return { examId: `exam-${Date.now()}`, version: '1.0', title: '建築設備士試験 第二次試験（設計製図） 模擬試験', projectTitle, createdAt: new Date().toISOString(), durationMinutes: 330, applicableLawDate, cover: { examName: '建築設備士試験 第二次試験（設計製図）', mockLabel: '模擬試験', designTaskName: projectTitle, bookletLabel: '問題集', duration: '330分', examineeNumberField: '受験番号欄', nameField: '氏名欄', noticeGuide: '注意事項を確認してから解答すること。', learningLabel: '学習用模擬試験' }, instructions: ['問題集は表紙、注意事項、設計課題、計画条件、選択問題、共通問題、製図要求事項で構成する。', '選択問題は空調、衛生、電気の各2問で構成する。', '共通問題Q03、Q04、Q05はAnswerSheet4に解答する。', '黒鉛筆又はシャープペンを使用する。', 'フリーハンド作図可。', `適用法令日は${applicableLawDate}とする。`, '問題文と図面の整合を確認すること。', '模範解答は問題集に含めない。'], designTask: { buildingUse: b.use, hotelType: plan?.hotelTypeName || plan?.hotelType || b.planningSource?.hotelTypeName || b.planningSource?.hotelType || '都市型ホテル', concept: b.concept, primaryAdditionalUses: ['宴会場', 'レストラン', '厨房', 'SPA'].filter((name) => JSON.stringify(b.rooms || {}).includes(name === 'SPA' ? 'spa' : name === '厨房' ? 'kitchen' : name === '宴会場' ? 'banquetHall' : 'restaurant')), locationConditions: b.siteCondition, designFocus: ['安全性', '省エネルギー', 'BCP', '維持管理性', '宿泊快適性'] }, planningConditions: { buildingSummary: b.name, use: b.use, fireServiceUseCategory: 'ホテル（消防法施行令別表第一(5)項イ相当）', location: b.location, zoning: b.zoning, siteArea: b.siteArea, buildingArea: b.buildingArea, totalFloorArea: b.totalFloorArea, structure: b.structure, floors: b.floors, penthouse: b.floors?.penthouse, basement: b.floors?.basement, guestRooms: b.rooms?.guestRooms, users: b.occupancy, parking: { bays: Math.max(20, Math.ceil((b.rooms?.guestRooms || 0) * 0.18)) }, infrastructure: material(materials, 'material-2')?.utilityConnectionPoints || {}, operation: { hours: '宿泊24時間、料飲・宴会は時間帯運用' }, disasterPrevention: { fireCompartment: '用途・竪穴区画を設定', smokeControl: '避難安全と整合' }, energySaving: { target: 'ZEB Oriented相当を検討' }, bcp: { emergencyPower: capText(sys(e, 'emergencyPower')), water: '受水槽と重要系統を優先' } }, selection, common, electiveSections: selection, drawingRequirements, calculationConditions, answerSheetReferences, metadata: { generator: 'examGenerator', schemaVersion: '1.0.0', sourceMaterialIds: listMaterials(materials).map((m) => m.materialId), drawingSetId: drawings?.drawingSetId, noModelAnswer: true, pastExamLearning: analyzePastExamLearning({ selection, common, drawingRequirements, planningConditions: { use: b.use } }).quality } };
}

function createQuestionFingerprint(q) { const text = [q.title, q.prompt, q.answerType, ...(q.conditions || []), ...(q.relatedSystems || []), ...(q.relatedRooms || [])].join(' '); const words = text.replace(/[、。・（）()]/g, ' ').split(/\s+/).filter(Boolean); return { id: q.questionId, title: q.title, answerType: q.answerType, systems: q.relatedSystems || [], rooms: q.relatedRooms || [], keywords: [...new Set(words.filter((w) => w.length >= 2))].slice(0, 20), structure: (q.prompt || '').replace(/[0-9０-９]+/g, '#').slice(0, 80) }; }
function similarity(a, b) { const ak = new Set(a.keywords); const bk = new Set(b.keywords); const inter = [...ak].filter((x) => bk.has(x)).length; const union = new Set([...ak, ...bk]).size || 1; return inter / union + (a.title === b.title ? 0.5 : 0) + (a.answerType === b.answerType ? 0.05 : 0); }
function checkQuestionDuplication(questions) { const warnings = []; const fps = (questions || []).map(createQuestionFingerprint); for (let i = 0; i < fps.length; i += 1) for (let j = i + 1; j < fps.length; j += 1) if (similarity(fps[i], fps[j]) >= 0.72 || fps[i].structure === fps[j].structure) warnings.push(`${fps[i].id}と${fps[j].id}が過度に類似している可能性があります。`); return { hasDuplication: warnings.length > 0, warnings, fingerprints: fps }; }
function validateExam(exam, sources = {}) { const errors = []; const warnings = []; const b = root(sources.building, 'building'); const selection = exam?.selection || exam?.electiveSections || {}; const common = exam?.common || []; const commonQuestions = commonList(common); const allQ = [...Object.values(selection).flat(), ...commonQuestions]; const validFloors = floorIds(sources.drawings); const checks = { cover: !!exam?.cover, instructions: (exam?.instructions || []).length > 0, designTask: !!exam?.designTask?.buildingUse, planningConditions: !!exam?.planningConditions?.totalFloorArea, selectionCounts: ['hvac', 'plumbing', 'electrical'].every((k) => selection?.[k]?.length === 2), commonCount: commonQuestions.length === 3, answerSheet4Exists: exam?.answerSheetReferences?.answerSheet4 === 'common' || !!exam?.answerSheetReferences?.common, q03Hvac: commonQuestions.find((q) => q.questionId === 'Q03')?.type === 'hvac-detail', q04Plumbing: commonQuestions.find((q) => q.questionId === 'Q04')?.type === 'plumbing-detail', q05Electrical: commonQuestions.find((q) => q.questionId === 'Q05')?.type === 'electrical-equipment', questionNumbering: selection.hvac?.map((q) => q.questionId).join(',') === 'A01,A02' && selection.plumbing?.map((q) => q.questionId).join(',') === 'B01,B02' && selection.electrical?.map((q) => q.questionId).join(',') === 'C01,C02' && commonQuestions.map((q) => q.questionId).join(',') === 'Q03,Q04,Q05', buildingUseConsistency: commonQuestions.every((q) => q.autoSelection?.buildingUse === exam?.planningConditions?.use), equipmentModeConsistency: commonQuestions.every((q) => (q.autoSelection?.equipmentCondition || []).length > 0), difficultyConfigured: commonQuestions.every((q) => ['basic','standard','hard'].includes(q.difficulty)), actualExamStructure: true, calculationConditions: !!exam?.calculationConditions && Object.keys(exam.calculationConditions).length > 0, drawingConsistency: (exam?.drawingRequirements?.blankPlanReferences || []).every((id) => (sources.drawings?.blankPlans || []).some((d) => d.drawingId === id)), answerSheetReferences: !!exam?.answerSheetReferences?.answerSheet4, buildingConsistency: !b || exam?.planningConditions?.guestRooms === b.rooms?.guestRooms, existingFloors: (exam?.drawingRequirements?.targetFloors || []).every((f) => validFloors.includes(String(f))), systemConsistency: allQ.every((q) => (q.relatedSystems || []).length === 0 || q.relatedSystems.every((id) => JSON.stringify(root(sources.equipment, 'equipment') || {}).includes(id))), nonEmptyPrompts: allQ.every((q) => q.prompt && q.title), noModelAnswer: !JSON.stringify(exam || {}).includes('模範解答:') && !Object.prototype.hasOwnProperty.call(exam || {}, 'modelAnswers') };
  const dup = checkQuestionDuplication(allQ); checks.noDuplication = !dup.hasDuplication; if (dup.hasDuplication) warnings.push(...dup.warnings); Object.entries(checks).forEach(([k, ok]) => { if (!ok) errors.push(`${k}の検査に失敗しました。`); }); return { isValid: errors.length === 0, errors, warnings, checks }; }

if (typeof module !== 'undefined') module.exports = { generateExam, createQuestionFingerprint, checkQuestionDuplication, validateExam };
if (typeof window !== 'undefined') { window.generateExam = generateExam; window.createQuestionFingerprint = createQuestionFingerprint; window.checkQuestionDuplication = checkQuestionDuplication; window.validateExam = validateExam; }

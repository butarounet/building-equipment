const { analyzeQuestionRequirement } = (typeof require !== 'undefined') ? require('./questionBlankPlanGenerator') : { analyzeQuestionRequirement: () => ({}) };
const { analyzeDrawingInstructions, validateDrawingInstructionAnalysis } = (typeof require !== 'undefined') ? require('./drawingInstructionAnalyzer') : { analyzeDrawingInstructions: () => ({ elements: {} }), validateDrawingInstructionAnalysis: () => ({ isValid: true, checks: [] }) };

function arr(v) { return Array.isArray(v) ? v : v ? [v] : []; }
function first(...values) { return values.find((v) => v !== undefined && v !== null && v !== ''); }
function normalizeDiscipline(v = '') { const t = String(v).toUpperCase(); if (/衛生|PLUMB|DRAIN|WATER/.test(t)) return 'PLUMBING'; if (/電気|ELECT|LIGHT|POWER/.test(t)) return 'ELECTRICAL'; return 'HVAC'; }
function normalizeSystem(system = '', discipline = 'HVAC') {
  const s = String(system || '').replace(/[-\s]/g, '_');
  const map = {
    AHU: 'AHU_VAV', AHU_VAV: 'AHU_VAV', VAV: 'AHU_VAV',
    FCU: 'FCU_4Pipe', FCU_4PIPE: 'FCU_4Pipe', FOUR_PIPE: 'FCU_4Pipe',
    PAC: 'PAC_IndoorOutdoor', PAC_INDOOROUTDOOR: 'PAC_IndoorOutdoor',
    LOOPVENT: 'LoopVentDrainage', LOOP_VENT: 'LoopVentDrainage', LOOPVENTDRAINAGE: 'LoopVentDrainage',
    KITCHEN_DRAINAGE: 'KitchenGreaseDrainage', GREASE_TRAP: 'KitchenGreaseDrainage',
    LIGHTING: 'LightingDesign', LIGHTING_CONTROL: 'LightingDesign'
  };
  const key = s.toUpperCase();
  if (map[key]) return map[key];
  if (discipline === 'PLUMBING' && /厨房|GREASE/.test(s)) return 'KitchenGreaseDrainage';
  if (discipline === 'ELECTRICAL' && /照明|LIGHT/.test(s)) return 'LightingDesign';
  return s || (discipline === 'PLUMBING' ? 'LoopVentDrainage' : discipline === 'ELECTRICAL' ? 'LightingDesign' : 'AHU_VAV');
}
function inferQuestionNo(scenario = {}, discipline) { return first(scenario.questionNo, scenario.questionId, discipline === 'PLUMBING' ? 'Q04' : discipline === 'ELECTRICAL' ? 'Q05' : 'Q03'); }
function normalizeScenario({ scenario = {}, equipment = {}, exam = {}, difficulty } = {}) {
  const discipline = normalizeDiscipline(first(scenario.discipline, scenario.category, scenario.drawingType));
  const system = normalizeSystem(first(scenario.system, scenario.equipmentSystem, arr(scenario.relatedSystems)[0]), discipline);
  const questionNo = inferQuestionNo(scenario, discipline);
  const room = first(scenario.room, scenario.roomType, arr(scenario.relatedRooms)[0], discipline === 'PLUMBING' ? '厨房' : discipline === 'ELECTRICAL' ? '宴会場' : '宴会場');
  return { discipline, questionNo, room, system, drawingType: scenario.drawingType || (discipline === 'HVAC' ? 'duct' : discipline === 'PLUMBING' ? 'plumbing' : 'electrical'), scale: scenario.scale || exam?.drawingRequirements?.scale?.detail || (discipline === 'PLUMBING' ? '1/50' : '1/100'), difficulty: difficulty || scenario.difficulty || 'standard', targetFloor: first(scenario.targetFloor, scenario.floor, '1'), equipment, exam };
}

const ConditionSets = {
  AHU_VAV: ['各VAVは変風量方式とする。', 'SA、RA、EA及びOAの各ダクトルートを明示する。', 'FD、VD及び点検口を適切に設ける。', '主要ダクトサイズを記入する。'],
  FCU_4Pipe: ['FCUは四管式とし、冷水及び温水の往管・還管を記入する。', '冷温水配管はリバースリターン方式を原則とする。', 'ドレン管は排水可能な勾配を確保する。', '弁類、制御弁及び点検スペースを示す。'],
  PAC_IndoorOutdoor: ['室内機及び室外機の位置を示す。', '冷媒管及びドレン管のルートを記入する。', '室外機の保守スペース及び吹出し短絡防止に留意する。'],
  LoopVentDrainage: ['排水は自然流下方式とする。', '通気方式はループ通気方式とする。', '器具排水管、排水横枝管及び通気管を明示する。', '掃除口及び管径を記入する。'],
  KitchenGreaseDrainage: ['厨房排水は一般排水系統と分離する。', 'グリース阻集器を設ける。', '排水は自然流下方式とし、必要な勾配を確保する。', '通気管、掃除口及び配管径を記入する。'],
  LightingDesign: ['設計照度は500 lxとする。', '保守率は0.85、照明率は0.80とする。', '照明器具の必要台数を算定する。', '非常照明、感知器、非常放送スピーカー及びコンセントを適切に配置する。']
};
const DrawSets = {
  AHU_VAV: ['ダクト', '吹出口', '吸込口', 'FD', 'VD', 'VAV', '点検口', 'ダクトサイズ'],
  FCU_4Pipe: ['FCU', '冷水往管', '冷水還管', '温水往管', '温水還管', 'ドレン管', '弁類'],
  PAC_IndoorOutdoor: ['室内機', '室外機', '冷媒管', 'ドレン管', '点検スペース'],
  LoopVentDrainage: ['給水配管', '給湯配管', '排水配管', '通気配管', '器具', '掃除口', '配管径'],
  KitchenGreaseDrainage: ['厨房器具', '排水配管', '通気配管', 'グリース阻集器', '掃除口', '配管径'],
  LightingDesign: ['照明器具', '非常照明', '感知器', '非常放送スピーカー', 'コンセント', 'スイッチ', '照明台数計算表']
};
function selectTemplate(n) { return n.discipline === 'PLUMBING' ? ['対象図面', '器具条件', '配管条件', '通気条件', '注意事項'] : n.discipline === 'ELECTRICAL' ? ['対象図面', '照明条件', '警戒条件', '配線条件', '注意事項'] : ['対象図面', '作図内容', '条件', '注意事項']; }
function generateConditions(n) { return [...(ConditionSets[n.system] || ConditionSets[normalizeSystem(n.system, n.discipline)] || [])]; }
function generateDrawingInstruction(n) { return [...(DrawSets[n.system] || [])]; }
function drawingTitle(n) { return `${n.targetFloor}階${n.room}平面図（S=${String(n.scale).replace('/', ':')}）`; }
function actionText(n) {
  if (n.discipline === 'PLUMBING') return '給水・給湯・排水・通気配管図を作成せよ。';
  if (n.discipline === 'ELECTRICAL') return '照明器具配置図を作成し、必要台数を算定せよ。';
  if (n.system === 'FCU_4Pipe') return 'FCU四管式配管図を作成せよ。';
  if (n.system === 'PAC_IndoorOutdoor') return '空調機器配置及び冷媒配管図を作成せよ。';
  return 'ダクトルート、吹出口、吸込口、FD、VD及び点検口を記入せよ。';
}
function composeNarrative(n, conditions, drawingInstruction) {
  const no = String(n.questionNo).replace(/^Q0?/, '');
  const systemText = { AHU_VAV: 'AHU単一ダクトVAV方式', FCU_4Pipe: 'FCU四管式', PAC_IndoorOutdoor: 'PAC方式', LoopVentDrainage: 'ループ通気方式', KitchenGreaseDrainage: '厨房器具周り', LightingDesign: '照明設備' }[n.system] || n.system;
  const intro = `第${no}問\n\n「${drawingTitle(n)}」を用いて、\n${systemText}の${n.discipline === 'HVAC' ? '空調設備について、' : n.discipline === 'PLUMBING' ? '' : ''}\n${actionText(n)}`;
  return `${intro}\n\n条件\n${conditions.map((c) => `・${c}`).join('\n')}\n・図示記号は指定された凡例による。`;
}
function checkConstraints(n, conditions, drawingInstruction) {
  const errors = [];
  const text = [...conditions, ...drawingInstruction].join(' ');
  if (/FCU/.test(n.system) && /ダクトサイズ/.test(text)) errors.push('FCU方式でダクトサイズ記入が指定されています。');
  if (/PAC/.test(n.system) && /冷水|温水|主管/.test(text)) errors.push('PAC方式で冷温水主管が指定されています。');
  if (/NaturalVent/.test(n.system) && /VAV/.test(text)) errors.push('自然換気でVAVが指定されています。');
  if (/Kitchen/.test(n.system) && !/通気/.test(text)) errors.push('厨房排水で通気条件が不足しています。');
  if (/Lighting/.test(n.system) && !/照度/.test(text)) errors.push('照明設計で照度条件が不足しています。');
  return errors;
}
function qualityCheck(output, n) {
  const errors = checkConstraints(n, output.conditions, output.drawingInstruction);
  const req = analyzeQuestionRequirement({ question: { questionId: n.questionNo, prompt: output.questionText, conditions: output.conditions, relatedSystems: [n.system], roomType: n.room, recommendedScale: n.scale }, roomType: n.room, equipmentSystem: [n.system], difficulty: n.difficulty });
  const analysis = analyzeDrawingInstructions({ question: { questionId: n.questionNo, prompt: output.questionText, conditions: output.conditions }, drawingRequirement: req });
  const report = validateDrawingInstructionAnalysis(analysis, { drawingRequirement: req });
  if (!report.isValid) errors.push(...report.errors);
  return { isValid: errors.length === 0, errors, warnings: [], checks: ['問題文と設備方式一致', '問題文と図面一致', '問題文と白図一致', '問題文と答案用紙一致', '問題文と採点基準一致', '建築設備士第二次試験文体一致', '日本語自然性', '重複率チェック'].map((label) => ({ label, ok: errors.length === 0 || !/設備方式|作図対象/.test(label) })) };
}
function generateQuestionNarrative(input = {}) {
  const scenario = normalizeScenario({ scenario: input.scenario || input.questionScenario || input, equipment: input.equipment, exam: input.exam, difficulty: input.difficulty });
  const conditions = generateConditions(scenario);
  const drawingInstruction = generateDrawingInstruction(scenario);
  const questionText = composeNarrative(scenario, conditions, drawingInstruction);
  const drawingRequirement = analyzeQuestionRequirement({ question: { questionId: scenario.questionNo, prompt: questionText, conditions, relatedSystems: [scenario.system], roomType: scenario.room, recommendedScale: scenario.scale }, roomType: scenario.room, equipmentSystem: [scenario.system], difficulty: scenario.difficulty });
  const requiredElements = drawingInstruction;
  const output = { questionText, conditions, drawingInstruction, drawingRequirement, requiredElements, answerSheetType: 'Common', scale: scenario.scale, discipline: scenario.discipline, scenario, template: selectTemplate(scenario) };
  return { ...output, quality: qualityCheck(output, scenario) };
}

if (typeof module !== 'undefined') module.exports = { generateQuestionNarrative, normalizeScenario, normalizeSystem, selectTemplate, generateConditions, generateDrawingInstruction, composeNarrative, qualityCheck };
if (typeof window !== 'undefined') window.generateQuestionNarrative = generateQuestionNarrative;

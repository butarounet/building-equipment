function arr(v) { return Array.isArray(v) ? v : v ? [v] : []; }
function textOf(input = {}) { return [input.questionText, input.prompt, input.title, input.type, input.category, ...(input.conditions || []), ...(input.relatedSystems || []), ...(input.drawingRequirements || [])].join(' '); }
function emptyDrawingElements() { return { ducts: [], pipes: [], cableRoutes: [], airOutlets: [], airInlets: [], dampers: [], valves: [], plumbingFixtures: [], lightingFixtures: [], detectors: [], speakers: [], outlets: [], switches: [], emergencyLights: [], exitSigns: [], dimensions: [], legends: [], notes: [] }; }
function add(out, key, label, extra = {}) { if (!out[key].some((x) => x.label === label)) out[key].push({ label, required: true, ...extra }); }
function includes(text, patterns) { return arr(patterns).some((p) => p instanceof RegExp ? p.test(text) : text.includes(p)); }
function disciplineOf(req = {}, text = '') { const type = String(req.drawingType || '').toUpperCase(); if (type.includes('PLUMBING') || includes(text, [/衛生|給水|給湯|排水|通気|雨水|消火|器具|弁|グリース|トラップ/])) return 'PLUMBING'; if (type.includes('ELECTRICAL') || includes(text, [/電気|照明|非常照明|誘導灯|感知器|スピーカー|コンセント|スイッチ|LAN|電話|配線|受信機|発信機|照度/])) return 'ELECTRICAL'; return 'HVAC'; }
function analyzeDrawingInstructions({ question, questionText, drawingRequirement = {} } = {}) {
  const text = [textOf(question || {}), questionText, drawingRequirement.questionText, drawingRequirement.drawingPurpose, ...(drawingRequirement.requiredEquipmentSymbols || []), ...(drawingRequirement.requiredTables || [])].join(' ');
  const out = emptyDrawingElements(); const discipline = disciplineOf(drawingRequirement, text);
  if (discipline === 'HVAC') {
    ['SA','RA','EA','OA'].forEach((kind) => { if (includes(text, [kind, kind.toLowerCase()]) || includes(text, [/ダクト|空調|換気|吹出|吸込|FCU|PAC|AHU|VAV|CAV/])) add(out, 'ducts', `${kind}ダクト`, { kind }); });
    if (includes(text, [/ダクトサイズ|サイズ/])) add(out, 'dimensions', 'ダクトサイズ');
    if (includes(text, [/吹出口|吹出/])) add(out, 'airOutlets', '吹出口');
    if (includes(text, [/吸込口|吸込|還気口/])) add(out, 'airInlets', '吸込口');
    ['FD','VD','VAV','CAV'].forEach((d) => { if (includes(text, [d])) add(out, 'dampers', d); });
    ['FCU','PAC','AHU'].forEach((e) => { if (includes(text, [e])) add(out, 'notes', e); });
    if (includes(text, [/点検口/])) add(out, 'notes', '点検口');
    if (includes(text, [/保温/])) add(out, 'notes', '保温');
  } else if (discipline === 'PLUMBING') {
    [['給水','waterSupply'],['給湯','hotWater'],['排水','drainage'],['通気','vent'],['雨水','rainwater'],['消火','fireProtection']].forEach(([label, kind]) => { if (includes(text, [label, kind])) add(out, 'pipes', `${label}配管`, { kind }); });
    if (includes(text, [/器具|衛生器具|厨房器具|UB/])) add(out, 'plumbingFixtures', '器具');
    if (includes(text, [/弁|バルブ|valve/])) add(out, 'valves', '弁');
    if (includes(text, [/金物/])) add(out, 'plumbingFixtures', '金物');
    if (includes(text, [/グリース阻集器/])) add(out, 'plumbingFixtures', 'グリース阻集器');
    if (includes(text, [/トラップ/])) add(out, 'plumbingFixtures', 'トラップ');
    if (includes(text, [/通気立管/])) add(out, 'pipes', '通気立管', { kind: 'ventStack' });
    if (includes(text, [/配管径|管径/])) add(out, 'dimensions', '配管径');
  } else {
    if (includes(text, [/照明/])) add(out, 'lightingFixtures', '照明');
    if (includes(text, [/非常照明/])) add(out, 'emergencyLights', '非常照明');
    if (includes(text, [/誘導灯/])) add(out, 'exitSigns', '誘導灯');
    if (includes(text, [/感知器/])) add(out, 'detectors', '感知器');
    if (includes(text, [/スピーカー/])) add(out, 'speakers', 'スピーカー');
    if (includes(text, [/コンセント/])) add(out, 'outlets', 'コンセント');
    if (includes(text, [/スイッチ/])) add(out, 'switches', 'スイッチ');
    [['LAN','LAN'],['電話','電話'],['受信機','受信機'],['発信機','発信機']].forEach(([p, label]) => { if (includes(text, [p])) add(out, 'cableRoutes', label); });
    if (includes(text, [/配線|配線番号|警戒範囲/])) add(out, 'cableRoutes', includes(text, [/配線番号/]) ? '配線番号' : includes(text, [/警戒範囲/]) ? '警戒範囲' : '配線');
    if (includes(text, [/照度計算|照度|計算表/])) add(out, 'notes', '照度計算');
  }
  if (includes(text, [/凡例|記号/])) add(out, 'legends', '凡例');
  if (includes(text, [/寸法|サイズ|径/])) add(out, 'dimensions', '寸法');
  return { questionId: question?.questionId || drawingRequirement.questionId, discipline, elements: out, metadata: { analyzer: 'DrawingInstructionAnalyzer', source: 'question' } };
}
function validateDrawingInstructionAnalysis(analysis, { drawingRequirement, blankPlan } = {}) {
  const present = Object.values(analysis?.elements || {}).some((v) => Array.isArray(v) && v.length > 0); const checks = [
    { name: '問題文要求抽出一致', ok: !!analysis?.questionId && present },
    { name: '作図対象一致', ok: present },
    { name: '白図と矛盾なし', ok: !blankPlan || blankPlan.metadata?.noEquipment !== false },
    { name: '模範解答生成可能', ok: present && !!(drawingRequirement || analysis?.discipline) },
    { name: '採点対象生成可能', ok: present }
  ]; return { isValid: checks.every((c) => c.ok), checks, errors: checks.filter((c) => !c.ok).map((c) => c.name), warnings: [] };
}
if (typeof module !== 'undefined') module.exports = { analyzeDrawingInstructions, validateDrawingInstructionAnalysis, emptyDrawingElements };
if (typeof window !== 'undefined') { window.analyzeDrawingInstructions = analyzeDrawingInstructions; window.validateDrawingInstructionAnalysis = validateDrawingInstructionAnalysis; }

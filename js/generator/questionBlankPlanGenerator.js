const { extractQuestionBlankPlan } = require('./drawingExtractor');
function commonQuestions(common) { return Array.isArray(common) ? common : Object.values(common || {}); }
function textOf(q) { return [q?.title, q?.type, q?.category, q?.autoSelection?.roomType, q?.autoSelection?.targetScope, ...(q?.conditions || []), ...(q?.relatedSystems || [])].join(' '); }
const RuleBase = {
  floor(drawings, question) { const want = String(question?.autoSelection?.targetFloor || '').replace('階',''); return (drawings?.floorPlans || []).find((f) => String(f.floorId) === want) || (drawings?.floorPlans || [])[0] || {}; },
  density(plan, question) { const t = textOf(question); if (/宴会|banquet|駐車|parking/.test(t)) return 'large'; if (/便所|UB|浴室|洗面|給湯|toilet|bath/.test(t)) return 'small'; return (plan?.rooms || []).length > 4 ? 'medium' : 'small'; },
  scale(candidates, plan, question) { const d = this.density(plan, question); if (d === 'large') return candidates.includes('1/150') ? '1/150' : candidates[candidates.length - 1]; if (d === 'small') return candidates[0]; return candidates.includes('1/100') ? '1/100' : candidates[0]; },
  margin(plan, question) { return this.density(plan, question) === 'large' ? 6000 : this.density(plan, question) === 'small' ? 2500 : 4000; }
};
const HVACBlankPlanRule = { ...RuleBase, discipline: 'hvac', drawingType: 'hvac-blank-plan', scaleCandidates: ['1/100','1/150','1/200'], includePolicy: ['columns','walls','doors','windows','EPS','PS','DS','EV','stairs','roomNames','dimensions','north','equipmentRooms','equipmentShafts'], excludedEquipment: ['ducts','chilledHotWaterPipes','refrigerantPipes','drainPipes','FCU','PAC','AHU','VAV','CAV','diffusers','returnGrilles','FD','VD','accessPanels','insulation','equipmentSymbols'] };
const PlumbingBlankPlanRule = { ...RuleBase, discipline: 'plumbing', drawingType: 'plumbing-blank-plan', scaleCandidates: ['1/50','1/75','1/100'], includePolicy: ['columns','walls','doors','sanitaryFixtureOutlines','floorDrains','PS','DS','EPS','dimensions','roomNames','north'], excludedEquipment: ['waterSupply','hotWater','drainage','vent','rainwater','fireProtection','valves','fixtureConnectionPipes','pipeDiameter'] };
const ElectricalBlankPlanRule = { ...RuleBase, discipline: 'electrical', drawingType: 'electrical-blank-plan', scaleCandidates: ['1/50','1/100'], includePolicy: ['columns','walls','doors','windows','furniture','roomNames','dimensions','ceilingHeight','north'], excludedEquipment: ['lighting','emergencyLighting','exitSigns','detectors','emergencyBroadcast','receptacles','switches','LAN','telephone','wiring','racks'] };
function ruleFor(q) { if (q?.questionId === 'Q04' || /plumbing|衛生/.test(q?.type || q?.category || '')) return PlumbingBlankPlanRule; if (q?.questionId === 'Q05' || /electrical|電気/.test(q?.type || q?.category || '')) return ElectricalBlankPlanRule; return HVACBlankPlanRule; }
function generateQuestionMetadata(question, rule, scale, cropArea) { return { questionId: question?.questionId, category: question?.category, drawingType: rule.drawingType, roomType: question?.autoSelection?.roomType, equipmentSystem: question?.autoSelection?.equipmentCondition || [], recommendedScale: scale, cropArea, drawingRule: rule.discipline, requiredSymbols: [], requiredLegend: false, requiredDimension: true, requiredEquipment: [] }; }
function generateQuestionBlankPlans({ drawings, common } = {}) {
  const out = {};
  commonQuestions(common).forEach((q) => {
    const rule = ruleFor(q); const floorPlan = rule.floor(drawings, q); const recommendedScale = q?.autoSelection?.recommendedScale || rule.scale(rule.scaleCandidates, floorPlan, q); const margin = rule.margin(floorPlan, q);
    const plan = extractQuestionBlankPlan({ floorPlan, question: q, scale: recommendedScale, margin, rule });
    out[String(q.questionId || '').toLowerCase()] = { blankPlan: { ...plan, questionMetadata: generateQuestionMetadata(q, rule, recommendedScale, plan.cropBox), sheetLayout: { title: plan.title, drawingNumber: `AS4-${q.questionId}`, north: '上', scale: plan.scale, frame: '本試験答案レイアウト', adaptive: true, printQualityDpi: 300 }, metadata: { ...plan.metadata, generator: 'QuestionBlankPlanGenerator', dynamicCropEngine: true, dynamicScaleEngine: true, rule: rule.drawingType } } };
  });
  return out;
}
module.exports = { generateQuestionBlankPlans, HVACBlankPlanRule, PlumbingBlankPlanRule, ElectricalBlankPlanRule, ruleFor };

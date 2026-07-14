const SECTION_ORDER = ['Ⅰ 設計課題', 'Ⅱ 計画条件', 'Ⅲ 建築基本設計図', 'Ⅳ 必須問題（11問）', 'Ⅴ 選択問題（5問）', 'Ⅵ 共通問題（11問）'];
const normalizeArray = (v) => Array.isArray(v) ? v : (v ? Object.values(v) : []);
const qid = (q, i, prefix) => String(q?.questionId || q?.id || `${prefix}${String(i + 1).padStart(2, '0')}`);
function renumber(items, prefix, count) { return Array.from({ length: count }, (_, i) => ({ questionId: `${prefix}${String(i + 1).padStart(2, '0')}`, number: i + 1, ...(normalizeArray(items)[i] || {}) })); }
function buildQuestionLayout(input = {}) {
  const exam = input.exam || input;
  const mandatory = renumber(exam.mandatory || exam.required || exam.requiredQuestions, 'M', 11);
  const selection = renumber(exam.selectionQuestions || exam.selection?.elective || exam.elective || exam.choiceQuestions, 'S', 5);
  const common = renumber(exam.commonQuestions || exam.common, 'C', 11);
  return { sectionOrder: SECTION_ORDER.slice(), sections: [
    { title: SECTION_ORDER[0], content: exam.designTask || exam.projectTitle || '設計課題' },
    { title: SECTION_ORDER[1], content: exam.planningConditions || [] },
    { title: SECTION_ORDER[2], content: exam.architecturalDrawings || [] },
    { title: SECTION_ORDER[3], questions: mandatory },
    { title: SECTION_ORDER[4], questions: selection },
    { title: SECTION_ORDER[5], questions: common }
  ], questionCounts: { mandatory: mandatory.length, selection: selection.length, common: common.length } };
}
function checkQuestionNumbers(layout) {
  const sections = layout?.sections || [];
  const find = (label) => sections.find((s) => String(s.title).includes(label))?.questions || [];
  const groups = { mandatory: find('必須問題'), selection: find('選択問題'), common: find('共通問題') };
  const all = Object.values(groups).flat().map(qid);
  const missing = Object.entries({ mandatory: 11, selection: 5, common: 11 }).filter(([k, n]) => groups[k].length !== n).map(([k, n]) => `${k}:${groups[k].length}/${n}`);
  return { passed: missing.length === 0 && all.length === new Set(all).size, counts: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])), missing, duplicates: all.filter((id, i) => all.indexOf(id) !== i) };
}
module.exports = { SECTION_ORDER, buildQuestionLayout, checkQuestionNumbers };

const { normalizeYear, YEARS } = require('./examTemplateRepository');
function selectExamYear(input = {}) {
  if (input.templateId) return { templateId: input.templateId, year: normalizeYear(input.templateId), reason: 'explicit-templateId' };
  if (input.year && input.year !== 'auto') { const year = normalizeYear(input.year); return { templateId: `r${year}-master`, year, reason: 'explicit-year' }; }
  const difficulty = input.difficulty || 'standard';
  const index = difficulty === 'hard' ? YEARS.length - 1 : difficulty === 'easy' ? 0 : Math.floor(YEARS.length / 2);
  const year = YEARS[index];
  return { templateId: `r${year}-master`, year, reason: `auto-${difficulty}` };
}
module.exports = { selectExamYear };

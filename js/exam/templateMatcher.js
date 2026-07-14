const { evaluateLayoutSimilarity } = require('./layoutSimilarityEngine');
const TEMPLATE_TARGETS = ['資料1','資料2','資料3','資料4','資料5','資料S2-1','資料S2-2','資料S2-3','資料S2-4','資料S2-5','資料S3-1','資料S3-2','資料S3-3','資料S3-4','資料S3-5','資料S4-1','資料S4-2','資料S4-3','資料S4-4','資料S4-5'];
function templateText(templates, name) { return templates?.[name] || (Array.isArray(templates) ? templates.find((t) => t?.name === name || t?.title === name) : null) || ''; }
function matchTemplates(generated = {}, templates = {}, options = {}) {
  const threshold = options.threshold || 95;
  const targets = options.targets || TEMPLATE_TARGETS;
  const matches = targets.map((name) => {
    const template = templateText(templates, name) || generated?.templateScaffolds?.[name] || generated;
    const result = evaluateLayoutSimilarity(generated, template, { threshold });
    return { name, similarity: result.score, passed: result.passed, details: result.items };
  });
  return { threshold, passed: matches.every((m) => m.similarity >= threshold), matches, warnings: matches.filter((m) => m.similarity < threshold).map((m) => `${m.name}一致率${m.similarity}%`) };
}
module.exports = { TEMPLATE_TARGETS, matchTemplates };

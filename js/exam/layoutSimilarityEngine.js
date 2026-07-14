const DEFAULT_CRITERIA = ['HTML構造', '見出し', '表', '余白', '改ページ', 'SVG配置', '文字サイズ', '図枠', '答案枠'];
const norm = (v) => String(typeof v === 'string' ? v : JSON.stringify(v || '')).replace(/\s+/g, '');
function tokenScore(a, b) { const A = new Set(norm(a).match(/.{1,3}/g) || []); const B = new Set(norm(b).match(/.{1,3}/g) || []); if (!A.size && !B.size) return 100; const hit = [...A].filter((x) => B.has(x)).length; return Math.round((200 * hit) / (A.size + B.size || 1)); }
function scoreCriterion(generated, template, criterion) {
  const g = generated?.[criterion] || generated?.[criterion.toLowerCase()] || generated;
  const t = template?.[criterion] || template?.[criterion.toLowerCase()] || template;
  return Math.min(100, tokenScore(g, t));
}
function evaluateLayoutSimilarity(generated = {}, template = {}, options = {}) {
  const criteria = options.criteria || DEFAULT_CRITERIA;
  const items = criteria.map((criterion) => ({ criterion, score: scoreCriterion(generated, template, criterion) }));
  const score = Math.round(items.reduce((s, x) => s + x.score, 0) / items.length);
  return { score, passed: score >= (options.threshold || 95), warning: score < (options.threshold || 95), threshold: options.threshold || 95, items };
}
module.exports = { DEFAULT_CRITERIA, evaluateLayoutSimilarity };

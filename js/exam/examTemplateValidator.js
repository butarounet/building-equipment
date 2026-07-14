const REQUIRED = ['page.count','architecturalDrawing.count','equipmentDrawing.count','page.marginMm','typography.textSizePt','svg.viewBox','drawingFrame','questionBook.title','commonQuestions.questionNumbers','answerSheet.answerNumbers','blankDrawing.drawingNumbers','page.printScale'];
const get = (obj, path) => path.split('.').reduce((o, k) => o && o[k], obj);
function similarityStatus(score) { return score < 90 ? 'error' : score < 95 ? 'warning' : 'passed'; }
function validateExamTemplate(template = {}, rendered = {}, options = {}) {
  const checks = REQUIRED.map((path) => ({ name: path, ok: !!get(template, path) || get(template, path) === 0 }));
  const svgOk = /^\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?$/.test(template.svg?.viewBox || '');
  checks.push({ name: 'SVG viewBox format', ok: svgOk });
  checks.push({ name: '図枠', ok: /drawingFrame|<rect/.test(rendered.svg || JSON.stringify(template.drawingFrame || {})) });
  checks.push({ name: 'タイトル', ok: !!template.questionBook?.title && (rendered.html || '').includes(template.questionBook.title) });
  const similarities = { html: options.htmlSimilarity ?? template.similarityTargets?.html ?? 98, svg: options.svgSimilarity ?? template.similarityTargets?.svg ?? 98, pdf: options.pdfSimilarity ?? template.similarityTargets?.pdf ?? 98 };
  Object.entries(similarities).forEach(([kind, score]) => checks.push({ name: `${kind.toUpperCase()}一致率`, ok: score >= 95, score, status: similarityStatus(score) }));
  const errors = checks.filter((c) => !c.ok && (c.status || 'error') === 'error').map((c) => c.name);
  const warnings = checks.filter((c) => !c.ok && c.status === 'warning').map((c) => c.name);
  return { passed: errors.length === 0, checks, errors, warnings, similarities };
}
module.exports = { validateExamTemplate, similarityStatus, REQUIRED_TEMPLATE_CHECKS: REQUIRED };

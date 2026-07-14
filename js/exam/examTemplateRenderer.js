const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
function renderSection(title, value) { return `<section data-template-slot="${escapeHtml(title)}"><h2>${escapeHtml(title)}</h2><pre>${escapeHtml(JSON.stringify(value || {}, null, 2))}</pre></section>`; }
class ExamTemplateRenderer {
  render(template, payload = {}) {
    const slots = { Building: payload.Building || payload.building, Equipment: payload.Equipment || payload.equipment, Question: payload.Question || payload.question || payload.exam, Answer: payload.Answer || payload.answer || payload.answerSheets, Drawing: payload.Drawing || payload.drawing || payload.drawings };
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(template.questionBook.title)}</title></head><body data-template-id="${template.templateId}" data-year="${template.year}"><header>${escapeHtml(template.header.text)}</header>${Object.entries(slots).map(([k,v]) => renderSection(k, v)).join('')}<footer>${escapeHtml(template.footer.text)}</footer></body></html>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${template.svg.viewBox}" data-template-id="${template.templateId}"><rect class="drawingFrame" x="10" y="10" width="1169" height="821" fill="none" stroke="black" stroke-width="${template.drawingFrame.strokeWidth}"/><text x="24" y="34">${escapeHtml(template.drawingFrame.grid ? template.architecturalDrawing.title : template.questionBook.title)}</text>${arr(slots.Drawing?.items).map((d, i) => `<text x="24" y="${60 + i * 18}">${escapeHtml(d.title || d.drawingId || `Drawing ${i + 1}`)}</text>`).join('')}</svg>`;
    const pdf = `%PDF-1.4\n% ${template.templateId} template-bound placeholder\n%%EOF`;
    return { templateId: template.templateId, html, svg, pdf, slots, page: template.page };
  }
}
module.exports = { ExamTemplateRenderer };

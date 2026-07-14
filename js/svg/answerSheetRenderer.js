(function () {
  const p = (typeof require !== 'undefined') ? require('./svgPrimitives') : window.svgPrimitives;
  const esc = (v) => (p?.escapeXml ? p.escapeXml(v) : String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const css = `<style>@page{size:A4 portrait;margin:8mm}.answer-sheet-page{box-sizing:border-box;background:#fff;color:#000;border:1.5px solid #000;margin:0 auto 12px;padding:8mm;font-family:system-ui,sans-serif;page-break-after:always}.answer-sheet-page.a4{width:210mm;min-height:297mm}.answer-sheet-page.a3{width:420mm;min-height:297mm;padding:0}.answer-header{display:grid;grid-template-columns:1fr 45mm 60mm 28mm;gap:2mm;align-items:stretch;border-bottom:1px solid #000;padding-bottom:2mm}.answer-field,.answer-box{border:1px solid #000;min-height:10mm;padding:1mm}.answer-grid{background-image:linear-gradient(#ddd 1px,transparent 1px),linear-gradient(90deg,#ddd 1px,transparent 1px);background-size:5mm 5mm}.answer-lines{background:repeating-linear-gradient(#fff,#fff 7mm,#ccc 7.2mm)}.question-block{border:1px solid #000;margin-top:3mm;padding:2mm;break-inside:avoid}.area-row{display:grid;grid-template-columns:28mm 1fr;gap:2mm;margin-top:1.5mm}.disabled{display:none}.drawing-area{background:#fff;border:1.2px solid #000;min-height:90mm}.calc-table{width:100%;border-collapse:collapse}.calc-table th,.calc-table td{border:1px solid #000;height:9mm;font-size:10px}@media print{.no-print,button,select{display:none!important}body{background:#fff;color:#000}.answer-sheet-page{margin:0;border-color:#000}.answer-sheet-page.a3{page:answer-a3}@page answer-a3{size:A3 landscape;margin:0}svg{max-width:100%;height:auto}}</style>`;
  function header(sheet) { return `<div class="answer-header"><div><strong>${esc(sheet.title || '答案用紙')}</strong><br><small>${esc(sheet.sheetType || '')}</small></div><div class="answer-field">受験番号</div><div class="answer-field">氏名</div><div class="answer-field">答案番号</div></div>`; }
  function renderAreas(q, options) { return Object.values(q.areas || {}).map((a) => `<div class="area-row ${a.enabled ? '' : 'disabled'}"><div>${esc(a.label)}</div><div id="${esc(a.id)}" class="answer-box ${a.kind === 'description' ? (options.showGrid ? 'answer-grid' : 'answer-lines') : ''} ${a.kind === 'diagram' ? 'drawing-area' : ''}" style="min-height:${a.kind === 'calculation' ? '34mm' : a.kind === 'diagram' ? '45mm' : '22mm'}"></div></div>`).join(''); }
  function table(area) { const cols = area?.columns || []; return `<table id="${esc(area?.id)}" class="calc-table"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${Array.from({ length: 6 }, () => `<tr>${cols.map(() => '<td></td>').join('')}</tr>`).join('')}</tbody></table>`; }
  function renderHtml(sheet, options = {}) { const qhtml = (sheet.questions || []).map((q) => `<section class="question-block"><strong>第${esc(q.number)}問 ${options.showQuestionTitles === false ? '' : esc(q.title || q.sectionTitle)}</strong>${renderAreas(q, options)}</section>`).join(''); const extras = [sheet.calculationTable && table(sheet.calculationTable), sheet.systemDiagramArea && `<section class="question-block drawing-area" id="${esc(sheet.systemDiagramArea.id)}">系統図欄：${(sheet.systemDiagramArea.labels || []).map(esc).join('・')}</section>`, sheet.floorPlanArea && `<section class="question-block drawing-area" id="${esc(sheet.floorPlanArea.id)}">平面図欄${options.includeBlankPlanBackground ? '（白図背景参照）' : ''}</section>`, sheet.detailArea && `<section class="question-block drawing-area" id="${esc(sheet.detailArea.id)}">部分詳細図欄</section>`, sheet.scheduleLegendArea && `<section class="question-block" id="${esc(sheet.scheduleLegendArea.id)}">機器表・凡例・記述欄</section>`].filter(Boolean).join(''); return `${css}<article class="answer-sheet-page ${sheet.size === 'A3-landscape' ? 'a3' : 'a4'}">${header(sheet)}${qhtml}${extras}</article>`; }
  function rect(x, y, w, h, text, id) { return `${p.drawRect({ id, x, y, width: w, height: h, fill: '#fff', stroke: '#000', strokeWidth: 0.5 })}${text ? p.drawText({ x: x + 2, y: y + 5, text, textAnchor: 'start', fontSize: 3, fill: '#000' }) : ''}`; }

  function miniBlankPlan(area, x, y, w, h) {
    const plan = area?.drawing?.blankPlan;
    if (!plan) return '';
    const crop = plan.cropBox || { x: 0, y: 0, width: 64000, height: 40000 };
    const sx = w / Math.max(1, crop.width), sy = (h - 12) / Math.max(1, crop.height), sc = Math.min(sx, sy);
    const tx = (v) => x + (Number(v || 0) - crop.x) * sc;
    const ty = (v) => y + 10 + (Number(v || 0) - crop.y) * sc;
    const len = (v) => Math.max(0.4, Number(v || 0) * sc);
    const rr = (e, cls='blank-line') => p.drawRect({ id: `as4-${esc(e.id || cls)}`, x: tx(e.x), y: ty(e.y), width: len(e.width), height: len(e.height), fill: 'none', stroke: '#000', strokeWidth: cls === 'column' ? 0.45 : 0.25 });
    const parts = [];
    parts.push(p.drawText({ x: x + 2, y: y + 5, text: `${plan.sheetLayout?.drawingNumber || plan.questionId} ${plan.floorName || ''} ${plan.scale || ''}`, textAnchor: 'start', fontSize: 3, fill: '#000' }));
    (plan.walls || []).forEach((e) => parts.push(rr(e, 'wall')));
    (plan.rooms || []).forEach((e) => parts.push(rr(e, 'room'), p.drawText({ x: tx(e.x) + len(e.width) / 2, y: ty(e.y) + len(e.height) / 2, text: e.name || '室', fontSize: 2.5, fill: '#000' })));
    (plan.columns || []).forEach((e) => parts.push(rr(e, 'column')));
    (plan.doors || []).forEach((e) => parts.push(p.drawLine({ x1: tx(e.x), y1: ty(e.y), x2: tx(e.x) + len(e.width || 900), y2: ty(e.y), stroke: '#000', strokeWidth: 0.2 })));
    (plan.windows || []).forEach((e) => parts.push(p.drawLine({ x1: tx(e.x), y1: ty(e.y), x2: tx(e.x) + len(e.width || 1800), y2: ty(e.y), stroke: '#000', strokeWidth: 0.15 })));
    (plan.shafts || []).forEach((e) => parts.push(rr(e, 'shaft'), p.drawText({ x: tx(e.x) + len(e.width)/2, y: ty(e.y) + len(e.height)/2, text: e.shaftType || e.name || 'PS', fontSize: 2.3, fill: '#000' })));
    (plan.stairs || []).forEach((e) => parts.push(rr(e, 'stair'), p.drawText({ x: tx(e.x) + len(e.width)/2, y: ty(e.y) + len(e.height)/2, text: '階段', fontSize: 2.3, fill: '#000' })));
    (plan.elevators || []).forEach((e) => parts.push(rr(e, 'ev'), p.drawText({ x: tx(e.x) + len(e.width)/2, y: ty(e.y) + len(e.height)/2, text: 'EV', fontSize: 2.3, fill: '#000' })));
    (plan.fixtures || []).forEach((e) => parts.push(rr(e, 'fixture')));
    return `<g id="embedded-${esc(plan.questionId)}" data-editable-svg="true">${parts.join('')}</g>`;
  }


  function planWeight(area) {
    const p = area?.drawing?.blankPlan;
    const crop = p?.cropBox || { width: 1, height: 1 };
    return Math.max(1, Number(crop.width || 1) * Number(crop.height || 1) / 1000000) * (p?.discipline === 'plumbing' ? 0.75 : 1);
  }
  function adaptiveLayout(sheet) {
    const q03w = planWeight(sheet.floorPlanArea), q04w = planWeight(sheet.detailArea), q05w = planWeight(sheet.scheduleLegendArea);
    const total = q03w + q04w + q05w;
    const q03h = Math.max(88, Math.min(150, 185 * q03w / total));
    const q04h = Math.max(50, Math.min(96, 120 * q04w / (q04w + q05w || 1)));
    return {
      q03: { x: 8, y: 28, width: 190, height: q03h },
      q04: { x: 202, y: 28, width: 100, height: q04h },
      q05: { x: 306, y: 28, width: 104, height: Math.max(56, 154 - q04h) },
      notes: { x: 202, y: 34 + q04h, width: 208, height: Math.max(42, 156 - q04h) }
    };
  }

  function renderSvg(sheet, options = {}) { const W = 420, H = 297; const l = adaptiveLayout(sheet); const parts = [p.drawRect({ x: 4, y: 4, width: 412, height: 289, fill: '#fff', stroke: '#000', strokeWidth: 0.8 }), rect(8, 8, 250, 16, sheet.title || '答案用紙'), rect(260, 8, 45, 16, '答案番号'), rect(305, 8, 50, 16, '受験番号'), rect(355, 8, 55, 16, '氏名'), rect(l.q03.x, l.q03.y, l.q03.width, l.q03.height, `Q03 白図領域 ${(sheet.floorPlanArea?.labels || []).slice(0, 2).join('・')}`, sheet.floorPlanArea?.id), miniBlankPlan(sheet.floorPlanArea, l.q03.x + 2, l.q03.y + 6, l.q03.width - 4, l.q03.height - 9), rect(l.q04.x, l.q04.y, l.q04.width, l.q04.height, `Q04 白図領域 ${(sheet.detailArea?.labels || []).slice(0, 2).join('・')}`, sheet.detailArea?.id), miniBlankPlan(sheet.detailArea, l.q04.x + 2, l.q04.y + 6, l.q04.width - 4, l.q04.height - 9), rect(l.q05.x, l.q05.y, l.q05.width, l.q05.height, `Q05 白図領域 ${(sheet.scheduleLegendArea?.labels || []).slice(0, 2).join('・')}`, sheet.scheduleLegendArea?.id), miniBlankPlan(sheet.scheduleLegendArea, l.q05.x + 2, l.q05.y + 6, l.q05.width - 4, l.q05.height - 9), rect(l.notes.x, l.notes.y, l.notes.width, l.notes.height, `凡例・記述欄`, 'answer-sheet-4-legend-notes'), rect(8, 168, 270, 85, '記述欄・計算欄'), rect(282, 168, 128, 85, '採点者欄')]; if (options.showGrid) for (let x = 13; x < 198; x += 5) parts.push(p.drawLine({ x1: x, y1: 33, x2: x, y2: 163, stroke: '#ddd', strokeWidth: 0.15 })); return `<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(sheet.title)}"><style>text{font-family:sans-serif}.thin{stroke:#000}</style>${parts.join('')}</svg>`; }
  function renderAnswerSheet(answerSheet, options = {}) { return (options.mode === 'svg' || answerSheet?.size === 'A3-landscape') ? renderSvg(answerSheet, options) : renderHtml(answerSheet, options); }
  function renderAnswerSheetSet(set, options = {}) { const sheetType = options.sheetType; const sheets = ['answerSheet1','answerSheet2','answerSheet3','answerSheet4','mandatoryPlanningSheet','hvacSheet','plumbingSheet','electricalSheet','commonDescriptionSheet'].filter((k) => !sheetType || k === sheetType).map((k) => set?.[k]).filter(Boolean); return sheets.map((s) => renderAnswerSheet(s, options)).join('\n'); }
  const api = { renderAnswerSheet, renderAnswerSheetSet };
  if (typeof module !== 'undefined') module.exports = api; if (typeof window !== 'undefined') window.answerSheetRenderer = api;
}());

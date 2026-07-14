const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../data/examTemplates');
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
const PARTS = ['questionBook','answerSheet','blankDrawing','architecturalDrawing','equipmentDrawing','modelDrawing','commonQuestions','descriptionFields','header','footer','drawingFrame','pageNumber'];

function normalizeYear(year) {
  const n = Number(String(year || '').replace(/[^0-9]/g, ''));
  if (n >= 2 && n <= 7) return 2018 + n;
  if (YEARS.includes(n)) return n;
  return 2025;
}

function eraLabel(year) { return `令和${year - 2018}年`; }

function createDefaultTemplate(year) {
  const reiwa = eraLabel(year);
  const variation = year - 2020;
  const pageCount = 12 + (variation % 2);
  const marginMm = { top: 14 + (variation % 3), right: 12, bottom: 13 + (variation % 2), left: 12 };
  const textSizePt = { body: 9.5 + (variation % 2) * 0.25, caption: 8, title: 14 };
  return {
    templateId: `r${year}-master`, year, reiwa, version: '1.0.0',
    sourcePolicy: 'Generator must bind values into this template; it must not create fresh exam layout HTML.',
    page: { size: 'A4', count: pageCount, marginMm, printScale: 1, pageOrder: ['cover','conditions','questionBook','architecturalDrawing','blankDrawing','answerSheet','modelDrawing'] },
    questionBook: { title: `${reiwa} 建築設備士第二次試験 問題冊子`, sections: ['header','commonQuestions','disciplineQuestions','drawingRequirements','footer'], pageCount: 4 },
    answerSheet: { title: `${reiwa} 答案用紙`, answerNumbers: ['答案用紙1','答案用紙2','答案用紙3','答案用紙4'], pageCount: 4 },
    blankDrawing: { title: '白図', drawingNumbers: ['白図1','白図2'], count: 2 },
    architecturalDrawing: { title: '建築図', drawingNumbers: ['建築図1','建築図2','建築図3'], count: 3 },
    equipmentDrawing: { title: '設備図', drawingNumbers: ['設備図1','設備図2','設備図3'], count: 3 },
    modelDrawing: { title: '模範図', drawingNumbers: ['模範図1','模範図2','模範図3'], count: 3 },
    commonQuestions: { title: '共通問題', questionNumbers: ['CQ03','CQ04','CQ05'], count: 3 },
    descriptionFields: { title: '記述欄', rows: 12 + variation, lineHeightMm: 6 },
    header: { text: `${reiwa} 建築設備士第二次試験`, heightMm: 9 },
    footer: { text: '無断転載を禁ずる', heightMm: 7 },
    drawingFrame: { strokeWidth: 0.35, titleBlockHeightMm: 18, grid: true },
    pageNumber: { format: '- {page} -', position: 'bottom-center' },
    typography: { fontFamily: 'serif', textSizePt },
    svg: { viewBox: '0 0 1189 841', frameRequired: true },
    similarityTargets: { html: 98, svg: 98, pdf: 98 }
  };
}

function readTemplate(year) {
  const file = path.join(ROOT, `r${year}`, 'template.json');
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  return createDefaultTemplate(year);
}

class ExamTemplateRepository {
  constructor(options = {}) { this.root = options.root || ROOT; }
  listYears() { return YEARS.slice(); }
  getTemplate(yearOrId = 2025) { const year = normalizeYear(yearOrId); return readTemplate(year); }
  getTemplatePart(yearOrId, part) { const template = this.getTemplate(yearOrId); if (!PARTS.includes(part)) throw new Error(`Unknown template part: ${part}`); return template[part]; }
}

module.exports = { ExamTemplateRepository, createDefaultTemplate, normalizeYear, YEARS, PARTS };

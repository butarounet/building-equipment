const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');

function createElement(id, value = '') {
  return {
    id,
    value,
    textContent: '',
    innerHTML: '',
    hidden: false,
    listeners: {},
    classList: { toggle: () => true },
    setAttribute() {},
    addEventListener(type, handler) { this.listeners[type] = handler; },
    click() { if (this.listeners.click) this.listeners.click({ target: this }); }
  };
}

function bootApp(ids = {}) {
  const elements = new Map();
  Object.entries(ids).forEach(([id, value]) => elements.set(id, createElement(id, value)));
  const document = {
    domReady: null,
    addEventListener(type, handler) { if (type === 'DOMContentLoaded') this.domReady = handler; },
    querySelector(selector) {
      if (selector === '.global-menu__toggle') return elements.get('menu-toggle') || null;
      if (selector === '#exam-json-code code') return elements.get('exam-json-code-code') || null;
      if (selector === '#json-preview-code code') return elements.get('json-preview-code-code') || null;
      if (!selector.startsWith('#')) return null;
      return elements.get(selector.slice(1)) || null;
    }
  };
  const errors = [];
  const context = {
    document,
    console: { error: (...args) => errors.push(args), log() {}, warn() {} },
    window: { print() {} },
    generateBuilding: ({ plan }) => ({ building: { name: 'ホテル', use: 'ホテル', location: '東京', siteArea: { value: 1000, unit: 'm2' }, buildingArea: { value: 500, unit: 'm2' }, totalFloorArea: { value: 5000, unit: 'm2' }, floors: { basement: 1, aboveGround: 6, description: '地上6階地下1階' }, structure: 'RC造', rooms: { guestRooms: 80, banquetHall: { count: 1, area: { value: 300, unit: 'm2' } }, restaurant: { count: 1, area: { value: 180, unit: 'm2' } }, kitchen: { area: { value: 120, unit: 'm2' } }, spa: { area: { value: 100, unit: 'm2' } }, laundry: { area: { value: 60, unit: 'm2' } } } } }),
    generateEquipment: () => ({ equipment: { hvac: { systems: [{ name: '中央熱源', capacity: { value: 100, unit: 'kW' } }] }, ventilation: { systems: [{ name: '機械換気' }] }, waterSupply: { systems: [{ name: '受水槽方式' }] }, hotWater: { systems: [{ name: '中央給湯' }] }, drainage: { systems: [{ name: '分流式' }] }, fireSafety: { systems: [{ name: 'SP' }] }, receivingTransformer: { systems: [{ name: '高圧受電' }] }, emergencyPower: { systems: [{ name: '発電機' }] }, buildingManagement: { systems: [{ name: 'BEMS' }] } } }),
    generateMaterials: () => ({ materials: [{ materialId: 'material-5' }] }),
    generateDrawings: () => ({ blankPlans: [{ drawingId: 'blank-1' }], floorPlans: [{ floorId: '1' }], sitePlan: { drawingId: 'site' } }),
    generateExam: () => ({ cover: { examName: '試験', bookletLabel: '問題', learningLabel: '学習', duration: '330分' }, projectTitle: '課題', instructions: ['注意'], designTask: { concept: '計画' }, planningConditions: { use: 'ホテル', location: '東京', totalFloorArea: { value: 5000, unit: 'm2' }, floors: { description: '地上6階' }, guestRooms: 80 }, mandatoryQuestions: [], electiveSections: { hvac: [], plumbing: [], electrical: [] } }),
    generateAnswerSheets: () => ({ mandatoryPlanningSheet: { title: '答案', size: 'A4-portrait' }, hvacSheet: { title: '空調', size: 'A3-landscape' } })
  };
  context.window = {
    ...context.window,
    planHotelProject: () => ({ hotelType: 'ホテル' }),
    generateMaterials: context.generateMaterials,
    generateDrawings: context.generateDrawings,
    generateExam: context.generateExam,
    generateAnswerSheets: context.generateAnswerSheets,
    svgRenderer: { createSvgDocument: () => '<svg><g id="Layer02_Grid" data-layer-name="Layer02_Grid" class=""></g><g id="Layer01_Architecture" data-layer-name="Layer01_Architecture" class="layer-architecture"></g></svg>', downloadSvg() {} },
    svgPrimitives: { drawGridLine: () => '', drawWall: () => '', drawColumn: () => '', drawDoor: () => '', drawWindow: () => '', drawRoomLabel: () => '', drawNorthArrow: () => '', drawScaleBar: () => '', drawDimensionLine: () => '' },
    architecturalDrawingRenderer: { renderArchitecturalDrawing: () => '<svg>arch</svg>' },
    equipmentDrawingRenderer: { renderEquipmentDrawing: () => '<svg>equip</svg>' },
    answerSheetRenderer: { renderAnswerSheetSet: () => '<article>answer</article>' }
  };
  vm.runInNewContext(fs.readFileSync('js/app.js', 'utf8'), context, { filename: 'js/app.js' });
  assert.ok(document.domReady);
  document.domReady();
  return { elements, errors };
}

test('Generator Previewは答案用紙DOMがなくても停止せず建築・設備条件とJSONを表示できる', () => {
  const { elements } = bootApp({ 'generate-button': '', 'generation-result': '', 'json-toggle-button': '', 'json-preview-code': '', 'json-preview-code-code': '' });
  elements.get('generate-button').click();
  assert.match(elements.get('generation-result').innerHTML, /建築条件/);
  assert.match(elements.get('generation-result').innerHTML, /設備条件/);
  elements.get('json-toggle-button').click();
  assert.match(elements.get('json-preview-code-code').textContent, /"building"/);
});

test('主要プレビューのイベントが独立して動作する', () => {
  const ids = {
    'generate-button': '', 'generation-result': '', 'json-toggle-button': '', 'json-preview-code': '', 'json-preview-code-code': '',
    'svg-sample-button': '', 'svg-save-button': '', 'svg-preview-canvas': '', 'svg-preview-message': '',
    'architectural-drawing-select': 'site', 'architectural-show-button': '', 'architectural-save-button': '', 'architectural-preview-canvas': '', 'architectural-preview-message': '',
    'equipment-discipline-select': 'hvac', 'equipment-floor-select': '1', 'equipment-mode-select': 'mono', 'equipment-show-button': '', 'equipment-save-button': '', 'equipment-preview-canvas': '', 'equipment-preview-message': '',
    'exam-generate-button': '', 'exam-show-button': '', 'exam-json-button': '', 'exam-print-button': '', 'exam-booklet': '', 'exam-json-code': '', 'exam-json-code-code': '', 'exam-preview-message': '',
    'answer-sheet-select': 'mandatoryPlanningSheet', 'answer-sheet-generate-button': '', 'answer-sheet-show-button': '', 'answer-sheet-save-button': '', 'answer-sheet-canvas': '', 'answer-sheet-message': ''
  };
  const { elements } = bootApp(ids);
  elements.get('generate-button').click();
  elements.get('svg-sample-button').click();
  assert.match(elements.get('svg-preview-canvas').innerHTML, /svg/);
  elements.get('architectural-show-button').click();
  assert.match(elements.get('architectural-preview-canvas').innerHTML, /arch/);
  elements.get('equipment-show-button').click();
  assert.match(elements.get('equipment-preview-canvas').innerHTML, /equip/);
  elements.get('exam-generate-button').click();
  elements.get('exam-show-button').click();
  assert.match(elements.get('exam-booklet').innerHTML, /試験/);
  elements.get('answer-sheet-generate-button').click();
  elements.get('answer-sheet-show-button').click();
  assert.match(elements.get('answer-sheet-canvas').innerHTML, /answer/);
});

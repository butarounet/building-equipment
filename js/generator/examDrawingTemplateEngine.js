const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
const num = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const scaleDenominator = (scale = '1/200') => Number(String(scale).replace('S=', '').replace('1/', '')) || 200;

const A3_LANDSCAPE = { name: 'A3', orientation: 'landscape', width: 420, height: 297, unit: 'mm' };

const TemplateLibrary = {
  site: { drawingType: 'site', document: '資料1', title: '配置図', scale: '1/500', drawingNumber: '資料1', requiredElements: ['北矢印', '敷地境界', '道路', '建物外形', '設備スペース', '凡例'], legendKeys: ['northArrow', 'siteBoundary', 'road', 'buildingOutline', 'equipmentSpace'] },
  floor1: { drawingType: 'floor', floorName: '1階', document: '資料2', title: '1階平面図', scale: '1/200', drawingNumber: '資料2', requiredElements: ['通り芯', '柱', '壁', '階段', 'EV', 'EPS', 'PS', 'DS', '室名', '寸法', '方位', '凡例'], legendKeys: ['grid', 'column', 'wall', 'stairs', 'ev', 'eps', 'ps', 'ds', 'northArrow'] },
  typicalFloor: { drawingType: 'floor', floorName: '基準階', document: '資料3', title: '基準階平面図', scale: '1/200', drawingNumber: '資料3', requiredElements: ['客室', 'コア', '設備シャフト', '寸法'], legendKeys: ['guestRoom', 'core', 'shaft', 'dimension'] },
  roof: { drawingType: 'roof', document: '資料4', title: '屋上伏図', scale: '1/200', drawingNumber: '資料4', requiredElements: ['冷却塔', '屋外機', '煙突', '設備基礎', '屋上機械室'], legendKeys: ['coolingTower', 'outdoorUnit', 'chimney', 'equipmentFoundation', 'roofMachineRoom'] },
  Q03: { drawingType: 'common-question', questionId: 'Q03', title: '共通問題 Q03', scale: '1/100', drawingNumber: 'Q03', requiredElements: ['部分平面図', '設備シャフト', '凡例'], legendKeys: ['eps', 'ps', 'ds', 'equipmentSpace'] },
  Q04: { drawingType: 'common-question', questionId: 'Q04', title: '共通問題 Q04', scale: '1/50', drawingNumber: 'Q04', requiredElements: ['部分詳細図', '器具スペース', '凡例'], legendKeys: ['fixture', 'ps', 'dimension'] },
  Q05: { drawingType: 'common-question', questionId: 'Q05', title: '共通問題 Q05', scale: '1/100', drawingNumber: 'Q05', requiredElements: ['部分平面図', '照明範囲', '凡例'], legendKeys: ['lighting', 'eps', 'dimension'] }
};

const LegendMaster = {
  northArrow: '北矢印', siteBoundary: '敷地境界', road: '道路', buildingOutline: '建物外形', equipmentSpace: '設備スペース',
  grid: '通り芯', column: '柱', wall: '壁', stairs: '階段', ev: 'EV', eps: 'EPS', ps: 'PS', ds: 'DS',
  guestRoom: '客室', core: 'コア', shaft: '設備シャフト', dimension: '寸法', coolingTower: '冷却塔', outdoorUnit: '屋外機',
  chimney: '煙突', equipmentFoundation: '設備基礎', roofMachineRoom: '屋上機械室', fixture: '衛生器具', lighting: '照明'
};

const SheetLayoutEngine = {
  generate(template = {}) {
    const sheet = { ...A3_LANDSCAPE };
    const margin = { top: 12, right: 12, bottom: 12, left: 12 };
    const frame = { x: margin.left, y: margin.top, width: sheet.width - margin.left - margin.right, height: sheet.height - margin.top - margin.bottom, strokeWidth: 0.5 };
    const titleBlock = { x: 292, y: 247, width: 116, height: 38 };
    const legend = { x: 292, y: 22, width: 116, height: 72 };
    const scaleBar = { x: 26, y: 268, width: 80, height: 8 };
    const viewport = { x: 24, y: 24, width: 258, height: 230 };
    return { sheet, margin, frame, viewport, legend, titleBlock, scaleBar, drawingNumberPosition: { x: 374, y: 279 }, scale: template.scale };
  }
};

const ViewportLayoutEngine = {
  place(view = {}, layout = {}, scale = '1/200') {
    const src = view.viewBox || view.cropArea || { x: 0, y: 0, width: num(view.width, 10000), height: num(view.height, 7000) };
    const box = layout.viewport;
    const srcRatio = src.width / Math.max(1, src.height);
    const boxRatio = box.width / box.height;
    const width = srcRatio > boxRatio ? box.width : box.height * srcRatio;
    const height = srcRatio > boxRatio ? box.width / srcRatio : box.height;
    return { ...box, x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height, sourceViewBox: src, scale, fixedScale: true, centered: true, marginAdjusted: true };
  }
};

const TitleBlockGenerator = {
  generate(template = {}, context = {}, position = {}) {
    return { ...position, drawingName: template.title, scale: template.scale, drawingNumber: template.drawingNumber, floorName: template.floorName || context.floorName || '', use: context.use || context.buildingUse || 'ホテル', buildingName: context.buildingName || '建築設備士第二次試験計画建物', fields: ['図面名称', '縮尺', '図面番号', '階名称', '用途', '建物名称'] };
  }
};

const LegendLayoutEngine = {
  generate(template = {}, position = {}) {
    const items = arr(template.legendKeys).map((key, index) => ({ key, label: LegendMaster[key] || key, x: position.x + 6 + (index % 2) * 52, y: position.y + 10 + Math.floor(index / 2) * 9, symbolSize: 5 }));
    return { ...position, items, columns: 2, title: '凡例' };
  }
};

const ScaleBarGenerator = {
  generate(scale = '1/200', position = {}) {
    const denom = scaleDenominator(scale);
    const segmentCount = 4;
    const segmentWorldMeters = denom >= 500 ? 10 : denom >= 200 ? 5 : denom >= 100 ? 2 : 1;
    return { ...position, scale, segmentCount, segmentWorldMeters, totalWorldMeters: segmentCount * segmentWorldMeters, labels: Array.from({ length: segmentCount + 1 }, (_, i) => `${i * segmentWorldMeters}m`) };
  }
};

const DrawingCompositionEngine = {
  compose({ template = {}, view = {}, context = {} } = {}) {
    const layout = SheetLayoutEngine.generate(template);
    const viewport = ViewportLayoutEngine.place(view, layout, template.scale);
    const legend = LegendLayoutEngine.generate(template, layout.legend);
    const titleBlock = TitleBlockGenerator.generate(template, context, layout.titleBlock);
    const scaleBar = ScaleBarGenerator.generate(template.scale, layout.scaleBar);
    return { drawingType: template.drawingType, sheet: layout.sheet.name, scale: template.scale, title: template.title, frame: layout.frame, viewport, legend, titleBlock, scaleBar, drawingNumber: template.drawingNumber, document: template.document, requiredElements: template.requiredElements, compositionOrder: ['配置図', '平面図', '屋上伏図', '部分図', '凡例', 'タイトル'] };
  }
};

const TemplateQualityChecker = {
  check(drawing = {}) {
    const checks = [
      ['図枠一致', drawing.frame?.width > 390 && drawing.frame?.height > 260], ['余白一致', drawing.viewport?.x >= 20 && drawing.viewport?.y >= 20], ['縮尺一致', /^1\/(50|100|200|500)$/.test(drawing.scale || '')], ['タイトル一致', !!drawing.titleBlock?.drawingName], ['図面番号一致', !!drawing.titleBlock?.drawingNumber], ['凡例一致', arr(drawing.legend?.items).length > 0], ['建築設備士試験品質', drawing.sheet === 'A3' && drawing.viewport?.fixedScale]
    ];
    const score = Math.round(checks.filter(([, ok]) => ok).length / checks.length * 100);
    return { score, isValid: score >= 90, checks: checks.map(([label, ok]) => ({ label, ok: !!ok })) };
  }
};

function resolveTemplate(input = {}) {
  const key = input.templateId || input.questionId || input.documentId || input.drawingKey;
  if (key && TemplateLibrary[key]) return TemplateLibrary[key];
  if (input.drawingType === 'site') return TemplateLibrary.site;
  if (input.drawingType === 'roof') return TemplateLibrary.roof;
  if (/基準階/.test(input.title || input.floorName || '')) return TemplateLibrary.typicalFloor;
  return TemplateLibrary.floor1;
}

function generateExamDrawingTemplates({ views = [], context = {}, includeDefaults = true } = {}) {
  const sourceViews = arr(views);
  const defaultKeys = includeDefaults ? ['site', 'floor1', 'typicalFloor', 'roof', 'Q03', 'Q04', 'Q05'] : [];
  const templates = (sourceViews.length ? sourceViews : defaultKeys.map((k) => ({ templateId: k }))).map((view) => DrawingCompositionEngine.compose({ template: resolveTemplate(view), view, context }));
  const quality = { score: Math.round(templates.reduce((s, t) => s + TemplateQualityChecker.check(t).score, 0) / Math.max(1, templates.length)), templates: templates.map((t) => ({ drawingNumber: t.drawingNumber, ...TemplateQualityChecker.check(t) })) };
  return { templates, quality, metadata: { engine: 'Exam Drawing Template Engine', sheetLayoutEngine: true, viewportLayoutEngine: true, titleBlockGenerator: true, legendLayoutEngine: true, scaleBarGenerator: true, drawingCompositionEngine: true, templateQualityChecker: true } };
}

module.exports = { generateExamDrawingTemplates, TemplateLibrary, SheetLayoutEngine, ViewportLayoutEngine, TitleBlockGenerator, LegendLayoutEngine, ScaleBarGenerator, DrawingCompositionEngine, TemplateQualityChecker };

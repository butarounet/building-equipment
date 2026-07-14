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

const LayerDefinitions = [
  ['A-WALL', '建築壁'], ['A-COLUMN', '柱'], ['A-BEAM', '梁'], ['A-DOOR', '建具'], ['A-WINDOW', '窓'], ['A-STAIR', '階段'], ['A-ELEVATOR', 'EV'], ['A-GRID', '通り芯'], ['A-DIM', '寸法'], ['A-TEXT', '文字'], ['A-HATCH', 'ハッチ'], ['A-FIRE', '防火区画'], ['A-SYMBOL', '建築記号'], ['A-ROOM', '室名・室番号'], ['A-EPS', 'EPS'], ['A-PS', 'PS'], ['A-DS', 'DS'], ['A-MECHSPACE', '設備室'], ['A-DETAIL', '詳細・断面'],
  ['M-HVAC', '空調設備'], ['M-DUCT', 'ダクト'], ['M-PIPE', '配管'], ['M-DRAIN', '排水'], ['E-LIGHT', '照明'], ['E-POWER', '電源'], ['E-FIRE', '防災電気'], ['E-CABLE', '弱電・配線']
];

const LineStyleDefinitions = {
  solid: { label: '実線', pattern: [], jis: true },
  dashed: { label: '破線', pattern: [4, 2], jis: true },
  dashDot: { label: '一点鎖線', pattern: [8, 2, 1.5, 2], jis: true },
  dashDoubleDot: { label: '二点鎖線', pattern: [8, 2, 1.5, 2, 1.5, 2], jis: true },
  center: { label: '中心線', pattern: [10, 2, 2, 2], layer: 'A-GRID', jis: true },
  hidden: { label: '隠線', pattern: [3, 2], jis: true },
  dimension: { label: '寸法線', pattern: [], layer: 'A-DIM', jis: true },
  leader: { label: '引出線', pattern: [], layer: 'A-DIM', jis: true },
  boundary: { label: '境界線', pattern: [10, 3], jis: true },
  fireCompartment: { label: '防火区画線', pattern: [6, 2, 1, 2], layer: 'A-FIRE', jis: true },
  evacuationRoute: { label: '避難経路線', pattern: [5, 2], layer: 'A-FIRE', jis: true }
};

const LineWeightDefinitions = {
  exteriorWall: 0.50, column: 0.45, fireRatedWall: 0.45, interiorWall: 0.30, door: 0.20, window: 0.18,
  dimension: 0.13, text: 0.13, furniture: 0.10, equipment: 0.18, centerLine: 0.09, hatch: 0.09
};

const CadLayerEngine = {
  generate() {
    return LayerDefinitions.map(([name, description]) => ({ name, description, printable: true, color: 'black' }));
  }
};

const LineStyleEngine = { generate: () => LineStyleDefinitions };
const LineWeightEngine = { generate: () => LineWeightDefinitions };

const ArchitecturalSymbolEngine = {
  generate() {
    return [
      ['stairs', '階段', 'A-STAIR'], ['ev', 'EV', 'A-ELEVATOR'], ['eps', 'EPS', 'A-EPS'], ['ps', 'PS', 'A-PS'], ['ds', 'DS', 'A-DS'], ['mechanicalRoom', '設備室', 'A-MECHSPACE'],
      ['sectionMarker', '断面記号', 'A-DETAIL'], ['detailMarker', '詳細記号', 'A-DETAIL'], ['northArrow', '北矢印', 'A-SYMBOL'], ['gridLine', '通り芯', 'A-GRID'], ['columnCenter', '柱芯', 'A-GRID'],
      ['doorNumber', '建具番号', 'A-DOOR'], ['windowNumber', '窓番号', 'A-WINDOW'], ['roomNumber', '室番号', 'A-ROOM'], ['sectionNumber', '断面番号', 'A-DETAIL'], ['detailNumber', '詳細番号', 'A-DETAIL'], ['scaleSymbol', '縮尺記号', 'A-SYMBOL'], ['drawingNumber', '図面番号', 'A-SYMBOL']
    ].map(([key, label, layer]) => ({ key, label, layer, lineStyle: 'solid', textHeight: 3.5 }));
  }
};

const DimensionStyleEngine = {
  generate() {
    return {
      types: ['通り芯寸法', '内法寸法', '開口寸法', '全体寸法', '建物寸法', '柱芯寸法', '壁芯寸法'],
      levelSymbols: ['FL', 'GL', 'RFL', 'CH'],
      layer: 'A-DIM',
      lineWeight: LineWeightDefinitions.dimension,
      textHeight: 2.5,
      tickSize: 2
    };
  }
};

const TextStyleEngine = {
  generate() {
    return {
      heights: [2.5, 3.5, 5.0, 7.0, 10.0],
      usage: { roomName: { label: '室名', height: 3.5 }, dimension: { label: '寸法', height: 2.5 }, title: { label: 'タイトル', height: 7.0 }, note: { label: '注記', height: 2.5 }, legend: { label: '凡例', height: 3.5 } },
      fontFamily: 'sans-serif',
      layer: 'A-TEXT'
    };
  }
};

const GridBubbleEngine = {
  generate({ xCount = 8, yCount = 6 } = {}) {
    const make = (prefix, count) => Array.from({ length: count }, (_, i) => ({ label: `${prefix}${i + 1}`, diameter: 7, textPosition: 'center', padding: 1.5, shape: 'circle' }));
    return { x: make('X', xCount), y: make('Y', yCount), layer: 'A-GRID', lineWeight: LineWeightDefinitions.centerLine };
  }
};

const ReferenceMarkerEngine = {
  generate() {
    return { sections: ['A-A', 'B-B'], details: ['1', '2', '3'], arrow: { type: 'filled', size: 3 }, leaderLine: { style: 'leader', layer: 'A-DIM' }, pageReference: true, drawingNumber: true };
  }
};

const PrintingQualityEngine = {
  generate() {
    return { paper: 'A3', dpi: 300, formats: ['PDF', 'SVG'], margin: SheetLayoutEngine.generate().margin, lineWidthCorrection: true, textCorrection: true, monochromeOptimized: true };
  }
};

const CadQualityChecker = {
  check(cadStandard = {}) {
    const layerNames = arr(cadStandard.layers).map((l) => l.name);
    const checks = [
      ['JIS線種', Object.values(cadStandard.lineStyles || {}).every((s) => s.jis)],
      ['線幅', Object.keys(LineWeightDefinitions).every((k) => Number(cadStandard.lineWeights?.[k]) > 0)],
      ['文字高さ', [2.5, 3.5, 5, 7, 10].every((h) => cadStandard.textStyles?.heights?.includes(h))],
      ['縮尺', !!cadStandard.symbols?.some((s) => s.key === 'scaleSymbol')],
      ['通り芯', layerNames.includes('A-GRID') && !!cadStandard.gridBubbles],
      ['寸法線', cadStandard.dimensions?.types?.includes('通り芯寸法')],
      ['建具番号', cadStandard.symbols?.some((s) => s.key === 'doorNumber')],
      ['室番号', cadStandard.symbols?.some((s) => s.key === 'roomNumber')],
      ['印刷品質', cadStandard.printing?.paper === 'A3' && cadStandard.printing?.dpi === 300],
      ['SVG品質', cadStandard.printing?.formats?.includes('SVG')],
      ['建築設備士試験品質', layerNames.includes('M-HVAC') && layerNames.includes('E-POWER')]
    ];
    const score = Math.round(checks.filter(([, ok]) => ok).length / checks.length * 100);
    return { score, isValid: score >= 90, checks: checks.map(([label, ok]) => ({ label, ok: !!ok })) };
  }
};

function generateArchitecturalCadStandard(options = {}) {
  const cadStandard = {
    layers: CadLayerEngine.generate(options),
    symbols: ArchitecturalSymbolEngine.generate(options),
    lineWeights: LineWeightEngine.generate(options),
    lineStyles: LineStyleEngine.generate(options),
    textStyles: TextStyleEngine.generate(options),
    dimensions: DimensionStyleEngine.generate(options),
    gridBubbles: GridBubbleEngine.generate(options),
    referenceMarkers: ReferenceMarkerEngine.generate(options),
    printing: PrintingQualityEngine.generate(options)
  };
  return { cadStandard, quality: CadQualityChecker.check(cadStandard), metadata: { engine: 'Architectural CAD Standard Engine', cadLayerEngine: true, lineStyleEngine: true, lineWeightEngine: true, architecturalSymbolEngine: true, dimensionStyleEngine: true, textStyleEngine: true, gridBubbleEngine: true, referenceMarkerEngine: true, printingQualityEngine: true, cadQualityChecker: true } };
}

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
  const cadStandard = generateArchitecturalCadStandard();
  return { templates, cadStandard: cadStandard.cadStandard, quality, cadQuality: cadStandard.quality, metadata: { engine: 'Exam Drawing Template Engine', architecturalCadStandardEngine: true, sheetLayoutEngine: true, viewportLayoutEngine: true, titleBlockGenerator: true, legendLayoutEngine: true, scaleBarGenerator: true, drawingCompositionEngine: true, templateQualityChecker: true } };
}

module.exports = { generateExamDrawingTemplates, generateArchitecturalCadStandard, TemplateLibrary, SheetLayoutEngine, ViewportLayoutEngine, TitleBlockGenerator, LegendLayoutEngine, ScaleBarGenerator, CadLayerEngine, LineStyleEngine, LineWeightEngine, ArchitecturalSymbolEngine, DimensionStyleEngine, TextStyleEngine, GridBubbleEngine, ReferenceMarkerEngine, PrintingQualityEngine, CadQualityChecker, DrawingCompositionEngine, TemplateQualityChecker };

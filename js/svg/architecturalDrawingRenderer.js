(function (root) {
  const site = root.sitePlanRenderer || (typeof require === 'function' ? require('./sitePlanRenderer') : {});
  const floor = root.floorPlanRenderer || (typeof require === 'function' ? require('./floorPlanRenderer') : {});
  const blank = root.blankPlanRenderer || (typeof require === 'function' ? require('./blankPlanRenderer') : {});
  const base = root.svgRenderer || (typeof require === 'function' ? require('./svgRenderer') : {});
  const qualityEngine = root.buildingDrawingQualityEngine || (typeof require === 'function' ? require('../layout/buildingDrawingQualityEngine') : {});
  const examCadQualityEngine = root.examCadQualityEngine || (typeof require === 'function' ? require('../layout/examCadQualityEngine') : {});
  const defaults = { sheetSize: 'A3', orientation: 'landscape', showDimensions: true, showGrid: true, showRoomNames: true, showTitleBlock: true, buildingDrawingQuality: true };
  function infer(drawing = {}) {
    const id = String(drawing.drawingId || drawing.type || '').toLowerCase();
    if (id.includes('site') || drawing.siteBoundary || drawing.buildingOutline) return 'site';
    if (id.includes('blank') || drawing.blankMode) return 'blank';
    return 'floor';
  }
  function renderArchitecturalDrawing(drawing, options = {}) {
    const opts = { ...defaults, ...options };
    try {
      if (!drawing) throw new Error('Drawing Generatorのデータがありません。');
      const kind = opts.kind || infer(drawing);
      const shouldImprove = opts.buildingDrawingQuality !== false && qualityEngine.improveBuildingDrawing;
      let source = shouldImprove ? qualityEngine.improveBuildingDrawing(drawing, {}, opts).enhancedFloorPlan : drawing;
      if (kind === 'site') return site.renderSitePlan(source, opts);
      if (kind === 'blank') return blank.renderBlankPlan(source, opts);
      if (opts.examCadQuality !== false && examCadQualityEngine.enhance) source = examCadQualityEngine.enhance({ drawing: source, template: opts.template }).drawing;
      return floor.renderFloorPlan(source, opts);
    } catch (error) {
      return base.createSvgDocument({ title: '建築図生成エラー', scale: 'S=1/200' }).replace('</svg>', `<text id="architectural-renderer-error" x="30" y="40" class="text-note">${String(error.message || error)}</text></svg>`);
    }
  }
  const api = { renderArchitecturalDrawing };
  if (typeof module !== 'undefined') module.exports = api;
  root.architecturalDrawingRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

(function (root) {
  const site = root.sitePlanRenderer || (typeof require === 'function' ? require('./sitePlanRenderer') : {});
  const floor = root.floorPlanRenderer || (typeof require === 'function' ? require('./floorPlanRenderer') : {});
  const blank = root.blankPlanRenderer || (typeof require === 'function' ? require('./blankPlanRenderer') : {});
  const DEFAULTS = { sheetSize: 'A3', orientation: 'landscape', showDimensions: true, showGrid: true, showRoomNames: true, showTitleBlock: true };
  function renderArchitecturalDrawing(drawing, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    try {
      const d = drawing || {};
      const kind = opts.type || d.type || (d.siteBoundary || d.buildingOutline ? 'sitePlan' : String(d.drawingId || '').includes('blank') || opts.blankMode ? 'blankPlan' : 'floorPlan');
      if (kind === 'sitePlan' || kind === 'site') return site.renderSitePlan(d, { scale: '1/500', ...opts });
      if (kind === 'blankPlan' || kind === 'blank') return blank.renderBlankPlan(d, { scale: '1/200', ...opts, blankMode: true });
      return floor.renderFloorPlan(d, { scale: '1/200', ...opts });
    } catch (error) {
      return floor.renderFloorPlan({ drawingId:'error', floorName:'SVG生成エラー', rooms:[{ roomId:'error', name:error.message, x:0, y:0, width:20000, height:10000 }] }, opts);
    }
  }
  const api = { renderArchitecturalDrawing };
  if (typeof module !== 'undefined') module.exports = api;
  root.architecturalDrawingRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

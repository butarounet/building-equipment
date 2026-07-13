(function (root) {
  const floor = root.floorPlanRenderer || (typeof require === 'function' ? require('./floorPlanRenderer') : {});
  function renderBlankPlan(blankPlan = {}, options = {}) {
    const clean = { ...(blankPlan || {}), equipmentSymbols: undefined, pipes: undefined, ducts: undefined, wiring: undefined, answers: undefined };
    return floor.renderFloorPlan(clean, { ...options, title: '白図', blankMode: true, showEquipmentSpaces: true });
  }
  const api = { renderBlankPlan };
  if (typeof module !== 'undefined') module.exports = api;
  root.blankPlanRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

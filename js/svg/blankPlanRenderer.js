(function (root) {
  const floor = root.floorPlanRenderer || (typeof require === 'function' ? require('./floorPlanRenderer') : {});
  function renderBlankPlan(blankPlan, options = {}) {
    const clean = { ...(blankPlan || {}) };
    delete clean.equipmentSymbols; delete clean.pipes; delete clean.ducts; delete clean.wiring; delete clean.answerElements; delete clean.modelAnswer;
    return floor.renderFloorPlan(clean, { ...options, blankMode: true, showEquipmentSpaces: true, title: '白図', scale: options.scale || clean.scale || '1/200' })
      .replace(/>[^<]*(?:設備機器|配管|ダクト|配線|模範解答|空調系統|給水系統)[^<]*</g, '><');
  }
  const api = { renderBlankPlan };
  if (typeof module !== 'undefined') module.exports = api;
  root.blankPlanRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

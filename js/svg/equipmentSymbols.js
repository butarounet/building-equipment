(function (root) {
  const symbols = [
    ['ahu','hvac','AHU'],['oahu','hvac','OAHU'],['fcu','hvac','FCU'],['pac','hvac','PAC'],['outdoor-unit','hvac','室外機'],['fan','hvac','送風機'],['smoke-fan','hvac','排煙機'],['diffuser','hvac','吹出口'],['return-grille','hvac','吸込口'],['damper','hvac','FD'],['vav','hvac','VAV'],['silencer','hvac','消音器'],['pump','hvac','P'],['cooling-tower','hvac','CT'],['heat-source','hvac','熱源'],
    ['receiving-tank','plumbing','受水槽'],['elevated-tank','plumbing','高置水槽'],['water-pump','plumbing','給水P'],['water-heater','plumbing','給湯器'],['storage-tank','plumbing','貯湯槽'],['drain-pump','plumbing','排水P'],['drain-tank','plumbing','排水槽'],['toilet','plumbing','便器'],['basin','plumbing','洗面器'],['shower','plumbing','シャワー'],['hydrant','plumbing','消火栓'],['sprinkler-head','plumbing','SP'],['valve','plumbing','弁'],['meter','plumbing','M'],
    ['transformer','electrical','TR'],['generator','electrical','G'],['battery','electrical','蓄電池'],['panel','electrical','盤'],['light','electrical','照明'],['outlet','electrical','C'],['detector','electrical','感知器'],['exit-light','electrical','誘導灯'],['monitor-terminal','electrical','中央監視'],['bems-terminal','electrical','BEMS']
  ].map(([symbolId, category, label]) => ({ symbolId, category, label, defaultWidth: 8, defaultHeight: 6, connectionPoints: [{ id: 'left', x: 0, y: 3 }, { id: 'right', x: 8, y: 3 }], svgDefinition: `<symbol id="eqsym-${symbolId}" viewBox="0 0 8 6"><rect x=".5" y=".5" width="7" height="5" fill="none" stroke="currentColor" stroke-width=".25"/><text x="4" y="3.3" font-size="1.8" text-anchor="middle" dominant-baseline="middle">${label}</text></symbol>` }));
  function createEquipmentSymbolDefinitions() { return symbols.map((s) => s.svgDefinition).join(''); }
  function findEquipmentSymbol(id) { return symbols.find((s) => s.symbolId === id || s.label === id); }
  const api = { equipmentSymbols: symbols, createEquipmentSymbolDefinitions, findEquipmentSymbol };
  if (typeof module !== 'undefined') module.exports = api;
  root.equipmentSymbols = api;
})(typeof window !== 'undefined' ? window : globalThis);

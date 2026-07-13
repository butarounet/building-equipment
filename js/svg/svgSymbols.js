(function (root) {
  const p = root.svgPrimitives || (typeof require === 'function' ? require('./svgPrimitives') : {});
  const symbol = (id, viewBox, content) => `<symbol id="${id}" viewBox="${viewBox}">${content}</symbol>`;
  function createSvgSymbols() {
    return [
      symbol('symbol-north-arrow', '0 0 20 30', p.drawNorthArrow({ x: 10, y: 13 })),
      symbol('symbol-stairs', '0 0 24 24', Array.from({ length: 6 }, (_, i) => p.drawLine({ x1: 3, y1: 4 + i * 3, x2: 21, y2: 4 + i * 3, className: 'line-thin' })).join('') + p.drawPolyline({ points: [[7, 21], [17, 12], [12, 12], [17, 6]], className: 'line-thin' })),
      symbol('symbol-elevator', '0 0 24 24', p.drawRect({ x: 3, y: 3, width: 18, height: 18, fill: 'none', className: 'line-medium' }) + p.drawText({ x: 12, y: 13, text: 'EV', className: 'text-note', fontSize: 5 })),
      symbol('symbol-column', '0 0 12 12', p.drawRect({ x: 1, y: 1, width: 10, height: 10, fill: 'none', className: 'line-medium' })),
      symbol('symbol-grid-bubble', '0 0 12 12', p.drawCircle({ x: 6, y: 6, r: 5, fill: 'none', className: 'line-grid' })),
      ...['EPS','PS','DS','機械室','電気室','受変電室','給水設備室','空調熱源設備室'].map((label, i) => symbol(`symbol-space-${i}`, '0 0 34 18', p.drawRect({ x: 1, y: 1, width: 32, height: 16, fill: 'none', className: 'line-thin' }) + p.drawText({ x: 17, y: 10, text: label, className: 'text-note', fontSize: label.length > 4 ? 2.5 : 4 })))
    ].join('\n');
  }
  const api = { createSvgSymbols };
  if (typeof module !== 'undefined') module.exports = api;
  root.svgSymbols = api;
})(typeof window !== 'undefined' ? window : globalThis);

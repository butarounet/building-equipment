(function (root) {
  const p = root.svgPrimitives || (typeof require === 'function' ? require('./svgPrimitives') : {});
  const s = root.svgSymbols || (typeof require === 'function' ? require('./svgSymbols') : {});
  const LAYERS = ['Layer01_Architecture','Layer02_Grid','Layer03_Dimensions','Layer04_Equipment','Layer05_Text','Layer06_Answer','Layer07_Print'];
  const css = `
    .sheet-background{fill:#fff}.line-heavy{fill:none;stroke:#000;stroke-width:.5;stroke-linecap:square;stroke-linejoin:miter}.line-medium{fill:none;stroke:#000;stroke-width:.3}.line-thin{fill:none;stroke:#000;stroke-width:.15}.line-grid{fill:none;stroke:#666;stroke-width:.13}.line-dashed{stroke-dasharray:4 2}.line-center{stroke-dasharray:8 2 1.5 2}.line-double-center{stroke-dasharray:8 2 1.5 2 1.5 2}.text-title{font:5px "Yu Gothic","Hiragino Kaku Gothic ProN",sans-serif;fill:#000;font-weight:700}.text-room{font:3.5px "Yu Gothic","Hiragino Kaku Gothic ProN",sans-serif;fill:#000}.text-dimension,.text-note,.text-legend,.text-border{font:2.5px "Yu Gothic","Hiragino Kaku Gothic ProN",sans-serif;fill:#000}.layer-architecture,.layer-equipment,.layer-answer{display:inline}.print-only{display:none}.screen-only{display:inline}@media print{.screen-only{display:none}.print-only{display:inline}}`;
  const layerClass = (name) => ({ Layer01_Architecture: 'layer-architecture', Layer04_Equipment: 'layer-equipment', Layer06_Answer: 'layer-answer' }[name] || '');
  function createMetadata(options) { return `<metadata>${p.escapeXml(JSON.stringify({ sheetSize: options.sheetSize, orientation: options.orientation, drawingNumber: options.drawingNumber, title: options.title, scale: options.scale, projectTitle: options.projectTitle, generatedAt: new Date().toISOString() }))}</metadata>`; }
  function createLayers(options) {
    const hidden = new Set(options.blankMode || options.hideEquipmentAndAnswer ? ['Layer04_Equipment','Layer06_Answer'] : options.excludeLayers || []);
    return LAYERS.filter((name) => !hidden.has(name)).map((name) => `<g id="${name}" data-layer-name="${name}" class="${layerClass(name)}"></g>`).join('\n');
  }
  function createSvgDocument(options = {}) {
    const opts = { sheetSize: 'A3', orientation: 'landscape', width: 420, height: 297, viewBox: '0 0 420 297', unit: 'mm', background: '#ffffff', title: 'SVG基盤図面', drawingNumber: 'SVG-001', scale: 'S=1/200', projectTitle: '建築設備士 模擬試験', ...options };
    const defs = `<defs><style><![CDATA[${css}]]></style>${s.createSvgSymbols ? s.createSvgSymbols() : ''}</defs>`;
    const content = [
      createMetadata(opts), defs,
      p.drawRect({ id: 'sheet-background', x: 0, y: 0, width: opts.width, height: opts.height, fill: opts.background, className: 'sheet-background' }),
      createLayers(opts),
      `<g id="Frame" data-layer-name="Frame">${p.drawBorder(opts)}${p.drawTitleBlock(opts)}</g>`
    ].join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}${opts.unit}" height="${opts.height}${opts.unit}" viewBox="${opts.viewBox}" data-sheet-size="${opts.sheetSize}" data-orientation="${opts.orientation}" role="img" aria-label="${p.escapeXml(opts.title)}">${content}</svg>`;
  }
  function serializeSvg(svg) { if (typeof svg === 'string') return svg; if (svg && svg.outerHTML) return svg.outerHTML; if (typeof XMLSerializer !== 'undefined') return new XMLSerializer().serializeToString(svg); return String(svg ?? ''); }
  function downloadSvg(svg, filename = 'drawing.svg') { const text = serializeSvg(svg); if (!text) return false; const blob = new Blob([text], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); return true; }
  const api = { LAYERS, createSvgDocument, serializeSvg, downloadSvg };
  if (typeof module !== 'undefined') module.exports = api;
  root.svgRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

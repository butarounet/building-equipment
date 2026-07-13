(function (root) {
  const p = root.svgPrimitives || (typeof require === 'function' ? require('./svgPrimitives') : {});
  const base = root.svgRenderer || (typeof require === 'function' ? require('./svgRenderer') : {});
  const coord = root.drawingCoordinateSystem || (typeof require === 'function' ? require('../layout/drawingCoordinateSystem') : {});
  const escId = (v) => String(v ?? 'item').replace(/[^A-Za-z0-9_-]/g, '-');
  const safe = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
  function add(svg, layer, content) { const needle = `<g id="${layer}" data-layer-name="${layer}"`; const i = svg.indexOf(needle); if (i < 0) return svg; const j = svg.indexOf('>', i); return `${svg.slice(0, j + 1)}${content}${svg.slice(j + 1)}`; }
  function renderSitePlan(sitePlan = {}, options = {}) {
    try {
      const sp = sitePlan || {}; const site = sp.siteBoundary || { x: 0, y: 0, width: 90000, height: 65000 }; const b = sp.buildingOutline || { x: 12000, y: 10000, width: 64000, height: 40000 };
      const cs = options.highQuality && coord.createDrawingCoordinateSystem ? coord.createDrawingCoordinateSystem({ scale: options.scale || sp.scale || '1/500', drawingArea: { x: 30, y: 34, width: 258, height: 198 } }) : null; const s = cs ? cs.l(1) : Math.min(250 / safe(site.width, 90000), 175 / safe(site.height, 65000)); const ox = cs ? cs.x(site.x) : 55, oy = cs ? cs.y(site.y) : 55; const x = (v) => ox + (safe(v) - safe(site.x)) * s; const y = (v) => oy + (safe(v) - safe(site.y)) * s; const l = (v) => safe(v) * s;
      let svg = base.createSvgDocument({ title: '配置図', drawingNumber: sp.drawingId || 'site-plan', scale: `S=${options.scale || sp.scale || '1/500'}`, projectTitle: options.projectTitle || '建築設備士 第二次試験' });
      const arch = [
        p.drawRect({ id: 'site-boundary-line', x: x(site.x), y: y(site.y), width: l(site.width), height: l(site.height), fill: 'none', className: 'line-heavy line-dashed' }),
        p.drawRect({ id: 'building-outline-site', x: x(b.x), y: y(b.y), width: l(b.width), height: l(b.height), fill: 'none', className: 'line-heavy' }),
        p.drawText({ id: 'building-label-site', x: x(b.x + b.width / 2), y: y(b.y + b.height / 2), text: '建物外形', className: 'text-room', fontSize: 3.5 }),
        p.drawRect({ id: 'porte-cochere-site', x: x(b.x + b.width * .35), y: y(b.y - 6000), width: l(b.width * .3), height: l(5000), fill: 'none', className: 'line-medium' }),
        p.drawText({ id: 'porte-cochere-label', x: x(b.x + b.width * .5), y: y(b.y - 3500), text: '車寄せ', className: 'text-note', fontSize: 2.5 }),
        p.drawRect({ id: 'parking-site', x: x(site.x + 4000), y: y(site.y + site.height * .55), width: l(20000), height: l(18000), fill: 'none', className: 'line-thin' }),
        p.drawText({ id: 'parking-label', x: x(site.x + 14000), y: y(site.y + site.height * .55 + 9000), text: '駐車場', className: 'text-note', fontSize: 2.5 }),
        p.drawRect({ id: 'green-area-site', x: x(site.x + site.width * .08), y: y(site.y + site.height * .80), width: l(site.width * .75), height: l(site.height * .1), fill: 'none', className: 'line-thin' }),
        p.drawText({ id: 'green-area-label', x: x(site.x + site.width * .45), y: y(site.y + site.height * .85), text: '緑地', className: 'text-note', fontSize: 2.5 })
      ];
      const roads = (sp.roads || [{ side: '北側', width: 12, type: '前面道路' }, { side: '東側', width: 8, type: 'サービス道路' }]).map((r, i) => p.drawRect({ id: `road-${i + 1}`, x: i === 0 ? x(site.x) : x(site.x + site.width), y: i === 0 ? y(site.y) - 15 : y(site.y), width: i === 0 ? l(site.width) : 15, height: i === 0 ? 15 : l(site.height), fill: 'none', className: 'line-medium' }) + p.drawText({ id: `road-label-${i + 1}`, x: i === 0 ? x(site.x + site.width / 2) : x(site.x + site.width) + 8, y: i === 0 ? y(site.y) - 8 : y(site.y + site.height / 2), text: `${r.side || ''}${r.type || '道路'} 幅員${r.width || ''}${r.unit || 'm'}`, className: 'text-note', fontSize: 2.5 })).join('');
      const dim = p.drawDimensionLine({ id: 'dimension-site-building-width', x: x(b.x), y: y(b.y + b.height) + 12, width: l(b.width), text: `${Math.round(b.width / 1000)}m` }) + p.drawDimensionLine({ id: 'dimension-site-boundary-width', x: x(site.x), y: y(site.y + site.height) + 22, width: l(site.width), text: `${Math.round(site.width / 1000)}m` }) + p.drawScaleBar({ id: 'scale-bar-site', x: 300, y: 230, text: `S=${options.scale || sp.scale || '1/500'}` });
      const text = [p.drawNorthArrow({ id: 'north-arrow-site', x: 365, y: 48 }), p.drawText({ id: 'entry-pedestrian', x: x(b.x + b.width / 2), y: y(b.y) - 3, text: '歩行者入口', className: 'text-note', fontSize: 2.5 }), p.drawText({ id: 'loading-dock-label', x: x(b.x + b.width) + 12, y: y(b.y + b.height * .55), text: '搬入口・サービス入口', textAnchor: 'start', className: 'text-note', fontSize: 2.5 }), p.drawText({ id: 'utility-electric', x: 310, y: 95, text: '受電引込位置', textAnchor: 'start', className: 'text-legend', fontSize: 2.5 }), p.drawText({ id: 'utility-gas-water', x: 310, y: 103, text: '都市ガス・上水引込位置', textAnchor: 'start', className: 'text-legend', fontSize: 2.5 }), p.drawText({ id: 'utility-sewer-rain', x: 310, y: 111, text: '下水接続・雨水排水位置', textAnchor: 'start', className: 'text-legend', fontSize: 2.5 }), p.drawText({ id: 'site-sidewalk-label', x: x(site.x + site.width / 2), y: y(site.y) - 18, text: '歩道', className: 'text-note', fontSize: 2.5 }), p.drawText({ id: 'vehicle-entry-label', x: x(site.x + site.width * .2), y: y(site.y) - 3, text: '車両出入口', className: 'text-note', fontSize: 2.5 }), p.drawText({ id: 'bicycle-parking-label', x: x(site.x + site.width * .15), y: y(site.y + site.height * .5), text: '駐輪場', className: 'text-note', fontSize: 2.5 }), p.drawText({ id: 'dry-area-site-label', x: x(site.x + site.width * .9), y: y(site.y + site.height * .45), text: 'ドライエリア', className: 'text-note', fontSize: 2.5 }), p.drawText({ id: 'rooftop-equipment-site-label', x: x(b.x + b.width * .75), y: y(b.y + b.height * .25), text: '屋上設備範囲', className: 'text-note', fontSize: 2.5 }), p.drawText({ id: 'legend-site', x: 310, y: 190, text: '凡例：敷地境界・道路・建物・外構', textAnchor: 'start', className: 'text-legend', fontSize: 2.5 })].join('');
      svg = add(svg, 'Layer01_Architecture', roads + arch.join(''));
      svg = add(svg, 'Layer03_Dimensions', options.showDimensions === false ? '' : dim);
      svg = add(svg, 'Layer05_Text', text);
      svg = add(svg, 'Layer04_Equipment', p.drawRect({ id: 'outdoor-equipment-yard', x: x(site.x + site.width * .72), y: y(site.y + site.height * .62), width: l(16000), height: l(10000), fill: 'none', className: 'line-thin' }) + p.drawText({ id: 'outdoor-equipment-yard-label', x: x(site.x + site.width * .80), y: y(site.y + site.height * .67), text: '屋外設備置場', className: 'text-note', fontSize: 2.5 }));
      return svg;
    } catch (error) { return base.createSvgDocument({ title: '配置図生成エラー', scale: 'S=1/500' }).replace('</svg>', `<text id="renderer-error" x="30" y="40" class="text-note">SVG生成に失敗: ${p.escapeXml(error.message)}</text></svg>`); }
  }
  const api = { renderSitePlan };
  if (typeof module !== 'undefined') module.exports = api;
  root.sitePlanRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

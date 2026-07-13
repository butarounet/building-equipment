(function (root) {
  const p = root.svgPrimitives || (typeof require === 'function' ? require('./svgPrimitives') : {});
  const base = root.svgRenderer || (typeof require === 'function' ? require('./svgRenderer') : {});
  const escId = (v) => String(v ?? 'x').replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase() || 'x';
  const idFactory = () => { const used = new Set(); return (prefix, raw) => { let id = `${prefix}-${escId(raw)}`; let out = id; let i=2; while(used.has(out)) out=`${id}-${i++}`; used.add(out); return out; }; };
  const num = (v, f=0) => Number.isFinite(Number(v)) ? Number(v) : f;
  function layer(svg, name, content) { return svg.replace(new RegExp(`(<g id="${name}"[^>]*>)`), `$1${content}`); }
  function renderSitePlan(sitePlan, options = {}) {
    try {
      const makeId = idFactory(); const boundary = sitePlan?.siteBoundary || { x:0, y:0, width:100000, height:70000 }; const bw=num(boundary.width,100000), bh=num(boundary.height,70000);
      const scale = Math.min(260 / bw, 180 / bh); const ox=45, oy=45; const x=(v)=>ox+num(v)*scale, y=(v)=>oy+num(v)*scale, l=(v)=>num(v)*scale;
      let svg = base.createSvgDocument({ sheetSize:'A3', orientation:'landscape', title:'配置図', drawingNumber:sitePlan?.drawingId || 'A-SITE', projectTitle:options.projectTitle || '建築設備士 第二次試験', scale:`S=${options.scale || sitePlan?.scale || '1/500'}` });
      const arch=[]; const dims=[]; const text=[]; const print=[];
      arch.push(p.drawRect({ id:makeId('site-boundary', boundary.id), x:x(boundary.x), y:y(boundary.y), width:l(bw), height:l(bh), fill:'none', className:'line-heavy' }));
      (sitePlan?.roads || []).forEach((r,i)=>{ const north=String(r.side||'').includes('北'); const east=String(r.side||'').includes('東'); const rx=north?x(0):east?x(bw)+4:x(0); const ry=north?y(0)-14:east?y(0):y(bh)+4; arch.push(p.drawRect({ id:makeId('road', r.side||i), x:rx, y:ry, width:north?l(bw):12, height:north?12:l(bh), fill:'none', className:'line-medium' })); text.push(p.drawText({ id:makeId('road-label', r.side||i), x:rx+(north?l(bw)/2:6), y:ry+(north?6:l(bh)/2), text:`${r.type||'道路'} 幅員${r.width||''}${r.unit||'m'}`, className:'text-note' })); });
      const b = sitePlan?.buildingOutline || { x:12000, y:10000, width:64000, height:40000 };
      arch.push(p.drawRect({ id:makeId('building-outline', b.id), x:x(b.x), y:y(b.y), width:l(b.width), height:l(b.height), fill:'none', className:'line-heavy' }));
      ['車寄せ','駐車場','搬入口','歩行者入口','サービス入口','屋外設備置場','緑地'].forEach((label,i)=>{ const px=x(6000+(i%3)*26000), py=y(bh-14000-Math.floor(i/3)*10000); arch.push(p.drawRect({ id:makeId('site-feature', label), x:px, y:py, width:22, height:10, fill:'none', className:'line-thin' })); text.push(p.drawText({ id:makeId('site-feature-label', label), x:px+11, y:py+5, text:label, className:'text-note' })); });
      const utilities = [['受電引込位置','electric'],['都市ガス引込位置','gas'],['上水引込位置','water'],['下水接続位置','sewer'],['雨水排水位置','rainwater']];
      utilities.forEach(([label,key],i)=>{ const px=x(bw)+20, py=y(8000+i*8000); arch.push(p.drawCircle({ id:makeId('utility', key), x:px, y:py, r:2.2, fill:'none', className:'line-medium' })); text.push(p.drawText({ id:makeId('utility-label', key), x:px+5, y:py, text:label, textAnchor:'start', className:'text-note' })); });
      const set = sitePlan?.placementDimensions || {}; dims.push(p.drawDimensionLine({ id:makeId('dimension','site-width'), x1:x(0), y1:y(bh)+12, x2:x(bw), y2:y(bh)+12, text:`敷地 ${Math.round(bw/1000)}m` }), p.drawDimensionLine({ id:makeId('dimension','building-width'), x1:x(b.x), y1:y(num(b.y)+num(b.height))+9, x2:x(num(b.x)+num(b.width)), y2:y(num(b.y)+num(b.height))+9, text:`建物 ${Math.round(num(b.width)/1000)}m` }), p.drawScaleBar({ id:makeId('scale-bar','site'), x:300, y:232, text:`S=${sitePlan?.scale||'1/500'}` }));
      text.push(p.drawNorthArrow({ id:makeId('north-arrow','site'), x:365, y:45 }), p.drawGroup({ id:makeId('legend','site'), children:[p.drawText({x:315,y:92,text:'凡例',className:'text-title',fontSize:4}), ...['敷地境界','道路','建物外形','外構施設','インフラ引込'].map((t,i)=>p.drawText({x:315,y:100+i*5,text:t,textAnchor:'start',className:'text-legend'}))] }));
      svg = layer(svg,'Layer01_Architecture',arch.join('')); svg = layer(svg,'Layer03_Dimensions',dims.join('')); svg = layer(svg,'Layer05_Text',text.join('')); svg = layer(svg,'Layer06_Answer',''); svg = layer(svg,'Layer07_Print',print.join(''));
      return svg;
    } catch (error) { return base.createSvgDocument({ title:'配置図生成エラー', scale:'S=1/500' }).replace('</svg>', `${p.drawText({ id:'site-plan-error', x:210, y:145, text:`SVG生成に失敗: ${error.message}`, className:'text-note' })}</svg>`); }
  }
  const api = { renderSitePlan };
  if (typeof module !== 'undefined') module.exports = api;
  root.sitePlanRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);

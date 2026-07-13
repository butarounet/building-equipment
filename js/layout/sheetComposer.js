(function(root){
 const {createDrawingCoordinateSystem}=root.drawingCoordinateSystem||(typeof require==='function'?require('./drawingCoordinateSystem'):{});
 const types=['配置図','複数階平面図','代表階平面図','設備平面図','系統図','部分詳細図','答案用紙'];
 const keyMap={site:'配置図',multiFloor:'複数階平面図',typicalFloor:'代表階平面図',equipment:'設備平面図',system:'系統図',detail:'部分詳細図',answer:'答案用紙'};
 const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 function composeSheet({drawingType='代表階平面図',scale='1/200',title='図面',drawingNumber='A-001',projectTitle='ホテル計画',pageNumber='1/1'}={}){
  const type=keyMap[drawingType]||drawingType; const body=type==='配置図'?{x:22,y:22,width:296,height:254}:type==='答案用紙'?{x:22,y:28,width:374,height:220}:{x:22,y:22,width:296,height:254};
  const cs=createDrawingCoordinateSystem({scale,sheetWidth:420,sheetHeight:297,drawingArea:body});
  const sheet={width:420,height:297,type,body:cs.regions.body,regions:{...cs.regions},metadata:{title,drawingNumber,projectTitle,pageNumber,scale:cs.scale},warnings:[]};
  ['titleBlock','legend','equipmentTable','notes'].forEach(k=>{if(overlaps(sheet.body,sheet.regions[k])) sheet.warnings.push(`${k} overlaps drawing body`);});
  return sheet;
 }
 const api={composeSheet,drawingTypes:types,overlaps}; if(typeof module!=='undefined')module.exports=api; root.sheetComposer=api;
})(typeof window!=='undefined'?window:globalThis);

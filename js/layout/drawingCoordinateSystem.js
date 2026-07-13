(function(root){
 const SUPPORTED=[100,200,400,500];
 const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
 const parseScale=(s)=>{const m=String(s||'1/200').match(/1\s*\/\s*(\d+)/);const v=m?Number(m[1]):n(s,200); if(!SUPPORTED.includes(v)) throw new Error(`Unsupported scale: 1/${v}`); return v;};
 function createDrawingCoordinateSystem({scale='1/200',sheetWidth=420,sheetHeight=297,drawingArea,modelUnit='mm'}={}){
  const denominator=parseScale(scale); const margin={top:12,right:12,bottom:12,left:12};
  const titleBlock={x:265,y:258,width:143,height:27}; const legend={x:320,y:34,width:76,height:48}; const equipmentTable={x:320,y:88,width:76,height:58}; const notes={x:320,y:152,width:76,height:58};
  const body=drawingArea||{x:22,y:22,width:284,height:242};
  const factor=(modelUnit==='m'?1000:1)/denominator;
  const toSvg=({x=0,y=0}={})=>({x:body.x+n(x)*factor,y:body.y+n(y)*factor});
  const toModel=({x=0,y=0}={})=>({x:(n(x)-body.x)/factor,y:(n(y)-body.y)/factor});
  const lengthToSvg=(mm)=>n(mm)*factor;
  return {scale:`1/${denominator}`,scaleDenominator:denominator,sheet:{width:sheetWidth,height:sheetHeight,margin},regions:{body,titleBlock,legend,equipmentTable,notes,scale:{x:300,y:230,width:70,height:16},drawingNumber:{x:360,y:264,width:36,height:8},projectTitle:{x:269,y:271,width:90,height:8},pageNumber:{x:372,y:272,width:24,height:8},examineeNumber:{x:20,y:258,width:70,height:12},name:{x:92,y:258,width:70,height:12}},clip:{id:'drawing-body-clip',x:body.x,y:body.y,width:body.width,height:body.height},modelUnit,toSvg,toModel,lengthToSvg,x:(v)=>toSvg({x:v,y:0}).x,y:(v)=>toSvg({x:0,y:v}).y,l:lengthToSvg};
 }
 const api={createDrawingCoordinateSystem}; if(typeof module!=='undefined')module.exports=api; root.drawingCoordinateSystem=api;
})(typeof window!=='undefined'?window:globalThis);

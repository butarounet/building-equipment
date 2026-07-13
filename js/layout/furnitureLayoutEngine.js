(function(root){
 const safe=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
 function furnitureForRoom(r){
  if(!r||r.zone!=='guest')return [];
  const x=safe(r.x),y=safe(r.y),w=safe(r.width),h=safe(r.height); const north=y<3000;
  const entryH=Math.min(1800,h*.22), bathW=Math.min(1700,w*.45), bathH=Math.min(2400,h*.34);
  const by=north?y+entryH:y+h-entryH-bathH; const livingY=north?y+entryH:y+600; const bedY=north?livingY+900:y+h-entryH-3000;
  const twin=(r.roomType||'').includes('ツイン')||w>3800; const suite=(r.roomType||'').includes('スイート')||w>5200;
  const list=[
   {type:'bath',name:'UB',x:x+200,y:by,width:bathW,height:bathH,roomId:r.roomId},{type:'basin',name:'洗面',x:x+320,y:by+250,width:500,height:350,roomId:r.roomId},{type:'toilet',name:'便器',x:x+bathW-720,y:by+300,width:420,height:620,roomId:r.roomId},
   {type:'entry',name:'前室',x:x+200,y:north?y+150:y+h-entryH+150,width:w-400,height:entryH-300,roomId:r.roomId},
   {type:'desk',name:'机',x:x+w-1050,y:livingY+400,width:750,height:450,roomId:r.roomId},{type:'chair',name:'椅子',x:x+w-850,y:livingY+930,width:360,height:360,roomId:r.roomId},{type:'tv',name:'TV',x:x+w-220,y:bedY+600,width:90,height:900,roomId:r.roomId},{type:'closet',name:'収納',x:x+w-900,y:north?y+250:y+h-1050,width:700,height:700,roomId:r.roomId},{type:'sideTable',name:'ST',x:x+250,y:bedY+650,width:350,height:350,roomId:r.roomId}
  ];
  if(suite){list.push({type:'bed',name:'ベッド',x:x+850,y:bedY,width:1800,height:2100,roomId:r.roomId},{type:'sofa',name:'ソファ',x:x+2900,y:bedY+350,width:1300,height:650,roomId:r.roomId});}
  else if(twin){list.push({type:'bed',name:'ベッド',x:x+700,y:bedY,width:950,height:2050,roomId:r.roomId},{type:'bed',name:'ベッド',x:x+1800,y:bedY,width:950,height:2050,roomId:r.roomId});}
  else list.push({type:'bed',name:'ベッド',x:x+850,y:bedY,width:1400,height:2050,roomId:r.roomId});
  return list;
 }
 function createFurnitureLayout(floorPlan={}){return (floorPlan.rooms||[]).flatMap(furnitureForRoom);}
 const api={createFurnitureLayout,furnitureForRoom}; if(typeof module!=='undefined')module.exports=api; root.furnitureLayoutEngine=api;
})(typeof window!=='undefined'?window:globalThis);

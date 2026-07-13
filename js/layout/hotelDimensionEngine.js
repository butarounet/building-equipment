(function(root){
 const safe=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
 function createHotelDimensions(plan={}){const w=safe(plan.footprint?.width,64000),d=safe(plan.footprint?.depth,40000); const dims=[{id:'overall-w',kind:'overall',x1:0,y1:d+9000,x2:w,y2:d+9000,text:`${Math.round(w)}`},{id:'overall-d',kind:'overall',x1:w+9000,y1:0,x2:w+9000,y2:d,text:`${Math.round(d)}`},{id:'corridor-w',kind:'corridor',x1:w*.42,y1:d/2-1050,x2:w*.42,y2:d/2+1050,text:'2100' }];
 (plan.gridLines?.x||[]).slice(1).forEach((g,i,a)=>{const prev=(plan.gridLines.x||[])[i]; dims.push({id:`grid-x-${i+1}`,kind:'grid',x1:prev.position??prev.coordinate,y1:d+5200,x2:g.position??g.coordinate,y2:d+5200,text:`${Math.round((g.position??g.coordinate)-(prev.position??prev.coordinate))}`});});
 (plan.gridLines?.y||[]).slice(1).forEach((g,i)=>{const prev=plan.gridLines.y[i]; dims.push({id:`grid-y-${i+1}`,kind:'grid',x1:w+5200,y1:prev.position??prev.coordinate,x2:w+5200,y2:g.position??g.coordinate,text:`${Math.round((g.position??g.coordinate)-(prev.position??prev.coordinate))}`});});
 (plan.rooms||[]).filter(r=>r.zone==='guest').slice(0,6).forEach((r,i)=>dims.push({id:`guest-module-${i+1}`,kind:'room',x1:r.x,y1:r.y+r.height+1200,x2:r.x+r.width,y2:r.y+r.height+1200,text:`${Math.round(r.width)}`}));
 (plan.rooms||[]).filter(r=>['core','shaft','back','plant'].includes(r.zone)).slice(0,10).forEach((r,i)=>dims.push({id:`room-${i+1}`,kind:'room',x1:r.x,y1:r.y-900,x2:r.x+r.width,y2:r.y-900,text:`${Math.round(r.width)}`}));
 return dims;}
 const api={createHotelDimensions}; if(typeof module!=='undefined')module.exports=api; root.hotelDimensionEngine=api;
})(typeof window!=='undefined'?window:globalThis);

const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/svg/svgPrimitives');
require('../js/svg/svgSymbols');
require('../js/svg/svgRenderer');
require('../js/svg/equipmentSymbols');
require('../js/svg/equipmentDrawingShared');
require('../js/svg/architecturalDrawingRenderer');
require('../js/svg/hvacDrawingRenderer');
require('../js/svg/plumbingDrawingRenderer');
require('../js/svg/electricalDrawingRenderer');
const { renderEquipmentDrawing } = require('../js/svg/equipmentDrawingRenderer');

const floorPlan = { drawingId:'floor-plan-1', floorId:'1', floorName:'1階', scale:'1/200', rooms:[{roomId:'r1',name:'ロビー',x:0,y:0,width:12000,height:9000},{roomId:'r2',name:'厨房',x:13000,y:0,width:12000,height:9000}], equipmentSpaces:[{id:'eq1',name:'機械室',x:3000,y:14000,width:9000,height:6000}], shafts:[{id:'eps',shaftType:'EPS',x:52000,y:16000,width:2500,height:2500},{id:'ps',shaftType:'PS',x:52000,y:19500,width:2500,height:2500},{id:'ds',shaftType:'DS',x:52000,y:23000,width:2500,height:2500}], columns:[{id:'c1',x:0,y:0,width:700,height:700}], doors:[], windows:[], gridLines:{x:[{id:'X1',position:0},{id:'X2',position:64000}],y:[{id:'Y1',position:0},{id:'Y2',position:40000}]}};
const equipment = { equipment:{ hvac:{systems:[{name:'中央熱源方式',category:'空調設備',capacity:{value:1200,unit:'kW'},location:'機械室'}]}, ventilation:{systems:[{name:'全熱交換器',category:'換気設備',capacity:{value:20000,unit:'m3/h'},location:'DS'}]}, waterSupply:{systems:[{name:'受水槽＋加圧給水',category:'給水設備',capacity:{value:100,unit:'m3'},location:'給水設備室'}]}, hotWater:{systems:[{name:'中央給湯',category:'給湯設備',capacity:{value:10000,unit:'L/h'},location:'機械室'}]}, drainage:{systems:[{name:'分流排水',category:'排水設備',capacity:{value:90,unit:'m3/day'},location:'PS'}]}, fireSafety:{systems:[{name:'スプリンクラー',category:'消火設備',capacity:{value:2000,unit:'L/min'},location:'機械室'}]}, electrical:{systems:[{name:'動力・電灯幹線',category:'電気設備',capacity:{value:1500,unit:'kVA'},location:'EPS'}]}, receivingTransformer:{systems:[{name:'高圧受変電',category:'受変電設備',capacity:{value:1800,unit:'kVA'},location:'受変電室'}]}, emergencyPower:{systems:[{name:'非常用発電機',category:'非常電源設備',capacity:{value:600,unit:'kVA'},location:'発電機室'}]}, lighting:{systems:[{name:'LED照明',category:'照明設備',capacity:{value:180,unit:'kW'},location:'EPS'}]}, buildingManagement:{systems:[{name:'中央監視・BEMS',category:'中央監視設備',location:'中央監視室'}]} } };
function ids(svg){return [...svg.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);}
function assertCommon(svg){assert.match(svg,/^<svg/);assert.match(svg,/Layer01_Architecture/);assert.match(svg,/Layer04_Equipment/);assert.match(svg,/equipment-legend-title/);assert.match(svg,/equipment-schedule-title/);assert.match(svg,/eqsym-/);assert.match(svg,/route-(ds|ps|eps)/i);assert.match(svg,/equipment-print-style/);assert.equal(new Set(ids(svg)).size, ids(svg).length);}

test('空調設備図SVGが生成される',()=>assertCommon(renderEquipmentDrawing({drawing:floorPlan,equipment,discipline:'hvac'})));
test('給排水衛生設備図SVGが生成される',()=>assertCommon(renderEquipmentDrawing({drawing:floorPlan,equipment,discipline:'plumbing'})));
test('電気設備図SVGが生成される',()=>assertCommon(renderEquipmentDrawing({drawing:floorPlan,equipment,discipline:'electrical'})));
test('白黒モードが動作する',()=>{const svg=renderEquipmentDrawing({drawing:floorPlan,equipment,discipline:'hvac',options:{monochrome:true}});assert.match(svg,/stroke:#000/);});
test('画面補助色モードが動作する',()=>{const svg=renderEquipmentDrawing({drawing:floorPlan,equipment,discipline:'electrical',options:{screenColorMode:true,monochrome:false}});assert.match(svg,/#cc0000/);});
test('無効データでも例外終了しない',()=>{assert.doesNotThrow(()=>renderEquipmentDrawing({drawing:null,equipment:null,discipline:'bad'}));assert.match(renderEquipmentDrawing({drawing:null,equipment:null,discipline:'bad'}),/設備図生成失敗/);});

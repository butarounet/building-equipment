(function(root){
 const req={
  '1':[['エントランス','ロビー'],['ロビー','フロント'],['ロビー','ラウンジ'],['レストラン','厨房'],['厨房','搬入口'],['厨房','バックヤード'],['中央管理室','エントランス'],['便所','ロビー']],
  '2':[['大宴会場','ホワイエ'],['大宴会場','前室'],['大宴会場','宴会厨房'],['宴会厨房','サービスEV'],['大宴会場','便所'],['大宴会場','倉庫']],
  '3':[['男性浴室','男性脱衣室'],['女性浴室','女性脱衣室'],['男性浴室','ろ過設備室'],['フィットネス','更衣室'],['リネン室','サービス廊下'],['SPA受付','客用廊下']],
  TYP:[['客室','中廊下'],['客室浴室','客室給排水PS'],['リネン室','サービスEV'],['EVホール','中廊下'],['階段','中廊下'],['EPS','中廊下']],
  B1:[['空調熱源設備室','機器搬入スペース'],['受変電室','ドライエリア'],['発電機室','ドライエリア'],['給水設備室','受水槽'],['給湯設備室','PS'],['従業員更衣室','従業員食堂'],['倉庫','サービスEV']]
 };
 const avoid=[['客室','大型機械室'],['宴会場','発電機室'],['客室','厨房排気DS'],['ロビー','ごみ置場'],['浴場','受変電室'],['厨房','客用EVホール']];
 function getHotelAdjacencyRules(){return {required:req,avoid,scoreRequired:10,scoreAvoid:-10};}
 function scoreAdjacency(a,b,floorId){const n=[a,b].map(v=>String(v)); if(avoid.some(p=>p.every(x=>n.some(y=>y.includes(x)||x.includes(y)))))return -10; const list=req[floorId]||[]; return list.some(p=>p.every(x=>n.some(y=>y.includes(x)||x.includes(y))))?10:0;}
 const api={getHotelAdjacencyRules,scoreAdjacency}; if(typeof module!=='undefined')module.exports=api; root.hotelAdjacencyRules=api;
})(typeof window!=='undefined'?window:globalThis);

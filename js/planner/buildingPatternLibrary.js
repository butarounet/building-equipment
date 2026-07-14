(function(root){
 const arr=(v)=>Array.isArray(v)?v:[];
 const USES={
  hotel:{label:'ホテル',patterns:[{patternId:'hotel_city_large',scale:'large',minArea:12000,maxArea:42000,minFloors:8,maxFloors:14,program:['ロビー','中央コア','客室モジュール','宴会場','厨房','レストラン','バックヤード','SPA','ランドリー','設備機械室','屋外機置場'],flows:['サービス動線','宿泊者動線','搬入動線'],core:'central',roomBands:'perimeter',lowRise:['ロビー','宴会場','厨房','レストラン'],equipment:['設備機械室','屋外機置場']}]},
  hospital:{label:'病院',patterns:[{patternId:'hospital_general_mid',scale:'mid',minArea:9000,maxArea:36000,minFloors:4,maxFloors:10,program:['外来','病棟','中央診療部','手術部','検査部','放射線部','SPD','厨房','霊安室','設備機械室'],flows:['患者動線','職員動線','清潔動線','汚染動線'],core:'nurse-central',roomBands:'patient-perimeter'}]},
  school:{label:'学校',patterns:[{patternId:'school_standard',scale:'mid',minArea:4500,maxArea:18000,minFloors:3,maxFloors:5,program:['普通教室','特別教室','職員室','図書室','体育館','家庭科室','理科室','音楽室','配膳室','EV','階段'],flows:['生徒動線','管理動線','給食動線'],core:'distributed',roomBands:'classroom-perimeter'}]},
  office:{label:'事務所',patterns:[{patternId:'office_urban_core',scale:'mid',minArea:6000,maxArea:30000,minFloors:5,maxFloors:16,program:['執務室','会議室','応接室','役員室','給湯室','コピー室','サーバ室','受付','ラウンジ','防災センター'],flows:['来客動線','執務者動線','搬入動線'],core:'central',roomBands:'office-perimeter'}]},
  laboratory:{label:'研究施設',patterns:[{patternId:'laboratory_research_standard',scale:'mid',minArea:6000,maxArea:26000,minFloors:3,maxFloors:8,program:['研究室','実験室','前室','薬品庫','会議室','設備機械室'],flows:['研究者動線','試料動線','廃棄動線'],core:'service-spine'}]},
  museum:{label:'美術館',patterns:[{patternId:'museum_gallery_standard',scale:'mid',minArea:5000,maxArea:22000,minFloors:2,maxFloors:5,program:['展示室','収蔵庫','搬入口','荷解室','ロビー','カフェ','設備機械室'],flows:['来館者動線','作品搬入動線','管理動線'],core:'back-core'}]},
  government:{label:'庁舎',patterns:[{patternId:'government_office_standard',scale:'mid',minArea:7000,maxArea:32000,minFloors:4,maxFloors:12,program:['窓口','執務室','議場','会議室','防災センター','書庫'],flows:['来庁者動線','職員動線','防災動線'],core:'central'}]},
  logistics:{label:'物流施設',patterns:[{patternId:'logistics_distribution_standard',scale:'large',minArea:10000,maxArea:60000,minFloors:1,maxFloors:4,program:['荷捌き','倉庫','事務室','ドック','設備機械室'],flows:['大型車動線','作業者動線','搬送動線'],core:'edge'}]},
  commercial:{label:'商業施設',patterns:[{patternId:'commercial_retail_standard',scale:'large',minArea:8000,maxArea:50000,minFloors:2,maxFloors:8,program:['物販','飲食','バックヤード','荷捌き','共用通路','設備機械室'],flows:['来客動線','搬入動線','従業員動線'],core:'multiple'}]},
  mixedUse:{label:'複合施設',patterns:[{patternId:'mixed_use_urban_standard',scale:'large',minArea:12000,maxArea:70000,minFloors:6,maxFloors:20,program:['低層商業','中層業務','高層宿泊','共用ロビー','防災センター'],flows:['用途別来客動線','管理動線','搬入動線'],core:'separated'}]}
 };
 const aliases={ホテル:'hotel',病院:'hospital',学校:'school',事務所:'office',研究施設:'laboratory',美術館:'museum',庁舎:'government',物流施設:'logistics',商業施設:'commercial',複合施設:'mixedUse'};
 function normalizeUse(use='hotel'){return aliases[use]||String(use||'hotel').replace(/[-_ ]/g,'').toLowerCase().replace('mixeduse','mixedUse');}
 function listBuildingUses(){return Object.entries(USES).map(([buildingUse,v])=>({buildingUse,label:v.label,patternCount:v.patterns.length}));}
 function getPatterns(buildingUse='hotel'){return arr(USES[normalizeUse(buildingUse)]?.patterns).map(p=>({...p,buildingUse:normalizeUse(buildingUse)}));}
 function getPattern(patternId,buildingUse){return (buildingUse?getPatterns(buildingUse):Object.keys(USES).flatMap(getPatterns)).find(p=>p.patternId===patternId)||null;}
 const api={USES,normalizeUse,listBuildingUses,getPatterns,getPattern}; if(typeof module!=='undefined')module.exports=api; root.buildingPatternLibrary=api;
})(typeof window!=='undefined'?window:globalThis);

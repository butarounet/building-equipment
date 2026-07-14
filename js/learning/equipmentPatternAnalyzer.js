const arr=(v)=>Array.isArray(v)?v:(v?[v]:[]);
const TERMS=['AHU','VAV','FCU','PAC','給水','給湯','排水','通気','照明','受変電','非常電源','BEMS','厨房','グリース','スプリンクラー'];
function analyzeEquipmentPatterns(exams=[]){const frequency=Object.fromEntries(TERMS.map(t=>[t,0])); const systems={}; arr(exams).forEach(exam=>{const s=JSON.stringify(exam); TERMS.forEach(t=>{const n=(s.match(new RegExp(t,'g'))||[]).length; frequency[t]+=n;}); Object.values(exam.selection||exam.electiveSections||{}).flat().concat(Object.values(exam.common||{}).flat()).forEach(q=>arr(q.relatedSystems).forEach(x=>systems[x]=(systems[x]||0)+1));}); return {frequency,systems,trend:Object.entries({...frequency,...systems}).sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count}))};}
module.exports={analyzeEquipmentPatterns};

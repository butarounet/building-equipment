const arr=(v)=>Array.isArray(v)?v:(v?[v]:[]);
const textOf=(v)=>typeof v==='string'?v:JSON.stringify(v||'');
function tokenize(text=''){return [...new Set(String(text).replace(/[\s、。・（）()「」]/g,' ').split(/\s+/).filter(Boolean))];}
function analyzeQuestionPatterns(exams=[]){
  const docs=arr(exams); const questions=[];
  docs.forEach((exam)=>{ Object.values(exam.selection||exam.electiveSections||{}).flat().forEach((q,i)=>questions.push({...q,section:'selection',order:i+1,year:exam.year||exam.reiwa})); Object.values(exam.common||{}).flat().forEach((q,i)=>questions.push({...q,section:'common',order:i+1,year:exam.year||exam.reiwa})); if(!questions.some(q=>q.year===(exam.year||exam.reiwa))){ (exam.questionBook?.sections||[]).forEach((section,i)=>questions.push({questionId:`${exam.reiwa||exam.year}-${section}`,title:section,category:section,prompt:`${section}について条件を整理し、必要事項を述べよ。`,answerType:/drawing|図/.test(section)?'diagram':'description',section:'template',order:i+1,year:exam.year||exam.reiwa,conditions:[]})); } });
  const allText=questions.map((q)=>[q.title,q.prompt,...arr(q.conditions)].join(' ')).join(' ');
  const endings=(allText.match(/(述べよ|算定せよ|作成せよ|示せ|検討せよ)/g)||[]).reduce((m,k)=>(m[k]=(m[k]||0)+1,m),{});
  const headings=[...new Set(questions.map((q)=>q.category||q.title).filter(Boolean))];
  const frequency={answerType:{},section:{},keywords:{}};
  questions.forEach((q)=>{frequency.answerType[q.answerType]=(frequency.answerType[q.answerType]||0)+1;frequency.section[q.section]=(frequency.section[q.section]||0)+1;tokenize([q.title,q.prompt].join(' ')).forEach(k=>{if(k.length>=2)frequency.keywords[k]=(frequency.keywords[k]||0)+1;});});
  return {years:[...new Set(docs.map(d=>d.reiwa||d.year).filter(Boolean))],questionCount:questions.length,style:{endings,headings,sequence:questions.map(q=>q.questionId||q.id)},frequency,patterns:questions.map(q=>({id:q.questionId||q.id,section:q.section,answerType:q.answerType,systems:arr(q.relatedSystems),rooms:arr(q.relatedRooms),template:textOf(q.prompt).replace(/[0-9０-９]+/g,'#').slice(0,120)}))};
}
module.exports={analyzeQuestionPatterns,tokenize};

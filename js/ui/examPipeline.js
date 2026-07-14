var ExamStateRef = (typeof require !== 'undefined' ? require('./examState') : { ExamState: window.ExamState }).ExamState;
function optionalRequire(path) { try { return require(path); } catch (_) { return {}; } }
function commonQuestions(common) { return Array.isArray(common) ? common : Object.values(common || {}); }
const defaultDeps = () => ({
  planHotelProject: globalThis.planHotelProject || optionalRequire('../planner/buildingPlanner').planHotelProject,
  generateBuilding: globalThis.generateBuilding || optionalRequire('../generator/buildingGenerator').generateBuilding,
  generateEquipment: globalThis.generateEquipment || optionalRequire('../generator/equipmentGenerator').generateEquipment,
  generateMaterials: globalThis.generateMaterials || optionalRequire('../generator/materialGenerator').generateMaterials,
  generateExam: globalThis.generateExam || optionalRequire('../generator/examGenerator').generateExam,
  generateDrawings: globalThis.generateDrawings || optionalRequire('../generator/drawingGenerator').generateDrawings,
  generateAnswerSheets: globalThis.generateAnswerSheets || optionalRequire('../generator/answerSheetGenerator').generateAnswerSheets,
  generateExamPackage: globalThis.generateExamPackage || optionalRequire('../generator/examPackageGenerator').generateExamPackage,
  checkExamConsistency: globalThis.checkExamConsistency || optionalRequire('../quality/examConsistencyEngine').checkExamConsistency
});
class ExamPipeline {
  constructor({ state = new ExamStateRef(), dependencies = {}, onProgress = () => {} } = {}) { this.state = state; this.dependencies = { ...defaultDeps(), ...dependencies }; this.onProgress = onProgress; }
  progress(step, detail = {}) { this.onProgress({ step, ...detail }); }
  requireGenerator(name) { if (typeof this.dependencies[name] !== 'function') throw new Error(`${name} is not available.`); return this.dependencies[name]; }
  generateModelAnswers(exam, answerSheets) { return { title: '資料3 模範解答 / 資料4 設備模範図', answers: commonQuestions(exam?.common).map((q) => ({ questionId: q.questionId, title: q.title, room: q.autoSelection?.roomType || q.relatedRooms?.[0], systems: q.relatedSystems || [], answerSheet: 'AnswerSheet4' })), references: answerSheets?.questionAnswerMap || [] }; }
  createPrintPackage(snapshot) { const artifacts = snapshot.examPackage?.artifacts || []; return { printable: !!snapshot.consistency?.passed, blockedReason: snapshot.consistency?.passed ? null : '品質チェック失敗のためPDF生成は禁止されています。', pdfSources: snapshot.consistency?.passed ? artifacts.filter((a) => a.type === 'pdf').map((a) => a.path) : [], svgSources: artifacts.filter((a) => a.type === 'svg').map((a) => a.path), jsonSources: artifacts.filter((a) => a.type === 'json').map((a) => a.path), json: snapshot }; }
  createPreviewPackage(snapshot) { const artifacts = snapshot.examPackage?.artifacts || []; return { ready: true, dummy: false, sections: ['examBooklet', 'building', 'equipment', 'materials', 'questions', 'buildingDrawing', 'blankDrawing', 'equipmentDrawing', 'answerSheets', 'modelAnswers', 'consistency', 'printPackage'], artifacts: artifacts.map(({ id, type, path, checksum }) => ({ id, type, path, checksum })), summary: { printable: !!snapshot.printPackage?.printable, passed: !!snapshot.consistency?.passed, score: snapshot.consistency?.score ?? null, updatedAt: snapshot.updatedAt } }; }
  async generate(options = {}) {
    this.progress('Building...'); const plan = this.dependencies.planHotelProject ? this.dependencies.planHotelProject(options.planner || {}) : null; const building = this.requireGenerator('generateBuilding')({ plan, options: options.building }); this.state.set('building', building);
    this.progress('Equipment...'); const equipment = this.requireGenerator('generateEquipment')(building, options.equipment); this.state.set('equipment', equipment);
    this.progress('Material...'); const materials = this.requireGenerator('generateMaterials')({ plan, building, equipment, options: options.materials }); this.state.set('materials', materials);
    this.progress('Question...'); const exam = this.requireGenerator('generateExam')({ plan, building, equipment, materials, drawings: null, options: options.exam }); this.state.set('exam', exam); this.state.set('questions', { selection: exam.selection || exam.electiveSections, common: exam.common });
    this.progress('Drawing...'); const drawings = this.requireGenerator('generateDrawings')({ plan, building, equipment, materials, exam, options: options.drawings }); this.state.set('buildingDrawing', { sitePlan: drawings.sitePlan, floorPlans: drawings.floorPlans, detailDrawings: drawings.detailDrawings, drawingSetId: drawings.drawingSetId });
    this.progress('Blank Drawing...'); this.state.set('blankDrawing', { blankPlans: drawings.blankPlans || [], drawingSetId: drawings.drawingSetId });
    this.progress('Equipment Drawing...'); this.state.set('equipmentDrawing', { equipmentPlans: drawings.equipmentPlans || drawings.floorPlans, systemDiagrams: drawings.systemDiagrams || [], legends: drawings.legends || [], drawingSetId: drawings.drawingSetId });
    this.progress('AnswerSheet...'); const answerSheets = this.requireGenerator('generateAnswerSheets')({ exam, materials, drawings, options: { includeBlankPlanBackground: true, ...(options.answerSheets || {}) } }); this.state.set('answerSheets', answerSheets);
    this.progress('ModelAnswer...'); const modelAnswers = this.dependencies.generateModelAnswers ? this.dependencies.generateModelAnswers({ exam, building, equipment, drawings, answerSheets }) : this.generateModelAnswers(exam, answerSheets); this.state.set('modelAnswers', modelAnswers);
    this.progress('Consistency...'); const consistency = this.requireGenerator('checkExamConsistency')({ exam, building, equipment, materials, questions: this.state.get('questions'), drawings, answerSheets, modelAnswers }); this.state.set('consistency', consistency);
    if (typeof this.dependencies.generateExamPackage === 'function') { try { this.state.set('examPackage', this.dependencies.generateExamPackage({ exam, building, equipment, materials, drawings, answerSheets, modelAnswers })); } catch (error) { this.state.set('examPackage', { error: error.message, consistencyReport: error.consistencyReport }); } }
    this.progress('Print...'); this.state.set('printPackage', this.createPrintPackage(this.state.snapshot));
    this.progress('Preview...'); this.state.set('previewPackage', this.createPreviewPackage(this.state.snapshot));
    this.progress('Complete', { passed: consistency.passed }); return this.state.snapshot;
  }
}
if (typeof module !== 'undefined') module.exports = { ExamPipeline, defaultDeps };
if (typeof window !== 'undefined') window.ExamPipeline = ExamPipeline;

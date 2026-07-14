const test = require('node:test');
const assert = require('node:assert/strict');
const { planHotelProject } = require('../js/planner/buildingPlanner');
const { generateBuilding } = require('../js/generator/buildingGenerator');
const { generateEquipment } = require('../js/generator/equipmentGenerator');
const { generateMaterials } = require('../js/generator/materialGenerator');
const { generateDrawings } = require('../js/generator/drawingGenerator');
const { generateExam } = require('../js/generator/examGenerator');
const { generateExamPackage, PackageAssembler, ExamQualityChecker } = require('../js/generator/examPackageGenerator');

test('Step9-12は試験提出用成果物一式を統合生成する', () => {
  const plan = planHotelProject({ hotelType: '国際会議対応ホテル', random: () => 0.53 });
  const building = generateBuilding({ plan, random: () => 0.53 });
  const equipment = generateEquipment(building);
  const materials = generateMaterials({ plan, building, equipment });
  const drawings = generateDrawings({ plan, building, equipment, materials });
  const exam = generateExam({ plan, building, equipment, materials, drawings });
  const pkg = generateExamPackage({ exam, drawings, equipment, materials });
  assert.ok(pkg.examBooklet.pages.length > 0);
  assert.ok(pkg.whiteDrawings.length > 0);
  assert.ok(pkg.answerSheets.answerSheetSetId);
  assert.ok(pkg.systemDiagrams.svg.startsWith('<svg'));
  assert.ok(pkg.equipmentSchedule.rows.length > 0);
  assert.ok(pkg.legend.symbols.length > 0);
  assert.ok(pkg.svgPackage.some((p) => p.includes('blank-plans')));
  assert.ok(pkg.artifacts.some((a) => a.type === 'pdf'));
  assert.ok(pkg.artifacts.some((a) => a.type === 'zip'));
  assert.ok(pkg.submissionMetadata.checksums['pdf/submission.pdf']);
});

test('PackageAssemblerとExamQualityCheckerは品質項目を検査する', () => {
  const plan = planHotelProject({ random: () => 0.42 });
  const building = generateBuilding({ plan, random: () => 0.42 });
  const equipment = generateEquipment(building);
  const materials = generateMaterials({ plan, building, equipment });
  const drawings = generateDrawings({ plan, building, equipment, materials });
  const exam = generateExam({ plan, building, equipment, materials, drawings });
  const pkg = PackageAssembler.assemble({ exam, drawings, equipment, materials });
  const report = ExamQualityChecker.check(pkg);
  for (const label of ['問題冊子生成','建築図生成','白図生成','答案生成','系統図生成','PDF生成','SVG生成','ZIP生成','建築設備士第二次試験レベル適合']) {
    assert.equal(report.checklist.find((c) => c.label === label)?.ok, true, label);
  }
  assert.equal(report.isValid, true, report.errors.join('\n'));
});

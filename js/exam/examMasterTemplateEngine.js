const { ExamTemplateRepository } = require('./examTemplateRepository');
const { selectExamYear } = require('./examYearSelector');
const { ExamTemplateRenderer } = require('./examTemplateRenderer');
const { validateExamTemplate } = require('./examTemplateValidator');

const QUALITY_GATES = ['Template','Layout','Typography','Spacing','SVG','PDF','Print','AnswerSheet','QuestionBook','CommonQuestion','Drawing'];

class ExamMasterTemplateEngine {
  constructor(options = {}) {
    this.repository = options.repository || new ExamTemplateRepository(options);
    this.renderer = options.renderer || new ExamTemplateRenderer();
  }
  generate(input = {}) {
    const selection = selectExamYear({ year: input.year, auto: input.auto, difficulty: input.difficulty, templateId: input.templateId });
    const template = this.repository.getTemplate(selection.year);
    const rendered = this.renderer.render(template, input);
    const validation = validateExamTemplate(template, rendered, input.similarity || {});
    const qualityGate = Object.fromEntries(QUALITY_GATES.map((gate) => [gate, validation.passed]));
    return { engine: 'STEP10-16 Exam Master Template Engine', selection, template, rendered, validation, qualityGate, passed: validation.passed && Object.values(qualityGate).every(Boolean) };
  }
}
function generateFromMasterTemplate(input) { return new ExamMasterTemplateEngine().generate(input); }
module.exports = { ExamMasterTemplateEngine, generateFromMasterTemplate, QUALITY_GATES };

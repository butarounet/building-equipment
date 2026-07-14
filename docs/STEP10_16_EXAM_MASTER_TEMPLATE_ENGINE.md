# STEP10-16 Exam Master Template Engine

## Purpose

The master template engine reproduces the small year-by-year differences in the real second-stage building-equipment exam. Generators must not invent fresh HTML/SVG/PDF layout. They select a Reiwa year template and bind `Building`, `Equipment`, `Question`, `Answer`, and `Drawing` values into the template slots.

## Added Modules

- `js/exam/examMasterTemplateEngine.js` orchestrates selection, repository lookup, rendering, validation, and quality gates.
- `js/exam/examTemplateRepository.js` exposes Reiwa 2 through Reiwa 7 templates.
- `js/exam/examYearSelector.js` maps `year`, `auto`, and `difficulty` inputs to a `templateId`.
- `js/exam/examTemplateRenderer.js` binds data into template slots and emits HTML, SVG, and PDF placeholders.
- `js/exam/examTemplateValidator.js` checks page count, drawings, margins, typography, SVG viewBox, frames, titles, numbering, print scale, and similarity thresholds.

## Template Repository Contents

Each yearly template stores problem booklet, answer sheet, blank drawings, architectural drawings, equipment drawings, model drawings, common questions, description fields, headers, footers, drawing frames, and page numbers.

## Integration

```text
Generator
  ↓
MasterTemplateEngine
  ↓
TemplateRenderer
  ↓
ExamConsistencyEngine
  ↓
PDF
```

## Similarity Gate

- 98% or higher: target pass level.
- Below 95%: warning.
- Below 90%: error.

## Quality Gates

`Template`, `Layout`, `Typography`, `Spacing`, `SVG`, `PDF`, `Print`, `AnswerSheet`, `QuestionBook`, `CommonQuestion`, and `Drawing` all derive from template validation.

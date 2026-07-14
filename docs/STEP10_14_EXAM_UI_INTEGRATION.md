# Step10-14 Exam UI Integration Engine

## Purpose

The Exam UI Integration Engine makes the web UI treat the Building, Equipment, Question, Blank Drawing, Answer Sheet, Model Answer, and Print outputs as one synchronized mock exam instead of independent generator previews.

## Added modules

- `js/ui/examState.js` keeps the canonical exam state.
- `js/ui/examPipeline.js` runs generators in the required dependency order.
- `js/ui/examController.js` connects the pipeline to UI actions.
- `js/ui/previewSynchronizer.js` renders every preview from `ExamState` only.
- `js/ui/progressOverlay.js` reports Building, Equipment, Questions, Drawings, Blank, Answer, Checking, and Complete states.
- `js/ui/downloadManager.js` centralizes JSON/SVG/PDF/ZIP download payloads and blocks PDF when quality checks fail.
- `js/ui/navigationSync.js` maps top navigation items to preview scroll targets.

## Generation order

1. BuildingGenerator
2. EquipmentGenerator
3. MaterialGenerator
4. QuestionGenerator
5. BuildingDrawingGenerator
6. EquipmentDrawingGenerator
7. BlankDrawingGenerator
8. AnswerSheetGenerator
9. ModelAnswerGenerator
10. ExamConsistencyEngine
11. Screen synchronization from `ExamState`

## Quality gate

`ExamConsistencyEngine` is always the final generation step. If it returns `passed: false`, `printPackage.printable` is false and `DownloadManager.pdf()` throws, preventing PDF generation while leaving JSON/SVG available for debugging.

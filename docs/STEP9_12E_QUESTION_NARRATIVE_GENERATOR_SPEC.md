# Step9-12e: Question Narrative Generator（問題文生成エンジン）

## 目的

Building Generator、Floor Planner、Equipment Generator、Question Scenario Builderで決定した条件から、建築設備士第二次試験の構成・文体に近い問題文を生成する。

## 入力

- Building JSON
- FloorPlan JSON
- Equipment JSON
- Question Scenario JSON
- Exam JSON
- Difficulty

最小入力例:

```json
{
  "discipline": "HVAC",
  "questionNo": "Q03",
  "room": "宴会場",
  "system": "AHU_VAV",
  "drawingType": "duct",
  "scale": "1/100",
  "difficulty": "standard"
}
```

## Engine構成

実装ファイル: `js/generator/questionNarrativeGenerator.js`

1. `QuestionScenarioNormalizer`
   - `AHU` → `AHU_VAV`
   - `FCU` → `FCU_4Pipe`
   - `PAC` → `PAC_IndoorOutdoor`
   - `LoopVent` → `LoopVentDrainage`
2. `QuestionTemplateSelector`
   - HVAC / Plumbing / Electricalごとの問題文構成を選択する。
3. `ConditionGenerator`
   - 設備方式別に条件文を生成する。
4. `DrawingInstructionGenerator`
   - 作図対象要素を生成する。
5. `NarrativeComposer`
   - 「第n問」「対象図面」「作図内容」「条件」「注意事項」の順で本文を合成する。
6. `NarrativeQualityChecker`
   - 設備方式との禁止組合せ、Question Requirement Analyzer、Drawing Instruction Analyzerとの接続妥当性を検査する。

## 出力JSON

```json
{
  "questionText": "...",
  "conditions": [],
  "drawingInstruction": [],
  "drawingRequirement": {},
  "requiredElements": [],
  "answerSheetType": "Common",
  "scale": "1/100",
  "discipline": "HVAC"
}
```

## Constraint Engine

主な禁止組合せ:

- FCU × ダクトサイズ記入
- PAC × 冷温水主管
- 自然換気 × VAV
- 厨房排水 × 通気条件なし
- 照明設計 × 照度条件なし

## 後続Engineとの接続

生成結果の `questionText` と `conditions` は、Question Requirement AnalyzerとDrawing Instruction Analyzerへ渡す前提の形式で出力される。`drawingRequirement` は `analyzeQuestionRequirement()` の結果を同梱するため、QuestionBlankPlanGeneratorとAnswerSheetGeneratorの入力として利用できる。

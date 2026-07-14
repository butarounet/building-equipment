# Step12-2 Exam Consistency Engine

## 目的

`ExamConsistencyEngine` は、個別に生成される問題文、建築図、白図、設備図、答案用紙、模範解答、採点基準の不整合を PDF/SVG/印刷成果物の生成前に検出する横断品質ゲートである。

## 入力

```js
{
  exam,
  building,
  floorPlans,
  materials,
  questions,
  drawings,
  answerSheets,
  modelAnswers,
  scoring
}
```

`modelAnswers` と `scoring` は既存 API 互換のため任意入力である。提供された場合は共通問題の対象室、設備方式、採点対象が問題文・白図・答案用紙と一致することを検査する。

## 出力

```js
{
  passed: true,
  score: 100,
  warnings: [],
  errors: [],
  checks: []
}
```

95 点未満またはエラーが 1 件以上ある場合、`passed` は `false` になる。

## 検査構成

- `QuestionConsistencyChecker`
  - A01/A02、B01/B02、C01/C02、CQ03/CQ04/CQ05 の欠番・重複を検査する。
  - 既存データの `Q03`/`Q04`/`Q05` は内部で `CQ03`/`CQ04`/`CQ05` として正規化する。
- `CommonQuestionChecker`
  - 共通問題は CQ03、CQ04、CQ05 のみ許可する。
  - A03、B03、C03 を禁止する。
  - CQ03 は HVAC 方式、CQ04 は衛生対象室・用途、CQ05 は電気設備項目を検査する。
- `DrawingConsistencyChecker`
  - 問題文の対象室と建築図・答案用紙上の対象室を照合する。
- `BlankPlanChecker`
  - 白図に設備機器、配管、ダクト、配線、照明、器具、機器番号などを含めないことを検査する。
- `AnswerSheetChecker`
  - AnswerSheet4 が CQ03、CQ04、CQ05 専用図面を持つことを検査する。
  - 固定レイアウトではなく、問題別に自動生成された adaptive layout を使用していることを検査する。
- `ModelAnswerChecker`
  - 模範解答が提供された場合、問題文で要求した設備と一致することを検査する。
- `ScoringChecker`
  - 採点基準が提供された場合、CQ03〜CQ05 への参照を検査する。
- `ScaleChecker`
  - 問題要求、白図、答案用紙の縮尺一致を検査する。
- `TemplateChecker`
  - 資料1〜資料5、問題冊子、答案用紙のテンプレート構成を確認する。
- `CrossReferenceChecker`
  - 問題 → 図面 → 答案 → 模範図 → 採点基準の対象室一致を検査する。

## スコア配分

| 項目 | 配点 |
| --- | ---: |
| Question | 20 |
| Drawing | 20 |
| AnswerSheet | 20 |
| ModelAnswer | 15 |
| Template | 15 |
| Scale | 5 |
| CrossReference | 5 |

未提供の任意データ（模範解答、採点基準）は既存 API 互換のため減点しない。ただし、提供されている場合は厳密に検査する。

## 生成パイプラインでの扱い

`generateExamPackage()` は PDF、SVG、ZIP の成果物を組み立てる前に `ExamConsistencyEngine` を実行する。

- `passed=true` の場合のみ PDF/SVG/印刷パッケージを生成する。
- `passed=false` の場合は例外を送出し、PDF/SVG/印刷処理を中止する。
- 成功時のパッケージには `examConsistencyReport` を含める。

## 共通問題ルール

CQ03〜CQ05 は、次の 5 点で対象室・設備方式・用途が一致する必要がある。

1. 問題文
2. 白図
3. 答案用紙
4. 模範解答
5. 採点基準

HVAC 方式は以下のみ許可する。

- FCU二管式
- FCU四管式
- PAC
- PAC+CAV
- PAC+VAV
- AHU+CAV
- AHU+VAV
- 外調機
- 全熱交換器
- 厨房排気
- 排煙
- 加圧
- EV前室
- クリーンルーム

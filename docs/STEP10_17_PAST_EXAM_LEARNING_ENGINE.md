# STEP10-17 Past Exam Learning Engine

## 目的
令和2〜令和7の過去問題テンプレートを解析し、本試験に固有の問題文、設備条件、図面構成、出題頻度、難易度を知識ベース化する。

## 追加モジュール
- `js/learning/pastExamLearningEngine.js`: 全アナライザーを統合し、Engine出力を生成する。
- `js/learning/questionPatternAnalyzer.js`: 問題文の文体、語尾、見出し、設問順、キーワード頻度を解析する。
- `js/learning/drawingPatternAnalyzer.js`: 配置図、平面図、断面図、屋上伏図、白図、設備図、答案用紙の構成頻度を解析する。
- `js/learning/equipmentPatternAnalyzer.js`: 空調、衛生、電気の設備方式、容量・機器語彙、機器構成の頻度を解析する。
- `js/learning/conditionPatternAnalyzer.js`: 設備条件と数値条件を抽出し、頻度順の傾向に変換する。
- `js/learning/difficultyAnalyzer.js`: 計算量、図面量、文章量、設備量をもとに難易度を数値化する。
- `js/learning/examStyleScorer.js`: 候補問題と知識ベースの類似度を100点評価する。

## データ出力
`PastExamLearningEngine.persist()` は以下を `data/learning/` に生成する。

- `questionPatterns.json`
- `drawingPatterns.json`
- `equipmentPatterns.json`
- `conditionPatterns.json`
- `examStyle.json`

## Engine出力
```js
{
  examStyle,
  difficulty,
  pattern,
  equipmentTrend,
  drawingTrend,
  questionTrend,
  conditionTrend,
  score,
  warning,
  quality
}
```

## Quality Gate
- 本試験類似度は100点評価。
- 95点未満の場合は `warning: true`。
- `quality.threshold` は 95。
- `quality.passed` が Generator 統合時の合否判定に利用できる。

## Generator統合
生成パイプラインは以下を想定する。

```text
BuildingGenerator
↓
MaterialGenerator
↓
QuestionGenerator
↓
PastExamLearningEngine
↓
QuestionNarrativeGenerator
↓
DrawingGenerator
```

`examGenerator` は生成結果の `metadata.pastExamLearning` に Past Exam Learning の品質結果を埋め込み、後続の Narrative / Drawing 生成で参照できるようにする。

## 実行例
```bash
node -e "const { PastExamLearningEngine } = require('./js/learning/pastExamLearningEngine'); const e = new PastExamLearningEngine(); e.learn(); e.persist();"
```

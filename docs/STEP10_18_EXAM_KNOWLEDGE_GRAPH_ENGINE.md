# STEP10-18 Exam Knowledge Graph Engine

## 目的

Building、Material、Question、Drawing、Equipment、Learningの個別Generator成果物をKnowledge Graphで接続し、設備条件の変更が建物条件、設備条件、問題、図面、答案、採点へ伝播する状態を管理する。

## ノード階層

`Building -> Floor -> Room -> Equipment Space -> Equipment -> System -> Drawing -> Question -> AnswerSheet -> ModelAnswer -> Scoring`

## Edge種別

`contains`、`dependsOn`、`requires`、`draws`、`answers`、`scores`、`references`、`locatedIn`、`connectsTo`、`feeds`、`returns` を標準Edgeとする。

## API

- `graph.findNode(id)`: IDで単一ノードを取得する。
- `graph.findByType(type)`: 種別でノードを取得する。
- `graph.getDependencies(id)`: 指定ノードに到達する上流依存を再帰取得する。
- `graph.getImpact(id)`: 指定ノード変更時の下流影響範囲を再帰取得する。
- `graph.validate(generatorResults)`: Graph構造とGenerator結果の対応を100点評価し、95点未満をwarningにする。
- `graph.generateDependencies()`: Question、Drawing、AnswerSheet、ModelAnswer、Scoringの標準依存を自動生成する。

## Query例

AHUを起点にすると、接続室、ダクト、図面、問題、答案、採点まで取得できる。

```js
const { KnowledgeGraphEngine } = require('../js/knowledge/knowledgeGraphEngine');
const graph = KnowledgeGraphEngine.fromRepository();
const impact = graph.getImpact('equipment:ahu-1');
```

## Generator統合

1. `BuildingGenerator`がBuilding/Floor/Roomノードを作成する。
2. `EquipmentGenerator`がEquipment Space/Equipment/Systemノードを追加する。
3. `DrawingGenerator`がSystemからDrawingへ`draws` Edgeを追加する。
4. `QuestionGenerator`がDrawing/System/Roomを参照しQuestionノードを追加する。
5. `AnswerSheetGenerator`がQuestionからAnswerSheetへ`answers` Edgeを追加する。
6. `Scoring`がModelAnswerからScoringへ`scores` Edgeを追加する。

## Consistency

Validatorは以下を確認する。

- 必須ノード種別の存在
- Edge種別の妥当性
- Edge両端ノードの存在
- Question、Drawing、AnswerSheet、ModelAnswer、Scoring参照の連鎖
- Generator結果キーがGraphに表現されていること

スコアは成功check数から100点換算し、95未満はwarningとして返す。

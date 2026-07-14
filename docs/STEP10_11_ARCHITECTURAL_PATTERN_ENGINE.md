# Step10-11 Architectural Pattern Library Engine

建築設備士第二次試験で用途ごとに頻出する平面・階構成を、後処理エンジンとして補正するためのライブラリです。

## 入出力

```js
const { enhance } = require('../js/layout/architecturalPatternEngine');
const result = enhance({ building, floorPlans, drawing });
// { drawing, pattern, score, warnings }
```

## 構成

- `architecturalPatternLibrary.js`: ホテル、病院、学校、事務所、その他施設のテンプレートを保持します。
- `architecturalPatternEngine.js`: `PatternSelector`、用途別Generator、`FloorCompositionPlanner`、`TypicalFloorGenerator`、整合Checkerを提供します。

## 生成対象

- ホテル: 基準客室階、宴会場、厨房、レストラン、バックヤード、ランドリー、機械室
- 病院: 病棟、外来、救急、ICU、手術部、検査、放射線、中央材料室、厨房
- 学校: 普通教室、理科室、家庭科室、職員室、図書室、体育館
- 事務所: 基準執務階、会議室、役員室、応接、受付、リフレッシュ、電算室
- 施設: 研究施設、庁舎、物流、商業施設、複合施設、美術館

## 統合順序

`RoomLayoutEngine → ExamCadQualityEngine → BuildingRealismEngine → ArchitecturalPatternEngine → CropEngine → ExamDrawingTemplateEngine`

SVGレンダラ、Building Crop、Common Question Blank Planで `ArchitecturalPatternEngine` を通し、Building Generator互換、Preview/Blank Drawing/Common Question/SVG-PDF/設備Generatorの互換を維持します。

## 品質評価

`ArchitecturalPatternChecker` は100点評価を返し、95点未満の場合に warning を出します。評価軸は用途適合、平面構成、階構成、設備成立、試験適合です。

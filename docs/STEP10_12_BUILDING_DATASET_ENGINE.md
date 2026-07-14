# Step10-12 Building Dataset Engine

## 目的

建築計画をゼロからアルゴリズム生成する方式から、建築設備士第二次試験で出題されやすい用途別データセットを起点に生成する方式へ拡張した。

## 追加データセット

`data/buildingPatterns/` にホテル、病院、学校、事務所、研究施設、美術館、庁舎、商業施設、物流施設、複合施設の JSON を配置する。各 JSON は複数の基準プラン、階構成、柱スパン、主要室、設備方式、制約条件を持つ。

## Engine 構成

`js/layout/buildingDatasetEngine.js` は次のクラスで構成する。

- `DatasetLoader`: 用途別 JSON を読み込む。
- `PatternSelector`: 難易度と乱数から基準プランを選ぶ。
- `MutationEngine`: 敷地、階数、柱スパン、室数、厨房、宴会場、PS/EPS/DS 等を変異させる。
- `FloorVariationGenerator`: 各階の PS/EPS オフセット、窓リズム、主要室を変化させる。
- `RoomVariationGenerator`: 各室の寸法、家具、建具、窓、設備スペースを変える。
- `EquipmentVariationGenerator`: FCU、PAC、AHU、VAV/CAV、給排水、電気、BEMS、BCP を変化させる。
- `ConstraintEngine`: 建築、設備、避難、防火、構造、設備ルートの成立条件を付与する。
- `DiversityChecker`: フィンガープリントと重複率を評価する。
- `DatasetQualityChecker`: 用途適合、多様性、設備成立、建築成立、試験適合を 100 点評価する。

## 入出力

入力:

```js
{ buildingType, difficulty, randomSeed }
```

出力:

```js
{ dataset, building, pattern, score }
```

`BuildingGenerator` は既定で `BuildingDatasetEngine` を呼び出し、既存の `building` JSON 形状を維持する。これにより Building Preview、Building Drawing、Blank Drawing、Common Question、設備 Generator、SVG/PDF 生成の既存 API 互換性を保つ。

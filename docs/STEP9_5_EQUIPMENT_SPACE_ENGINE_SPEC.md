# Step9-5

## 目的

Step9-5は、Step9-4Dで生成した建築平面計画を入力とし、EPS・PS・DS・機械室・電気室・屋上設備・保守動線を制約充足問題として自動配置する設備スペース設計エンジンである。設備幹線長、施工性、保守性、更新性、設備容量、上下階整合を同時に評価し、Step9-6 空調設備配置、Step9-7 給排水衛生設備配置、Step9-8 電気設備配置が直接参照できるJSONを生成する。

## 入力

- FloorPlan JSON
- Room List
- Core Position
- Corridor Graph
- Building Outline
- Grid
- Column Layout
- Building Use
- HVAC Conditions
- Plumbing Conditions
- Electrical Conditions
- Fire Protection Conditions

## 処理フロー

1. 入力平面、室、コア、廊下、柱グリッドを正規化する。
2. ShaftPlacementEngineでEPS・PS・DS候補を抽出し、既存室またはコア近傍に候補を生成する。
3. VerticalAlignmentEngineで候補座標を平均化し、Vertical Alignment Ratioが最大になる組を選定する。
4. MechanicalRoomPlannerで熱源機械室、空調機械室、給水設備室、給湯設備室、ポンプ室、排水槽、消火ポンプ室を搬入・更新・騒音・振動条件で配置する。
5. ElectricalRoomPlannerで受変電室、電気室、MDF、IDF、発電機室、UPSを引込位置、幹線長、EPS接続、防災区画条件で配置する。
6. CoolingTowerPlannerで冷却塔、屋外機、煙突をショートサーキット防止、メンテスペース、騒音、荷重、景観で配置する。
7. MaintenanceRouteAnalyzerで搬入口、サービスEV、設備室、各シャフトを結ぶ保守ルートを検証する。
8. EquipmentSpaceScorerで100点満点のスコア、チェックリスト、改善提案、ASCII図を出力する。

## 判定ロジック

- EPS、PS、DSは上下階一致率を最優先し、既存平面にシャフト室がある場合はその重心を基準座標へ寄せる。
- 機械室は地下階またはサービス動線側に置き、搬入可能、更新可能、保守動線あり、騒音敏感室を避ける条件を満たす。
- 電気室と受変電室は外部引込位置、EPS距離、発電機排気、防災区画を評価して配置する。
- 冷却塔と屋外機は屋上外気短絡、点検余白、騒音、荷重、景観リスクを属性として保持する。
- 保守動線は搬入口、サービスEV、設備室、EPS、PS、DSの到達性、点検可能性、機器交換可能性を判定する。
- スコアは設備幹線長、施工性、保守性、更新性、上下階整合、設備面積率、搬入性、防災、法適合の合計100点で算定する。

## 出力

```json
{
  "equipmentSpaces": [],
  "shaftNetwork": { "shafts": [], "verticalAlignmentRatio": 1, "edges": [] },
  "mechanicalRooms": [],
  "electricalRooms": [],
  "maintenanceRoutes": [],
  "score": { "total": 100, "items": {}, "verticalAlignmentRatio": 1 },
  "ascii": {
    "eps": "EPS配置図",
    "ps": "PS配置図",
    "ds": "DS配置図",
    "mechanical": "機械室配置図",
    "maintenance": "保守動線図"
  },
  "improvements": [],
  "checklist": {}
}
```

## チェックリスト

- EPS上下階一致
- PS上下階一致
- DS上下階一致
- 幹線長最小
- 機械室面積適正
- 更新スペース確保
- 保守動線確保
- 防災区画適合
- 建築設備士二次試験レベル適合

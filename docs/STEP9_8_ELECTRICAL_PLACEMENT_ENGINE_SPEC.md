# Step9-8 電気設備配置エンジン仕様

Step9-8は、Step9-4の平面計画とStep9-5の設備スペースを入力し、建築設備士第二次試験（設計製図）で求められる電気設備計画を自動生成するエンジンである。EPSを優先したGraph Routingにより幹線・分岐配線を成立させ、受変電、配電、照明、防災、弱電を一体で出力する。

## 入力

- `floorPlan`: Step9-4のFloorPlan JSON。
- `equipmentSpace` / `equipmentSpaces`: Step9-5の設備スペースJSON。
- `rooms` / `roomList`: 任意の室リスト。
- `corePosition`, `shaftNetwork`: コア・シャフト情報。
- `buildingUse`: 建物用途。
- `electricalConditions`: 需要率、力率などの電気条件。
- `fireProtectionConditions`: 防災条件。

## Engine構成

- `PowerReceivingPlanner`: 電源方式、受変電容量、高圧盤・低圧盤を決定する。
- `TransformerPlanner`: 変圧器台数・容量・配置を決定する。
- `MainDistributionPlanner`: 主幹系統を構成する。
- `PanelBoardPlanner`: 各階EPS近傍に分電盤・IDF盤を配置する。
- `CableRackPlanner`: 幹線に対応するケーブルラックを生成する。
- `CableRoutingEngine`: EPS優先の直交Graph Routingで最短経路を探索する。
- `LightingPlanner`, `EmergencyLightingPlanner`, `ExitSignPlanner`: 照明・非常照明・誘導灯を室用途に応じて配置する。
- `GeneratorPlanner`, `UPSPlanner`: 非常用発電機とUPSを発電機室に配置する。
- `FireAlarmPlanner`, `BroadcastPlanner`, `LANPlanner`: 自火報、非常放送、LANを生成する。
- `ElectricalScorer`: 電源信頼性、幹線長、施工性、保守性、更新性、防災、省エネ、法適合を100点で評価する。

## 出力JSON

```json
{
  "schemaVersion": "1.0.0",
  "engine": "Step9-8 Electrical Placement Engine",
  "powerReceiving": {},
  "transformers": [],
  "panelBoards": [],
  "lighting": [],
  "emergencyLighting": [],
  "exitSigns": [],
  "cableNetwork": [],
  "cableRacks": [],
  "generator": {},
  "ups": {},
  "fireAlarm": [],
  "broadcast": [],
  "lan": [],
  "loadSchedule": [],
  "singleLineDiagram": "単線結線図ASCII",
  "receivingSystemDiagram": "受変電系統図ASCII",
  "improvements": [],
  "score": {},
  "checklist": {}
}
```

## Quality Checker

- 幹線成立: EPSへ接続する幹線が存在する。
- EPS利用: 幹線・分岐配線がEPS優先経路を持つ。
- 分電盤配置: 各階負荷に対応する分電盤を配置する。
- 照明成立: 室負荷に応じたLED照明を配置する。
- 非常照明成立: 防災対象室に非常照明を配置する。
- 誘導灯成立: ロビー、宴会、廊下、階段等に誘導灯を配置する。
- 発電機成立: 非常用発電機を配置し、防災負荷へ供給する。
- 自火報成立: 各室に煙感知器又は熱感知器を配置する。
- LAN成立: 室面積と用途に応じたLANポートを配置する。
- 建築設備士二次試験レベル適合: Score 80点以上を目安とする。

## 後続Step連携

`cableNetwork`, `cableRacks`, `panelBoards`, `loadSchedule`, `score`, `checklist`は、Step9-9 設備干渉チェック、Step9-10 系統図生成、Step9-11 答案生成の直接入力として利用できる。

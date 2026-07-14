# Step9-6 空調設備配置エンジン仕様

## 目的

Step9-5で生成したEPS・PS・DS・機械室・屋上機器置場などの設備スペースを利用し、建築設備士第二次試験レベルで成立する空調設備配置案を自動生成する。

## 入力

- `floorPlan`: FloorPlan JSON。各階、室、シャフト、コアを参照する。
- `equipmentSpace`: EquipmentSpace JSON。未指定時はStep9-5 Plannerで補完する。
- `rooms` / `roomList`: 追加の室リスト。
- `hvacConditions`: 負荷計算条件。`diversityFactor`を指定できる。
- `buildingUse`: 建物用途。ホテル用途では客室FCU＋外調機を優先する。

## 処理フロー

1. Room HVAC Load: 室面積・用途・厨房/宴会/SPAなどの名称から冷房負荷、暖房負荷、必要風量を概算する。
2. Air System Selection: 客室、厨房、宴会場、ロビー、SPA、一般室に応じてAHU、FCU、PAC、外調機、VAV、CAVを選定する。
3. AHU/PAC配置: 各階DS近傍に主要空調機または外調機/PACを配置する。
4. ダクト経路探索: DS、空調機、対象室中心を直交折れ線で接続し、主ダクト・分岐ダクトを生成する。
5. 吹出口配置: 各室中心付近に吹出口、VAV/CAV付き吹出口を配置する。
6. 吸込口配置: 各室中心付近に吸込口を配置する。
7. 配管ルート: PSから空調機へ冷温水配管、ドレン、PAC系統の冷媒配管を生成する。
8. 保守スペース: 空調機ごとに1200mm保守クリアランスを確保する。
9. 設備干渉チェック: 長大ルートを低リスク干渉候補として抽出する。
10. スコアリング: 設備成立、省エネ、施工性、保守、ダクト長、配管長、設備干渉、法適合を100点満点で評価する。

## Engine構成

`js/planner/hvacPlacementEngine.js` は以下のAPIを公開する。

- `planHVAC(input)`: HVAC JSON全体を生成する。
- `HVACSystemSelector.selectSystem(load, buildingUse)`: 室負荷から空調方式を選定する。
- `AirHandlingUnitPlanner`
- `PackageUnitPlanner`
- `DuctRoutingEngine`
- `PipeRoutingEngine`
- `DiffuserPlacementEngine`
- `ReturnAirPlanner`
- `FireDamperPlanner`
- `MaintenanceAnalyzer`
- `HVACScorer.score(loads, ducts, pipes, conflicts, maintenance)`

## 出力

- `roomLoads`: 室別空調負荷。
- `airSystemSelections`: 室別空調方式。
- `equipment`: AHU、PAC、外調機、排気ファン、給気ファン、防火ダンパー、消音器、風量測定口。
- `ductNetwork`: ダクトネットワークと総延長。
- `pipeNetwork`: 冷温水配管、ドレン、冷媒配管のネットワーク。
- `diffusers`: 吹出口/VAV/CAV配置。
- `returnAir`: 吸込口配置。
- `maintenance`: 保守スペース判定。
- `interferenceChecks`: 設備干渉チェック。
- `ascii.system`: ASCII系統図。
- `ascii.equipment`: ASCII機器配置図。
- `airflowSchedule`: 風量一覧。
- `improvements`: 改善案。
- `score`: 100点満点の評価。

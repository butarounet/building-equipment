# Step9-4D

## 目的

Step9-4Dは、建築設備士第二次試験（設計製図）の平面計画において、設備機器・配管・ダクト・幹線を配置する前に、建築基本設計図の骨格を確定するための平面計画エンジン仕様である。設備計画は建築基本設計図との整合性が最重要であるため、本エンジンは次の要素を先行決定し、後続のEquipment Generator、Drawing Generator、Quality Checkerが参照できる構造化データを出力する。

- ゾーニング
- コア配置
- 廊下計画
- 避難動線
- サービス動線
- 設備動線
- 設備スペース
- 平面計画スコア

本仕様はPythonまたはJavaScriptで実装しやすいよう、処理フロー、判定アルゴリズム、データ構造、入出力仕様、ASCII出力、チェックリストを定義する。

## 入力

### 入力データ概要

```json
{
  "buildingUse": "hotel",
  "floorCount": 8,
  "totalFloorArea": 12000,
  "floors": [],
  "rooms": [],
  "areaRequirements": {},
  "architecturalConditions": {},
  "legalConditions": {},
  "equipmentConditions": {},
  "options": {}
}
```

### 入力フィールド

| フィールド | 型 | 必須 | 内容 |
|---|---:|---:|---|
| `buildingUse` | string | 必須 | 建物用途。例: `hotel`, `office`, `hospital`, `school`, `commercial`, `mixedUse` |
| `floorCount` | number | 必須 | 地上階数。地下階がある場合は`floors`側に`level: -1`として持つ |
| `totalFloorArea` | number | 必須 | 延床面積。単位はm2 |
| `floors` | FloorInput[] | 必須 | 各階の外形、面積、階用途、上下階接続候補 |
| `rooms` | RoomInput[] | 必須 | 各室一覧。室名、要求面積、用途、想定階、隣接要求を含む |
| `areaRequirements` | object | 任意 | 用途別・部門別・階別の面積条件 |
| `architecturalConditions` | object | 任意 | 敷地、出入口、搬入口、柱グリッド、外形、階高、防火区画条件 |
| `legalConditions` | object | 任意 | 避難距離、階段数、廊下幅、バリアフリー、排煙、防火区画など |
| `equipmentConditions` | object | 任意 | 空調、衛生、電気、防災、搬送、保守、更新条件 |
| `options` | object | 任意 | スコア重み、ASCII解像度、再生成回数、用途別テンプレート指定 |

### 室入力モデル

```ts
type RoomInput = {
  id: string;
  name: string;
  department?: string;
  requiredArea: number;
  minArea?: number;
  maxArea?: number;
  preferredFloors?: number[];
  fixedFloor?: number;
  publicness?: "public" | "semiPublic" | "backyard" | "management" | "equipment";
  wetArea?: boolean;
  heavyEquipment?: boolean;
  noiseSensitive?: boolean;
  heatSource?: boolean;
  requiresExteriorWall?: boolean;
  requiresServiceAccess?: boolean;
  requiresPublicAccess?: boolean;
  requiresStaffAccess?: boolean;
  adjacency?: Array<{ target: string; type: "must" | "prefer" | "avoid"; weight?: number }>;
};
```

### 階入力モデル

```ts
type FloorInput = {
  id: string;
  level: number;
  name: string;
  floorArea: number;
  outline?: Rect | Polygon;
  useType?: string;
  grid?: { x: number[]; y: number[] };
  entrances?: Point[];
  serviceEntrances?: Point[];
  evacuationExits?: Point[];
};
```

## 判定ロジック

### 全体処理フロー

1. **入力正規化**: 室名、要求面積、階、用途、隣接条件、法規条件、設備条件を標準スキーマへ変換する。
2. **用途別テンプレート選択**: 建物用途と規模から、標準ゾーン構成、標準コア数、標準廊下形式を選択する。
3. **ゾーニング生成**: 各室を5ゾーンへ分類し、階別・平面別にゾーン領域を仮配置する。
4. **コア候補生成**: EV、階段、EPS、PS、DS、トイレ、シャフトの候補位置を生成する。
5. **コア評価・確定**: 上下階一致、幹線短縮、避難距離、更新性、保守性で候補を採点し、代表案を選ぶ。
6. **廊下自動生成**: 主要出入口、コア、各ゾーン、避難階段、搬入口、設備室を結ぶ通路グラフを生成する。
7. **動線解析**: 利用者、職員、搬入、搬出、ごみ搬出、設備保守、非常時避難を経路探索し、交差と干渉を検出する。
8. **設備スペース配置**: EPS、PS、DS、機械室、電気室、受変電室、熱源機械室、給水設備室、冷却塔、屋外機を配置する。
9. **法規・設備・施工性検証**: 廊下幅、避難距離、二方向避難、シャフト整合、搬入経路、更新スペースを検査する。
10. **スコアリング**: 100点満点で評価し、重大欠陥、警告、改善案を生成する。
11. **出力生成**: ASCII図、構造化JSON、改善点一覧、最終評価、チェックリストを返す。

### ① ゾーニング

#### 5ゾーン分類

| ゾーン | 対象室例 | 配置原則 | 避ける条件 |
|---|---|---|---|
| パブリック | ロビー、受付、ホール、客席、展示、店舗 | 主出入口、EVホール、外部視認性の高い位置 | 搬入口・ごみ置場・機械室との直接隣接 |
| セミパブリック | 会議室、客室、診察室、研修室、共用ラウンジ | パブリックから短く、管理可能な位置 | 不特定多数がバックヤードへ抜ける動線 |
| バックヤード | 厨房、倉庫、リネン、荷捌き、職員更衣 | 搬入口、サービスEV、管理ゾーンに近接 | 主動線との交差、客用EVホールへの露出 |
| 管理 | 事務室、防災センター、中央監視、職員室 | 主出入口・サービス動線の双方を監視できる位置 | 完全な奥配置、避難階段から遠い配置 |
| 設備 | 機械室、電気室、受変電、ポンプ室、シャフト | 外部搬入、更新、縦シャフト、屋外機器に近接 | 騒音敏感室直下・直上、長い幹線経路 |

#### 用途ごとの推奨配置

| 用途 | 推奨ゾーニング |
|---|---|
| ホテル | 1階はパブリックを前面、厨房・荷捌きを背面、中央コアで客用・サービスを分離。客室階は中廊下、中央コア、両端階段を基本とする。 |
| 事務所 | 低層に受付・会議、基準階は執務室を外周、中央にコア・トイレ・EPSを集約する。 |
| 病院 | 外来、病棟、診療、供給、管理を明確に分離し、清汚動線を交差させない。 |
| 学校 | 管理を入口近く、普通教室を採光面、特別教室・機械室を設備幹線に近い位置へ置く。 |
| 商業 | 客用動線を回遊化し、バックヤード・搬入・ごみ搬出を客用動線から分離する。 |

#### アルゴリズム

```pseudo
for room in rooms:
  zone = inferZone(room.publicness, room.name, room.requiresPublicAccess, room.requiresServiceAccess)
  room.zone = zone

for floor in floors:
  create_zone_blocks(floor.outline, target_area_by_zone)
  place public near main entrances
  place equipment near service edge and shaft candidates
  place backyard near service entrances
  place management between public and backyard when monitoring is required
  place semiPublic between public and private/upper-floor areas
  optimize by adjacency_score + area_fit_score + flow_separation_score
```

### ② コア配置

#### 配置対象

- EV
- 階段
- EPS
- PS
- DS
- トイレ
- シャフト

#### 判定条件

| 判定 | 内容 | 推奨閾値 |
|---|---|---:|
| 上下階一致 | EV、階段、主要EPS/PS/DSの重なり率 | 90%以上 |
| 設備幹線短縮 | 機械室・電気室・シャフト・主要負荷のマンハッタン距離 | 案比較で最小化 |
| 避難距離 | 各室から階段までの歩行距離 | `legalConditions.maxTravelDistance`以下 |
| 将来更新 | 機器搬出入スペース、シャフト点検面、更新ルート | 有効幅・扉幅を満足 |
| コア分散 | 階段2箇所以上の離隔、避難冗長性 | 平面対角または両端配置を優先 |

#### コア候補生成

```pseudo
core_candidates = []
for floor in floors:
  candidates = grid_intersections_near_center + side_bays + service_edge
  for c in candidates:
    evaluate:
      vertical_alignment_score(c)
      evacuation_score(c, stairs)
      shaft_route_score(c, equipment_rooms)
      rentable_area_loss_score(c)
      service_public_separation_score(c)
  core_candidates.append(best candidates)
select building_core_set maximizing weighted score
```

#### コア配置原則

- 乗用EVとサービスEVは隣接させすぎず、ホールとバックヤードの向きを分ける。
- 階段は2方向避難を成立させるため、中央集中ではなく両端または離隔配置を優先する。
- EPSは電気室・受変電室から各階分電盤へ短く立ち上げる。
- PSは水回り、厨房、便所、客室浴室の縦並びを優先する。
- DSは機械室、外気取入口、排気経路、屋上機器との接続を優先する。
- トイレはPSに隣接し、パブリック・セミパブリックから認識しやすく、主要室の真正面は避ける。

### ③ 廊下計画

#### 自動生成方針

廊下は、部屋を接続する線ではなく、ゾーン境界、コア、避難階段、搬入口、設備室を結ぶ**通路グラフ**として生成する。各エッジは幅員、用途、通行主体、避難可否、搬入可否、設備保守可否を持つ。

```ts
type CorridorEdge = {
  id: string;
  from: string;
  to: string;
  polyline: Point[];
  width: number;
  allowedFlows: FlowType[];
  evacuation: boolean;
  service: boolean;
  equipmentMaintenance: boolean;
  deadEndLength: number;
};
```

#### 確認項目

| 項目 | 判定方法 | 不適合時の警告 |
|---|---|---|
| 回遊可能 | 廊下グラフの閉路、代替経路数を検出 | `WARN_CORRIDOR_NO_LOOP` |
| 袋小路なし | 端点から分岐点までの距離を算定 | `WARN_DEAD_END_CORRIDOR` |
| 避難方向 | 各室から2階段への経路を探索 | `ERROR_EGRESS_SINGLE_ROUTE` |
| 搬入可能 | 搬入口から対象室までの幅員・曲がりを確認 | `WARN_DELIVERY_ROUTE_NARROW` |
| 設備搬入可能 | 機械室・電気室・屋上機器までの更新経路を確認 | `ERROR_EQUIPMENT_REPLACEMENT_ROUTE` |

#### 廊下生成アルゴリズム

```pseudo
nodes = entrances + service_entrances + stairs + ev_halls + zone_centroids + equipment_rooms
primary_edges = minimum_spanning_tree(nodes, cost=distance + zone_cross_penalty)
loop_edges = add_edges_until_redundancy(primary_edges, required_cycles)
service_edges = connect(service_entrance, backyard, service_ev, equipment_rooms)
egress_edges = connect_each_room_to_two_stairs(room_doors, stairs)
remove_edges_crossing_forbidden_zones()
widen_edges_by_flow_type()
validate_dead_ends_and_turning_radius()
```

### ④ 動線解析

#### 解析対象

- 利用者動線
- 職員動線
- 搬入動線
- 搬出動線
- ごみ搬出
- 設備保守
- 非常時避難

#### 動線モデル

```ts
type FlowRoute = {
  id: string;
  type: "user" | "staff" | "delivery" | "removal" | "waste" | "maintenance" | "egress";
  source: string;
  targets: string[];
  path: Point[];
  corridorEdges: string[];
  conflictPolicy: "allow" | "warn" | "deny";
  widthRequired: number;
  timeWindow?: string;
};
```

#### 交差判定

| 交差 | 判定 | 重大度 |
|---|---|---|
| 利用者 × ごみ搬出 | 同一廊下を一定距離以上共有 | 高 |
| 利用者 × 搬入 | 主動線上で荷捌き経路と交差 | 中〜高 |
| 利用者 × 設備保守 | 機器搬出時のみ交差 | 中 |
| 職員 × 搬入 | バックヤード内で共有 | 低 |
| 避難 × 搬入・保守 | 非常時に閉塞リスク | 高 |
| 清潔 × 汚染 | 病院・厨房・ごみで同一経路 | 高 |

```pseudo
for routeA, routeB in combinations(routes, 2):
  shared_length = calculate_shared_corridor_length(routeA, routeB)
  crossing_points = intersect_polylines(routeA.path, routeB.path)
  severity = conflict_matrix[routeA.type][routeB.type]
  if severity == high and shared_length > threshold:
    add_error(routeA, routeB, "FLOW_CONFLICT")
  elif crossing_points:
    add_warning(routeA, routeB, "FLOW_CROSSING")
```

### ⑤ 設備スペース

#### 配置対象

- EPS
- PS
- DS
- 機械室
- 電気室
- 受変電室
- 熱源機械室
- 給水設備室
- 冷却塔
- 屋外機

#### 最適配置ルール

| 設備スペース | 推奨配置 | 主な判定 |
|---|---|---|
| EPS | 電気室・受変電室の上部または近傍、各階コア内 | 幹線距離、上下階一致、点検扉 |
| PS | トイレ、厨房、浴室、給湯室の背面 | 水回り縦整合、横引き短縮、防火区画 |
| DS | 機械室、空調機械室、厨房、便所、浴室に近接 | ダクト経路、外気・排気、梁貫通回避 |
| 機械室 | 搬入しやすく、DS・PSに近く、騒音影響が小さい位置 | 更新ルート、騒音、振動、保守空間 |
| 電気室 | 受変電室、EPS、防災センターに近接 | 浸水回避、搬入、耐火、防火区画 |
| 受変電室 | 道路・外部搬入・電力引込に近い低層 | 外部扉、更新、浸水、換気 |
| 熱源機械室 | 屋外機・冷却塔・DSに近い地下または屋上近傍 | 配管距離、騒音、排熱 |
| 給水設備室 | 受水槽、ポンプ、PSに近い地下または低層 | 搬入、排水、浸水対策 |
| 冷却塔 | 屋上または外部、熱源と短絡しない位置 | 騒音、排熱、補給水、保守 |
| 屋外機 | 屋上・バルコニー・設備ヤード | 離隔、騒音、更新、外観 |

#### 設備スペースデータ

```ts
type EquipmentSpace = {
  id: string;
  name: string;
  category: "eps" | "ps" | "ds" | "machine" | "electrical" | "substation" | "heatSource" | "water" | "coolingTower" | "outdoorUnit";
  floorId: string;
  rect: Rect;
  connectedShafts: string[];
  maintenanceAccess: string[];
  replacementRoute: string[];
  noiseRisk?: "low" | "medium" | "high";
  floodRisk?: "low" | "medium" | "high";
};
```

### ⑥ スコアリング

#### 100点満点評価

| 評価項目 | 配点 | 主な評価内容 |
|---|---:|---|
| ゾーニング | 15 | 5ゾーン分類、隣接、用途別配置、面積バランス |
| 動線 | 15 | 利用者・職員・搬入・ごみ・保守の分離、交差抑制 |
| 設備 | 15 | EPS/PS/DS、機械室、電気室、熱源、給水、屋外機の成立性 |
| 保守 | 10 | 点検口、搬入、更新ルート、機器周囲スペース |
| 避難 | 15 | 階段数、二方向避難、避難距離、袋小路、幅員 |
| 法適合 | 10 | 廊下幅、防火区画、バリアフリー、排煙、用途別要求 |
| 施工性 | 10 | 縦シャフト整合、梁貫通抑制、幹線短縮、矩形配置 |
| 将来更新 | 10 | 予備スペース、機器更新、シャフト余裕、用途変更耐性 |

#### 採点疑似コード

```pseudo
score = 0
score += score_zoning(plan)          # 15
score += score_flow(plan)            # 15
score += score_equipment(plan)       # 15
score += score_maintenance(plan)     # 10
score += score_egress(plan)          # 15
score += score_legal(plan)           # 10
score += score_constructability(plan)# 10
score += score_future_update(plan)   # 10

if has_critical_error(plan):
  score = min(score, 59)
if egress_not_established(plan):
  score = min(score, 49)
if core_not_aligned(plan):
  score = min(score, 69)
```

#### 評価ランク

| 点数 | ランク | 判定 |
|---:|---|---|
| 90〜100 | A | 本試験レベルで優秀。設備計画へ進める |
| 80〜89 | B | 軽微な改善で設備計画へ進める |
| 70〜79 | C | 成立するが、動線・設備・避難の一部改善が必要 |
| 60〜69 | D | 大きな修正が必要。設備計画前に再配置 |
| 0〜59 | E | 不成立。ゾーニングまたはコアから再生成 |

## 出力

### 出力データ概要

```json
{
  "step": "Step9-4D",
  "planId": "plan-001",
  "zoning": {},
  "cores": [],
  "corridors": [],
  "flows": [],
  "equipmentSpaces": [],
  "ascii": {
    "zoning": "",
    "flow": "",
    "core": "",
    "equipment": ""
  },
  "issues": [],
  "improvements": [],
  "score": {},
  "checklist": []
}
```

### ① ゾーニング図（ASCII）

```text
+--------------------------------------+
| Public Lobby | Public Cafe | Meeting |
|--------------+-------------+---------|
| Main Corridor / Public Spine   Stair |
| Semi-Public Hall              EV     |
| Office/Admin | Staff | EPS | PS | WC |
|--------------------------------------|
| Machine Room | Electrical | Storage  |
+--------------------------------------+
```

### ② 動線図（ASCII）

```text
+--------------------------------------+
| User ---> Lobby ---> EV Hall --->    |
|             |                        |
| Staff ---> Admin ---> Service EV     |
|             |                        |
| Delivery -> Loading -> Storage -> Kit|
| Waste ----> Waste Room -> Service Out|
| Maint. ---> Electrical -> EPS/DS     |
| Egress ===> Stair A        Stair B   |
+--------------------------------------+
```

### ③ コア配置図（ASCII）

```text
+--------------------------------------+
| Stair A                         WC   |
|   |                              PS  |
|---+---------- Corridor ----------+---|
|        EV  EV  S-EV  EPS  DS         |
|---+------------------------------+---|
| Stair B                  Service Hall|
+--------------------------------------+
```

### ④ 設備スペース配置図（ASCII）

```text
+--------------------------------------+
| Outdoor Unit Zone / Cooling Tower    |
|--------------------------------------|
| DS  AHU Room        EPS  Electrical  |
| PS  Pump Room       Substation       |
|--------------------------------------|
| Heat Source Machine Room | Loading   |
+--------------------------------------+
```

### ⑤ 改善点一覧

改善点は、重大度、対象、理由、推奨修正、関連スコアを持つ。

```json
[
  {
    "severity": "warning",
    "target": "serviceRoute-1",
    "reason": "利用者動線と搬入動線がロビー付近で交差している",
    "recommendation": "搬入口から厨房・サービスEVへ直接接続するバックヤード廊下を追加する",
    "scoreImpact": -4
  }
]
```

### ⑥ 最終評価

```json
{
  "total": 86,
  "rank": "B",
  "breakdown": {
    "zoning": 13,
    "flow": 12,
    "equipment": 14,
    "maintenance": 8,
    "egress": 14,
    "legal": 9,
    "constructability": 8,
    "futureUpdate": 8
  },
  "decision": "設備計画へ進行可能。ただし搬入動線と保守動線の交差を軽減すること。"
}
```

## 入出力仕様

### 関数インターフェース例

```ts
function generateArchitecturalPlanningSkeleton(input: Step94DInput): Step94DOutput;
function classifyZones(rooms: RoomInput[], buildingUse: string): ZonedRoom[];
function placeCores(floors: FloorInput[], rooms: ZonedRoom[], conditions: Conditions): CorePlan[];
function generateCorridors(floors: FloorInput[], zones: ZoneBlock[], cores: CorePlan[]): CorridorGraph;
function analyzeFlows(corridors: CorridorGraph, rooms: ZonedRoom[], cores: CorePlan[]): FlowAnalysis;
function placeEquipmentSpaces(input: Step94DInput, cores: CorePlan[], corridors: CorridorGraph): EquipmentSpace[];
function scorePlanningSkeleton(plan: PlanningSkeleton): PlanningScore;
function renderStep94DAscii(plan: PlanningSkeleton): AsciiOutput;
```

### エラー・警告コード

| コード | 種別 | 内容 |
|---|---|---|
| `ERROR_CORE_VERTICAL_MISMATCH` | error | 主要コアまたはシャフトが上下階で一致しない |
| `ERROR_EGRESS_SINGLE_ROUTE` | error | 二方向避難が成立しない室または階がある |
| `ERROR_EGRESS_DISTANCE_EXCEEDED` | error | 避難距離が法規条件を超過している |
| `ERROR_EQUIPMENT_REPLACEMENT_ROUTE` | error | 主要設備機器の搬出入・更新経路がない |
| `WARN_FLOW_CROSSING` | warning | 動線交差がある |
| `WARN_DEAD_END_CORRIDOR` | warning | 袋小路または長い行き止まり廊下がある |
| `WARN_SHAFT_ROUTE_LONG` | warning | シャフトから主要負荷までの横引きが長い |
| `WARN_NO_MAINTENANCE_ACCESS` | warning | 保守点検面または点検ルートが不足している |
| `INFO_RECOMMENDED_LOOP_ADDED` | info | 回遊性確保のため補助廊下を追加した |

## 実装方針

### 推奨モジュール構成

```text
js/planner/architecturalSkeletonPlanner.js
js/planner/zoningClassifier.js
js/planner/corePlacementEngine.js
js/planner/corridorGraphEngine.js
js/planner/flowAnalysisEngine.js
js/planner/equipmentSpacePlacementEngine.js
js/planner/planningSkeletonScorer.js
tests/architecturalSkeletonPlanner.test.js
```

### 実装優先順位

1. 室の5ゾーン分類と用途別テンプレートを実装する。
2. 矩形グリッド上で階別ゾーンブロックを生成する。
3. 中央コア、両端階段、EPS/PS/DSの標準配置を生成する。
4. 廊下グラフと二方向避難経路を生成する。
5. 利用者・職員・搬入・ごみ・保守動線の交差判定を追加する。
6. 設備スペース配置とシャフト接続性を評価する。
7. スコアリング、ASCII出力、改善点生成を追加する。
8. 既存のHotel Floor Planner、Equipment Generator、Drawing Generatorへ接続する。

### Quality Checker連携

Step9-4Dの出力は、後続工程で次の品質検査に利用する。

- Building Generator: 室構成、階構成、ゾーニング、コア位置の整合確認
- Equipment Generator: EPS/PS/DS、機械室、電気室、熱源、給水設備室との接続確認
- Drawing Generator: 建築基本設計図、白図、設備図の共通下敷きとして利用
- Exam Generator: 設計課題・資料・製図要求事項の根拠として利用
- Quality Checker: 法規、設備成立性、避難、保守、施工性、更新性の横断検査

## チェックリスト

- □ 建築計画に矛盾なし
- □ コア位置一致
- □ 動線交差なし
- □ EPS配置良好
- □ PS配置良好
- □ DS配置良好
- □ 機械室接続良好
- □ 保守動線確保
- □ 避難成立
- □ 法適合
- □ 本試験レベルの建築設備士第二次試験に適合

# 建築設備士 第二次試験 模擬試験

建築設備士第二次試験（設計製図）の本試験レベルの模擬試験を作成するためのWebアプリです。

## 構成

```text
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── planner/
│   │   └── buildingPlanner.js
│   └── generator/
│       ├── buildingGenerator.js
│       ├── equipmentGenerator.js
│       ├── material1Generator.js
│       └── materialGenerator.js
├── svg/
├── data/
│   └── hotel/
│       ├── building.json
│       ├── floors.json
│       ├── rooms.json
│       ├── equipment.json
│       ├── exam.json
│       ├── drawing.json
│       └── scoring.json
├── docs/
├── tests/
│   └── buildingGenerator.test.js
└── README.md
```

## 機能

- 白背景のシンプルな学習画面
- ヘッダーとメニュー
- レスポンシブ対応
- A4縦印刷対応
- CSSとJavaScriptの分離
- 用途別JSONデータによる模擬試験生成基盤
- ホテル課題の建築企画を生成するBuilding Planner
- ホテル用途の建築条件を自動生成するBuilding Generator
- 建築条件からホテル用途の設備条件を自動生成するEquipment Generator
- 建築企画・建築条件・設備条件から「資料1 計画条件」を生成するMaterial1 Generator
- 資料1〜資料5を一括生成・管理するMaterial Generator
- 生成条件を検査するQuality Checker
- ブラウザで建築条件・設備条件を確認できるGenerator Preview画面

## データモデル

用途別データは `data/<用途>/` に配置します。現在はホテル用途の実用データとして `data/hotel/` を提供しています。将来、病院・事務所・学校などを追加する場合も同じファイル構成で `data/hospital/`、`data/office/` のように拡張できます。

`data/hotel/` には以下のJSONを配置しています。

- `building.json`: 建物名称、用途、所在地、敷地面積、延床面積、階数、構造、利用人数
- `floors.json`: 地下1階、1階、2階、3階、4〜10階、塔屋の階構成
- `rooms.json`: 各階の室名称、室用途、室面積、ゾーン、設備要求
- `equipment.json`: 空調、衛生、電気、防災、搬送の設備方式と要求条件
- `exam.json`: 設計課題、計画条件、設備条件、製図課題、記述問題
- `drawing.json`: 資料1〜資料5の製図用資料
- `scoring.json`: 採点項目、配点、評価基準、減点条件

各JSONには `schemaVersion` と `buildingType` を含め、用途追加時も同じ共通構造で参照できるようにしています。

## Building Planner

`js/planner/buildingPlanner.js` は、Building GeneratorとEquipment Generatorの前段で利用するホテル課題の建築企画を生成します。

```js
const { planHotelProject, validateHotelPlan } = require('./js/planner/buildingPlanner');

const plan = planHotelProject({ hotelType: '国際会議対応ホテル' });
const result = validateHotelPlan(plan);
```

### planHotelProject(options)

`options.hotelType` が指定された場合は、都市型シティホテル、国際会議対応ホテル、宴会場併設ホテル、温浴施設付きホテル、宿泊主体型ホテルのいずれかを優先します。指定がない場合はランダムに選択し、設計テーマ、敷地条件、ゾーニング、規模、階数、客室、宴会、料飲、SPA、バックヤード、設備スペース、試験難易度の方針を返します。

### validateHotelPlan(plan)

Quality Checkerとして、ホテルタイプ、階数方針、客室方針、主要機能とホテルタイプの整合、建築設備士第二次試験の模擬課題としての成立性を検査します。

## Building Generator

`js/generator/buildingGenerator.js` は、ホテル用途の `building.json` 互換オブジェクトを生成します。

```js
const { generateBuilding, validateBuilding } = require('./js/generator/buildingGenerator');

const building = generateBuilding();
const plannedBuilding = generateBuilding({ plan });
const result = validateBuilding(building);
```

### generateBuilding()

以下の建築条件をランダムに生成します。`options.plan` が渡された場合は、Building Plannerのホテルタイプ、設計テーマ、敷地・階数・客室・宴会・料飲・SPA・設備スペース方針を反映して生成します。数値条件は呼び出しごとに変化し、本試験レベルの都市型ホテルとして成立する範囲に制限しています。

- 建物名称、建物コンセプト、用途
- 所在地条件、用途地域
- 敷地面積、建築面積、延床面積
- 構造、地下階数、地上階数、塔屋
- 客室数
- 宴会場、レストラン、厨房、SPA、ランドリー
- 機械室、電気室、受変電室、EPS、PS、DS

### validateBuilding()

Quality Checkerとして、生成後の建築条件を検査します。

- 用途地域に対する建蔽率・容積率の成立性
- 機械室、電気室、受変電室、EPS、PS、DSの設備計画成立性
- 延床面積と客室数の整合
- 地下階、地上階、塔屋の階数成立性
- 設備スペース面積の不足有無
- 地下階と機械室配置の整合

戻り値は `{ isValid, errors, warnings, checks }` です。

## Equipment Generator

`js/generator/equipmentGenerator.js` は、Building Generatorが生成したホテル用途の建築条件を入力として、`equipment.json` 互換の設備条件オブジェクトを生成します。

```js
const { generateBuilding } = require('./js/generator/buildingGenerator');
const { generateEquipment, validateEquipment } = require('./js/generator/equipmentGenerator');

const plan = planHotelProject({ hotelType: '温浴施設付きホテル' });
const building = generateBuilding();
const plannedBuilding = generateBuilding({ plan });
const equipment = generateEquipment(building);
const result = validateEquipment(equipment, building);
```

### generateEquipment(building)

以下の設備分野を、延床面積、客室数、利用人数、主要室、設備スペースに応じて生成します。

- 空調設備、換気設備
- 給水設備、給湯設備、排水設備、消火設備
- 電気設備、受変電設備、非常電源設備、照明設備
- 搬送設備、中央監視設備

客室数に応じて中央熱源方式、客室空調方式、受変電容量、非常用発電機容量、エレベーター台数を調整します。厨房がある場合は厨房給排気バランス換気方式、SPAがある場合はSPA高負荷対応の中央給湯循環方式、宴会場がある場合は宴会場単独空調ゾーンを追加します。

### validateEquipment(equipment, building)

Quality Checkerとして、生成後の設備条件を検査します。

- 設備方式の成立性
- 建物規模と客室数との整合
- 熱源、給湯、受変電、搬送などの設備容量
- 機械室、電気室、受変電室、EPS、PS、DSとの整合
- 厨房換気、SPA給湯、宴会場空調ゾーンなどの設備条件不足

戻り値は `{ isValid, errors, warnings, checks }` です。

## Material1 Generator

`js/generator/material1Generator.js` は、Building Planner、Building Generator、Equipment Generatorの出力を入力として、建築設備士第二次試験の「資料1 計画条件」に相当する資料データを生成します。

```js
const { generateMaterial1, validateMaterial1 } = require('./js/generator/material1Generator');

const material1 = generateMaterial1({ plan, building, equipment });
const result = validateMaterial1(material1);
```

### generateMaterial1({ plan, building, equipment })

以下の構成を持つ資料1データオブジェクトを返します。

- 設計課題
- 建築物等概要
- 建築設備概要
- 空調換気設備条件
- 給排水衛生設備条件
- 電気設備条件
- 防災設備条件
- 設計上の注意事項

資料文は本試験形式に近い条件提示型の文体で生成し、ホテル用途として自然な客室、宴会、料飲、SPA、バックヤード、設備スペースの条件を含めます。設備方式、容量、設置場所はEquipment Generatorの結果を参照するため、空調、換気、給水、給湯、排水、消火、受変電、非常電源、搬送、中央監視の内容と矛盾しない資料になります。

### validateMaterial1(material1)

Quality Checkerとして、資料1の必須項目、建築概要、設備概要、空調・衛生・電気・防災の条件、ホテル課題としての成立性、buildingとequipmentに由来する内容との整合を検査します。

戻り値は `{ isValid, errors, warnings, checks }` です。

## Material Generator

`js/generator/materialGenerator.js` は、既存のMaterial1 Generatorを利用しながら、資料1〜資料5を一括生成・管理する親Generatorです。資料2〜資料5は詳細SVG生成の前段となる構造化データとして生成し、資料間で同一の建物条件を共有します。

```js
const { generateMaterials, validateMaterials } = require('./js/generator/materialGenerator');

const result = generateMaterials({ plan, building, equipment });
const validation = validateMaterials(result);
```

### generateMaterials({ plan, building, equipment })

戻り値は `{ materials, index }` です。`materials` には資料1「計画条件」、資料2「配置図」、資料3「建築基本設計図」、資料4「白図」、資料5「答案用紙」を順番に格納します。資料2は敷地条件、道路条件、建物配置、車寄せ、搬入口、屋外設備置場、引込位置、方位、寸法情報を持ちます。資料3は地下1階、1階、2階、3階、4〜10階代表階、塔屋と、主要室、EPS、PS、DS、設備諸室を持ちます。資料4は資料3と同じ階構成を持つ建築情報のみの白図です。資料5は建築設備基本計画、空調換気、給排水衛生、電気の答案用紙と、記述欄、計算欄、系統図欄、機器表欄、凡例欄を持ちます。

### validateMaterials(materials)

Quality Checkerとして、資料1〜5の存在、各資料の`materialId`と`title`、資料1と資料2〜5の建物条件、資料3と資料4の階構成、資料5の答案欄を検査します。

## ドメインモデルとの整合

Building Plannerは `docs/DOMAIN_MODEL.md` の「建築企画」エンティティとして、ホテルタイプと各種方針を定義します。Building Generatorは `docs/DOMAIN_MODEL.md` の「建物」エンティティを起点として、階数、主要室、設備スペースを生成します。Equipment Generatorは同モデルの「設備機器」「空調設備」「衛生設備」「電気設備」を、建物全体・室・設備スペースに紐づく設備方式、容量、設置場所として生成します。Material1 Generatorは、建築企画、建物、設備機器を試験資料の「資料1 計画条件」として統合します。Material Generatorは資料1〜資料5を同一の建物条件で束ね、後続のDrawing Generator、Exam Generator、Scoring Generator、およびQuality Checkerが参照する前提条件として利用できる構造です。

## テスト

Node.jsの標準テストランナーでユニットテストを実行します。

```bash
npm test
```

## 使い方

`index.html` をブラウザで開いて利用します。

1. 画面上部メニューの「生成プレビュー」を選択します。
2. 「模擬試験生成」ボタンを押します。
3. Building Generatorが建物名称、用途、所在地、面積、階数、構造、主要室を生成します。
4. 生成された建築条件を入力としてEquipment Generatorが空調、換気、給水、給湯、排水、消火、受変電、非常電源、中央監視の各方式を生成します。
5. Material1 Generatorにより、建築条件と設備条件に整合する「資料1 計画条件」を生成できます。
6. Material Generatorにより、資料1〜資料5を同じ建物条件で一括生成できます。
7. 生成結果表示エリアで建築条件と設備条件を確認します。
8. 「JSONを表示」ボタンを押すと、直近で生成したBuilding GeneratorとEquipment Generatorの結果を整形済みJSONとして確認できます。模擬試験を未生成の状態で押した場合は「先に模擬試験生成を押してください」と表示されます。

印刷する場合は画面内の「A4で印刷する」ボタン、またはブラウザの印刷機能を使用してください。生成結果カードとJSON表示エリアはPC表示とA4縦印刷の両方で読みやすいレイアウトになるよう調整しています。

## Drawing Generator

`js/generator/drawingGenerator.js` は、Building Planner、Building Generator、Equipment Generator、Material Generatorの結果から、次StepのSVG変換で利用する図面JSONオブジェクトを生成します。`generateDrawings({ plan, building, equipment, materials })` は、A3横・mm単位の図面セットとして、配置図、各階平面図、白図、部分詳細図、答案用紙、凡例、タイトル欄、メタデータを返します。

配置図は敷地境界、接道、方位、建物外形、配置寸法、車寄せ、駐車場、搬入口、歩行者入口、サービス動線、屋外設備置場、電気・ガス・上水・下水・雨水の接続位置、緑地、縮尺、図枠を保持します。平面図は地下1階、1階、2階、3階、4〜10階代表階、塔屋、屋上を対象に、通り芯、柱、壁、開口、階段、EV、室、寸法、設備室、EPS・PS・DS、注記を保持します。白図は平面図と同じ建築形状を使用しますが、設備機器、配管、ダクト、配線、設備記号、系統名称、模範解答情報を含めません。

`validateDrawings(drawings, { plan, building, equipment, materials })` は、必須図面、図面ID、配置図コア要素、必要階、資料3と白図の階構成、白図への設備要素混入、EPS・PS・DS、設備室と設備条件、答案欄、縮尺・用紙・図枠を検査します。

## SVG描画基盤

Step9-1では、Drawing Generatorが生成する図面JSONを編集可能なSVGに変換するための共通描画基盤を追加しました。`js/svg/svgRenderer.js`がA3横のSVGルート、`defs`、図枠、タイトル枠、メタデータ、レイヤーを生成し、`serializeSvg()`と`downloadSvg()`で文字列化と保存を行います。`js/svg/svgPrimitives.js`は線・矩形・柱・壁・扉・窓・寸法線などの基本図形、`js/svg/svgSymbols.js`は方位・階段・EV・設備スペース等の再利用記号を提供します。

レイヤーは`Layer01_Architecture`、`Layer02_Grid`、`Layer03_Dimensions`、`Layer04_Equipment`、`Layer05_Text`、`Layer06_Answer`、`Layer07_Print`を標準とし、白図モードでは設備・解答レイヤーを除外できます。CAD風の白黒SVGを前提に、外壁0.50mm、内壁0.30mm、柱0.35mm、設備0.25mm、寸法0.15mm、通り芯0.13mm、補助線0.10mm、図枠0.50mmの線幅標準を定義しています。日本語フォントはYu Gothic、Hiragino Kaku Gothic ProN、sans-serifを使用します。

## 建築図SVG Generator

Step9-2では、Drawing Generatorが出力する配置図・各階平面図・白図JSONを、Step9-1のSVG基盤レイヤーに差し込む建築図Rendererを追加しました。`js/svg/architecturalDrawingRenderer.js`が図面種別を判定し、配置図は`sitePlanRenderer`、平面図は`floorPlanRenderer`、白図は`blankPlanRenderer`へ委譲します。

* 配置図はA3横、標準縮尺1/500で、敷地境界、道路、道路幅員、方位、建物外形、外構、各種引込位置、縮尺、凡例を白黒CAD風SVGで描画します。
* 平面図はA3横、標準縮尺1/200で、通り芯、柱、壁、扉、窓、階段、EV、室名、室面積、寸法、EPS/PS/DS、設備室名称、方位、縮尺、凡例を描画します。設備機器、配管、ダクト、配線、模範解答は描画しません。
* 白図は平面図と同じ建築形状を使い、設備記号・設備系統名称・配管・ダクト・配線・模範解答を除外します。

プレビューは画面の「建築図プレビュー」で図面を選択し、「建築図を表示」を押します。表示後、「SVG保存」で編集可能なSVGを保存できます。「印刷」はA3横、余白0、白背景で図面のみを印刷します。

## Step9-3 設備図SVG Generator

`js/svg/equipmentDrawingRenderer.js` はDrawing Generatorの階平面図JSONとEquipment Generatorの設備条件を受け取り、Step9-2の建築図SVGを背景に `Layer04_Equipment` と `Layer05_Text` へ設備要素を重ねる。対象は空調・換気、給排水衛生、電気設備で、各分野の詳細描画は `hvacDrawingRenderer.js`、`plumbingDrawingRenderer.js`、`electricalDrawingRenderer.js` に分離している。設備記号は `equipmentSymbols.js` の `symbol` 定義を再利用し、凡例と機器表は `Layer07_Print` に生成する。

ルーティングはEPS、PS、DSを立上り基点とし、直交ルートで室中央横断を避ける簡易方式とする。白黒CAD風を標準とし、画面補助色モードでは空調を青、給排水を緑、電気を赤で表示するが、印刷CSSによりA3横・白背景・黒線で出力する。HTMLの「設備図プレビュー」から設備区分、階、表示モードを選択し、「設備図を表示」「SVG保存」「印刷」を実行できる。

## Exam Generator（Step10-1）

Exam Generatorは、Building Planner、Building Generator、Equipment Generator、Material Generator、Drawing Generatorの結果を入力として、建築設備士第二次試験（設計製図）形式の学習用模擬試験問題集データを生成する。問題集は表紙、注意事項、設計課題、計画条件、必須問題11問、選択問題A（空調・換気）5問、選択問題B（給排水衛生）5問、選択問題C（電気）5問、計算条件、製図要求事項、答案用紙参照で構成する。模範解答は生成しない。

必須問題は `questionId`、分野、設問名、問題文、解答形式、要求点、条件、関連設備、関連室、難易度、答案欄IDを持つ。記述、計算、選択、図示を組み合わせ、ホテル条件・設備方式・防災・維持管理・BCP・LCCを読み取らないと解けない設問にする。選択問題は各設備区分ごとに能力算定、系統図、指定階平面図、部分詳細図、機器表・制御・省エネルギー等を扱う。

計算条件には外気条件、室内条件、空気密度、水の比熱、温度差、比エンタルピー、照明負荷、コンセント負荷、需要率、力率、給水量、給湯量、同時使用率、安全率を、出題に使う範囲で集約する。製図要求事項には選択設備区分、作図対象図面、対象階、縮尺、図面サイズ、系統図、平面図、部分詳細図、機器表、凡例、記号、記載事項、省略可能事項、白図参照先、答案用紙参照先を含め、資料1〜5およびDrawing GeneratorのIDと対応させる。

重複防止として `createQuestionFingerprint()` と `checkQuestionDuplication()` を備え、問題タイトル、主要キーワード、要求項目、計算式の種類、対象設備、対象室、文章構造から過度に類似する設問を警告する。Quality Checkerである `validateExam()` は、表紙・注意事項・設計課題・計画条件・問題数・計算条件・図面要求・答案用紙参照・建築概要と設備条件の整合・存在しない階や室・設備方式との矛盾・空問題文・重複・模範解答混入を検査する。

UIでは「試験問題プレビュー」セクションの「試験問題を生成」「問題集を表示」「JSON表示」「印刷」ボタンから確認できる。印刷はA4縦、12mm余白を基本とし、表紙、設計課題と計画条件、必須問題、選択問題A、選択問題B、選択問題Cでページ区切りを制御し、操作ボタンは印刷時に非表示にする。

## Answer Sheet Generator

Answer Sheet Generatorは、Exam Generator、Material Generator、Drawing Generatorの生成結果を受け取り、模範解答を含まない空欄中心の答案用紙セットを生成します。答案用紙セットは`answerSheetSetId`、`examId`、A4縦/A3横の`sheetSizePolicy`、共通欄、建築設備基本計画答案用紙、空調・換気設備答案用紙、給排水衛生設備答案用紙、電気設備答案用紙、共通記述用紙、メタデータで構成します。

必須問題答案用紙は11問分の問題番号、見出し、記述欄、計算欄、選択欄、簡易図示欄、単位記入欄、算定根拠欄を持ち、`answerType`に応じて必要欄だけを有効化します。空調、衛生、電気の各答案用紙は第1問の算定表、第2問の系統図、第3問の平面図、第4問の詳細図、第5問の機器表・凡例・記述欄を持ちます。平面図欄はDrawing Generatorの白図参照を保持し、設備の模範解答は重ねません。

Answer Sheet RendererはHTMLとSVGを出力します。記述・計算中心の用紙はA4縦HTML、製図用紙はA3横SVGを標準とし、白黒の本試験風レイアウト、図枠、ヘッダー、受験番号欄、氏名欄、採点者欄、罫線または方眼に対応します。プレビュー画面の「答案用紙プレビュー」から用紙種別を選び、生成、表示、SVG保存、印刷を実行できます。

### Step9-4A 高品質建築図面基盤

Step9-4Aでは、A3横・白黒CAD風・編集可能SVGを前提に、実寸座標と用紙座標を分離する図面品質基盤を追加しました。`js/layout/drawingCoordinateSystem.js`で縮尺1/100、1/200、1/400、1/500の実寸mm→SVG座標変換を担い、`sheetComposer.js`で図面本体、凡例、機器表、注記、タイトル枠を重ならない領域へ割り付けます。ホテル階別テンプレート、通り芯、衝突検出、注記配置、品質チェックを追加し、建築図プレビューには高品質モードと表示切替を追加しました。

# 図面仕様書

## 1. 目的

本仕様書は、建築設備士第二次試験の模擬試験に用いるSVG図面の構造、レイヤー、表現ルール、印刷条件を定義する。

## 2. SVG基本方針

SVG図面は、Web表示とA4印刷の両方で判読できることを前提とする。建築要素、寸法、設備要素、文字、解答、印刷補助情報をレイヤー分離し、表示切替、採点支援、PDF変換に利用できる構成とする。

## 3. レイヤー構成

### Layer01 建築

壁、柱、梁、開口、階段、エレベーター、室境界、外構、屋上、機械室、電気室など、建築図面の基本要素を配置する。

### Layer02 寸法

通り芯、寸法線、階高、室寸法、主要設備スペース寸法、縮尺、方位、基準線を配置する。

### Layer03 設備

空調機器、熱源機器、換気機器、配管、ダクト、電気幹線、PS、EPS、DS、受水槽、ポンプ、キュービクル、非常用発電機などを配置する。

### Layer04 文字

室名、室面積、設備名称、注記、凡例、記号説明、設計条件の補足文を配置する。

### Layer05 解答

標準解、採点用補助線、想定設備ルート、正答例の機器配置、減点対象領域など、受験者向け表示では非表示にできる採点支援情報を配置する。

### Layer06 印刷

用紙枠、タイトル欄、ページ番号、試験名、図面番号、印刷余白、トンボ相当の補助情報を配置する。

## 4. 表現ルール

- 建築線は設備線より薄く、設備線は解答確認時に判別しやすい線種とする。
- 寸法線と文字はA4印刷時に判読可能なサイズを確保する。
- 設備系統は凡例と一致する線種、色、記号を用いる。
- 解答レイヤーは通常表示と採点表示を切り替えられるようにする。
- 印刷レイヤーはPDF化時に欠落しないよう、他レイヤーと独立させる。

## 5. 品質条件

- すべての図面要素は所属レイヤーを持つ。
- 文字の重なり、寸法線の欠落、印刷範囲外の要素を検出する。
- 図面上の室名、面積、設備名称は資料と一致させる。
- SVGはブラウザ表示とPDF変換で同等に読めることを確認する。

## 6. Drawing Generator JSON

`generateDrawings({ plan, building, equipment, materials })` はSVG作成前の図面JSONを生成する。トップレベルは`drawingSetId`、`projectTitle`、`sheetSize`、`unit`、`scalePolicy`、`sitePlan`、`floorPlans`、`blankPlans`、`detailDrawings`、`answerSheets`、`legends`、`titleBlocks`、`metadata`で構成する。

`sitePlan`は、`drawingId`、`scale`、`frame`に加え、敷地境界、道路、方位、建物外形、配置寸法、車寄せ、駐車場、搬入口、歩行者入口、サービス動線、屋外設備置場、受電・都市ガス・上水・下水・雨水の接続位置、緑地を保持する。`floorPlans`は、地下1階、1階、2階、3階、4〜10階代表階、塔屋、屋上について、`floorId`、`floorName`、`scale`、`gridLines`、`columns`、`walls`、`doors`、`windows`、`stairs`、`elevators`、`rooms`、`dimensions`、`equipmentSpaces`、`shafts`、`annotations`を保持する。`shafts`はEPS、PS、DSを必須とし、上下階で同じ位置に近づける。

`blankPlans`は白図用で、平面図と同じ建築形状、室名、通り芯、寸法、壁、柱、開口部を保持する。ただし設備機器、設備配管、ダクト、配線、設備記号、設備系統名称、模範解答情報は保持しない。`detailDrawings`はEPS、PS、DS、空調熱源設備室、給水設備室、受変電室、屋上設備置場、冷却塔周辺、配管立上り、ダクト立上りの詳細を持つ。`legends`は記号名、`symbolId`、分類、説明のみを持ち、SVGパスは次Stepで定義する。

## SVG描画仕様（Step9-1）

標準シートはA3横、幅420mm、高さ297mm、`viewBox="0 0 420 297"`です。SVG内部には白背景、黒線、グレースケール印刷対応のCSSを埋め込みます。必須レイヤーは以下の7層です。

1. `Layer01_Architecture`：壁、柱、扉、窓、階段、EVなどの建築要素
2. `Layer02_Grid`：通り芯、グリッド符号
3. `Layer03_Dimensions`：寸法線、寸法値
4. `Layer04_Equipment`：設備機器・設備スペース（白図では除外可能）
5. `Layer05_Text`：室名、注記、凡例
6. `Layer06_Answer`：解答・採点用の表示（白図では除外可能）
7. `Layer07_Print`：印刷専用情報

標準線幅は外壁0.50mm、内壁0.30mm、柱0.35mm、設備0.25mm、寸法0.15mm、通り芯0.13mm、補助線0.10mm、図枠0.50mmです。線種はCSSクラスで実線、破線、一点鎖線、二点鎖線を表現します。文字は日本語表示を前提に、図面タイトル5.0mm、室名3.5mm、寸法・注記・凡例・図枠文字2.5mmを標準とします。印刷は`@page size: A3 landscape; margin: 0;`を前提とし、図枠が切れないよう内側余白を持つSVG図枠を使用します。

## Step9-2 建築図描画仕様

### 共通

原点はSVG左上、単位はmmです。A3横の図面中央に建物を配置し、外周に20mm以上の余白を確保します。タイトル枠は右下、方位記号は右上、凡例は右側または下側に配置します。すべての主要要素に一意の`id`を付与します。

### 配置図

標準縮尺は1/500です。敷地境界、道路、道路幅員、方位記号、建物外形、配置寸法、車寄せ、駐車場、搬入口、歩行者入口、サービス入口、屋外設備置場、緑地、受電・都市ガス・上水・下水・雨水の接続位置、縮尺表示、凡例を描画します。

### 平面図・白図

標準縮尺は1/200です。通り芯は建物外形の外側まで延長し、X1〜・Y1〜の円形記号を上下左右に表示します。柱中心は通り芯交点に合わせる想定で、柱は700〜900mm相当、外壁は200mm相当、内壁は100〜150mm相当のCAD風線幅で表現します。扉は開き勝手、窓は二重線で表現し、室名は室中央、室面積は室名下に配置します。

白図は通り芯、柱、壁、扉、窓、階段、EV、室名、寸法、EPS、PS、DS、設備室名称、図枠、タイトル枠を保持し、設備機器・配管・ダクト・配線・設備系統名称・模範解答は描画しません。

## Step9-3 設備図SVG Generator

- 構成: `equipmentDrawingRenderer.js` が建築図SVGを生成し、分野別Renderer（空調・換気、給排水衛生、電気）を呼び出して設備レイヤーを合成する。
- 描画ルール: 空調はAHU/OAHU/FCU/PAC、吹出口・吸込口、ダクト、冷温水・ドレン・冷媒系をDS/PS/機械室から直交配置する。給排水は給水・給湯・返湯・汚水・雑排水・厨房排水・雨水・消火配管をPS/DSから器具へ接続する。電気はEPSから受変電、発電機、盤、照明、コンセント、弱電・監視設備へ幹線・枝線を展開する。
- 設備記号: `equipmentSymbols.js` に記号ID、カテゴリ、ラベル、SVG定義、標準寸法、接続点を保持し、SVGの `symbol` / `use` として編集可能にする。
- ルーティング: EPS、PS、DSを基点に、廊下・設備シャフト沿いを優先し、柱・扉を避ける前提の直交経路を生成する。重複系統はオフセットし、方向矢印と系統注記を付ける。
- 凡例・機器表: 分野別に記号、名称、略号、線種、用途を凡例化し、Equipment Generatorの設備条件から機器番号、名称、設置場所、能力、電源、備考を表示する。
- 表示と印刷: 標準は白黒CAD風。画面補助色は空調=青、給排水=緑、電気=赤。印刷時はA3横、白背景、完全黒線、UI非表示、SVG比率維持で出力する。
- プレビュー: `index.html` の「設備図プレビュー」で設備区分、階、白黒/画面補助色を選択し、SVG表示・SVG保存・印刷を行う。

## Answer Sheet Generator / 答案用紙出力

- 役割: Exam Generatorの`questionId`、`answerType`、`answerSheetAreaId`、`drawingRequirements`、`answerSheetReferences`、`selection`と`common`と、Material Generatorの資料5、Drawing Generatorの`blankPlans`を参照し、受験者が直接記入・作図する空欄中心の答案用紙セットを生成する。
- セット構造: `answerSheetSetId`、`examId`、`sheetSizePolicy`、`commonFields`、`answerSheet1`、`answerSheet2`、`answerSheet3`、`answerSheet4`、`questionAnswerMap`、`metadata`で構成する。
- 必須問題答案用紙: 建築設備基本計画11問に対し、問題番号、設問見出し、記述欄、計算欄、選択欄、簡易図示欄、単位記入欄、算定根拠欄を持つ。記述、計算、選択、図示の`answerType`に合わせて欄を有効化する。
- 空調答案用紙: 能力算定表、熱源・冷温水・冷却水・外気処理等の系統図欄、平面図欄、部分詳細図欄、機器表・凡例・制御説明欄を持つ。
- 衛生答案用紙: 給水・給湯・排水能力算定表、飲料水・雑用水・給湯・返湯・排水・雨水・通気・消火の系統図欄、平面図欄、設備室詳細図欄、機器表・凡例・雨水利用・消火設備説明欄を持つ。
- 電気答案用紙: 受変電容量・非常電源容量算定表、受変電単線結線図欄、平面図欄、幹線系統図または受変電室詳細図欄、負荷表・機器表・凡例・制御説明欄を持つ。
- 欄種別: 記述欄は罫線または方眼、計算欄は途中式用の高さ、作図欄は白背景・黒枠を標準とする。各欄には一意な`answer-*` IDを付与する。
- 白図連携: 空調・衛生・電気の平面図欄は`blankPlanReference`と`includeBlankPlanBackground`で白図背景の参照可否を表す。模範解答設備は含めない。
- HTML/SVG出力: `renderAnswerSheet()`と`renderAnswerSheetSet()`がHTMLまたはSVG文字列を返す。A4縦はHTML、A3横製図答案用紙はSVGを標準とする。
- 印刷仕様: A4縦は`@page size: A4 portrait; margin: 8mm;`、A3横は`@page size: A3 landscape; margin: 0;`を想定し、印刷時は操作ボタン非表示、白背景、黒文字、図枠維持とする。
- プレビュー方法: UIの「答案用紙プレビュー」で建築設備基本計画、空調・換気設備、給排水衛生設備、電気設備、共通記述用紙を選択し、生成・表示・SVG保存・印刷を行う。

## Step9-4A CAD-style architectural sheet quality

High-quality architectural drawings are A3 landscape SVG sheets. All major geometry is calculated from real dimensions and scale instead of arbitrary SVG placement. The drawing body target occupancy is 55-75% of sheet area. Required sheet regions are drawing body, title block, legend, equipment table, notes, scale, drawing number, project title, page number, examinee number, and name. Floor plans include grid bubbles on all sides, grid dimensions, overall dimensions, double-line wall classes, columns at grid intersections, doors with swing arcs, windows in wall lines, room names, areas, north arrow, scale, and legend.

## Hotel Floor Planner（Step9-4B）

Hotel Floor Plannerは、Step9-4Aの座標系、A3横用紙構成、通り芯、階別テンプレート、注記配置、衝突検出の基盤を利用して、建築設備士第二次試験の問題図として判読可能な白黒CAD風ホテル平面図データを生成する機能である。

- 階別テンプレート: 地下1階、1階、2階、3階、代表客室階、塔屋、屋上を標準対象とし、低層部と客室タワー部の外形差を保持する。
- 中央コア: 乗用EV、サービスEV、非常用EV、2箇所以上の階段、EVホール、前室、EPS、PS、DS、清掃員スペース、リネン庫を上下階で整合させる。
- シャフト: EPS、PS、DS、厨房排気DS、浴場排気DS、排煙DS、客室給排水PS、客室換気DSを、保守側と対象階を持つ縦系統として管理する。
- 客室モジュール: 代表客室階は中廊下型を標準とし、外周窓、客室番号、前室・浴室の簡略区画、両端または離隔階段への避難方向を持つ。
- 隣接条件: ロビー・フロント、厨房・レストラン、宴会場・宴会厨房、浴場・ろ過設備室などの必須隣接と、客室・大型機械室などの回避隣接をスコア化する。
- サービス動線: 搬入口、厨房、宴会厨房、倉庫、サービスEV、客室階リネン、設備室を、客用動線と重大交差しない経路として保持する。
- 避難動線: 各主要階で2方向避難経路を生成し、経路長を算定できる点列データとして保存する。
- 高品質平面図生成: 建物外形、通り芯、柱、壁、扉、窓、階段、EV、室名、面積、室番号、シャフト、防火区画、寸法、方位、凡例、タイトルをSVG Rendererへ渡せる形式に整える。
- 品質検査: `validateHotelFloorPlans` が対象階、上下階コア整合、シャフト整合、階段数、中廊下客室階、主要隣接、搬入経路、2方向避難、外形内配置、文字衝突許容、図面占有率を検査する。

## Step9-4C ホテル平面図描画品質強化

Step9-4Cでは、Step9-4BのHotel Floor Plannerと高品質建築図Rendererを活かし、建築設備士第二次試験の問題図として判読できる白黒CAD風A3横SVGを強化しました。図面本体はタイトル枠・凡例・方位・縮尺を除く領域へ自動フィットし、用紙占有率72〜80%を目標として中央配置します。

代表客室階は中廊下型を標準とし、客室24〜36室、中央コア、客用EV、サービスEV、階段2箇所、EPS/PS/DS、リネン室、清掃員室、防火区画、二方向避難表示を含みます。客室にはベッド、サイドテーブル、デスク、椅子、TV、収納、ユニットバス、洗面器、便器、前室、扉、外窓を簡略家具として配置します。

1階は風除室、エントランス、ロビー、フロント、ラウンジ、レストラン、厨房、食品庫、冷蔵・冷凍庫、搬入口、荷捌き、バックヤード、中央管理室、便所、客用EVホール、サービスEV、階段、EPS/PS/DS、倉庫、従業員動線を高密度に配置する方針です。厨房とレストラン、厨房と搬入口はサービス動線で接続し、客用動線との交差を避けます。

寸法は通り芯間、建物全体、外形、主要室、客室モジュール、廊下幅、コア幅、主要開口、設備室をmm表記で生成します。線幅は外壁0.45mm、耐震壁0.50mm、柱0.35mm、内壁0.18mm、建具0.15mm、家具0.10mm、設備シャフト0.22mm、防火区画0.20mm、寸法線・通り芯・注記引出線0.09mm、図枠0.50mmを基準とします。

SVG patternとしてRC耐震壁、設備スペース、吹抜け/屋外、水回り、防火区画を白黒印刷で区別できるハッチングとして利用します。設備シャフトはEPS、PS、DS、厨房排気DS、浴場排気DS、排煙DS、客室給排水PSを上下階整合と点検性が読み取れるように注記します。

品質指標はpaperUsageRatio、roomUsageRatio、guestRoomCount、furnitureCount、dimensionCount、shaftCount、coreAreaRatio、textCollisionCount、unusedAreaRatio、egressRouteCountを算定し、validateFloorPlanQualityでA3占有率、室利用率、客室数、家具、寸法、線幅、防火区画、避難動線、凡例、タイトル枠、方位・縮尺、文字衝突を検査します。

プレビューでは「ホテル平面計画を生成」後に「高品質建築図を表示」を押し、家具、室面積、室番号、通り芯、寸法、シャフト、防火区画、避難方向、凡例、注記、線幅プレビュー、用紙占有率表示を切り替えます。SVG保存ボタンで編集可能なSVGを書き出し、印刷ボタンでA3横相当の白黒CAD風図面を確認します。

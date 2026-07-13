
## SVG基盤プレビューUI

トップページに「SVG基盤プレビュー」セクションを追加します。「SVGサンプル表示」ボタンでA3横の図枠、タイトル枠、方位記号、グリッド線、壁、柱、扉、窓、室名、寸法線、縮尺バーを含むサンプルSVGを描画します。「SVG保存」ボタンは生成済みSVGを`.svg`ファイルとして保存します。未生成時に保存を押した場合は、先にサンプル表示を行うようメッセージを表示します。

画面表示ではSVGをプレビュー領域内に縮小表示し、印刷時はA3横の原寸比率を維持します。既存のGenerator PreviewおよびJSON表示は独立して動作し、SVGプレビュー操作によって生成済みJSON表示は変更されません。

## 建築図プレビューUI

`index.html`に「建築図プレビュー」セクションを追加しています。図面選択は、配置図、地下1階、1階、2階、3階、代表階、塔屋、屋上、白図に対応します。

* 「建築図を表示」: 生成済みDrawing Generatorデータを建築図SVGへ変換して表示します。
* 「SVG保存」: 表示中の編集可能SVGを保存します。
* 「印刷」: A3横で印刷します。

未生成、Drawing Generatorデータなし、選択階なし、SVG生成失敗、室データ不足は、プレビュー欄のメッセージとして表示し、JavaScript例外で画面全体を停止させない方針です。

## Step9-3 設備図SVG Generator

- 構成: `equipmentDrawingRenderer.js` が建築図SVGを生成し、分野別Renderer（空調・換気、給排水衛生、電気）を呼び出して設備レイヤーを合成する。
- 描画ルール: 空調はAHU/OAHU/FCU/PAC、吹出口・吸込口、ダクト、冷温水・ドレン・冷媒系をDS/PS/機械室から直交配置する。給排水は給水・給湯・返湯・汚水・雑排水・厨房排水・雨水・消火配管をPS/DSから器具へ接続する。電気はEPSから受変電、発電機、盤、照明、コンセント、弱電・監視設備へ幹線・枝線を展開する。
- 設備記号: `equipmentSymbols.js` に記号ID、カテゴリ、ラベル、SVG定義、標準寸法、接続点を保持し、SVGの `symbol` / `use` として編集可能にする。
- ルーティング: EPS、PS、DSを基点に、廊下・設備シャフト沿いを優先し、柱・扉を避ける前提の直交経路を生成する。重複系統はオフセットし、方向矢印と系統注記を付ける。
- 凡例・機器表: 分野別に記号、名称、略号、線種、用途を凡例化し、Equipment Generatorの設備条件から機器番号、名称、設置場所、能力、電源、備考を表示する。
- 表示と印刷: 標準は白黒CAD風。画面補助色は空調=青、給排水=緑、電気=赤。印刷時はA3横、白背景、完全黒線、UI非表示、SVG比率維持で出力する。
- プレビュー: `index.html` の「設備図プレビュー」で設備区分、階、白黒/画面補助色を選択し、SVG表示・SVG保存・印刷を行う。

## Exam Generator（Step10-1）

Exam Generatorは、Building Planner、Building Generator、Equipment Generator、Material Generator、Drawing Generatorの結果を入力として、建築設備士第二次試験（設計製図）形式の学習用模擬試験問題集データを生成する。問題集は表紙、注意事項、設計課題、計画条件、必須問題11問、選択問題A（空調・換気）5問、選択問題B（給排水衛生）5問、選択問題C（電気）5問、計算条件、製図要求事項、答案用紙参照で構成する。模範解答は生成しない。

必須問題は `questionId`、分野、設問名、問題文、解答形式、要求点、条件、関連設備、関連室、難易度、答案欄IDを持つ。記述、計算、選択、図示を組み合わせ、ホテル条件・設備方式・防災・維持管理・BCP・LCCを読み取らないと解けない設問にする。選択問題は各設備区分ごとに能力算定、系統図、指定階平面図、部分詳細図、機器表・制御・省エネルギー等を扱う。

計算条件には外気条件、室内条件、空気密度、水の比熱、温度差、比エンタルピー、照明負荷、コンセント負荷、需要率、力率、給水量、給湯量、同時使用率、安全率を、出題に使う範囲で集約する。製図要求事項には選択設備区分、作図対象図面、対象階、縮尺、図面サイズ、系統図、平面図、部分詳細図、機器表、凡例、記号、記載事項、省略可能事項、白図参照先、答案用紙参照先を含め、資料1〜5およびDrawing GeneratorのIDと対応させる。

重複防止として `createQuestionFingerprint()` と `checkQuestionDuplication()` を備え、問題タイトル、主要キーワード、要求項目、計算式の種類、対象設備、対象室、文章構造から過度に類似する設問を警告する。Quality Checkerである `validateExam()` は、表紙・注意事項・設計課題・計画条件・問題数・計算条件・図面要求・答案用紙参照・建築概要と設備条件の整合・存在しない階や室・設備方式との矛盾・空問題文・重複・模範解答混入を検査する。

UIでは「試験問題プレビュー」セクションの「試験問題を生成」「問題集を表示」「JSON表示」「印刷」ボタンから確認できる。印刷はA4縦、12mm余白を基本とし、表紙、設計課題と計画条件、必須問題、選択問題A、選択問題B、選択問題Cでページ区切りを制御し、操作ボタンは印刷時に非表示にする。

## Answer Sheet Generator / 答案用紙出力

- 役割: Exam Generatorの`questionId`、`answerType`、`answerSheetAreaId`、`drawingRequirements`、`answerSheetReferences`、`electiveSections`と、Material Generatorの資料5、Drawing Generatorの`blankPlans`を参照し、受験者が直接記入・作図する空欄中心の答案用紙セットを生成する。
- セット構造: `answerSheetSetId`、`examId`、`sheetSizePolicy`、`commonFields`、`mandatoryPlanningSheet`、`hvacSheet`、`plumbingSheet`、`electricalSheet`、`commonDescriptionSheet`、`questionAnswerMap`、`metadata`で構成する。
- 必須問題答案用紙: 建築設備基本計画11問に対し、問題番号、設問見出し、記述欄、計算欄、選択欄、簡易図示欄、単位記入欄、算定根拠欄を持つ。記述、計算、選択、図示の`answerType`に合わせて欄を有効化する。
- 空調答案用紙: 能力算定表、熱源・冷温水・冷却水・外気処理等の系統図欄、平面図欄、部分詳細図欄、機器表・凡例・制御説明欄を持つ。
- 衛生答案用紙: 給水・給湯・排水能力算定表、飲料水・雑用水・給湯・返湯・排水・雨水・通気・消火の系統図欄、平面図欄、設備室詳細図欄、機器表・凡例・雨水利用・消火設備説明欄を持つ。
- 電気答案用紙: 受変電容量・非常電源容量算定表、受変電単線結線図欄、平面図欄、幹線系統図または受変電室詳細図欄、負荷表・機器表・凡例・制御説明欄を持つ。
- 欄種別: 記述欄は罫線または方眼、計算欄は途中式用の高さ、作図欄は白背景・黒枠を標準とする。各欄には一意な`answer-*` IDを付与する。
- 白図連携: 空調・衛生・電気の平面図欄は`blankPlanReference`と`includeBlankPlanBackground`で白図背景の参照可否を表す。模範解答設備は含めない。
- HTML/SVG出力: `renderAnswerSheet()`と`renderAnswerSheetSet()`がHTMLまたはSVG文字列を返す。A4縦はHTML、A3横製図答案用紙はSVGを標準とする。
- 印刷仕様: A4縦は`@page size: A4 portrait; margin: 8mm;`、A3横は`@page size: A3 landscape; margin: 0;`を想定し、印刷時は操作ボタン非表示、白背景、黒文字、図枠維持とする。
- プレビュー方法: UIの「答案用紙プレビュー」で建築設備基本計画、空調・換気設備、給排水衛生設備、電気設備、共通記述用紙を選択し、生成・表示・SVG保存・印刷を行う。

## Step9-4A architectural preview controls

The architectural preview includes a high-quality mode and a dedicated 「高品質建築図を表示」 button. The preview also exposes toggles for grid lines, dimensions, room areas, notes, collision ranges, and sheet regions. High-quality preview can synthesize hotel floor templates when drawing generator data is not available, enabling layout review without changing the existing exam-generation workflow.

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

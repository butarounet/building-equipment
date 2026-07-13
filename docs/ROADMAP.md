# ロードマップ

## Phase1 設計

- 既存設計書を整備する。
- ドメインモデル、アーキテクチャ、データ仕様、図面仕様、AI生成仕様の関係を整理する。
- 生成エンジンの責務をBuilding Generator、Equipment Generator、Drawing Generator、Exam Generator、Scoring Generator、Quality Checkerに分離する。
- 実装前に、設計書間の用語、入力、出力、品質確認観点を統一する。

## Phase2 データモデル

- 建物、階、室、設備機器、図面、問題、採点項目のデータ構造を定義する。
- 空調設備、衛生設備、電気設備の共通属性と個別属性を整理する。
- 用途別ディレクトリ構成、スキーマ、テンプレート、原単位、採点基準を整備する。
- データバージョン管理、乱数シード、生成IDによる再現性の方針を決定する。

## Phase3 問題生成

- 建物条件、設備条件、図面条件に基づく問題生成ルールを具体化する。
- 資料1～資料5、記述問題、製図問題、模範解答、採点基準の対応関係を整理する。
- 出題重複防止、難易度調整、年度別傾向反映の仕組みを設計する。
- 問題文と採点項目が資料・図面から検証できる状態にする。

## Phase4 SVG生成

- SVG図面の中間表現とレイヤー構成を定義する。
- 建築、寸法、設備、文字、解答、印刷レイヤーを分離する。
- 空調、衛生、電気の設備記号、配管、ダクト、幹線、凡例の表現ルールを整理する。
- A4印刷とPDF変換に適した図面品質検査を追加する。

## Phase5 HTML

- 生成済み試験をHTMLで閲覧できる画面構成を設計する。
- 問題文、資料、図面、模範解答、採点項目の表示順序を整理する。
- A4印刷を前提としたHTMLレイアウト、改ページ、余白、文字サイズを定義する。
- 将来のUI操作、プレビュー、条件入力、生成結果確認に備えた画面責務を整理する。

## Phase6 PDF

- HTMLおよびSVGからPDFを出力する方針を設計する。
- ページ構成、図面解像度、文字判読性、余白、縮尺、凡例配置の品質基準を定義する。
- 問題冊子、解答例、採点基準を分離または結合して出力するパターンを整理する。
- PDF変換時の崩れ、欠落、ページまたぎをQuality Checkerで検査する方針を定める。

## Phase7 AI自動生成

- AI自動生成で利用する入力スキーマ、出力スキーマ、制約条件を定義する。
- LLMを各Generatorの内部実装候補として扱い、外部インターフェースは構造化データに統一する。
- LLM生成結果をQuality Checkerで検査し、法令整合、設備成立性、出題重複、難易度を確認する。
- AI出力失敗時の再生成、部分修正、人手確認、フォールバック手順を整備する。

## Step9-1 SVG描画基盤

完了範囲は、A3横SVGドキュメント生成、共通レイヤー、図枠・タイトル枠、CAD風CSS、基本プリミティブ、共通記号、HTMLプレビュー、SVG保存、基礎テストです。次Stepでは、Drawing Generatorの配置図JSONおよび各階平面図JSONをこのSVG基盤へマッピングし、図面種別ごとのレンダラーを追加します。今回の範囲では配置図・各階平面図そのものの完成描画は行わず、後続実装が共通利用できるSVGエンジンに限定します。

## Step9-2 完了: 建築図SVG Generator

配置図・各階平面図・白図をSVG化する建築図Rendererを追加しました。今回の対象は建築基本設計図風の白黒CAD表現であり、設備配管、ダクト、配線、設備機器、模範解答描画は対象外です。

次段階では、建築図レイヤーを壊さずに設備系統図・配管・ダクト・配線・解答例レイヤーを段階的に重ねる実装を検討します。

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

## Step9-4A completed foundation

- Added model/sheet coordinate separation and A3 sheet composition.
- Added grid, hotel floor template, annotation, collision, and drawing quality modules.
- Added high-quality architectural preview controls.
- Kept detailed equipment piping/system diagram/model answer upgrades out of scope for this step.

Next steps: enrich equipment-symbol density on top of this architectural base, add more robust automatic door/window wall splitting, and expand visual collision resolution diagnostics.

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

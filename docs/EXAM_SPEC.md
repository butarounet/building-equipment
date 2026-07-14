# 試験資料仕様書

## 資料1 Generator

`js/generator/material1Generator.js` は、Building Planner、Building Generator、Equipment Generatorの結果を統合し、建築設備士第二次試験の「資料1 計画条件」に相当する構造化データを生成する。

資料1は、設計課題、建築物等概要、建築設備概要、空調換気設備条件、給排水衛生設備条件、電気設備条件、防災設備条件、設計上の注意事項で構成する。文体は本試験に近い条件提示型としつつ、過去問題の文章をそのまま転用しない。

`generateMaterial1({ plan, building, equipment })` は、ホテル用途として自然な条件を作成し、客室数、面積、階数、設備方式、設備容量、設置場所が入力データと矛盾しないように記述する。`validateMaterial1(material1)` は、必須項目、建築概要、設備概要、設備分野別条件、ホテル課題としての成立性、入力由来の設備系統との整合性を検査する。


## Material Generator

`js/generator/materialGenerator.js` は、資料1〜資料5を一括生成・管理する親Generatorである。資料1は既存のMaterial1 Generatorを利用し、資料2〜資料5は詳細SVG生成前の構造化データとして作成する。

`generateMaterials({ plan, building, equipment })` は、`materials`配列に資料1「計画条件」、資料2「配置図」、資料3「建築基本設計図」、資料4「白図」、資料5「答案用紙」を順に格納し、`index`で資料番号と表題を管理する。資料2は敷地条件、道路条件、建物配置、車寄せ、搬入口、屋外設備置場、引込位置、方位、寸法情報を持つ。資料3は地下1階、1階、2階、3階、4〜10階代表階、塔屋と、主要室、EPS、PS、DS、機械室、電気室、受変電室、給水設備室、空調熱源設備室を持つ。資料4は資料3と同じ階構成を持つ建築情報のみの白図で、設備機器、配管、ダクト、配線は含めない。資料5は建築設備基本計画、空調換気設備、給排水衛生設備、電気設備の答案用紙と、記述欄、計算欄、系統図欄、機器表欄、凡例欄を持つ。

`validateMaterials(materials)` は、資料1〜5の存在、各資料の`materialId`と`title`、資料1と資料2〜5の建物条件、資料3と資料4の階構成、資料5の答案用紙欄を検査する。

## Drawing Generator

`js/generator/drawingGenerator.js` は、資料1〜資料5を参照して試験図面のJSON中間表現を生成する。`generateDrawings({ plan, building, equipment, materials })` は配置図、各階平面図、白図、部分詳細図、答案用紙、凡例、タイトル欄を生成し、次StepのSVG変換に必要な図面ID、縮尺、図枠、寸法、室、設備室、シャフト、答案欄を構造化する。

答案用紙は、建築設備基本計画、空調換気設備、給排水衛生設備、電気設備、共通記述用紙を生成対象とし、受験番号欄、氏名欄、問題番号、記述欄、計算欄、系統図欄、平面図欄、機器表欄、凡例欄、採点者記入欄を持つ。`validateDrawings()` は必須図面、階構成、白図の設備要素非混入、EPS・PS・DS、設備室、答案欄、縮尺・用紙・図枠を検査し、既存Quality Checkerと同じ`{ isValid, errors, warnings, checks }`形式を返す。

## Exam Generator（Step10-1）

Exam Generatorは、Building Planner、Building Generator、Equipment Generator、Material Generator、Drawing Generatorの結果を入力として、建築設備士第二次試験（設計製図）形式の学習用模擬試験問題集データを生成する。問題集は表紙、注意事項、設計課題、計画条件、選択問題A（空調）2問、選択問題B（衛生）2問、選択問題C（電気）2問、共通問題Q03〜Q05、計算条件、製図要求事項、答案用紙参照で構成する。模範解答は生成しない。

必須問題は `questionId`、分野、設問名、問題文、解答形式、要求点、条件、関連設備、関連室、難易度、答案欄IDを持つ。記述、計算、選択、図示を組み合わせ、ホテル条件・設備方式・防災・維持管理・BCP・LCCを読み取らないと解けない設問にする。選択問題は各設備区分ごとに2問を扱い、共通問題はQ03客室階FCU配管図、Q04便所配管図、Q05照明設計を扱う。

計算条件には外気条件、室内条件、空気密度、水の比熱、温度差、比エンタルピー、照明負荷、コンセント負荷、需要率、力率、給水量、給湯量、同時使用率、安全率を、出題に使う範囲で集約する。製図要求事項には選択設備区分、作図対象図面、対象階、縮尺、図面サイズ、系統図、平面図、部分詳細図、機器表、凡例、記号、記載事項、省略可能事項、白図参照先、答案用紙参照先を含め、資料1〜5およびDrawing GeneratorのIDと対応させる。

重複防止として `createQuestionFingerprint()` と `checkQuestionDuplication()` を備え、問題タイトル、主要キーワード、要求項目、計算式の種類、対象設備、対象室、文章構造から過度に類似する設問を警告する。Quality Checkerである `validateExam()` は、表紙・注意事項・設計課題・計画条件・問題数・計算条件・図面要求・答案用紙参照・建築概要と設備条件の整合・存在しない階や室・設備方式との矛盾・空問題文・重複・模範解答混入を検査する。

UIでは「試験問題プレビュー」セクションの「試験問題を生成」「問題集を表示」「JSON表示」「印刷」ボタンから確認できる。印刷はA4縦、12mm余白を基本とし、表紙、設計課題と計画条件、必須問題、選択問題A、選択問題B、選択問題Cでページ区切りを制御し、操作ボタンは印刷時に非表示にする。

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

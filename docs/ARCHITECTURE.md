# アーキテクチャ設計書

## 1. 概要

本アプリケーションは、建築設備士第二次試験（設計製図）の模擬試験を生成・表示・印刷するためのWebアプリケーションである。将来的なAI生成、REST API化、HTML/PDF出力を見据え、生成処理、描画処理、採点処理、品質確認処理を疎結合なモジュールとして分離する。

## 2. レイヤー構成

- UI Layer: HTML、CSS、JavaScriptによる画面表示、入力受付、印刷操作を担当する。
- Application Layer: ユーザー操作を受け、生成エンジン群を順序制御する。
- Generation Layer: 建築、設備、図面、試験、採点、品質確認を担当する独立モジュール群で構成する。
- Data Layer: 用途別のテンプレート、原単位、問題部品、図面部品、採点基準を管理する。
- Output Layer: HTML、PDF、SVG、JSONなどの出力を担当する。

## 3. 生成エンジン構成

生成エンジンは、以下の独立モジュールで構成する。各Generatorは前段の構造化データを入力とし、後段が利用できる構造化データを出力する。Quality Checkerは全工程の出力を横断的に検査し、必要に応じて該当Generatorへ再生成要求を返す。

- Building Planner
- Building Generator
- Equipment Generator
- Material1 Generator
- Material Generator
- Drawing Generator
- Exam Generator
- Scoring Generator
- Quality Checker

### 3.1 Building Planner

Building Plannerは、ホテル課題の前提となる建築企画を生成する。ホテルタイプ、設計テーマ、敷地条件、ゾーニング方針、規模方針、階数方針、客室方針、宴会・料飲・SPA・バックヤード・設備スペース方針、試験難易度を構造化し、Building GeneratorとEquipment Generatorが参照できる上位方針として出力する。Quality Checkerは、企画段階でホテルタイプと主要機能の整合、階数・客室数の成立性、建築設備士第二次試験の模擬課題としての妥当性を検査する。

### 3.2 Building Generator

Building Generatorは、建物用途、敷地条件、階構成、室構成、建築概要、基本ゾーニングを生成する。生成結果はEquipment GeneratorとDrawing Generatorの入力となるため、面積、階数、室名、室用途、利用人数を構造化データとして出力する。

### 3.3 Equipment Generator

Equipment Generatorは、空調、換気、給排水衛生、電気、防災、搬送設備の条件を生成する。用途別データと建築概要を参照し、設備方式、容量条件、機械室、シャフト、屋外機器、制御方針を出力する。

### 3.4 Material1 Generator

Material1 Generatorは、Building Plannerの建築企画、Building Generatorの建築条件、Equipment Generatorの設備条件を統合し、建築設備士第二次試験の「資料1 計画条件」に相当する資料データを生成する。設計課題、建築物等概要、建築設備概要、空調換気設備条件、給排水衛生設備条件、電気設備条件、防災設備条件、設計上の注意事項を、ホテル用途として自然で、かつ設備生成結果と矛盾しない文体で出力する。Quality Checkerは必須項目、分野別条件、建築・設備データとの整合を検査する。

### 3.5 Material Generator

Material Generatorは、既存のMaterial1 Generatorで生成した資料1を起点に、資料2 配置図、資料3 建築基本設計図、資料4 白図、資料5 答案用紙を一括生成・管理する親Generatorである。資料2〜資料5は詳細SVG生成を行わず、敷地・道路・配置・階構成・白図書込層・答案欄など、後続Generatorが参照する構造化データとして出力する。Quality Checkerは資料1〜5の存在、各資料の識別子と表題、建物条件の整合、資料3と資料4の階構成一致、資料5の答案欄を検査する。

### 3.6 Drawing Generator

Drawing Generatorは、建築概要と設備条件からSVG図面用の中間表現を生成する。壁、柱、室、寸法、設備機器、配管、ダクト、幹線、文字、解答レイヤー、印刷レイヤーをレイヤー別に整理する。

### 3.7 Exam Generator

Exam Generatorは、資料1～資料5、記述問題、製図問題を生成する。問題文は建築概要、設備条件、図面条件と必ず対応させ、受験者が資料と図面から根拠を読み取れる構成にする。

### 3.8 Scoring Generator

Scoring Generatorは、模範解答、採点項目、配点、部分点、減点条件、重大欠陥条件を生成する。記述問題と製図問題で採点構造を分離し、AI採点支援に利用可能なキーワード、許容表現、代替解も保持する。

### 3.9 Quality Checker

Quality Checkerは、各生成エンジンの出力を検査する。検査対象は、法令整合、設備成立性、図面整合、資料と問題の対応、採点基準の妥当性、出題重複、難易度、印刷品質である。検査に失敗した場合は、該当モジュールへ再生成要求を返す。

## 4. データフロー

1. UIまたは将来APIから生成条件を受け取る。
2. Application Layerが乱数シードと生成IDを発行する。
3. Building Plannerが建築企画を生成する。
4. Building Generatorが企画方針を反映して建築条件を生成する。
5. Equipment Generatorが設備条件を生成する。
6. Material1 Generatorが資料1 計画条件を生成する。
7. Material Generatorが資料1〜資料5を同一条件で束ねる。
8. Drawing Generatorが図面中間表現とSVGを生成する。
9. Exam Generatorが試験資料と問題を生成する。
10. Scoring Generatorが採点基準を生成する。
11. Quality Checkerが全体整合を確認する。
12. Output LayerがHTML、PDF、SVG、JSONとして出力する。

## 5. 拡張方針

各Generatorは、同一入力と同一シードから同一出力を再現できるようにする。将来LLMを利用する場合も、LLMは各Generatorの内部実装候補として扱い、外部インターフェースは構造化データを維持する。

### Drawing Generator実装メモ

現行実装のDrawing GeneratorはSVGを直接出力せず、SVG Generatorへ渡す中間図面JSONを生成する。入力は`plan`、`building`、`equipment`、`materials`で、資料2の配置条件、資料3の階構成、資料5の答案用紙構成を利用する。出力は`sitePlan`、`floorPlans`、`blankPlans`、`detailDrawings`、`answerSheets`、`legends`、`titleBlocks`を含み、白図は建築情報のみを保持する。Quality Checkerは`validateDrawings()`として同ファイルに実装し、図面セット単体ではなく元資料・建物・設備との整合性を検査する。

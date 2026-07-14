# STEP10-15 Real Exam Reproduction Engine

## 目的

`js/exam/realExamReproductionEngine.js` は、試験資料を新規に自由生成するのではなく、資料1〜5、資料S2-1〜S2-5、資料S3-1〜S3-5、資料S4-1〜S4-5をテンプレートとして再構成するための品質ゲートです。

## 固定する構成

### 問題レイアウト

以下の見出し順を固定します。

1. Ⅰ 設計課題
2. Ⅱ 計画条件
3. Ⅲ 建築基本設計図
4. Ⅳ 必須問題（11問）
5. Ⅴ 選択問題（5問）
6. Ⅵ 共通問題（11問）

`questionLayoutEngine` は必須11問、選択5問、共通11問を検査し、欠番または重複を検出します。

### 図面レイアウト

`drawingLayoutEngine` は以下の図面順を固定します。

1. 配置図
2. 各階平面図
3. 屋上
4. 断面
5. 白図
6. 設備図
7. 模範図

### ページネーション

`paginationEngine` は以下のページ順と改ページを固定します。

1. 表紙
2. 注意事項
3. 設計課題
4. 計画条件
5. 図面
6. 問題
7. 答案
8. 採点
9. 模範解答

### 答案用紙

`answerSheetLayoutEngine` は資料S3-5、資料S4-5相当の答案枠を維持します。`textarea` のみの簡易表示は不合格です。

## 類似度評価

`layoutSimilarityEngine` は以下の項目を100点満点で評価します。95点未満はwarning相当です。

- HTML構造
- 見出し
- 表
- 余白
- 改ページ
- SVG配置
- 文字サイズ
- 図枠
- 答案枠

## Quality Gate

`realExamReproductionEngine` は生成完了後に以下を検査します。

- Template Similarity
- Question Count
- Drawing Count
- Page Count
- Layout
- AnswerSheet
- Common Questions
- Print Layout
- SVG
- PDF

## 完了条件

- 資料S3との一致率95%以上
- 資料S4との一致率95%以上
- 共通問題11問保証
- 選択問題5問保証
- ページ構成固定
- HTMLレイアウト固定
- SVGレイアウト固定
- `npm test` 成功

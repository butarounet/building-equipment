# 建築設備士 第二次試験 模擬試験

建築設備士第二次試験（設計製図）の本試験レベルの模擬試験を作成するためのWebアプリです。

## 構成

```text
/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
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
└── README.md
```

## 機能

- 白背景のシンプルな学習画面
- ヘッダーとメニュー
- レスポンシブ対応
- A4縦印刷対応
- CSSとJavaScriptの分離
- 用途別JSONデータによる模擬試験生成基盤

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

## 使い方

`index.html` をブラウザで開いて利用します。印刷する場合は画面内の「A4で印刷する」ボタン、またはブラウザの印刷機能を使用してください。

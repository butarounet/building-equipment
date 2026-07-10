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
│   └── generator/
│       └── buildingGenerator.js
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
- ホテル用途の建築条件を自動生成するBuilding Generator
- 生成条件を検査するQuality Checker

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

## Building Generator

`js/generator/buildingGenerator.js` は、ホテル用途の `building.json` 互換オブジェクトを生成します。

```js
const { generateBuilding, validateBuilding } = require('./js/generator/buildingGenerator');

const building = generateBuilding();
const result = validateBuilding(building);
```

### generateBuilding()

以下の建築条件をランダムに生成します。数値条件は呼び出しごとに変化し、本試験レベルの都市型ホテルとして成立する範囲に制限しています。

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

## ドメインモデルとの整合

Building Generatorは `docs/DOMAIN_MODEL.md` の「建物」エンティティを起点として、階数、主要室、設備スペースを生成します。生成結果は後続のEquipment Generator、Drawing Generator、Exam Generator、Scoring Generator、およびQuality Checkerが参照する前提条件として利用できる構造です。

## テスト

Node.jsの標準テストランナーでユニットテストを実行します。

```bash
npm test
```

## 使い方

`index.html` をブラウザで開いて利用します。印刷する場合は画面内の「A4で印刷する」ボタン、またはブラウザの印刷機能を使用してください。

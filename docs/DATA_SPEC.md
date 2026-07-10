# データ仕様書

## 1. 目的

本仕様書は、模擬試験生成に使用する用途別データ、テンプレート、原単位、図面部品、採点基準のディレクトリ構成と管理方針を定義する。

## 2. 用途別ディレクトリ構成

データは建物用途別に分離し、用途ごとの建築条件、設備条件、問題テンプレート、図面部品を管理する。

```text
data/
  hotel/
  hospital/
  office/
  school/
  library/
  museum/
```

## 3. 各用途ディレクトリの想定内容

各用途ディレクトリには、将来的に以下のデータを配置する。

- building.json: 建物名称、用途、所在地、敷地面積、延床面積、階数、構造、利用人数などの建築条件。
- floors.json: 地下階、地上階、塔屋などの階構成、面積、主要用途、ゾーン。
- rooms.json: 各階の室名、室用途、室面積、ゾーン、設備要求、温湿度、換気、給排水、電源条件。
- equipment.json: 空調、換気、給水、給湯、排水、消火、電気、受変電、非常電源、照明、搬送、中央監視設備の方式候補と容量条件。
- exam.json: 設計課題、計画条件、設備条件、製図課題、記述問題。
- scoring.json: 採点項目、配点、部分点、評価基準、減点条件。
- drawing.json: 資料、設備記号、凡例、標準配置、SVG部品参照。

## 4. 共通データ

用途別データに加え、将来的には共通データ領域を設けることができる。共通データには、単位、線種、設備記号、法令チェックルール、難易度係数、重複判定フィンガープリントを格納する。

## 5. データ整合方針

- 用途別データは、共通スキーマに従う。
- 室名、設備名、単位は正規化辞書で統一する。
- 原単位や法令チェックルールには更新日と根拠種別を持たせる。
- 生成結果から参照されたデータバージョンを記録し、再現性を確保する。

## 6. 実装済みデータ

ホテル用途の初期データを `data/hotel/` に配置する。各JSONは `schemaVersion` と `buildingType` を持ち、将来ほかの用途を追加する場合は `data/<用途>/` に同じファイル構成を追加する。

```text
data/
  hotel/
    building.json
    floors.json
    rooms.json
    equipment.json
    exam.json
    drawing.json
    scoring.json
```

各JSONはJSONとして妥当であり、JSON Schema Draft 2020-12のメタ情報を示す `$schema` を持つ。

## 7. 生成器が出力する設備データ

`js/generator/equipmentGenerator.js` が生成する `equipment.json` 互換オブジェクトは、`schemaVersion`、`buildingType`、入力建物を要約する `sourceBuilding`、および `equipment` を持つ。`equipment` は設備分野ごとのオブジェクトであり、各分野は `name` と `systems` を持つ。

各 `systems` 要素は、原則として以下を持つ。

- `id`: システム識別子。
- `name`: 設備方式名。
- `category`: 設備分類。
- `serves`: 供給・対象範囲。該当する場合に設定する。
- `capacity`: 容量値と単位。
- `quantity`: 台数。該当する場合に設定する。
- `location`: 機械室、電気室、シャフト、屋上などの設置場所。
- `requirements`: 計画・採点で確認する要求条件。

生成器はBuilding Generatorが出力する延床面積、客室数、利用人数、厨房、SPA、宴会場、機械室、電気室、受変電室、EPS、PS、DSを参照し、ホテル用途として成立する設備方式と容量を決定する。


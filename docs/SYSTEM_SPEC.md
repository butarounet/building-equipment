# システム仕様書

## 1. 目的

本仕様書は、建築設備士第二次試験模擬試験アプリケーションのシステム構成、モジュール分離、将来拡張方針を定義する。

## 2. 現行システムの前提

現行は静的Webアプリケーションとして、HTML、CSS、JavaScript、SVG、データファイルにより構成する。ブラウザ上で問題表示とA4印刷を行うことを基本とする。

## 3. 将来REST API化を前提としたモジュール分離

将来、生成処理をREST APIとして提供できるよう、以下の責務に分離する。

- Presentation Module: 画面表示、入力フォーム、印刷操作を担当する。
- API Client Module: REST API呼び出し、エラー処理、進捗表示、生成結果取得を担当する。
- Generation Orchestrator: 生成要求を受け、各Generatorの実行順序、再生成、品質確認を制御する。
- Building Generator Module: 建築概要と室構成を生成する。
- Equipment Generator Module: 設備条件と容量条件を生成する。
- Drawing Generator Module: SVG図面と図面中間表現を生成する。
- Exam Generator Module: 資料、記述問題、製図問題を生成する。
- Scoring Generator Module: 模範解答と採点基準を生成する。
- Quality Checker Module: 法令整合、設備成立性、重複、難易度、図面整合を検査する。
- Data Access Module: 用途別データ、共通データ、生成履歴を読み書きする。
- Export Module: HTML、PDF、SVG、JSONの出力を担当する。

## 4. REST API想定エンドポイント

将来のAPIでは、以下のようなエンドポイントを想定する。

- POST /api/exams: 模擬試験生成要求を受け付ける。
- GET /api/exams/{id}: 生成済み模擬試験を取得する。
- GET /api/exams/{id}/svg: SVG図面を取得する。
- GET /api/exams/{id}/pdf: PDF出力を取得する。
- GET /api/exams/{id}/scoring: 採点基準を取得する。
- POST /api/exams/{id}/quality-check: 品質検査を再実行する。

## 5. 非機能要件

- 同一シードによる再現性を確保する。
- 生成途中の失敗箇所を特定できるログを残す。
- 用途別データと生成結果のバージョンを記録する。
- 将来のLLM利用時も、構造化スキーマと品質確認を必須とする。
- 静的Web版とAPI版で出力仕様を共通化する。

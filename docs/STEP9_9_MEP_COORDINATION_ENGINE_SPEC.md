# Step9-9 MEP Coordination Engine Spec

## 目的

Step9-6（空調）、Step9-7（給排水衛生）、Step9-8（電気）で生成した設備配置を統合し、建築設備士第二次試験レベルの設備干渉・設備スペース・保守性・防災性を自動判定する。

## Engine

- `MEPMerger`: HVAC / Plumbing / Electrical / EquipmentSpace をGraph構造へ統合する。
- `ClashDetectionEngine`: ダクト、配管、ケーブルラック、照明、スプリンクラーの干渉を検出する。
- `ClearanceChecker`: 同一階・同一天井内レーンのクリアランスを判定する。
- `CeilingSpaceAnalyzer`: 天井内高さと設備レーンを確認する。
- `ShaftCapacityAnalyzer`: EPS / PS / DS の利用率を判定し、必要時は容量予約補正を行う。
- `FireCompartmentChecker`: 防火ダンパー等の防火区画貫通対応を確認する。
- `MaintenanceSpaceChecker`: 保守スペース、搬入経路、更新スペースを確認する。
- `AccessibilityChecker`: 点検口・搬入経路の成立性を確認する。
- `RuleValidator`: 建築設備士第二次試験レベルのチェックリストを生成する。
- `CoordinationScorer`: 100点満点の統合設備スコアを生成する。

## 入力

```js
coordinateMEP({
  floorPlan,
  equipmentSpace,
  hvac,
  plumbing,
  electrical,
  building,
  fireProtection,
  buildingUse: 'hotel'
})
```

## 出力

```json
{
  "mep": {},
  "clashes": [],
  "corrections": [],
  "score": {},
  "checklist": []
}
```

## 後続連携

`finalModel.readyFor` に以下の後続Stepを明示する。

- Step9-10 系統図生成
- Step9-11 SVG製図
- Step9-12 建築設備士答案生成

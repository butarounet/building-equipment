# 試験資料仕様書

## 資料1 Generator

`js/generator/material1Generator.js` は、Building Planner、Building Generator、Equipment Generatorの結果を統合し、建築設備士第二次試験の「資料1 計画条件」に相当する構造化データを生成する。

資料1は、設計課題、建築物等概要、建築設備概要、空調換気設備条件、給排水衛生設備条件、電気設備条件、防災設備条件、設計上の注意事項で構成する。文体は本試験に近い条件提示型としつつ、過去問題の文章をそのまま転用しない。

`generateMaterial1({ plan, building, equipment })` は、ホテル用途として自然な条件を作成し、客室数、面積、階数、設備方式、設備容量、設置場所が入力データと矛盾しないように記述する。`validateMaterial1(material1)` は、必須項目、建築概要、設備概要、設備分野別条件、ホテル課題としての成立性、入力由来の設備系統との整合性を検査する。

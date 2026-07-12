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

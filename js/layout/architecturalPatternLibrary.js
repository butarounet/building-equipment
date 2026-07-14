(function (root) {
  const clone = (v) => JSON.parse(JSON.stringify(v || {}));
  const library = {
    hotel: {
      use: 'hotel', label: 'ホテル', variants: ['シティホテル', 'リゾートホテル', '宿泊主体型', '宴会場付き', '温浴施設付き', '国際会議場付き'],
      zones: ['基準客室階', '宴会場', '厨房', 'レストラン', 'バックヤード', 'ランドリー', '機械室'],
      composition: [{ floorId: 'B2', role: '機械室', rooms: ['熱源機械室', '受変電室', 'ポンプ室'] }, { floorId: 'B1', role: '厨房', rooms: ['主厨房', '食品庫', '従業員更衣', 'バックヤード'] }, { floorId: '1', role: 'エントランス・レストラン', rooms: ['エントランスホール', 'フロント', 'ロビー', 'レストラン'] }, { floorId: '2', role: '宴会場階', rooms: ['大宴会場', '中宴会場', 'ホワイエ', '宴会厨房'] }, { floorId: '3-10', role: '基準客室階', rooms: ['客室列', '廊下', 'リネン室', 'サービス室'] }, { floorId: 'RF', role: '設備', rooms: ['屋上機械置場'] }],
      typical: ['客室', '客室', '客室', '廊下', 'PS', 'EPS', 'EV', 'リネン室', 'サービス室']
    },
    hospital: { use: 'hospital', label: '病院', variants: ['総合病院', '救急病院'], zones: ['病棟', '外来', '救急', 'ICU', '手術部', '検査', '放射線', '中央材料室', '厨房'], composition: [{ floorId: 'B1', role: 'サービス・厨房', rooms: ['厨房', '中央材料室', '機械室'] }, { floorId: '1', role: '外来・救急', rooms: ['外来', '救急', '放射線'] }, { floorId: '2', role: '手術・ICU', rooms: ['手術部', 'ICU', '中央材料室'] }, { floorId: '3-8', role: '病棟', rooms: ['病室', 'NS', '汚物処理室'] }], typical: ['病室', '病室', 'NS', '廊下', 'EV', 'PS', 'EPS'] },
    school: { use: 'school', label: '学校', variants: ['小学校', '中学校', '高等学校'], zones: ['普通教室', '理科室', '家庭科室', '職員室', '図書室', '体育館'], composition: [{ floorId: '1', role: '管理・体育', rooms: ['玄関', '職員室', '体育館'] }, { floorId: '2', role: '普通教室', rooms: ['普通教室', '図書室'] }, { floorId: '3', role: '特別教室', rooms: ['理科室', '家庭科室'] }], typical: ['普通教室', '普通教室', '廊下', 'EV', 'PS', 'EPS'] },
    office: { use: 'office', label: '事務所', variants: ['本社', 'テナントオフィス'], zones: ['基準執務階', '会議室', '役員室', '応接', '受付', 'リフレッシュ', '電算室'], composition: [{ floorId: 'B1', role: '機械階', rooms: ['機械室', '受変電室'] }, { floorId: '1', role: '受付', rooms: ['エントランス', '受付', '応接'] }, { floorId: '2-10', role: '基準執務階', rooms: ['執務室', '会議室', 'リフレッシュ'] }, { floorId: '11', role: '役員階', rooms: ['役員室', '大会議室'] }, { floorId: 'RF', role: '設備', rooms: ['屋上機械置場'] }], typical: ['執務室', '会議室', '廊下', 'EV', 'PS', 'EPS', '電算室'] },
    facility: { use: 'facility', label: '施設', variants: ['研究施設', '庁舎', '物流', '商業施設', '複合施設', '美術館'], zones: ['共用', '管理', '展示・作業', 'サービス', '機械室'], composition: [{ floorId: '1', role: '共用・受付', rooms: ['受付', '共用ホール'] }, { floorId: '2', role: '主要用途', rooms: ['主要室', '管理室'] }, { floorId: 'RF', role: '設備', rooms: ['屋上機械置場'] }], typical: ['主要室', '管理室', '廊下', 'EV', 'PS', 'EPS'] }
  };
  function select(building = {}) { const text = [building.use, building.type, building.buildingType, building.name].join(' ').toLowerCase(); const key = /病院|hospital/.test(text) ? 'hospital' : /学校|school/.test(text) ? 'school' : /事務|office|庁舎/.test(text) ? 'office' : /hotel|ホテル|旅館/.test(text) ? 'hotel' : 'facility'; return clone(library[key]); }
  const api = { ArchitecturalPatternLibrary: library, PatternSelector: { select }, selectPattern: select };
  if (typeof module !== 'undefined') module.exports = api;
  root.architecturalPatternLibrary = api;
})(typeof window !== 'undefined' ? window : globalThis);

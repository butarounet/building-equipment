document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.global-menu__toggle');
  const menuList = document.querySelector('#menu-list');
  const printButton = document.querySelector('#print-button');
  const generateButton = document.querySelector('#generate-button');
  const jsonToggleButton = document.querySelector('#json-toggle-button');
  const resultArea = document.querySelector('#generation-result');
  const hotelTypeSelect = document.querySelector('#hotel-type-select');
  const jsonPreviewCode = document.querySelector('#json-preview-code code');
  let generatedPlan = null;
  let generatedBuilding = null;
  let generatedEquipmentData = null;
  let generatedMaterials = null;
  let generatedDrawings = null;
  let generatedExam = null;
  let generatedAnswerSheetSet = null;
  let currentAnswerSheetOutput = null;
  let currentSvg = null;
  const svgSampleButton = document.querySelector('#svg-sample-button');
  const svgSaveButton = document.querySelector('#svg-save-button');
  const svgPreviewCanvas = document.querySelector('#svg-preview-canvas');
  const svgPreviewMessage = document.querySelector('#svg-preview-message');

  const architecturalSelect = document.querySelector('#architectural-drawing-select');
  const architecturalShowButton = document.querySelector('#architectural-show-button');
  const architecturalSaveButton = document.querySelector('#architectural-save-button');
  const architecturalHqShowButton = document.querySelector('#architectural-hq-show-button');
  const architecturalHqToggle = document.querySelector('#architectural-hq-toggle');
  const architecturalGridToggle = document.querySelector('#architectural-grid-toggle');
  const architecturalDimToggle = document.querySelector('#architectural-dim-toggle');
  const architecturalAreaToggle = document.querySelector('#architectural-area-toggle');
  const architecturalNoteToggle = document.querySelector('#architectural-note-toggle');
  const architecturalCollisionToggle = document.querySelector('#architectural-collision-toggle');
  const architecturalSheetToggle = document.querySelector('#architectural-sheet-toggle');
  const architecturalFurnitureToggle = document.querySelector('#architectural-furniture-toggle');
  const architecturalLegendToggle = document.querySelector('#architectural-legend-toggle');
  const architecturalLinewidthToggle = document.querySelector('#architectural-linewidth-toggle');
  const architecturalUsageToggle = document.querySelector('#architectural-usage-toggle');
  const architecturalPrintButton = document.querySelector('#architectural-print-button');
  const architecturalCanvas = document.querySelector('#architectural-preview-canvas');
  const architecturalMessage = document.querySelector('#architectural-preview-message');
  let currentArchitecturalSvg = null;
  let generatedHotelFloorPlanSet = null;
  const hotelPlanGenerateButton = document.querySelector('#hotel-plan-generate-button');
  const hotelZoningButton = document.querySelector('#hotel-zoning-button');
  const hotelFlowButton = document.querySelector('#hotel-flow-button');
  const hotelAdjacencyButton = document.querySelector('#hotel-adjacency-button');
  const hotelQualityButton = document.querySelector('#hotel-quality-button');


  const examGenerateButton = document.querySelector('#exam-generate-button');
  const examShowButton = document.querySelector('#exam-show-button');
  const examJsonButton = document.querySelector('#exam-json-button');
  const examPrintButton = document.querySelector('#exam-print-button');
  const examBooklet = document.querySelector('#exam-booklet');
  const examJsonCode = document.querySelector('#exam-json-code code');
  const examJsonPre = document.querySelector('#exam-json-code');
  const examMessage = document.querySelector('#exam-preview-message');

  const answerSheetSelect = document.querySelector('#answer-sheet-select');
  const answerSheetGenerateButton = document.querySelector('#answer-sheet-generate-button');
  const answerSheetShowButton = document.querySelector('#answer-sheet-show-button');
  const answerSheetSaveButton = document.querySelector('#answer-sheet-save-button');
  const answerSheetPrintButton = document.querySelector('#answer-sheet-print-button');
  const answerSheetCanvas = document.querySelector('#answer-sheet-canvas');
  const answerSheetMessage = document.querySelector('#answer-sheet-message');

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const renderQuestion = (q) => `<li><strong>${escapeHtml(q.questionId)} ${escapeHtml(q.title)}</strong><p>${escapeHtml(q.prompt)}</p><p class="exam-meta">解答形式: ${escapeHtml(q.answerType)} / 要求点: ${escapeHtml(q.requiredPoints)}</p></li>`;
  const renderExamBooklet = (exam) => {
    if (!exam) return '<p class="generation-result__empty">試験問題が未生成です。</p>';
    const pc = exam.planningConditions || {};
    return `
      <article class="exam-page exam-cover"><h3>${escapeHtml(exam.cover.examName)}</h3><h2>${escapeHtml(exam.projectTitle)}</h2><p>${escapeHtml(exam.cover.bookletLabel)} / ${escapeHtml(exam.cover.learningLabel)}</p><p>試験時間 ${escapeHtml(exam.cover.duration)}</p><div class="exam-fields"><span>受験番号：</span><span>氏名：</span></div></article>
      <article class="exam-page"><h3>注意事項</h3><ol>${exam.instructions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol><h3>設計課題</h3><p>${escapeHtml(exam.designTask.concept)}：${escapeHtml(exam.projectTitle)}</p><h3>計画条件</h3><dl class="result-list">${createDefinitionList([{ label: '用途', value: escapeHtml(pc.use) }, { label: '場所', value: escapeHtml(pc.location) }, { label: '延べ面積', value: formatArea(pc.totalFloorArea) }, { label: '階数', value: escapeHtml(pc.floors?.description) }, { label: '客室数', value: `${escapeHtml(pc.guestRooms)}室` }])}</dl></article>
      <article class="exam-page"><h3>選択問題A 空調選択</h3><ol>${(exam.selection?.hvac || exam.electiveSections?.hvac || []).map(renderQuestion).join('')}</ol></article>
      <article class="exam-page"><h3>選択問題B 衛生選択</h3><ol>${(exam.selection?.plumbing || exam.electiveSections?.plumbing || []).map(renderQuestion).join('')}</ol></article>
      <article class="exam-page"><h3>選択問題C 電気選択</h3><ol>${(exam.selection?.electrical || exam.electiveSections?.electrical || []).map(renderQuestion).join('')}</ol></article>
      <article class="exam-page"><h3>共通問題 AnswerSheet4</h3><ol>${(exam.common || []).map(renderQuestion).join('')}</ol></article>`;
  };

  const ensureAnswerSheets = () => {
    const exam = generatedExam || ensureExam();
    generatedAnswerSheetSet = window.generateAnswerSheets({ exam, materials: generatedMaterials, drawings: generatedDrawings, options: { includeBlankPlanBackground: true } });
    return generatedAnswerSheetSet;
  };

  const getPlannerOptions = () => {
    const hotelType = hotelTypeSelect?.value;
    return hotelType ? { hotelType } : {};
  };

  const ensureExam = () => {
    if (!generatedBuilding) {
      generatedPlan = window.planHotelProject ? window.planHotelProject(getPlannerOptions()) : null;
      generatedBuilding = generateBuilding({ plan: generatedPlan });
      generatedEquipmentData = generateEquipment(generatedBuilding);
    }
    generatedMaterials = generatedMaterials || (window.generateMaterials ? window.generateMaterials({ plan: generatedPlan, building: generatedBuilding, equipment: generatedEquipmentData }) : null);
    generatedDrawings = generatedDrawings || (window.generateDrawings ? window.generateDrawings({ plan: generatedPlan, building: generatedBuilding, equipment: generatedEquipmentData, materials: generatedMaterials }) : null);
    generatedExam = window.generateExam({ plan: generatedPlan, building: generatedBuilding, equipment: generatedEquipmentData, materials: generatedMaterials, drawings: generatedDrawings });
    return generatedExam;
  };

  const equipmentDisciplineSelect = document.querySelector('#equipment-discipline-select');
  const equipmentFloorSelect = document.querySelector('#equipment-floor-select');
  const equipmentModeSelect = document.querySelector('#equipment-mode-select');
  const equipmentShowButton = document.querySelector('#equipment-show-button');
  const equipmentSaveButton = document.querySelector('#equipment-save-button');
  const equipmentPrintButton = document.querySelector('#equipment-print-button');
  const equipmentCanvas = document.querySelector('#equipment-preview-canvas');
  const equipmentMessage = document.querySelector('#equipment-preview-message');
  let currentEquipmentSvg = null;

  const ensureDrawings = () => {
    if (!generatedBuilding) return { error: '模擬試験が未生成です。先に「模擬試験生成」を押してください。' };
    if (!generatedDrawings) {
      try {
        generatedMaterials = generatedMaterials || (window.generateMaterials ? window.generateMaterials({ plan: generatedPlan, building: generatedBuilding, equipment: generatedEquipmentData }) : null);
        generatedDrawings = window.generateDrawings ? window.generateDrawings({ plan: generatedPlan, building: generatedBuilding, equipment: generatedEquipmentData, materials: generatedMaterials }) : null;
      } catch (error) {
        return { error: `Drawing Generatorのデータがありません。${error.message || ''}` };
      }
    }
    if (!generatedDrawings) return { error: 'Drawing Generatorのデータがありません。' };
    return { drawings: generatedDrawings };
  };

  const findArchitecturalDrawing = (value) => {
    if (generatedHotelFloorPlanSet && value !== 'site' && value !== 'blank') {
      const normalized = value === '4-10' ? 'TYP' : value;
      const floor = generatedHotelFloorPlanSet.floors.find((item) => item.floorId === normalized);
      if (floor) return { drawing: floor, kind: 'floor' };
    }
    const ready = ensureDrawings();
    if (ready.error) return ready;
    if (value === 'site') return { drawing: ready.drawings.sitePlan, kind: 'site' };
    if (value === 'blank') return { drawing: ready.drawings.blankPlans?.[0], kind: 'blank' };
    const drawing = (ready.drawings.floorPlans || []).find((floor) => String(floor.floorId) === value);
    return drawing ? { drawing, kind: 'floor' } : { error: '選択した階が存在しません。' };
  };

  const formatArea = (area) => {
    if (!area || typeof area.value === 'undefined') return '-';
    return `${area.value.toLocaleString('ja-JP')} ${area.unit || 'm2'}`;
  };

  const formatSystem = (group) => {
    const primarySystem = group && Array.isArray(group.systems) ? group.systems[0] : null;
    if (!primarySystem) return '-';
    const capacity = primarySystem.capacity
      ? `（${primarySystem.capacity.value.toLocaleString('ja-JP')} ${primarySystem.capacity.unit}）`
      : '';
    return `${primarySystem.name}${capacity}`;
  };

  const createDefinitionList = (items) => items.map(({ label, value }) => `
    <div class="result-list__item">
      <dt>${label}</dt>
      <dd>${value}</dd>
    </div>
  `).join('');

  const renderGenerationResult = (buildingJson, equipmentJson) => {
    const building = buildingJson.building;
    const equipment = equipmentJson.equipment;
    const rooms = building.rooms;

    const buildingItems = [
      { label: '建物名称', value: building.name },
      { label: '建物用途', value: building.use },
      { label: '所在地', value: building.location },
      { label: '敷地面積', value: formatArea(building.siteArea) },
      { label: '建築面積', value: formatArea(building.buildingArea) },
      { label: '延床面積', value: formatArea(building.totalFloorArea) },
      { label: '地下階数', value: `${building.floors.basement}階` },
      { label: '地上階数', value: `${building.floors.aboveGround}階` },
      { label: '構造', value: building.structure },
      { label: '客室数', value: `${rooms.guestRooms.toLocaleString('ja-JP')}室` },
      { label: '宴会場', value: `${rooms.banquetHall.count}室 / ${formatArea(rooms.banquetHall.area)}` },
      { label: 'レストラン', value: `${rooms.restaurant.count}室 / ${formatArea(rooms.restaurant.area)}` },
      { label: '厨房', value: formatArea(rooms.kitchen.area) },
      { label: 'SPA', value: formatArea(rooms.spa.area) },
      { label: 'ランドリー', value: formatArea(rooms.laundry.area) }
    ];

    const equipmentItems = [
      { label: '空調方式', value: formatSystem(equipment.hvac) },
      { label: '換気方式', value: formatSystem(equipment.ventilation) },
      { label: '給水方式', value: formatSystem(equipment.waterSupply) },
      { label: '給湯方式', value: formatSystem(equipment.hotWater) },
      { label: '排水方式', value: formatSystem(equipment.drainage) },
      { label: '消火設備', value: formatSystem(equipment.fireSafety) },
      { label: '受変電方式', value: formatSystem(equipment.receivingTransformer) },
      { label: '非常電源', value: formatSystem(equipment.emergencyPower) },
      { label: '中央監視', value: formatSystem(equipment.buildingManagement) }
    ];

    resultArea.innerHTML = `
      <article class="result-card">
        <h3>建築条件</h3>
        <dl class="result-list">${createDefinitionList(buildingItems)}</dl>
      </article>
      <article class="result-card">
        <h3>設備条件</h3>
        <dl class="result-list">${createDefinitionList(equipmentItems)}</dl>
      </article>
    `;
  };



  const buildSvgSample = () => {
    const { createSvgDocument } = window.svgRenderer;
    const p = window.svgPrimitives;
    let svg = createSvgDocument({ title: 'SVG基盤サンプル', drawingNumber: 'S-001', projectTitle: '建築設備士 第二次試験', scale: 'S=1/200' });

    const grid = [40, 80, 120, 160, 200].map((x, index) => p.drawGridLine({ x1: x, y1: 35, x2: x, y2: 230, id: `grid-x-${index + 1}` })).join('')
      + [45, 85, 125, 165, 205].map((y, index) => p.drawGridLine({ x1: 30, y1: y, x2: 235, y2: y, id: `grid-y-${index + 1}` })).join('');
    const architecture = [
      p.drawWall({ id: 'sample-wall', points: [[50, 55], [210, 55], [210, 185], [50, 185], [50, 55]] }),
      p.drawWall({ id: 'sample-inner-wall', wallType: 'inner', points: [[130, 55], [130, 185]] }),
      p.drawColumn({ x: 45, y: 50, width: 10, height: 10 }),
      p.drawColumn({ x: 205, y: 50, width: 10, height: 10 }),
      p.drawColumn({ x: 45, y: 180, width: 10, height: 10 }),
      p.drawDoor({ x: 88, y: 185, width: 18, height: -18 }),
      p.drawWindow({ x: 150, y: 55, width: 32 }),
      p.drawRoomLabel({ x: 90, y: 120, text: '機械室' }),
      p.drawRoomLabel({ x: 170, y: 120, text: '電気室' }),
      p.drawNorthArrow({ x: 330, y: 55 }),
      p.drawScaleBar({ x: 305, y: 210 }),
      p.drawDimensionLine({ x: 50, y: 198, width: 160, text: '32,000' })
    ].join('');
    svg = svg.replace('<g id="Layer02_Grid" data-layer-name="Layer02_Grid" class="">', `<g id="Layer02_Grid" data-layer-name="Layer02_Grid" class="">${grid}`);
    svg = svg.replace('<g id="Layer01_Architecture" data-layer-name="Layer01_Architecture" class="layer-architecture">', `<g id="Layer01_Architecture" data-layer-name="Layer01_Architecture" class="layer-architecture">${architecture}`);
    return svg;
  };

  if (menuToggle && menuList) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuList.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (printButton) {
    printButton.addEventListener('click', () => {
      window.print();
    });
  }

  if (generateButton && resultArea) {
    generateButton.addEventListener('click', () => {
      generatedPlan = window.planHotelProject ? window.planHotelProject(getPlannerOptions()) : null;
      generatedBuilding = generateBuilding({ plan: generatedPlan });
      generatedEquipmentData = generateEquipment(generatedBuilding);
      generatedMaterials = window.generateMaterials ? window.generateMaterials({ plan: generatedPlan, building: generatedBuilding, equipment: generatedEquipmentData }) : null;
      generatedExam = null;
      try {
        generatedMaterials = generatedMaterials || (window.generateMaterials ? window.generateMaterials({ plan: generatedPlan, building: generatedBuilding, equipment: generatedEquipmentData }) : null);
        generatedDrawings = window.generateDrawings ? window.generateDrawings({ plan: generatedPlan, building: generatedBuilding, equipment: generatedEquipmentData, materials: generatedMaterials }) : null;
      } catch (error) {
        generatedDrawings = null;
      }
      renderGenerationResult(generatedBuilding, generatedEquipmentData);
    });
  }

  if (jsonToggleButton && jsonPreviewCode) {
    jsonToggleButton.addEventListener('click', () => {
      if (!generatedBuilding || !generatedEquipmentData) {
        jsonPreviewCode.textContent = '先に模擬試験生成を押してください';
        return;
      }

      jsonPreviewCode.textContent = JSON.stringify({
        plan: generatedPlan,
        building: generatedBuilding,
        equipment: generatedEquipmentData,
        materials: generatedMaterials,
        drawings: generatedDrawings,
        exam: generatedExam
      }, null, 2);
    });
  }

  if (svgSampleButton && svgPreviewCanvas) {
    svgSampleButton.addEventListener('click', () => {
      currentSvg = buildSvgSample();
      svgPreviewCanvas.innerHTML = currentSvg;
      svgPreviewMessage.textContent = 'SVGサンプルを表示しました。';
    });
  }

  if (svgSaveButton) {
    svgSaveButton.addEventListener('click', () => {
      if (!currentSvg) {
        svgPreviewMessage.textContent = '先にSVGサンプル表示を押してください。';
        return;
      }
      window.svgRenderer.downloadSvg(currentSvg, 'svg-sample-a3-landscape.svg');
    });
  }

  const renderArchitecturalPreview = (forceHighQuality = false) => {
    try {
      let selected = findArchitecturalDrawing(architecturalSelect?.value || 'site');
      const highQuality = forceHighQuality || Boolean(architecturalHqToggle?.checked);
      if ((selected.error || !selected.drawing) && window.hotelFloorPlanner) {
        generatedHotelFloorPlanSet = generatedHotelFloorPlanSet || window.hotelFloorPlanner.planHotelFloors({ plan: generatedPlan || {}, building: generatedBuilding || { rooms: { guestRooms: 120 }, hotelType: getPlannerOptions().hotelType }, equipment: generatedEquipmentData || {}, options: getPlannerOptions() });
        const value = architecturalSelect?.value || 'TYP';
        const normalized = value === '4-10' ? 'TYP' : value;
        const floor = generatedHotelFloorPlanSet.floors.find((item) => item.floorId === normalized);
        selected = floor ? { drawing: floor, kind: 'floor' } : selected;
      }
      if (selected.error && highQuality && window.floorTemplateEngine) {
        const value = architecturalSelect?.value || 'site';
        const floorType = value === 'site' ? null : value === '1' ? '1' : value === '2' ? '2' : value === '3' ? '3' : value === 'B1' ? 'basement' : value === 'RF' ? 'rooftop' : value === 'PH' ? 'penthouse' : 'typicalGuestFloor';
        selected = value === 'site' ? { drawing: {}, kind: 'site' } : { drawing: window.floorTemplateEngine.createFloorTemplate(floorType), kind: 'floor' };
      }
      if (selected.error) { architecturalMessage.textContent = selected.error; return; }
      if (!selected.drawing) { architecturalMessage.textContent = '室データが不足しています。'; return; }
      currentArchitecturalSvg = window.architecturalDrawingRenderer.renderArchitecturalDrawing(selected.drawing, {
        kind: selected.kind,
        highQuality,
        showGrid: architecturalGridToggle?.checked !== false,
        showDimensions: architecturalDimToggle?.checked !== false,
        showRoomAreas: architecturalAreaToggle?.checked !== false,
        showNotes: architecturalNoteToggle?.checked !== false,
        showCollisionBoxes: Boolean(architecturalCollisionToggle?.checked),
        showSheetRegions: Boolean(architecturalSheetToggle?.checked),
        showFurniture: architecturalFurnitureToggle?.checked !== false,
        showLegend: architecturalLegendToggle?.checked !== false,
        showLineWidthPreview: Boolean(architecturalLinewidthToggle?.checked),
        showPaperUsage: architecturalUsageToggle?.checked !== false,
        showFireCompartment: document.querySelector('#hotel-fire-toggle')?.checked !== false
      });
      architecturalCanvas.innerHTML = currentArchitecturalSvg;
      const qualityResult = window.floorPlanQualityMetrics?.validateFloorPlanQuality ? window.floorPlanQualityMetrics.validateFloorPlanQuality({ floorPlan: selected.drawing, svg: currentArchitecturalSvg, building: generatedBuilding || {}, plan: generatedPlan || {} }) : null;
      const m = qualityResult?.metrics || {};
      architecturalMessage.textContent = `${highQuality ? '高品質建築図SVGを表示しました。' : '建築図SVGを表示しました。'} 用紙占有率:${Math.round((m.paperUsageRatio || 0) * 100)}% / 生成客室:${m.generatedGuestRoomCount ?? '-'} / SVG客室:${m.svgGuestRoomCount ?? '-'} / 客室配置率:${Math.round((m.guestPlacementRatio || 0) * 100)}% / 内部利用率:${Math.round((m.buildingInteriorUsageRatio || 0) * 100)}% / 家具室:${m.furnishedGuestRoomCount ?? '-'} / 空間重複:${m.spatialConflictCount ?? '-'} / 孤立室:${m.isolatedRoomCount ?? '-'} / 扉なし:${m.doorlessRoomCount ?? '-'} / 文字衝突:${m.textCollisionCount ?? '-'} / 未利用:${Math.round((m.unusedAreaRatio || 0) * 100)}%`;
    } catch (error) {
      architecturalMessage.textContent = `SVG生成に失敗しました。${error.message || ''}`;
    }
  };

  if (hotelPlanGenerateButton) {
    hotelPlanGenerateButton.addEventListener('click', () => {
      generatedHotelFloorPlanSet = window.hotelFloorPlanner.planHotelFloors({ plan: generatedPlan || {}, building: generatedBuilding || { rooms: { guestRooms: 120 }, hotelType: getPlannerOptions().hotelType }, equipment: generatedEquipmentData || {}, options: getPlannerOptions() });
      architecturalMessage.textContent = `ホテル平面計画を生成しました（${generatedHotelFloorPlanSet.floors.length}階）。`;
    });
  }

  const ensureHotelFloorPlanSet = () => {
    generatedHotelFloorPlanSet = generatedHotelFloorPlanSet || window.hotelFloorPlanner.planHotelFloors({ plan: generatedPlan || {}, building: generatedBuilding || { rooms: { guestRooms: 120 }, hotelType: getPlannerOptions().hotelType }, equipment: generatedEquipmentData || {}, options: getPlannerOptions() });
    return generatedHotelFloorPlanSet;
  };

  if (hotelZoningButton) {
    hotelZoningButton.addEventListener('click', () => {
      const set = ensureHotelFloorPlanSet();
      architecturalMessage.textContent = `ゾーニング表示: ${set.floors.map((f) => `${f.floorName}:${f.rooms.length}室`).join(' / ')}`;
    });
  }

  if (hotelFlowButton) {
    hotelFlowButton.addEventListener('click', () => {
      const set = ensureHotelFloorPlanSet();
      architecturalMessage.textContent = `動線表示: ${set.serviceFlows.map((flow) => flow.type).join('、')}`;
    });
  }

  if (hotelAdjacencyButton) {
    hotelAdjacencyButton.addEventListener('click', () => {
      const set = ensureHotelFloorPlanSet();
      const result = set.consistency.validation;
      architecturalMessage.textContent = `隣接評価表示: ${result.isValid ? 'OK' : result.errors.join('、')}`;
    });
  }

  if (hotelQualityButton) {
    hotelQualityButton.addEventListener('click', () => {
      const set = ensureHotelFloorPlanSet();
      const floor = set.floors.find((item) => item.floorId === (architecturalSelect?.value || 'TYP')) || set.floors.find((item) => item.floorId === 'TYP');
      const svg = currentArchitecturalSvg || (window.floorPlanRenderer ? window.floorPlanRenderer.renderFloorPlan(floor, { highQuality: true }) : '');
      const result = window.floorPlanQualityMetrics?.validateFloorPlanQuality ? window.floorPlanQualityMetrics.validateFloorPlanQuality({ floorPlan: floor, svg, building: generatedBuilding || {}, plan: generatedPlan || {} }) : { isValid: false, errors: ['品質検査器が未読込です'], metrics: {} };
      architecturalMessage.textContent = `品質チェック結果: ${result.isValid ? 'OK' : result.errors.join('、')} / 指標 ${JSON.stringify(result.metrics)}`;
    });
  }

  if (architecturalShowButton && architecturalCanvas) {
    architecturalShowButton.addEventListener('click', () => renderArchitecturalPreview(false));
  }

  if (architecturalHqShowButton && architecturalCanvas) {
    architecturalHqShowButton.addEventListener('click', () => renderArchitecturalPreview(true));
  }


  if (architecturalSaveButton) {
    architecturalSaveButton.addEventListener('click', () => {
      if (!currentArchitecturalSvg) { architecturalMessage.textContent = '先に建築図を表示してください。'; return; }
      window.svgRenderer.downloadSvg(currentArchitecturalSvg, 'architectural-drawing-a3-landscape.svg');
    });
  }

  if (architecturalPrintButton) {
    architecturalPrintButton.addEventListener('click', () => window.print());
  }

  if (equipmentShowButton && equipmentCanvas) {
    equipmentShowButton.addEventListener('click', () => {
      try {
        if (!generatedBuilding) { equipmentMessage.textContent = '模擬試験未生成です。先に「模擬試験生成」を押してください。'; return; }
        if (!generatedEquipmentData) { equipmentMessage.textContent = '設備データがありません。'; return; }
        const ready = ensureDrawings();
        if (ready.error) { equipmentMessage.textContent = ready.error; return; }
        const floorId = equipmentFloorSelect?.value || '1';
        const drawing = (ready.drawings.floorPlans || []).find((floor) => String(floor.floorId) === floorId);
        if (!drawing) { equipmentMessage.textContent = '選択階がありません。'; return; }
        const discipline = equipmentDisciplineSelect?.value || 'hvac';
        const screenColorMode = (equipmentModeSelect?.value || 'mono') === 'color';
        currentEquipmentSvg = window.equipmentDrawingRenderer.renderEquipmentDrawing({
          drawing,
          equipment: generatedEquipmentData,
          discipline,
          options: { monochrome: !screenColorMode, screenColorMode }
        });
        equipmentCanvas.innerHTML = currentEquipmentSvg;
        equipmentMessage.textContent = '設備図SVGを表示しました。';
      } catch (error) {
        equipmentMessage.textContent = `SVG生成失敗: ${error.message || ''}`;
      }
    });
  }

  if (equipmentSaveButton) {
    equipmentSaveButton.addEventListener('click', () => {
      if (!currentEquipmentSvg) { equipmentMessage.textContent = '先に設備図を表示してください。'; return; }
      window.svgRenderer.downloadSvg(currentEquipmentSvg, 'equipment-drawing-a3-landscape.svg');
    });
  }

  if (equipmentPrintButton) {
    equipmentPrintButton.addEventListener('click', () => window.print());
  }


  if (examGenerateButton) {
    examGenerateButton.addEventListener('click', () => {
      try { ensureExam(); examMessage.textContent = '試験問題を生成しました。'; }
      catch (error) { examMessage.textContent = `試験問題生成に失敗しました。${error.message || ''}`; }
    });
  }

  if (examShowButton && examBooklet) {
    examShowButton.addEventListener('click', () => {
      try { const exam = generatedExam || ensureExam(); examBooklet.innerHTML = renderExamBooklet(exam); examMessage.textContent = '問題集を表示しました。'; }
      catch (error) { examMessage.textContent = `問題集表示に失敗しました。${error.message || ''}`; }
    });
  }

  if (examJsonButton && examJsonCode) {
    examJsonButton.addEventListener('click', () => {
      try { const exam = generatedExam || ensureExam(); examJsonCode.textContent = JSON.stringify(exam, null, 2); examJsonPre.hidden = !examJsonPre.hidden; }
      catch (error) { examMessage.textContent = `JSON表示に失敗しました。${error.message || ''}`; }
    });
  }

  if (examPrintButton) examPrintButton.addEventListener('click', () => window.print());


  if (answerSheetGenerateButton) {
    answerSheetGenerateButton.addEventListener('click', () => {
      try { ensureAnswerSheets(); answerSheetMessage.textContent = '答案用紙セットを生成しました。'; }
      catch (error) { answerSheetMessage.textContent = `答案用紙生成に失敗しました。${error.message || ''}`; }
    });
  }

  if (answerSheetShowButton && answerSheetCanvas) {
    answerSheetShowButton.addEventListener('click', () => {
      try {
        const set = generatedAnswerSheetSet || ensureAnswerSheets();
        const sheetType = answerSheetSelect?.value || 'answerSheet1';
        const mode = ['answerSheet4'].includes(sheetType) ? 'svg' : 'html';
        currentAnswerSheetOutput = window.answerSheetRenderer.renderAnswerSheetSet(set, { sheetType, mode, showGrid: true, showQuestionTitles: true, includeBlankPlanBackground: true });
        answerSheetCanvas.innerHTML = currentAnswerSheetOutput;
        answerSheetMessage.textContent = '答案用紙を表示しました。';
      } catch (error) { answerSheetMessage.textContent = `答案用紙表示に失敗しました。${error.message || ''}`; }
    });
  }

  if (answerSheetSaveButton) {
    answerSheetSaveButton.addEventListener('click', () => {
      if (!currentAnswerSheetOutput || !currentAnswerSheetOutput.trim().startsWith('<svg')) { answerSheetMessage.textContent = 'SVG形式の答案用紙を先に表示してください。'; return; }
      window.svgRenderer.downloadSvg(currentAnswerSheetOutput, 'answer-sheet-a3-landscape.svg');
    });
  }

  if (answerSheetPrintButton) answerSheetPrintButton.addEventListener('click', () => window.print());

});

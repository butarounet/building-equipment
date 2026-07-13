document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.global-menu__toggle');
  const menuList = document.querySelector('#menu-list');
  const printButton = document.querySelector('#print-button');
  const generateButton = document.querySelector('#generate-button');
  const jsonToggleButton = document.querySelector('#json-toggle-button');
  const resultArea = document.querySelector('#generation-result');
  const jsonPreviewCode = document.querySelector('#json-preview-code code');
  let generatedBuilding = null;
  let generatedEquipment = null;
  let currentSvg = null;
  let generatedMaterials = null;
  let generatedDrawings = null;
  let currentArchitecturalSvg = null;
  const svgSampleButton = document.querySelector('#svg-sample-button');
  const svgSaveButton = document.querySelector('#svg-save-button');
  const svgPreviewCanvas = document.querySelector('#svg-preview-canvas');
  const svgPreviewMessage = document.querySelector('#svg-preview-message');
  const architecturalSelect = document.querySelector('#architectural-drawing-select');
  const architecturalShowButton = document.querySelector('#architectural-show-button');
  const architecturalSaveButton = document.querySelector('#architectural-save-button');
  const architecturalPrintButton = document.querySelector('#architectural-print-button');
  const architecturalCanvas = document.querySelector('#architectural-preview-canvas');
  const architecturalMessage = document.querySelector('#architectural-preview-message');

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
      try {
        const plan = typeof planHotelProject === 'function' ? planHotelProject() : null;
        generatedBuilding = generateBuilding({ plan });
        generatedEquipment = generateEquipment(generatedBuilding);
        generatedMaterials = typeof generateMaterials === 'function' ? generateMaterials({ plan, building: generatedBuilding, equipment: generatedEquipment }) : null;
        generatedDrawings = typeof generateDrawings === 'function' ? generateDrawings({ plan, building: generatedBuilding, equipment: generatedEquipment, materials: generatedMaterials }) : null;
        renderGenerationResult(generatedBuilding, generatedEquipment);
      } catch (error) {
        resultArea.innerHTML = `<p class="generation-result__empty">模擬試験生成に失敗しました: ${error.message}</p>`;
      }
    });
  }

  if (jsonToggleButton && jsonPreviewCode) {
    jsonToggleButton.addEventListener('click', () => {
      if (!generatedBuilding || !generatedEquipment) {
        jsonPreviewCode.textContent = '先に模擬試験生成を押してください';
        return;
      }

      jsonPreviewCode.textContent = JSON.stringify({
        building: generatedBuilding,
        equipment: generatedEquipment,
        materials: generatedMaterials,
        drawings: generatedDrawings
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

  const selectArchitecturalDrawing = () => {
    if (!generatedBuilding || !generatedEquipment) throw new Error('模擬試験が未生成です。先に「模擬試験生成」を押してください。');
    if (!generatedDrawings) throw new Error('Drawing Generatorのデータがありません。');
    const value = architecturalSelect ? architecturalSelect.value : 'site';
    if (value === 'site') return { drawing: generatedDrawings.sitePlan, options: { type: 'sitePlan' }, filename: 'site-plan.svg' };
    if (value === 'blank') {
      const blank = (generatedDrawings.blankPlans || [])[0];
      if (!blank) throw new Error('白図データが存在しません。');
      return { drawing: blank, options: { type: 'blankPlan', blankMode: true }, filename: 'blank-plan.svg' };
    }
    const floor = (generatedDrawings.floorPlans || []).find((item) => item.floorId === value);
    if (!floor) throw new Error(`選択した階（${value}）が存在しません。`);
    if (!Array.isArray(floor.rooms) || floor.rooms.length === 0) throw new Error('室データが不足しています。');
    return { drawing: floor, options: { type: 'floorPlan' }, filename: `floor-plan-${value}.svg` };
  };

  if (architecturalShowButton && architecturalCanvas) {
    architecturalShowButton.addEventListener('click', () => {
      try {
        const selected = selectArchitecturalDrawing();
        currentArchitecturalSvg = window.architecturalDrawingRenderer.renderArchitecturalDrawing(selected.drawing, selected.options);
        architecturalCanvas.innerHTML = currentArchitecturalSvg;
        architecturalMessage.textContent = '建築図SVGを表示しました。';
      } catch (error) {
        architecturalMessage.textContent = error.message || 'SVG生成に失敗しました。';
      }
    });
  }

  if (architecturalSaveButton) {
    architecturalSaveButton.addEventListener('click', () => {
      try {
        if (!currentArchitecturalSvg) throw new Error('先に建築図を表示してください。');
        const selected = selectArchitecturalDrawing();
        window.svgRenderer.downloadSvg(currentArchitecturalSvg, selected.filename);
      } catch (error) { architecturalMessage.textContent = error.message; }
    });
  }

  if (architecturalPrintButton) {
    architecturalPrintButton.addEventListener('click', () => window.print());
  }

});

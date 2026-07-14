const DRAWING_ORDER = ['配置図', '各階平面図', '屋上', '断面', '白図', '設備図', '模範図'];
function buildDrawingLayout(input = {}) { const drawings = input.drawings || input; return { drawingOrder: DRAWING_ORDER.slice(), sheets: DRAWING_ORDER.map((title, i) => ({ index: i + 1, title, drawings: drawings[title] || drawings[title.replace('図', '')] || [] })) }; }
function checkDrawingLayout(layout = {}) { const order = layout.drawingOrder || (layout.sheets || []).map((s) => s.title); return { passed: DRAWING_ORDER.every((t, i) => order[i] === t), expected: DRAWING_ORDER, actual: order, drawingCount: (layout.sheets || []).length }; }
module.exports = { DRAWING_ORDER, buildDrawingLayout, checkDrawingLayout };

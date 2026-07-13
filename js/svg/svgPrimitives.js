const SVG_NS = 'http://www.w3.org/2000/svg';

const LINE_WIDTHS = Object.freeze({
  outerWall: 0.5,
  innerWall: 0.3,
  column: 0.35,
  equipment: 0.25,
  dimension: 0.15,
  grid: 0.13,
  auxiliary: 0.1,
  border: 0.5
});

const FONT_SIZES = Object.freeze({
  title: 5,
  room: 3.5,
  dimension: 2.5,
  note: 2.5,
  legend: 2.5,
  border: 2.5
});

const escapeXml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const attrs = (attributes = {}) => Object.entries(attributes)
  .filter(([, value]) => value !== undefined && value !== null && value !== false)
  .map(([key, value]) => `${key === 'className' ? 'class' : key}="${escapeXml(value)}"`)
  .join(' ');

const element = (tag, attributes = {}, content = '', selfClose = true) => {
  const attrText = attrs(attributes);
  const open = attrText ? `<${tag} ${attrText}` : `<${tag}`;
  return selfClose && content === '' ? `${open}/>` : `${open}>${content}</${tag}>`;
};

const pointsToString = (points = []) => Array.isArray(points)
  ? points.map((point) => Array.isArray(point) ? point.join(',') : `${point.x},${point.y}`).join(' ')
  : points;

const commonAttrs = (options = {}) => ({
  id: options.id,
  className: options.className,
  stroke: options.stroke,
  'stroke-width': options.strokeWidth,
  fill: options.fill,
  transform: options.transform,
  'data-layer': options.layer
});

function drawLine(options = {}) {
  return element('line', { ...commonAttrs(options), x1: options.x1 ?? options.x, y1: options.y1 ?? options.y, x2: options.x2, y2: options.y2 });
}
function drawPolyline(options = {}) { return element('polyline', { ...commonAttrs(options), points: pointsToString(options.points), fill: options.fill ?? 'none' }); }
function drawPolygon(options = {}) { return element('polygon', { ...commonAttrs(options), points: pointsToString(options.points) }); }
function drawRect(options = {}) { return element('rect', { ...commonAttrs(options), x: options.x, y: options.y, width: options.width, height: options.height, rx: options.rx, ry: options.ry }); }
function drawCircle(options = {}) { return element('circle', { ...commonAttrs(options), cx: options.cx ?? options.x, cy: options.cy ?? options.y, r: options.r ?? options.radius }); }
function drawArc(options = {}) {
  const d = options.d ?? `M ${options.x1 ?? options.x} ${options.y1 ?? options.y} A ${options.rx ?? options.r} ${options.ry ?? options.r} ${options.rotation ?? 0} ${options.largeArc ?? 0} ${options.sweep ?? 1} ${options.x2} ${options.y2}`;
  return element('path', { ...commonAttrs(options), d, fill: options.fill ?? 'none' });
}
function drawText(options = {}) {
  const anchor = options.textAnchor ?? options.anchor ?? 'middle';
  const dominant = options.dominantBaseline ?? (options.verticalAlign === 'top' ? 'hanging' : options.verticalAlign === 'bottom' ? 'text-after-edge' : 'middle');
  return element('text', { ...commonAttrs(options), x: options.x, y: options.y, 'font-size': options.fontSize, 'text-anchor': anchor, 'dominant-baseline': dominant }, escapeXml(options.text ?? ''), false);
}
function drawGroup(options = {}) { return element('g', { id: options.id, className: options.className, transform: options.transform, 'data-layer': options.layer }, (options.children || []).join(''), false); }
function drawDimensionLine(options = {}) {
  const { x1 = options.x, y1 = options.y, x2 = options.x + options.width, y2 = options.y, text = '' } = options;
  return drawGroup({ id: options.id, className: options.className ?? 'dimension-line', children: [
    drawLine({ x1, y1, x2, y2, className: 'line-thin', strokeWidth: LINE_WIDTHS.dimension }),
    drawLine({ x1, y1: y1 - 2, x2: x1, y2: y1 + 2, className: 'line-thin', strokeWidth: LINE_WIDTHS.dimension }),
    drawLine({ x1: x2, y1: y2 - 2, x2, y2: y2 + 2, className: 'line-thin', strokeWidth: LINE_WIDTHS.dimension }),
    drawText({ x: (x1 + x2) / 2, y: y1 - 2, text, className: 'text-dimension', fontSize: FONT_SIZES.dimension })
  ] });
}
function drawGridLine(options = {}) { return drawLine({ ...options, className: options.className ?? 'line-grid line-center', strokeWidth: options.strokeWidth ?? LINE_WIDTHS.grid }); }
function drawColumn(options = {}) { return drawRect({ ...options, className: options.className ?? 'line-medium column-symbol', strokeWidth: options.strokeWidth ?? LINE_WIDTHS.column, fill: options.fill ?? 'none' }); }
function drawWall(options = {}) { return drawPolyline({ ...options, className: options.className ?? 'line-heavy wall-line', strokeWidth: options.strokeWidth ?? (options.wallType === 'inner' ? LINE_WIDTHS.innerWall : LINE_WIDTHS.outerWall) }); }
function drawDoor(options = {}) { const w = options.width ?? 10; const h = options.height ?? 10; return drawGroup({ id: options.id, className: options.className ?? 'door-symbol', transform: options.transform, children: [drawLine({ x1: options.x, y1: options.y, x2: options.x + w, y2: options.y, className: 'line-thin' }), drawArc({ x: options.x, y: options.y, r: w, x2: options.x + w, y2: options.y + h, className: 'line-thin' })] }); }
function drawWindow(options = {}) { return drawGroup({ id: options.id, className: options.className ?? 'window-symbol', children: [drawLine({ x1: options.x, y1: options.y, x2: options.x + options.width, y2: options.y, className: 'line-thin' }), drawLine({ x1: options.x, y1: options.y + 2, x2: options.x + options.width, y2: options.y + 2, className: 'line-thin' })] }); }
function drawRoomLabel(options = {}) { return drawText({ ...options, className: options.className ?? 'text-room', fontSize: options.fontSize ?? FONT_SIZES.room }); }
function drawNorthArrow(options = {}) { return drawGroup({ id: options.id ?? 'north-arrow', className: options.className ?? 'north-arrow', transform: options.transform, children: [drawPolygon({ points: [[options.x, options.y - 12], [options.x - 4, options.y + 5], [options.x, options.y + 2], [options.x + 4, options.y + 5]], fill: '#000' }), drawText({ x: options.x, y: options.y + 11, text: 'N', className: 'text-note', fontSize: 4 })] }); }
function drawScaleBar(options = {}) { const length = options.length ?? 50; return drawGroup({ id: options.id ?? 'scale-bar', className: 'scale-bar', children: [drawRect({ x: options.x, y: options.y, width: length, height: 3, fill: 'none', className: 'line-thin' }), drawLine({ x1: options.x + length / 2, y1: options.y, x2: options.x + length / 2, y2: options.y + 3, className: 'line-thin' }), drawText({ x: options.x + length / 2, y: options.y + 8, text: options.text ?? '0 5 10m', className: 'text-dimension', fontSize: FONT_SIZES.dimension })] }); }
function drawTitleBlock(options = {}) { const x = options.x ?? 250; const y = options.y ?? 258; const w = options.width ?? 155; const h = options.height ?? 24; return drawGroup({ id: options.id ?? 'title-block', className: 'title-block', children: [drawRect({ x, y, width: w, height: h, fill: '#fff', className: 'line-heavy' }), drawLine({ x1: x, y1: y + 8, x2: x + w, y2: y + 8, className: 'line-thin' }), drawLine({ x1: x + 95, y1: y, x2: x + 95, y2: y + h, className: 'line-thin' }), drawText({ x: x + 4, y: y + 5, text: options.title ?? '図面タイトル', textAnchor: 'start', className: 'text-title', fontSize: FONT_SIZES.title }), drawText({ x: x + 99, y: y + 5, text: options.drawingNumber ?? 'No.', textAnchor: 'start', className: 'text-border', fontSize: FONT_SIZES.border }), drawText({ x: x + 4, y: y + 15, text: options.projectTitle ?? '', textAnchor: 'start', className: 'text-border', fontSize: FONT_SIZES.border }), drawText({ x: x + 99, y: y + 15, text: options.scale ?? 'S=1/200', textAnchor: 'start', className: 'text-border', fontSize: FONT_SIZES.border })] }); }
function drawBorder(options = {}) { const m = options.margin ?? 10; return drawRect({ id: options.id ?? 'drawing-border', x: m, y: m, width: (options.width ?? 420) - m * 2, height: (options.height ?? 297) - m * 2, fill: 'none', className: 'line-heavy drawing-border', strokeWidth: LINE_WIDTHS.border }); }

const api = { SVG_NS, LINE_WIDTHS, FONT_SIZES, escapeXml, element, drawLine, drawPolyline, drawPolygon, drawRect, drawCircle, drawArc, drawText, drawGroup, drawDimensionLine, drawGridLine, drawColumn, drawWall, drawDoor, drawWindow, drawRoomLabel, drawNorthArrow, drawScaleBar, drawTitleBlock, drawBorder };
if (typeof module !== 'undefined') module.exports = api;
if (typeof window !== 'undefined') window.svgPrimitives = api;

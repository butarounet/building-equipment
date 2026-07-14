const { EDGE_TYPES } = require('./knowledgeEdge');
const REQUIRED_TYPES = ['Building','Floor','Room','Equipment Space','Equipment','System','Drawing','Question','AnswerSheet','ModelAnswer','Scoring'];
class GraphValidator {
  constructor(graph) { this.graph = graph; }
  validate(generatorResults = {}) {
    const errors = [], warnings = [], checks = [];
    const check = (name, ok, message, warn = false) => { checks.push({ name, ok: !!ok }); if (!ok) (warn ? warnings : errors).push(message || name); };
    const ids = new Set();
    for (const node of this.graph.nodes) { check(`node:${node.id}:unique`, !ids.has(node.id), `重複ノード: ${node.id}`); ids.add(node.id); check(`node:${node.id}:type`, REQUIRED_TYPES.includes(node.type), `未対応ノード種別: ${node.type}`); }
    for (const type of REQUIRED_TYPES) check(`type:${type}:exists`, this.graph.findByType(type).length > 0, `${type}ノードがありません。`);
    for (const edge of this.graph.edges) { check(`edge:${edge.from}->${edge.to}:type`, EDGE_TYPES.includes(edge.type), `未対応エッジ: ${edge.type}`); check(`edge:${edge.from}->${edge.to}:nodes`, ids.has(edge.from) && ids.has(edge.to), `存在しないノードへのエッジ: ${edge.from}->${edge.to}`); }
    const requiredRefs = [ ['Question','AnswerSheet'], ['Drawing','Question'], ['ModelAnswer','Scoring'] ];
    for (const [fromType, toType] of requiredRefs) check(`${fromType}-${toType}:linked`, this.graph.edges.some((e) => this.graph.findNode(e.from)?.type === fromType && this.graph.findNode(e.to)?.type === toType), `${fromType}から${toType}への参照がありません。`);
    for (const [key, value] of Object.entries(generatorResults)) check(`generator:${key}:represented`, !value || this.graph.nodes.some((n) => n.generator === key || n.payload?.generatorResultKey === key), `${key}のGenerator結果がGraphにありません。`, true);
    const score = Math.round(100 * (checks.filter((c) => c.ok).length / Math.max(1, checks.length)));
    if (score < 95) warnings.push(`Knowledge Graph consistency score is ${score}; 95未満です。`);
    return { passed: errors.length === 0 && score >= 95, score, warning: score < 95, warnings, errors, checks };
  }
}
module.exports = { GraphValidator };

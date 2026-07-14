const EDGE_TYPES = ['contains','dependsOn','requires','draws','answers','scores','references','locatedIn','connectsTo','feeds','returns'];
class KnowledgeEdge {
  constructor({ from, to, type = 'references', metadata = {} } = {}) {
    if (!from || !to) throw new Error('KnowledgeEdge requires from and to.');
    if (!EDGE_TYPES.includes(type)) throw new Error(`Unsupported edge type: ${type}`);
    this.from = from;
    this.to = to;
    this.type = type;
    this.metadata = metadata || {};
  }
}
module.exports = { KnowledgeEdge, EDGE_TYPES };

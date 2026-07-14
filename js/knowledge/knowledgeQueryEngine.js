class KnowledgeQueryEngine {
  constructor(graph) { this.graph = graph; }
  findNode(id) { return this.graph.findNode(id); }
  findByType(type) { return this.graph.nodes.filter((n) => n.type === type); }
  trace(id, edgeTypes = null) {
    const allowed = edgeTypes && new Set(edgeTypes);
    const visited = new Set([id]);
    const result = [];
    const queue = [...this.graph.outgoing(id)];
    while (queue.length) {
      const edge = queue.shift();
      if (allowed && !allowed.has(edge.type)) continue;
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      const node = this.graph.findNode(edge.to);
      if (node) result.push(node);
      queue.push(...this.graph.outgoing(edge.to));
    }
    return result;
  }
}
module.exports = { KnowledgeQueryEngine };

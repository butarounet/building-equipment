class ImpactAnalyzer {
  constructor(graph) { this.graph = graph; }
  getImpact(id) {
    const visited = new Set([id]);
    const queue = [...this.graph.outgoing(id)];
    const impacted = [];
    while (queue.length) {
      const edge = queue.shift();
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      const node = this.graph.findNode(edge.to);
      if (node) impacted.push({ node, via: edge.type, from: edge.from });
      queue.push(...this.graph.outgoing(edge.to));
    }
    return impacted;
  }
}
module.exports = { ImpactAnalyzer };

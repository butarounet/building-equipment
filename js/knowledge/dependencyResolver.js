class DependencyResolver {
  constructor(graph) { this.graph = graph; }
  getDependencies(id, visited = new Set()) {
    if (visited.has(id)) return [];
    visited.add(id);
    const direct = this.graph.incoming(id).filter((e) => ['dependsOn','requires','references','draws','answers','scores','locatedIn','connectsTo','feeds','returns','contains'].includes(e.type));
    return direct.flatMap((edge) => [this.graph.findNode(edge.from), ...this.getDependencies(edge.from, visited)]).filter(Boolean);
  }
  generateDependencies() {
    const edges = [];
    const nodes = this.graph.nodes;
    const byType = (type) => nodes.filter((n) => n.type === type);
    for (const q of byType('Question')) {
      for (const drawing of byType('Drawing')) if (!this.graph.hasEdge(drawing.id, q.id, 'draws')) edges.push({ from: drawing.id, to: q.id, type: 'draws', metadata: { generated: true } });
      for (const answer of byType('AnswerSheet')) if (!this.graph.hasEdge(q.id, answer.id, 'answers')) edges.push({ from: q.id, to: answer.id, type: 'answers', metadata: { generated: true } });
    }
    for (const answer of byType('AnswerSheet')) for (const model of byType('ModelAnswer')) if (!this.graph.hasEdge(answer.id, model.id, 'references')) edges.push({ from: answer.id, to: model.id, type: 'references', metadata: { generated: true } });
    for (const model of byType('ModelAnswer')) for (const scoring of byType('Scoring')) if (!this.graph.hasEdge(model.id, scoring.id, 'scores')) edges.push({ from: model.id, to: scoring.id, type: 'scores', metadata: { generated: true } });
    edges.forEach((e) => this.graph.addEdge(e));
    return edges;
  }
}
module.exports = { DependencyResolver };

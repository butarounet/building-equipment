const { KnowledgeNode } = require('./knowledgeNode');
const { KnowledgeEdge } = require('./knowledgeEdge');
const { KnowledgeRepository } = require('./knowledgeRepository');
const { KnowledgeQueryEngine } = require('./knowledgeQueryEngine');
const { DependencyResolver } = require('./dependencyResolver');
const { ImpactAnalyzer } = require('./impactAnalyzer');
const { GraphValidator } = require('./graphValidator');

class KnowledgeGraphEngine {
  constructor({ nodes = [], edges = [], repository = null } = {}) {
    this.nodes = []; this.edges = [];
    [...nodes].forEach((n) => this.addNode(n)); [...edges].forEach((e) => this.addEdge(e));
    this.repository = repository || new KnowledgeRepository();
    this.queryEngine = new KnowledgeQueryEngine(this);
    this.dependencyResolver = new DependencyResolver(this);
    this.impactAnalyzer = new ImpactAnalyzer(this);
    this.validator = new GraphValidator(this);
  }
  static fromRepository(options = {}) { const repo = new KnowledgeRepository(options); const data = repo.loadAll(); return new KnowledgeGraphEngine({ ...data, repository: repo }); }
  addNode(node) { const n = node instanceof KnowledgeNode ? node : new KnowledgeNode(node); const i = this.nodes.findIndex((x) => x.id === n.id); if (i >= 0) this.nodes[i] = n; else this.nodes.push(n); return n; }
  addEdge(edge) { const e = edge instanceof KnowledgeEdge ? edge : new KnowledgeEdge(edge); if (!this.hasEdge(e.from, e.to, e.type)) this.edges.push(e); return e; }
  hasEdge(from, to, type) { return this.edges.some((e) => e.from === from && e.to === to && (!type || e.type === type)); }
  outgoing(id) { return this.edges.filter((e) => e.from === id); }
  incoming(id) { return this.edges.filter((e) => e.to === id); }
  findNode(id) { return this.nodes.find((n) => n.id === id); }
  findByType(type) { return this.queryEngine.findByType(type); }
  getDependencies(id) { return this.dependencyResolver.getDependencies(id); }
  getImpact(id) { return this.impactAnalyzer.getImpact(id); }
  validate(generatorResults = {}) { return this.validator.validate(generatorResults); }
  generateDependencies() { return this.dependencyResolver.generateDependencies(); }
  query(id, edgeTypes) { return this.queryEngine.trace(id, edgeTypes); }
}
module.exports = { KnowledgeGraphEngine };

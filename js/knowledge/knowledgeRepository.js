const fs = require('node:fs');
const path = require('node:path');

class KnowledgeRepository {
  constructor({ baseDir = path.join(process.cwd(), 'data', 'knowledge') } = {}) { this.baseDir = baseDir; }
  loadGraphFile(fileName) { return JSON.parse(fs.readFileSync(path.join(this.baseDir, fileName), 'utf8')); }
  loadAll() {
    if (!fs.existsSync(this.baseDir)) return { nodes: [], edges: [] };
    return fs.readdirSync(this.baseDir).filter((f) => f.endsWith('Graph.json')).sort().reduce((acc, file) => {
      const graph = this.loadGraphFile(file);
      acc.nodes.push(...(graph.nodes || [])); acc.edges.push(...(graph.edges || [])); return acc;
    }, { nodes: [], edges: [] });
  }
}
module.exports = { KnowledgeRepository };

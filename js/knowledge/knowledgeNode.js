class KnowledgeNode {
  constructor({ id, type, name, generator = null, payload = {}, references = [] } = {}) {
    if (!id) throw new Error('KnowledgeNode id is required.');
    if (!type) throw new Error(`KnowledgeNode type is required: ${id}`);
    this.id = id;
    this.type = type;
    this.name = name || id;
    this.generator = generator;
    this.payload = payload || {};
    this.references = Array.isArray(references) ? references : [references].filter(Boolean);
  }
}
module.exports = { KnowledgeNode };

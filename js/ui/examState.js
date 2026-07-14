class ExamState {
  constructor(initial = {}) { this.version = 1; this.data = this.createEmptyState(); this.listeners = new Set(); if (Object.keys(initial).length) this.replace(initial); }
  createEmptyState() { return { exam: null, building: null, equipment: null, materials: null, questions: null, buildingDrawing: null, equipmentDrawing: null, blankDrawing: null, answerSheets: null, modelAnswers: null, consistency: null, printPackage: null, previewPackage: null, updatedAt: null }; }
  get snapshot() { return { ...this.data }; }
  get(key) { return this.data[key]; }
  set(key, value) { if (!Object.prototype.hasOwnProperty.call(this.data, key)) throw new Error(`Unknown ExamState key: ${key}`); this.data = { ...this.data, [key]: value, updatedAt: new Date().toISOString() }; this.emit(key); return this.snapshot; }
  replace(next = {}) { this.data = { ...this.createEmptyState(), ...next, updatedAt: new Date().toISOString() }; this.emit('*'); return this.snapshot; }
  reset() { return this.replace(); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(changedKey) { const snapshot = this.snapshot; this.listeners.forEach((listener) => listener(snapshot, changedKey)); }
  canPrint() { return !!this.data.consistency?.passed; }
}
if (typeof module !== 'undefined') module.exports = { ExamState };
if (typeof window !== 'undefined') window.ExamState = ExamState;

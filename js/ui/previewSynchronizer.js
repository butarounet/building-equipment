class PreviewSynchronizer {
  constructor(state, targets = {}) { this.state = state; this.targets = targets; this.unsubscribe = null; }
  start() { this.unsubscribe = this.state.subscribe((snapshot) => this.sync(snapshot)); this.sync(this.state.snapshot); return this; }
  stop() { if (this.unsubscribe) this.unsubscribe(); }
  write(name, value) { const target = this.targets[name]; if (!target) return; const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2); if ('innerHTML' in target) target.innerHTML = text; else if ('textContent' in target) target.textContent = text; }
  sync(s) { this.write('generator', { building: s.building, equipment: s.equipment, materials: s.materials }); this.write('building', s.buildingDrawing); this.write('equipment', s.equipmentDrawing); this.write('blank', s.blankDrawing); this.write('question', s.exam); this.write('answer', s.answerSheets); this.write('print', s.printPackage); }
}
if (typeof module !== 'undefined') module.exports = { PreviewSynchronizer };
if (typeof window !== 'undefined') window.PreviewSynchronizer = PreviewSynchronizer;

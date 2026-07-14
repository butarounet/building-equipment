class ProgressOverlay { constructor(root = null) { this.root = root; this.steps = []; } show(message = '生成中') { this.visible = true; this.update(message); } update(message) { this.current = message; this.steps.push(message); if (this.root) this.root.textContent = message; } hide() { this.visible = false; } bind(pipeline) { pipeline.onProgress = ({ step }) => { if (step === 'Complete') this.hide(); else this.show(step); }; return this; } }
if (typeof module !== 'undefined') module.exports = { ProgressOverlay };
if (typeof window !== 'undefined') window.ProgressOverlay = ProgressOverlay;

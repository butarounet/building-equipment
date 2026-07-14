const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const repoRoot = path.join(__dirname, '..');

function deferredScripts() {
  const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  return [...html.matchAll(/<script src="([^"]+)" defer><\/script>/g)].map((match) => match[1]);
}

test('browser deferred scripts expose ExamConsistencyEngine before ExamPipeline dependencies are captured', () => {
  const context = {
    console,
    document: { addEventListener() {}, querySelector() { return null; } },
    window: null,
    globalThis: null,
    setTimeout,
    clearTimeout
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);

  for (const src of deferredScripts()) {
    const source = fs.readFileSync(path.join(repoRoot, src), 'utf8');
    assert.doesNotThrow(() => vm.runInContext(source, context, { filename: src }), `${src} should load in browser global scope`);

    if (src === 'js/quality/examConsistencyEngine.js') {
      assert.equal(typeof context.window.checkExamConsistency, 'function');
      assert.equal(typeof context.window.ExamConsistencyEngine, 'function');
      for (const helper of ['normalize', 'score', 'inferRoom', 'collect', 'getCommon', 'WEIGHTS', 'ALLOWED_HVAC', 'ALLOWED_PLUMBING', 'ALLOWED_ELECTRICAL']) {
        assert.equal(Object.hasOwn(context.window, helper), false, `${helper} should remain local to examConsistencyEngine.js`);
      }
    }
  }

  assert.equal(typeof context.window.ExamPipeline, 'function');
  const pipeline = new context.window.ExamPipeline({ state: { set() {}, get() {}, snapshot: {} } });
  assert.equal(typeof pipeline.dependencies.checkExamConsistency, 'function');
});

// Прогон встроенных тестов index.html без браузера.
// Запуск: node tools/run-tests.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
if (!match) { console.error('В index.html не найден тег <script>'); process.exit(2); }

// Заглушки: игре нужен DOM, но тесты трогают только чистые функции.
const stubs = `
globalThis.document = {
  addEventListener(){}, getElementById(){ return null; },
  createElement(){ return { style:{}, classList:{ add(){}, remove(){} },
    appendChild(){}, addEventListener(){}, setAttribute(){}, remove(){},
    replaceWith(){}, focus(){} }; },
  createTextNode(){ return {}; }, body:{ appendChild(){} },
  documentElement: { setAttribute(){}, getAttribute(){ return null; } },
  title: ''
};
globalThis.location = { search: '?test=1', reload(){} };
globalThis.localStorage = {
  _d:{}, getItem(k){ return this._d[k] || null; },
  setItem(k,v){ this._d[k] = String(v); }, removeItem(k){ delete this._d[k]; }
};
globalThis.navigator = { language: 'ru-RU' };
globalThis.window = globalThis;
globalThis.Image = function(){};
`;

const runner = `
globalThis.__result = (() => {
  let passed = 0, failed = 0; const failures = [];
  for (const suite of Tests.suites) {
    for (const test of suite.tests) {
      try { test.fn(); passed++; }
      catch (e) { failed++; failures.push(suite.name + ' > ' + test.name + ' :: ' + e.message); }
    }
  }
  return { passed, failed, failures };
})();
`;

vm.runInThisContext(stubs + match[1] + runner, { filename: 'index.html' });

const { passed, failed, failures } = globalThis.__result;
console.log('PASSED: ' + passed + '  FAILED: ' + failed);
for (const f of failures) console.log('FAIL: ' + f);
process.exit(failed > 0 ? 1 : 0);

// В коде не должно остаться русского текста вне словарей, комментариев,
// тестов и dev-панели.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const lines = src.split('\n');
const CYRILLIC = /[А-Яа-яЁё]/;

// Границы, внутри которых кириллица разрешена.
const bounds = (marker) => lines.findIndex(l => l.includes(marker));
const i18nStart = bounds('=== SECTION: I18N ===');
const i18nEnd = bounds('=== SECTION: TEST INFRA ===');
const devStart = bounds('=== SECTION: DEV ===');

const offenders = [];
lines.forEach((line, i) => {
  const n = i + 1;
  if (n > i18nStart && n < i18nEnd) return;      // словари
  if (devStart !== -1 && n > devStart) return;   // dev-панель
  const code = line.replace(/\/\/.*$/, '');      // комментарии
  if (/\b(describe|it|assert\w*)\s*\(/.test(code)) return;  // тесты
  const literals = code.match(/'[^']*'|"[^"]*"|`[^`]*`/g) || [];
  for (const lit of literals) if (CYRILLIC.test(lit)) offenders.push(n + ': ' + lit);
});

if (offenders.length) {
  console.log('Русский текст вне словаря — ' + offenders.length + ':');
  for (const o of offenders) console.log('  ' + o);
  process.exit(1);
}
console.log('OK: русского текста вне словаря нет');

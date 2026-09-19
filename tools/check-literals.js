// В коде не должно остаться русского текста вне словарей, комментариев,
// тестов и dev-панели.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const lines = src.split('\n');
const CYRILLIC = /[А-Яа-яЁё]/;
const LITERAL = /'[^']*'|"[^"]*"|`[^`]*`/g;

function find(marker) {
  const i = lines.findIndex(l => l.includes(marker));
  if (i === -1) { console.error('Не найден маркер: ' + marker); process.exit(2); }
  return i + 1;
}

const i18nStart = find('=== SECTION: I18N ===');
const i18nEnd = find('=== SECTION: TEST INFRA ===');
const devStart = find('=== SECTION: DEV ===');

// Блок теста пропускаем целиком: describe( или it( открывает его, закрывает
// строка «});» с тем же отступом. Границу считаем по отступу, а не по счёту
// фигурных скобок — в тестах есть литералы вида '{a}-{b}', счёт бы сбился.
const inTest = new Array(lines.length).fill(false);
for (let i = 0; i < lines.length; i++) {
  const open = lines[i].match(/^(\s*)(?:describe|it)\s*\(/);
  if (!open) continue;
  let end = lines.length - 1;
  for (let j = i + 1; j < lines.length; j++) {
    const close = lines[j].match(/^(\s*)\}\)/);
    if (close && close[1].length === open[1].length) { end = j; break; }
  }
  for (let k = i; k <= end; k++) inTest[k] = true;
}

const offenders = [];
lines.forEach((line, i) => {
  const n = i + 1;
  if (n > i18nStart && n < i18nEnd) return;   // словари
  if (n > devStart) return;                    // dev-панель
  if (inTest[i]) return;                       // тесты
  const code = line.replace(/\/\/.*$/, '');    // строчные комментарии
  const literals = code.match(LITERAL) || [];
  for (const lit of literals) if (CYRILLIC.test(lit)) offenders.push(n + ': ' + lit);
});

if (offenders.length) {
  console.log('Русский текст вне словаря — ' + offenders.length + ':');
  for (const o of offenders) console.log('  ' + o);
  process.exit(1);
}
console.log('OK: русского текста вне словаря нет');

// Check of the Straight From the Band shipping rule in sftb.js.
// Run: node tools/sftb-shipping-test.mjs
import fs from 'fs';
const src = fs.readFileSync(new URL('../sftb.js', import.meta.url), 'utf8');
const m = src.match(/\/\/ ---- sftb:data:start[\s\S]*?\/\/ ---- sftb:data:end ----/);
if (!m) throw new Error('sftb:data block not found in sftb.js');
const {shipFor, CAT} = new Function(m[0] + '\nreturn {shipFor, CAT};')();
const L = (id, qty = 1) => { if (!CAT[id]) throw new Error('unknown item ' + id); return {id, qty}; };
const cases = [
  ['empty cart', [], 0],
  ['1 shirt', [L('skulltee')], 5],
  ['2 shirts', [L('skulltee'), L('ringer')], 7],
  ['2 shirts, one line', [L('skulltee', 2)], 7],
  ['1 shirt + 1 sticks', [L('ringer'), L('sticks')], 7],
  ['3 shirts + 2 sticks', [L('skulltee', 2), L('ringer'), L('sticks', 2)], 13],
  ['only picks', [L('pick-darrell', 3), L('pick-gedy')], 5],
  ['2 picks', [L('pick-darrell', 2)], 5],
  ['only tins', [L('tin', 2)], 5],
  ['1 tee + 1 tin', [L('skulltee'), L('tin')], 5],
  ['1 CD', [L('cd-salt')], 5],
  ['3 CDs', [L('cd-salt'), L('cd-friction'), L('cd-die-scared')], 7],
  ['3 CDs, one line', [L('cd-salt', 3)], 7],
  ['1 vinyl + 3 CDs', [L('vinyl-knockout'), L('cd-salt'), L('cd-friction'), L('cd-die-scared')], 5],
  ['1 shirt + 1 vinyl', [L('skulltee'), L('vinyl-knockout')], 7],
  ['2 CDs + 1 pick', [L('cd-salt'), L('cd-friction'), L('pick-gedy')], 6],
  ['1 shirt + 2 CDs', [L('ringer'), L('cd-salt'), L('cd-friction')], 5],
  ['vinyl + 2 CDs + 1 shirt (PayPal test cart)', [L('vinyl-knockout'), L('cd-digital-toys'), L('cd-salt'), L('skulltee')], 7],
];
let fail = 0;
for (const [name, lines, want] of cases) { const got = shipFor(lines); const ok = got === want; if (!ok) fail++; console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + ': ' + got + (ok ? '' : ' (want ' + want + ')')); }
const bad = Object.values(CAT).filter(c => !['big', 'cd', 'none'].includes(c.ship)).map(c => c.id);
if (bad.length) { fail++; console.log('FAIL  items without a valid ship class: ' + bad.join(', ')); }
console.log(fail ? fail + ' failed' : 'all ' + cases.length + ' cases passed');
if (CAT['cd-knockout']) { fail++; console.log('FAIL  Knockout must be vinyl only (cd-knockout exists)'); }
const sub = [L('vinyl-knockout'), L('cd-digital-toys'), L('cd-salt'), L('skulltee')].reduce((s, l) => s + CAT[l.id].price * l.qty, 0);
console.log((sub === 72 ? 'PASS' : 'FAIL') + '  PayPal test cart subtotal: ' + sub + ', total ' + (sub + 7)); if (sub !== 72) fail++;
process.exit(fail ? 1 : 0);

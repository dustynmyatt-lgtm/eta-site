// Tiny check of the Straight From the Band shipping rule in sftb.js.
// Run: node tools/sftb-shipping-test.mjs
import fs from 'fs';
const src = fs.readFileSync(new URL('../sftb.js', import.meta.url), 'utf8');
const grab = re => { const m = src.match(re); if(!m) throw new Error('not found: ' + re); return m[0]; };
const code = [grab(/var SFTB_SHIP_BASE[^;]*;/), grab(/var SFTB_SHIP_PER_EXTRA_BIG[^;]*;/),
  grab(/var CAT = \{[\s\S]*?\n\};/), grab(/function shipFor\(lines\)\{[\s\S]*?\n\}/), 'return shipFor;'].join('\n');
const shipFor = new Function(code)();
const L = (id, qty) => ({id, qty});
const cases = [
  ['empty cart', [], 0],
  ['1 shirt', [L('skulltee',1)], 5],
  ['2 shirts', [L('skulltee',1), L('ringer',1)], 7],
  ['2 shirts, one line', [L('skulltee',2)], 7],
  ['1 shirt + 1 sticks', [L('ringer',1), L('sticks',1)], 7],
  ['3 shirts + 2 sticks', [L('skulltee',2), L('ringer',1), L('sticks',2)], 13],
  ['only picks', [L('pick-darrell',3), L('pick-gedy',1)], 5],
  ['only tins', [L('tin',2)], 5],
  ['1 tee + 1 tin (PayPal test cart)', [L('skulltee',1), L('tin',1)], 5],
];
let fail = 0;
for (const [name, lines, want] of cases) { const got = shipFor(lines); const ok = got === want; if(!ok) fail++; console.log((ok?'PASS':'FAIL') + '  ' + name + ': ' + got + (ok?'':' (want ' + want + ')')); }
process.exit(fail ? 1 : 0);

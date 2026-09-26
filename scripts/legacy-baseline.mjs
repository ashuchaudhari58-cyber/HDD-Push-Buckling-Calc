// Runs compute() from legacy/index.html with its DEFAULTS and prints full-precision results.
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../legacy/index.html', import.meta.url), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const DEF = eval('(' + js.match(/const DEFAULTS = (\{[\s\S]*?\});/)[1] + ')');
const body = js.slice(js.indexOf('const E_SHEET'), js.indexOf('/* ================= RENDER'));
const document = { getElementById: (id) => ({ get value() { return DEF[id]; }, get checked() { return DEF[id]; } }) };
const R = eval(body + ';compute()');
console.log(JSON.stringify({
  cum: R.sec.map((s) => s.cum), total: R.total, sigma: R.safe.sigma, allow: R.safe.allow, util: R.safe.util, sfYield: R.safe.sfYield,
  Fcrs: R.buck.Fcrs, GaoSin: R.buck.GaoSin, GaoHel: R.buck.GaoHel, Wnet: R.Wnet,
}, null, 1));

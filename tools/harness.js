// Headless balance harness for the Act 1 prototype.
// Runs the real sim files with no screen, driving the player's cab and
// the business decisions by a fixed strategy, and prints daily numbers.
//
//   node tools/harness.js [strategy] [days] [seeds]
//   strategies: solo, lease, lease-fast, all
//
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILES = ['util', 'town', 'state', 'sim', 'actions'];
const SRC = FILES.map(f => fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'));

function seeded(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const STUBS = `
function render(){} function renderOverlay(){} function renderChat(){}
function syncSpeed(){} function save(){} function renderZoom(){}
`;

function makeWorld(seed) {
  const math = Object.create(Math);
  math.random = seeded(seed);
  const ctx = {
    Math: math, console, setTimeout: () => 0, performance: { now: () => 0 },
    document: { getElementById: () => null }, window: {}, localStorage: { removeItem() {} },
  };
  vm.createContext(ctx);
  vm.runInContext(STUBS, ctx);
  SRC.forEach((s, i) => vm.runInContext(s, ctx, { filename: FILES[i] + '.js' }));
  vm.runInContext(`toast=function(){}; newGame(); Object.defineProperty(globalThis,'S_',{get(){return S}});`, ctx);
  return ctx;
}

// ---------- strategies ----------
// Each returns a function called every 30 game minutes while the
// player is free to make business decisions.
const STRATEGIES = {
  solo: () => () => {},
  lease: opts => w => {
    const run = code => vm.runInContext(code, w);
    const reserve = opts.reserve;
    const S = w.S_;
    if (!S.office && S.cash >= 500 + reserve) return run(`act('rent',null)`);
    if (!S.office) return;
    // staff any cab without a hired driver
    const needDriver = run(`ourCabs().some(c=>!staffed(c))`);
    if (needDriver && S.candidates.length && run(`!!freeSlot()`)) {
      const id = S.candidates[0].id;
      return run(`act('hire',{dataset:{id:${id}}})`);
    }
    if (!S.operator && run('hired().length>0') && S.cash >= 80 * 3 + reserve) return run(`act('operator',null)`);
    const n = run('ourCabs().length');
    if (S.operator && !needDriver && n < 4 && S.cash >= opts.leaseAt) return run(`act('lease',null)`);
    if (!S.mechanic && n >= 3 && S.cash >= 600 + reserve && opts.mechanic) return run(`act('mechanic',null)`);
    if (!S.act1 && run('act1Ready()')) {
      const me = run(`S.drivers.find(d=>d.isPlayer).id`);
      return run(`act('shift',{dataset:{id:${me}},value:'off',blur(){}})`);
    }
  },
};
const PLANS = {
  solo: STRATEGIES.solo(),
  lease: STRATEGIES.lease({ reserve: 250, leaseAt: 300, mechanic: true }),
  'lease-fast': STRATEGIES.lease({ reserve: 0, leaseAt: 100, mechanic: false }),
};

// The player's own driving: go for nearby hails, queue at busy ranks,
// take the quickest route, answer chat well most of the time.
const DRIVE = `
(function(){
  if(S.choosing){act('route',{dataset:{i:0}});return}
  if(S.chat&&!S.chat.result){act('chat',{dataset:{kind:Math.random()<.65?'good':'ok'}});}
  const pc=playerCab();if(!pc||!freeCab(pc))return;
  if(pc.state==='moving')return;
  const c=nearestHail(pc,pc.rankId?200:380);if(c){goPickup(pc,c);return}
  if(!pc.rankId){let best=null,bs=Infinity;const h=S.t/60;
    for(const rk of RANKS){const q=S.cabs.filter(x=>x.rankId===rk.id||x.targetRank===rk.id).length;const s=(q+1)/(.3+demand(rk.d,h))+Math.hypot(nodes[rk.node].x-pc.x,nodes[rk.node].y-pc.y)/300;if(s<bs){bs=s;best=rk}}
    if(best)sendTo(pc,best.node,best.id)}
})();`;

function runOne(planName, days, seed) {
  const w = makeWorld(seed);
  const plan = PLANS[planName];
  const drive = new vm.Script(DRIVE);
  const out = [];
  let lastDecide = -1, act1Day = null;
  const endAt = days * 1440;
  while (out.length < days) {
    const S = w.S_;
    if (S.modal) S.modal = null;
    drive.runInContext(w);
    const ab = vm.runInContext('absNow()', w);
    if (Math.floor(ab / 30) !== lastDecide && !vm.runInContext('locked()', w)) {
      lastDecide = Math.floor(ab / 30);
      plan(w);
    }
    if (w.S_.modal && w.S_.modal.type === 'act1') act1Day = w.S_.day;
    const prevHist = w.S_.history.length;
    vm.runInContext('tick(.25)', w);
    if (w.S_.history.length > prevHist) {
      const h = w.S_.history[0];
      out.push({
        day: h.day, cash: Math.round(w.S_.cash), net: Math.round(h.net), jobs: h.jobs,
        fares: Math.round(h.fares + h.tips), cabs: vm.runInContext('ourCabs().length', w),
        staffed: vm.runInContext('staffedCount()', w), rival: Math.round(h.rival),
        lost: h.lost, rep: Math.round(w.S_.rep), comm: Math.round(h.comm), fuel: Math.round(h.fuel), rep_: Math.round(h.repairs+h.service), fixed: h.fixed,
      });
    }
    if (w.S_.negDays >= 3) { out.push({ bust: true, day: w.S_.day }); break; }
  }
  return { out, act1Day };
}

// ---------- main ----------
const [, , which = 'all', daysArg = '12', seedsArg = '3'] = process.argv;
const days = +daysArg, seeds = +seedsArg;
const names = which === 'all' ? Object.keys(PLANS) : [which];
for (const name of names) {
  console.log(`\n=== ${name} (${days} days x ${seeds} seeds) ===`);
  const all = [];
  for (let s = 1; s <= seeds; s++) {
    const t0 = Date.now();
    const r = runOne(name, days, 1000 + s);
    all.push(r);
    const last = r.out[r.out.length - 1] || {};
    console.log(`seed ${s}: ${r.out.filter(d => !d.bust).length} days, final cash £${last.cash ?? '-'}` +
      `${last.bust ? ' BUST on day ' + last.day : ''}, act 1 done: ${r.act1Day ? 'day ' + r.act1Day : 'no'}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  console.log('day | cash     | net    | jobs | fares  | cabs/staffed | rival | lost | rep');
  if (process.env.COSTS) for (let d = 0; d < days; d++) { const rows = all.map(r => r.out[d]).filter(x => x && !x.bust); if (!rows.length) break; const avg = k => Math.round(rows.reduce((a, r) => a + r[k], 0) / rows.length); console.log('  costs day ' + (d + 1) + ': commission £' + avg('comm') + ', fuel £' + avg('fuel') + ', repairs+service £' + avg('rep_') + ', fixed £' + avg('fixed')); }
  for (let d = 0; d < days; d++) {
    const rows = all.map(r => r.out[d]).filter(x => x && !x.bust);
    if (!rows.length) break;
    const avg = k => Math.round(rows.reduce((a, r) => a + r[k], 0) / rows.length);
    console.log(`${String(d + 1).padStart(3)} | ${('£' + avg('cash')).padStart(8)} | ${('£' + avg('net')).padStart(6)} | ${String(avg('jobs')).padStart(4)} | ${('£' + avg('fares')).padStart(6)} | ${(rows.map(r => r.cabs + '/' + r.staffed).join(' ')).padEnd(12)} | ${String(avg('rival')).padStart(5)} | ${String(avg('lost')).padStart(4)} | ${avg('rep')}`);
  }
}

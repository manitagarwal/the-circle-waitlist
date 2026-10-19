// Metro station carousel, drawn like station signage. Run: node build-metro.js [outdir]
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const F = path.resolve(__dirname, '../../app/node_modules/@expo-google-fonts');
const ff = (w, f) => `@font-face{font-family:'In';font-weight:${w};src:url('file://${F}/inter/${f}')}`;
const LINE = { yellow: ['#f4c20d', '#1b1a18', 'Yellow'], blue: ['#1e6fd9', '#fff', 'Blue'], red: ['#d93a2f', '#fff', 'Red'], violet: ['#7a4db3', '#fff', 'Violet'], magenta: ['#c6338c', '#fff', 'Magenta'] };
const css = `${ff(400, '400Regular/Inter_400Regular.ttf')}${ff(600, '600SemiBold/Inter_600SemiBold.ttf')}${ff(700, '700Bold/Inter_700Bold.ttf')}${ff(800, '800ExtraBold/Inter_800ExtraBold.ttf')}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;position:relative;overflow:hidden;font-family:'In',sans-serif;background:#eef0f2;color:#14181d}
.band{position:absolute;left:0;right:0;top:0;height:580px;padding:90px 90px 0}
.badges{display:flex;gap:14px;margin-bottom:46px}.badge{height:56px;padding:0 26px;border-radius:28px;display:flex;align-items:center;gap:12px;font:700 26px 'In';letter-spacing:.06em;text-transform:uppercase;background:rgba(255,255,255,.2)}
.badge i{width:22px;height:22px;border-radius:50%;display:block}
.st{font:800 124px/1.0 'In';letter-spacing:-.03em;text-transform:uppercase}.st.l{font-size:100px}
.sub{font:600 30px 'In';letter-spacing:.14em;text-transform:uppercase;margin-top:30px;opacity:.85}
.strip{position:absolute;left:0;right:0;top:580px;bottom:0}
.rail{position:absolute;left:150px;top:0;width:16px;height:620px}
.dot{position:absolute;left:131px;width:54px;height:54px;border-radius:50%;background:#fff;border:12px solid}
.cur{left:118px;width:80px;height:80px;border-width:18px}
.gh{position:absolute;left:290px;font:600 32px 'In';color:#7b848e}.gh b{display:block;font:700 22px 'In';letter-spacing:.14em;text-transform:uppercase;color:#a0a8b0;margin-bottom:6px}
.t{position:absolute;left:290px;right:90px;top:150px}.t h2{font:800 76px/1.02 'In';letter-spacing:-.02em}.t p{font:400 42px/1.4 'In';color:#3d4650;margin-top:26px}
.foot{position:absolute;left:90px;right:90px;bottom:60px;display:flex;justify-content:space-between;align-items:center;font:700 24px 'In';letter-spacing:.1em;text-transform:uppercase;color:#7b848e}
.foot .br{display:flex;gap:14px;align-items:center;text-transform:none;letter-spacing:0;font:600 30px 'In';color:#3d4650}.foot svg{width:44px;height:27px}
.map{position:absolute;inset:0}
`;
const M = '<svg viewBox="0 0 40 24"><path d="M4,20 A16,16 0 0 1 36,20 L4,20 Z" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linejoin="round"/></svg>';
const foot = (i, n, dk) => `<div class="foot"${dk ? ' style="color:#bfe3cf"' : ''}><div class="br"${dk ? ' style="color:#fff"' : ''}>${M}<span>The Semi Circle</span></div><div>${i + 1} / ${n}${i < n - 1 ? '  Swipe' : ''}</div></div>`;
const station = (s, i, n) => { const [c, tc] = LINE[s.lines[0]]; const long = s.station.length > 14;
  const badges = s.lines.map((l) => `<div class="badge" style="color:${tc}"><i style="background:${LINE[l][0]};box-shadow:0 0 0 4px ${l === s.lines[0] ? tc : '#fff'}"></i>${LINE[l][2]} line</div>`).join('');
  return `<div class="band" style="background:${c};color:${tc}"><div class="badges">${badges}</div><div class="st${long ? ' l' : ''}">${s.station}</div><div class="sub">Next station is you</div></div>
<div class="strip"><div class="rail" style="background:${c}"></div>
<div class="dot" style="border-color:${c};top:40px"></div><div class="gh" style="top:40px"><b>Previous</b>${s.prev}</div>
<div class="dot cur" style="border-color:${c};top:250px"></div><div class="t" style="top:145px"><h2>${s.title}</h2><p>${s.body}</p></div>
<div class="dot" style="border-color:${c};top:600px"></div><div class="gh" style="top:588px"><b>${s.next === 'End of the line' ? 'Terminates' : 'Next'}</b>${s.next}</div></div>${foot(i, n)}`; };
const cover = (i, n) => `<div class="map"><svg width="1080" height="1350" viewBox="0 0 1080 1350"><g transform="translate(300 60) scale(.5) translate(-60 -140)" fill="none" stroke-width="34" stroke-linecap="round" stroke-linejoin="round">
<path d="M120 1120L120 700L380 440L380 200L760 200" stroke="${LINE.blue[0]}"/><path d="M960 1150L960 780L700 520L700 330L300 330" stroke="${LINE.violet[0]}"/><path d="M60 600L430 600L430 900L800 900L1020 700" stroke="${LINE.red[0]}"/><path d="M540 140L540 1200" stroke="${LINE.yellow[0]}"/><path d="M180 1000L540 760L940 1000" stroke="${LINE.magenta[0]}"/></g>
<g transform="translate(300 60) scale(.5) translate(-60 -140)" fill="#fff" stroke="#14181d" stroke-width="12">${[[540,600],[540,330],[430,600],[540,900],[540,760],[380,330],[700,520],[120,700]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="24"/>`).join('')}</g></svg></div>
<div style="position:absolute;left:70px;right:70px;top:700px;background:#14181d;color:#fff;border-radius:34px;padding:60px 64px;box-shadow:0 30px 70px rgba(0,0,0,.25)"><div style="font:700 26px 'In';letter-spacing:.16em;text-transform:uppercase;color:#f4c20d">Dilli Metro edition</div><div style="font:800 92px/1.02 'In';letter-spacing:-.025em;margin-top:26px">If Delhi Metro stations were <span style="color:#f4c20d">people</span></div><div style="font:600 40px 'In';margin-top:30px;color:#b8c0c8">Which station are you? Swipe.</div></div>${foot(i, n)}`;
const cta = (i, n) => `<div style="position:absolute;inset:0;background:#0f6b3a;color:#fff"><div style="position:absolute;left:90px;right:90px;top:200px"><div style="display:inline-block;background:#fff;color:#0f6b3a;font:800 34px 'In';letter-spacing:.14em;text-transform:uppercase;padding:18px 36px;border-radius:14px">Exit</div><div style="font:800 118px/1.02 'In';letter-spacing:-.03em;margin-top:60px">Every line needs people who <span style="color:#f4c20d">show up.</span></div><div style="font:400 44px/1.4 'In';margin-top:40px;color:#d4efe0">Plans with people who show up. Padel, cafes, quiz nights, treks. Delhi NCR.</div><div style="display:inline-flex;align-items:center;gap:26px;margin-top:70px;background:#f4c20d;color:#14181d;font:800 44px 'In';padding:32px 56px;border-radius:999px">Apply at the link in bio <span style="font-size:56px">→</span></div><div style="font:600 36px 'In';margin-top:36px;color:#d4efe0">thesemicircle.in</div></div></div>${foot(i, n, true)}`;
(async () => {
  const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'metro.json'), 'utf8')); const out = path.join(__dirname, process.argv[2] || 'batch-5'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } }); const n = spec.slides.length;
  for (let i = 0; i < n; i++) { const s = spec.slides[i]; const body = s.type === 'cover' ? cover(i, n) : s.type === 'cta' ? cta(i, n) : station(s, i, n);
    const f = path.join(out, '.t.html'); fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`); await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(100); await pg.screenshot({ path: path.join(out, `${spec.id}-${i + 1}.png`) }); }
  fs.rmSync(path.join(out, '.t.html'), { force: true }); await b.close(); console.log('done');
})();

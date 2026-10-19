// Builds Instagram post images (1080x1350) from posts.json using our fonts and colours.
// Run: node build.js   (needs playwright; fonts come from app/node_modules/@expo-google-fonts)
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const F = path.resolve(__dirname, '../../app/node_modules/@expo-google-fonts');
const font = (fam, file, w, st) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url('file://${F}/${file}')}`;
const css = `
${font('Fr', 'fraunces/500Medium/Fraunces_500Medium.ttf', 500, 'normal')}
${font('Fr', 'fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf', 400, 'italic')}
${font('In', 'inter/400Regular/Inter_400Regular.ttf', 400, 'normal')}
${font('In', 'inter/600SemiBold/Inter_600SemiBold.ttf', 600, 'normal')}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;position:relative;overflow:hidden;font-family:'In',sans-serif}
.dark{background:#211c16;color:#f4efe4;--gold:#b6935e;--dim:#9c9384}
.light{background:#f4efe4;color:#211c16;--gold:#8a6a38;--dim:#6b665e}
.terra{background:#c4623f;color:#fff;--gold:#ffd9c7;--dim:#ffe9dd}
.sage{background:#8fa58a;color:#12210f;--gold:#12210f;--dim:#25402a}
.mus{background:#d9a441;color:#1b1a18;--gold:#1b1a18;--dim:#4a3b22}
.gold{background:#b6935e;color:#211c16;--gold:#211c16;--dim:#4a3b22}
.wrap{position:absolute;inset:0;padding:110px 96px 150px;display:flex;flex-direction:column;justify-content:center}
.kick{font:600 26px 'In';letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:44px}
h1{hyphens:none;font:500 112px/1.04 'Fr';letter-spacing:-.025em}
h1 i,h2 i{font-style:italic;font-weight:400}
h1.m{font-size:92px}h1.s{font-size:76px;line-height:1.1}
p.b{font:400 40px/1.5 'In';color:var(--dim);margin-top:48px;max-width:820px}
ul.l{list-style:none;padding:0;margin-top:10px}
ul.l li{font:500 74px/1 'Fr';padding:30px 0;border-bottom:2px solid rgba(128,118,100,.35);display:flex;justify-content:space-between;align-items:baseline}
ul.l li span{font:400 34px 'In';color:var(--dim);margin-left:30px;text-align:right}
.big{font:500 330px/1 'Fr';color:var(--gold);letter-spacing:-.04em}
.foot{position:absolute;left:96px;right:96px;bottom:72px;display:flex;justify-content:space-between;align-items:center;font:600 24px 'In';letter-spacing:.06em;color:var(--dim)}
.foot .br{display:flex;align-items:center;gap:16px;font:500 32px 'Fr';letter-spacing:0;color:inherit}
.foot svg{width:46px;height:28px}
.tier li{display:flex;justify-content:flex-start;align-items:center;gap:36px}
.tier li b{flex:none;width:96px;height:96px;border-radius:50%;background:var(--gold);color:#211c16;display:grid;place-items:center;font:500 54px 'Fr'}
.tier li span{margin-left:auto}
body.reel{width:1080px;height:1920px}
.reel .wrap{padding:200px 90px 220px;justify-content:center}
.reel .ln{font:500 92px/1.12 'Fr';letter-spacing:-.02em;margin-bottom:56px;transition:none}
.reel .ln i{font-style:italic;font-weight:400}
.reel .ln.old{opacity:.32}
.reel .ln.end{font-size:104px}
.reel .foot{bottom:110px}
.pill{display:inline-block;margin-top:56px;background:var(--gold);color:#211c16;font:600 40px 'In';padding:30px 56px;border-radius:999px}
.url{font:500 36px 'Fr';font-style:italic;color:var(--dim);margin-top:34px}
.gold .pill{background:#211c16;color:#f4efe4}
.num{font:500 250px/1 'Fr';color:var(--gold);letter-spacing:-.05em;margin-bottom:6px}
.chip{display:inline-block;background:var(--gold);color:#211c16;font:600 30px 'In';padding:14px 30px;border-radius:999px;margin-top:40px}
.light .chip{color:#f4efe4}.terra .chip{color:#8f3f25}.sage .chip{color:#e6efe3}.mus .chip{color:#f4efe4}
.meta{font:600 28px 'In';letter-spacing:.12em;text-transform:uppercase;color:var(--dim);margin-top:34px}
.flag{width:150px;height:150px;margin-bottom:30px;color:#d4452d}
.sw{font:600 24px 'In';letter-spacing:.14em;text-transform:uppercase}
`;
const mark = '<svg viewBox="0 0 40 24"><path d="M4,20 A16,16 0 0 1 36,20 L4,20 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>';
const html = (s, i, n) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body class="${s.theme || 'dark'}">
<div class="wrap">${s.kicker ? `<div class="kick">${s.kicker}</div>` : ''}${s.flag ? '<svg class="flag" viewBox="0 0 40 40"><path d="M10 4v32" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M10 6h22l-5 8 5 8H10z" fill="currentColor"/></svg>' : ''}${s.num ? `<div class="num">${s.num}</div>` : ''}${s.big ? `<div class="big">${s.big}</div>` : ''}${s.h ? `<h1 class="${s.size || ''}">${s.h}</h1>` : ''}${s.list ? `<ul class="l${s.tier ? ' tier' : ''}">${s.list.map(([a, b]) => s.tier ? `<li><b>${a}</b><span>${b}</span></li>` : `<li>${a}${b ? `<span>${b}</span>` : ''}</li>`).join('')}</ul>` : ''}${s.p ? `<p class="b">${s.p}</p>` : ''}${s.chip ? `<div><span class="chip">${s.chip}</span></div>` : ''}${s.meta ? `<div class="meta">${s.meta}</div>` : ''}${s.pill ? `<div><span class="pill">${s.pill}</span></div>` : ''}${s.url ? `<div class="url">${s.url}</div>` : ''}</div>
<div class="foot"><div class="br">${mark}<span>The Semi Circle</span></div><div class="sw">${n > 1 ? (i < n - 1 ? `${i + 1} / ${n}  Swipe` : `${i + 1} / ${n}`) : ''}</div></div></body></html>`;
const reelHtml = (r, k) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body class="reel ${r.theme || 'dark'}">
<div class="wrap">${r.kicker ? `<div class="kick">${r.kicker}</div>` : ''}${r.lines.slice(0, k + 1).map((l, j) => `<div class="ln${j < k ? ' old' : ''}${r.end && j === r.lines.length - 1 ? ' end' : ''}">${l}</div>`).join('')}</div>
<div class="foot"><div class="br">${mark}<span>The Semi Circle</span></div><div class="sw"></div></div></body></html>`;
(async () => {
  const posts = JSON.parse(fs.readFileSync(path.join(__dirname, process.argv[3] || 'posts.json'), 'utf8'));
  const out = path.join(__dirname, process.argv[2] || 'batch-1'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const { execSync } = require('child_process');
  for (const p of posts.filter((x) => x.reel)) {
    const pr = await b.newPage({ viewport: { width: 1080, height: 1920 } }); const dir = path.join(out, '.frames-' + p.id); fs.mkdirSync(dir, { recursive: true });
    for (let k = 0; k < p.lines.length; k++) { const tmp = path.join(out, '.tmp.html'); fs.writeFileSync(tmp, reelHtml(p, k)); await pr.goto('file://' + tmp); await pr.evaluate(() => document.fonts.ready); await pr.waitForTimeout(120); await pr.screenshot({ path: path.join(dir, `f${k}.png`) }); }
    await pr.close();
    // each line holds for 2.2s with a 0.35s crossfade; last frame holds longer
    const n = p.lines.length, hold = 2.2, fade = 0.35;
    const inputs = Array.from({ length: n }, (_, k) => `-loop 1 -t ${k === n - 1 ? hold + 1.6 : hold + fade} -i ${dir}/f${k}.png`).join(' ');
    let chain = '', last = '[0]';
    for (let k = 1; k < n; k++) { chain += `${last}[${k}]xfade=transition=fade:duration=${fade}:offset=${(hold * k).toFixed(2)}[v${k}];`; last = `[v${k}]`; }
    execSync(`ffmpeg -y -loglevel error ${inputs} -filter_complex "${chain.slice(0, -1) || '[0]null[v]'}" -map "${last}" -r 30 -pix_fmt yuv420p -c:v libx264 -crf 18 ${path.join(out, p.id + '.mp4')}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  for (const p of posts.filter((x) => !x.reel)) for (let i = 0; i < p.slides.length; i++) {
    const tmp = path.join(out, '.tmp.html'); fs.writeFileSync(tmp, html(p.slides[i], i, p.slides.length)); await pg.goto('file://' + tmp); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(150);
    await pg.screenshot({ path: path.join(out, `${p.id}${p.slides.length > 1 ? '-' + (i + 1) : ''}.png`) });
  }
  await b.close(); fs.rmSync(path.join(out, '.tmp.html'), { force: true }); console.log('done');
})();

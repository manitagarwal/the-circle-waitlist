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
.gold{background:#b6935e;color:#211c16;--gold:#211c16;--dim:#4a3b22}
.wrap{position:absolute;inset:0;padding:110px 96px 150px;display:flex;flex-direction:column;justify-content:center}
.kick{font:600 26px 'In';letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:44px}
h1{font:500 112px/1.04 'Fr';letter-spacing:-.025em}
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
.sw{font:600 24px 'In';letter-spacing:.14em;text-transform:uppercase}
`;
const mark = '<svg viewBox="0 0 40 24"><path d="M4,20 A16,16 0 0 1 36,20 L4,20 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>';
const html = (s, i, n) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body class="${s.theme || 'dark'}">
<div class="wrap">${s.kicker ? `<div class="kick">${s.kicker}</div>` : ''}${s.big ? `<div class="big">${s.big}</div>` : ''}${s.h ? `<h1 class="${s.size || ''}">${s.h}</h1>` : ''}${s.list ? `<ul class="l">${s.list.map(([a, b]) => `<li>${a}${b ? `<span>${b}</span>` : ''}</li>`).join('')}</ul>` : ''}${s.p ? `<p class="b">${s.p}</p>` : ''}</div>
<div class="foot"><div class="br">${mark}<span>The Semi Circle</span></div><div class="sw">${n > 1 ? (i < n - 1 ? `${i + 1} / ${n}  Swipe` : `${i + 1} / ${n}`) : ''}</div></div></body></html>`;
(async () => {
  const posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts.json'), 'utf8'));
  const out = path.join(__dirname, process.argv[2] || 'batch-1'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const p of posts) for (let i = 0; i < p.slides.length; i++) {
    const tmp = path.join(out, '.tmp.html'); fs.writeFileSync(tmp, html(p.slides[i], i, p.slides.length)); await pg.goto('file://' + tmp); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(150);
    await pg.screenshot({ path: path.join(out, `${p.id}${p.slides.length > 1 ? '-' + (i + 1) : ''}.png`) });
  }
  await b.close(); fs.rmSync(path.join(out, '.tmp.html'), { force: true }); console.log('done');
})();

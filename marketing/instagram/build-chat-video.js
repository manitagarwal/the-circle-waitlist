// "Group chat, live" reel: messages pop in on the beat. Run: node build-chat-video.js groupchat
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const F = path.resolve(__dirname, '../../app/node_modules/@expo-google-fonts');
const ff = (fam, file, w, st) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url('file://${F}/${file}')}`;
const M = '<svg viewBox="0 0 40 24"><path d="M4,20 A16,16 0 0 1 36,20 L4,20 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>';
const COL = { Isha: '#8a6a38', Rohan: '#c4623f', Meera: '#4d6a4f', Kabir: '#5a6fa3', Aman: '#a8553c' };
const css = `${ff('Fr','fraunces/500Medium/Fraunces_500Medium.ttf',500,'normal')}${ff('Fr','fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf',400,'italic')}${ff('In','inter/400Regular/Inter_400Regular.ttf',400,'normal')}${ff('In','inter/600SemiBold/Inter_600SemiBold.ttf',600,'normal')}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:#e9e4d6;font-family:'In';position:relative;overflow:hidden;color:#1b1a18}
.hd{position:absolute;top:0;left:0;right:0;height:250px;background:#fffdf8;border-bottom:2px solid #ddd5c1;padding:100px 60px 0;display:flex;align-items:center;gap:30px;z-index:5}
.av{width:104px;height:104px;border-radius:50%;background:#211c16;color:#b6935e;display:grid;place-items:center;flex:none}.av svg{width:62px;height:38px}
.hd b{font:600 48px 'In';display:block}.hd span{font:400 32px 'In';color:#6b665e}
.feed{position:absolute;top:250px;left:0;right:0;bottom:230px;display:flex;flex-direction:column;justify-content:flex-end;padding:0 50px 30px;overflow:hidden}
.row{display:flex;gap:22px;margin-top:22px;align-items:flex-end}.row.me{justify-content:flex-end}
.pf{flex:none;width:76px;height:76px;border-radius:50%;color:#fff;display:grid;place-items:center;font:600 34px 'In'}
.m{max-width:700px;background:#fffdf8;border-radius:12px 44px 44px 44px;padding:26px 38px;font:400 52px/1.22 'In'}
.m small{display:block;font:600 30px 'In';margin-bottom:6px}
.me .m{background:#d9c58f;border-radius:44px 12px 44px 44px}
.pop{transform:scale(.9);opacity:.6;transform-origin:left bottom}.me .pop{transform-origin:right bottom}
.dv{align-self:center;margin-top:34px;background:rgba(33,28,22,.82);color:#f4efe4;font:600 34px 'In';padding:16px 36px;border-radius:999px;letter-spacing:.04em}
.poll{width:760px;background:#fffdf8;border-radius:12px 44px 44px 44px;padding:30px 38px}
.poll small{font:600 28px 'In';color:#8a6a38;letter-spacing:.12em;text-transform:uppercase}.poll h4{font:500 50px 'Fr';margin:6px 0 16px}
.poll div.o{display:flex;justify-content:space-between;font:400 44px 'In';padding:14px 0;border-top:2px solid #eee7d6}.poll div.o em{font-style:normal;color:#8b8372}
.in{position:absolute;left:0;right:0;bottom:0;height:230px;background:#fffdf8;border-top:2px solid #ddd5c1;padding:50px 50px}
.in div{height:110px;border-radius:55px;background:#efe9db;font:400 42px/110px 'In';color:#8b8372;padding-left:50px}
.top{position:absolute;top:250px;left:0;right:0;height:140px;background:linear-gradient(#e9e4d6,rgba(233,228,214,0));z-index:4}
`;
const bub = (m, pop) => m.div ? `<div class="dv">${m.div}</div>` : m.poll
  ? `<div class="row"><div class="pf" style="background:${COL.Isha}">I</div><div class="poll${pop ? ' pop' : ''}"><small>Poll</small><h4>What time?</h4><div class="o"><span>11 am</span><em>0 votes</em></div><div class="o"><span>12 pm</span><em>0 votes</em></div><div class="o"><span>1 pm</span><em>0 votes</em></div></div></div>`
  : m.w === 'Isha' ? `<div class="row me"><div class="m${pop ? ' pop' : ''}">${m.t}</div></div>`
  : `<div class="row"><div class="pf" style="background:${COL[m.w]}">${m.w[0]}</div><div class="m${pop ? ' pop' : ''}"><small style="color:${COL[m.w]}">${m.w}</small>${m.t}</div></div>`;
const page = (msgs, upto, pop) => `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="hd"><div class="av">${M}</div><div><b>Sunday plan</b><span>5 members</span></div></div><div class="top"></div><div class="feed">${msgs.slice(0, upto + 1).map((m, i) => bub(m, pop && i === upto)).join('')}</div><div class="in"><div>Message</div></div></body></html>`;
const endPage = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
body{background:#211c16;color:#f4efe4}.c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 90px}
.c svg{width:300px;height:180px;color:#b6935e;margin-bottom:70px}.c h1{font:500 112px/1.05 'Fr';letter-spacing:-.03em}.c h1 i{font-weight:400}.c p{font:400 46px/1.35 'In';color:#9c9384;margin-top:50px}
.pill{margin-top:64px;background:#b6935e;color:#211c16;font:600 44px 'In';padding:30px 62px;border-radius:999px}.u{font:italic 400 40px 'Fr';color:#9c9384;margin-top:34px}
</style></head><body><div class="c">${M}<h1>Every group chat needs the friend who <i>shows up.</i></h1><p>Plans with people who show up. Delhi NCR.</p><div class="pill">Apply at the link in bio</div><div class="u">thesemicircle.in</div></div></body></html>`;
(async () => {
  const name = process.argv[2] || 'groupchat'; const dir = path.join(__dirname, 'video'); const spec = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8'));
  const tmp = path.join(dir, '.' + name); fs.mkdirSync(tmp, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const shot = async (h, f) => { fs.writeFileSync(tmp + '/t.html', h); await pg.goto('file://' + tmp + '/t.html'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(60); await pg.screenshot({ path: f }); };
  const seq = []; let t = 0; const events = [];
  for (let i = 0; i < spec.msgs.length; i++) {
    const m = spec.msgs[i], d = m.u * spec.u, popD = Math.min(0.07, d / 3);
    await shot(page(spec.msgs, i, true), `${tmp}/p${i}.png`); await shot(page(spec.msgs, i, false), `${tmp}/s${i}.png`);
    seq.push([`p${i}.png`, popD], [`s${i}.png`, d - popD]); events.push({ t, k: m.div ? 'hit' : m.w === 'Isha' || m.poll ? 'popLow' : 'pop', i }); t += d;
  }
  await shot(endPage, `${tmp}/end.png`); events.push({ t, k: 'end' }); const endD = spec.end.u * spec.u; seq.push(['end.png', endD]); t += endD;
  await b.close();
  fs.writeFileSync(tmp + '/list.txt', seq.map(([f, d]) => `file '${f}'\nduration ${d.toFixed(4)}`).join('\n') + `\nfile 'end.png'`);
  fs.writeFileSync(tmp + '/events.json', JSON.stringify({ events, total: t, u: spec.u }));
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${tmp}/list.txt -vf "fps=30,format=yuv420p" -c:v libx264 -crf 17 ${tmp}/silent.mp4`);
  console.log('frames done', t.toFixed(2), 's');
})();

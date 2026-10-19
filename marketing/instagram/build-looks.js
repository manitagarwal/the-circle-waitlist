// One-off "look" templates for Instagram posts (notification stack, billboard, chat, notes, poll). Run: node build-looks.js <outdir>
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const F = path.resolve(__dirname, '../../app/node_modules/@expo-google-fonts');
const ff = (fam, file, w, st) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url('file://${F}/${file}')}`;
const base = `${ff('Fr','fraunces/500Medium/Fraunces_500Medium.ttf',500,'normal')}${ff('Fr','fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf',400,'italic')}${ff('In','inter/400Regular/Inter_400Regular.ttf',400,'normal')}${ff('In','inter/600SemiBold/Inter_600SemiBold.ttf',600,'normal')}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1350px;position:relative;overflow:hidden;font-family:'In',sans-serif}
.mark{position:absolute;left:80px;bottom:64px;display:flex;align-items:center;gap:16px;font:500 32px 'Fr'}.mark svg{width:46px;height:28px}`;
const M = '<svg viewBox="0 0 40 24"><path d="M4,20 A16,16 0 0 1 36,20 L4,20 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>';
const brand = (c) => `<div class="mark" style="color:${c}">${M}<span>The Semi Circle</span></div>`;
const L = {};
// 1. lock screen notifications
L['notifications'] = `<style>${base}
body{background:linear-gradient(160deg,#c4623f,#8f3f25);color:#fff}
.time{position:absolute;top:110px;left:0;right:0;text-align:center;font:600 150px 'In';letter-spacing:-.04em;opacity:.95}
.date{position:absolute;top:80px;left:0;right:0;text-align:center;font:500 36px 'In';opacity:.85}
.stack{position:absolute;top:330px;left:70px;right:70px}
.n{background:rgba(255,255,255,.88);color:#1b1a18;border-radius:44px;padding:34px 38px;margin-bottom:26px;display:flex;gap:28px;align-items:flex-start;box-shadow:0 12px 40px rgba(0,0,0,.18)}
.ic{flex:none;width:92px;height:92px;border-radius:24px;background:#211c16;color:#b6935e;display:grid;place-items:center}.ic svg{width:56px;height:34px}
.n b{display:block;font:600 34px 'In'}.n p{font:400 36px/1.3 'In';margin-top:6px;color:#2b2926}.n span{margin-left:auto;font:400 28px 'In';color:#6b665e;white-space:nowrap}
.tag{position:absolute;left:80px;right:80px;bottom:150px;font:400 40px/1.3 'Fr';font-style:italic}
</style><div class="date">Saturday</div><div class="time">8:05</div><div class="stack">
<div class="n"><div class="ic">${M}</div><div><b>Aman, Group chat</b><p>I’m 5 min away.</p></div><span>6:10 pm</span></div>
<div class="n"><div class="ic">${M}</div><div><b>Aman, Group chat</b><p>Slightly more than 5.</p></div><span>6:48 pm</span></div>
<div class="n"><div class="ic">${M}</div><div><b>Aman, Group chat</b><p>Aman is typing...</p></div><span>7:35 pm</span></div></div>
<div class="tag">Every group chat has an Aman.</div>${brand('#fff')}`;
// 2. billboard
L['billboard'] = `<style>${base}
body{background:#d9a441;color:#1b1a18}
.b{position:absolute;left:80px;right:80px;top:150px;font:500 190px/.98 'Fr';letter-spacing:-.04em}.b i{font-weight:400}
.rule{position:absolute;left:80px;right:80px;bottom:190px;height:6px;background:#1b1a18}
.sub{position:absolute;left:80px;bottom:240px;font:600 28px 'In';letter-spacing:.2em;text-transform:uppercase}
</style><div class="b">Saturday 7&nbsp;am is a <i>time.</i> We checked.</div><div class="sub">A public service announcement</div><div class="rule"></div>${brand('#1b1a18')}`;
// 3. chat screenshot
const bub = (t, me, who, seen) => `<div class="m ${me ? 'me' : ''}">${who ? `<small>${who}</small>` : ''}${t}${seen ? `<em>${seen}</em>` : ''}</div>`;
L['chat'] = `<style>${base}
body{background:#e9e4d6;color:#1b1a18}
.hd{position:absolute;top:0;left:0;right:0;height:210px;background:#fffdf8;border-bottom:2px solid #ddd5c1;padding:70px 60px;display:flex;align-items:center;gap:30px}
.av{width:96px;height:96px;border-radius:50%;background:#211c16;color:#b6935e;display:grid;place-items:center}.av svg{width:56px;height:34px}
.hd b{font:600 44px 'In';display:block}.hd span{font:400 30px 'In';color:#6b665e}
.feed{position:absolute;top:250px;left:60px;right:60px}
.m{max-width:760px;margin-bottom:22px;background:#fffdf8;border-radius:12px 44px 44px 44px;padding:30px 38px;font:400 44px/1.25 'In';box-shadow:0 2px 0 rgba(0,0,0,.06)}
.m small{display:block;font:600 28px 'In';color:#8a6a38;margin-bottom:6px}.m em{display:block;font:400 26px 'In';color:#8b8372;margin-top:10px;font-style:normal;text-align:right}
.m.me{margin-left:auto;background:#d9c58f;border-radius:44px 12px 44px 44px}
.note{text-align:center;font:400 34px 'In';color:#6b665e;margin:24px 0}
</style><div class="hd"><div class="av">${M}</div><div><b>Sunday plan</b><span>14 members</span></div></div><div class="feed">
${bub('Who is in for Sunday brunch?', true, '', 'Seen by 14')}
${bub('Maybe', false, 'Rohan')}
${bub('Let me check', false, 'Isha')}
${bub('Ok but where?', false, 'Kabir')}
${bub('Will confirm tonight', false, 'Meera')}
<div class="note">Aman left the group</div></div>${brand('#1b1a18').replace('bottom:64px','bottom:64px')}`;
// 4. notes app
L['notes'] = `<style>${base}
body{background:#f6e27a;color:#2a2418;background-image:repeating-linear-gradient(transparent 0 109px,rgba(120,90,20,.25) 109px 111px)}
.top{position:absolute;top:0;left:0;right:0;height:120px;background:#e8cf5b;display:flex;align-items:center;padding:0 70px;font:600 38px 'In'}
h2{position:absolute;top:170px;left:90px;right:70px;font:500 96px/1.05 'Fr';letter-spacing:-.02em}
ul{position:absolute;top:440px;left:90px;right:70px;list-style:none;padding:0}
li{font:400 64px/111px 'Fr';font-style:italic;white-space:nowrap}li:before{content:'';display:inline-block;width:40px;height:40px;border:4px solid #2a2418;border-radius:10px;margin-right:34px;vertical-align:-2px}
li.x{text-decoration:line-through;text-decoration-thickness:6px;opacity:.55}
li.last{font-style:normal;font-weight:500}
</style><div class="top">Notes</div><h2>Reasons I cancelled</h2><ul><li class="x">Traffic</li><li class="x">Headache</li><li class="x">Laundry</li><li class="x">Early meeting tomorrow</li><li class="x">Battery at 4 percent</li><li class="last">Just didn’t feel like it</li></ul>${brand('#2a2418')}`;
// 5. poll
L['poll'] = `<style>${base}
body{background:linear-gradient(170deg,#8fa58a,#4d6a4f);color:#fff}
.q{position:absolute;top:150px;left:80px;right:80px;font:500 116px/1.05 'Fr';letter-spacing:-.03em}.q i{font-weight:400}
.opt{position:absolute;left:80px;right:80px;height:190px;border-radius:50px;background:rgba(255,255,255,.18);border:3px solid rgba(255,255,255,.55);display:flex;align-items:center;padding:0 60px;font:600 64px 'In'}
.o1{top:560px}.o2{top:800px}
.cta{position:absolute;left:80px;right:80px;bottom:150px;font:400 40px/1.3 'In';opacity:.92}
</style><div class="q">Delhi or Gurgaon for a <i>Sunday plan?</i></div><div class="opt o1">Delhi</div><div class="opt o2">Gurgaon</div><div class="cta">Pick a side in the comments. Both sides will be wrong.</div>${brand('#fff')}`;
(async () => {
  const out = path.join(__dirname, process.argv[2] || 'looks'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const [k, body] of Object.entries(L)) { const f = path.join(out, '.t.html'); fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`); await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(150); await pg.screenshot({ path: path.join(out, k + '.png') }); }
  fs.rmSync(path.join(out, '.t.html'), { force: true }); await b.close(); console.log('done');
})();

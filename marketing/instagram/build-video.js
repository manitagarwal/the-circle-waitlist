// Fast-cut kinetic text video from video/<name>.json. Run: node build-video.js excuses
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const F = path.resolve(__dirname, '../../app/node_modules/@expo-google-fonts');
const ff = (fam, file, w, st) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url('file://${F}/${file}')}`;
const M = '<svg viewBox="0 0 40 24"><path d="M4,20 A16,16 0 0 1 36,20 L4,20 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>';
const html = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>${ff('Fr','fraunces/500Medium/Fraunces_500Medium.ttf',500,'normal')}${ff('Fr','fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf',400,'italic')}${ff('In','inter/600SemiBold/Inter_600SemiBold.ttf',600,'normal')}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:${c.bg};color:${c.fg};font-family:'In';position:relative;overflow:hidden}
.k{position:absolute;top:300px;left:90px;right:90px;font:600 38px 'In';letter-spacing:.22em;text-transform:uppercase;color:${c.acc}}
.h{position:absolute;left:90px;right:90px;top:50%;transform:translateY(-52%);font:500 ${c.end ? 150 : 148}px/1.02 'Fr';letter-spacing:-.035em}
.s{position:absolute;left:90px;right:90px;bottom:430px;font:400 56px/1.25 'Fr';font-style:italic;color:${c.acc}}
.m{position:absolute;left:90px;bottom:150px;display:flex;align-items:center;gap:18px;font:500 36px 'Fr';opacity:.9}.m svg{width:54px;height:33px}
.big{position:absolute;left:0;right:0;top:560px;display:flex;justify-content:center}.big svg{width:340px;height:204px}
</style></head><body><div class="k">${c.kick}</div>${c.end ? `<div class="big" style="color:${c.fg}">${M}</div>` : ''}<div class="h" style="${c.end ? 'top:900px;transform:none;text-align:center' : ''}">${c.h}</div><div class="s" style="${c.end ? 'text-align:center;bottom:480px' : ''}">${c.sub}</div>${c.end ? '' : `<div class="m">${M}<span>The Semi Circle</span></div>`}</body></html>`;
(async () => {
  const name = process.argv[2] || 'excuses'; const dir = path.join(__dirname, 'video'); const spec = JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8'));
  const tmp = path.join(dir, '.' + name); fs.mkdirSync(tmp, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let i = 0; i < spec.cards.length; i++) { fs.writeFileSync(tmp + '/t.html', html(spec.cards[i])); await pg.goto('file://' + tmp + '/t.html'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(100); await pg.screenshot({ path: `${tmp}/c${i}.png` }); }
  await b.close();
  // cut times for the beat track
  let t = 0; const cuts = spec.cards.map((c) => { const r = t; t += c.d; return r; }); fs.writeFileSync(tmp + '/cuts.json', JSON.stringify({ cuts, total: t }));
  // each card: slow punch-in zoom
  spec.cards.forEach((c, i) => execSync(`ffmpeg -y -loglevel error -loop 1 -i ${tmp}/c${i}.png -vf "zoompan=z='1+0.07*on/${Math.round(c.d * 30)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(c.d * 30)}:s=1080x1920:fps=30" -frames:v ${Math.round(c.d * 30)} -pix_fmt yuv420p -c:v libx264 -crf 17 ${tmp}/v${i}.mp4`));
  fs.writeFileSync(tmp + '/list.txt', spec.cards.map((c, i) => `file 'v${i}.mp4'`).join('\n'));
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${tmp}/list.txt -c copy ${tmp}/silent.mp4`);
  console.log('frames done', t.toFixed(2), 's');
})();

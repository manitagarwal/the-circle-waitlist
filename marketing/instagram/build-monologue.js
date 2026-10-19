// Monologue video: text lands on the voice. Run: node build-monologue.js <voice.mp3> <out.mp4>
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
const F = path.resolve(__dirname, '../../app/node_modules/@expo-google-fonts');
const ff = (fam, file, w, st) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:${st};src:url('file://${F}/${file}')}`;
const M = '<svg viewBox="0 0 40 24"><path d="M4,20 A16,16 0 0 1 36,20 L4,20 Z" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"/></svg>';
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'video/monologue.json'), 'utf8')); const [voice, out] = [process.argv[2], process.argv[3]];
const page = (pal, texts, big, mode) => {
  const size = (t) => big ? 190 : (t.replace(/<[^>]+>/g, '').length < 32 ? 124 : t.replace(/<[^>]+>/g, '').length < 62 ? 104 : 90);
  const body = mode === 'title' ? `<div class="t" style="font-size:128px;color:${pal.fg}">${spec.title}</div>` : mode === 'end' ? `<div class="end"><div class="m2" style="color:${pal.fg}">${M}</div><div class="n" style="color:${pal.fg}">The Semi Circle</div><div class="l" style="color:${pal.fg}">Plans with people who show up.</div><div class="k" style="color:${pal.fg}">Apply at the link in bio</div></div>`
    : texts.map((t, i) => `<div class="t" style="font-size:${size(t)}px;opacity:${i < texts.length - 1 ? .5 : 1}">${t}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${ff('Fr','fraunces/500Medium/Fraunces_500Medium.ttf',500,'normal')}${ff('Fr','fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf',400,'italic')}${ff('In','inter/600SemiBold/Inter_600SemiBold.ttf',600,'normal')}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:${pal.bg};color:${pal.fg};position:relative;overflow:hidden}
.w{position:absolute;left:96px;right:96px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:42px}
.t{font:500 100px/1.12 'Fr';letter-spacing:-.025em}.t i{font-weight:400;color:${pal.ac}}
.end{text-align:center;margin:0 auto}.m2 svg{width:260px;height:156px}.n{font:500 96px 'Fr';margin-top:50px}.l{font:italic 400 52px 'Fr';margin-top:30px;opacity:.85}.k{font:600 36px 'In';letter-spacing:.2em;text-transform:uppercase;margin-top:90px;opacity:.8}
.mk{position:absolute;left:96px;bottom:130px;display:flex;align-items:center;gap:16px;font:500 34px 'Fr';opacity:.55;color:${pal.fg}}.mk svg{width:50px;height:30px}
</style></head><body><div class="w">${mode === 'end' ? '' : ''}${body}</div>${mode === 'end' ? '' : `<div class="mk">${M}<span>The Semi Circle</span></div>`}</body></html>`;
};
(async () => {
  const lead = spec.lead, FADE = 0.3, tmp = path.join(__dirname, 'video/.mono'); fs.mkdirSync(tmp, { recursive: true });
  const states = []; // {t, pal, texts, big, mode}
  states.push({ t: -lead, pal: spec.palette.f, texts: [], mode: 'title' });
  spec.scenes.forEach((sc) => {
    const pal = sc.p === 'end' ? { bg: '#b6935e', fg: '#211c16', ac: '#211c16' } : spec.palette[sc.p];
    if (sc.p === 'end') { states.push({ t: sc.s, pal, texts: [], mode: 'end' }); return; }
    states.push({ t: sc.s, pal, texts: [], big: sc.big, mode: 'blank' });
    sc.items.forEach((it, i) => states.push({ t: i === 0 ? Math.max(sc.s, it[0] - 0.05) : it[0] - 0.05, pal, texts: sc.items.slice(0, i + 1).map((x) => x[1]), big: sc.big, mode: 'text' }));
  });
  // drop blank states that are immediately replaced
  const st = states.filter((s, i) => !(s.mode === 'blank' && states[i + 1] && Math.abs(states[i + 1].t - s.t) < 0.2));
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let i = 0; i < st.length; i++) { fs.writeFileSync(tmp + '/t.html', page(st[i].pal, st[i].texts, st[i].big, st[i].mode === 'text' || st[i].mode === 'blank' ? 'text' : st[i].mode)); await pg.goto('file://' + tmp + '/t.html'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(80); await pg.screenshot({ path: `${tmp}/s${i}.png` }); }
  await b.close();
  const total = spec.end + lead, starts = st.map((s) => s.t + lead); // shift so the title starts at 0
  const inputs = [], filt = [];
  st.forEach((s, i) => { const d = (i < st.length - 1 ? starts[i + 1] - starts[i] + FADE : total - starts[i]); inputs.push(`-loop 1 -framerate 30 -t ${d.toFixed(3)} -i ${tmp}/s${i}.png`); });
  let last = '[0:v]';
  for (let i = 1; i < st.length; i++) { const off = (starts[i] - FADE).toFixed(3); filt.push(`${last}[${i}:v]xfade=transition=fade:duration=${FADE}:offset=${off}[x${i}]`); last = `[x${i}]`; }
  fs.writeFileSync(tmp + '/filter.txt', filt.join(';'));
  execSync(`ffmpeg -y -loglevel error ${inputs.join(' ')} -filter_complex_script ${tmp}/filter.txt -map "${last}" -r 30 -pix_fmt yuv420p -c:v libx264 -crf 17 ${tmp}/video.mp4`);
  // music pad
  execSync(`python3 ${path.join(__dirname, 'video/pad.py')} ${total.toFixed(2)} ${tmp}/pad.wav`);
  execSync(`ffmpeg -y -loglevel error -i ${tmp}/video.mp4 -i ${voice} -i ${tmp}/pad.wav -filter_complex "[1:a]adelay=${Math.round(lead * 1000)}|${Math.round(lead * 1000)},volume=1.0[v];[2:a]volume=0.22[m];[v][m]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-16:TP=-1.5,atrim=0:${total.toFixed(2)}[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest ${out}`);
  console.log('built', total.toFixed(1), 's,', st.length, 'states');
})();

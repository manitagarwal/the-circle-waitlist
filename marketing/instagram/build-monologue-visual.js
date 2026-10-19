// Illustrated monologue video: scenes.html drawn frame by frame, mixed with the voice and a soft pad.
// Run: node build-monologue-visual.js <voice.mp3> <out.mp4> [fps]
const fs = require('fs'), path = require('path'), { execSync, spawn } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright');
(async () => {
  const [voice, out, fpsArg] = [process.argv[2], process.argv[3], process.argv[4]]; const fps = Number(fpsArg || 30);
  const tmp = path.join(__dirname, 'video/.vis'); fs.mkdirSync(tmp, { recursive: true });
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.join(__dirname, 'video/scenes.html')); await pg.evaluate(() => document.fonts.ready);
  const total = await pg.evaluate(() => window.TOTAL); const n = Math.round(total * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', tmp + '/video.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < n; i++) { await pg.evaluate((t) => window.render(t), i / fps); const buf = await pg.screenshot({ type: 'jpeg', quality: 92 }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); if (i % 200 === 0) console.log('frame', i, '/', n); }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await b.close();
  execSync(`python3 ${path.join(__dirname, 'video/pad.py')} ${total.toFixed(2)} ${tmp}/pad.wav`);
  execSync(`ffmpeg -y -loglevel error -i ${tmp}/video.mp4 -i ${voice} -i ${tmp}/pad.wav -filter_complex "[1:a]adelay=1600|1600,volume=1.0[v];[2:a]volume=0.22[m];[v][m]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-16:TP=-1.5,atrim=0:${total.toFixed(2)}[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest ${out}`);
  console.log('built', total.toFixed(1), 's');
})();

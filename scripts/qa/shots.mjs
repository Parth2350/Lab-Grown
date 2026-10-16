// Full-page screenshots for visual review:  node scripts/qa/shots.mjs <outDir> <path> [path...]   (QA_MOBILE=1 for a 390px phone)
import { launch } from './cdp.mjs';
import { BASE, TMP } from './env.mjs';

const [out, ...paths] = process.argv.slice(2);
const mobile = process.env.QA_MOBILE === '1';
const b = await launch({ profile: TMP + '/chrome-shots', port: mobile ? 9343 : 9342, mobile, width: 1440 });
try {
  for (const p of paths) {
    await b.goto(BASE + p, 3000);
    await b.eval(`window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 800)); window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 500)); return 1`);
    const h = Math.min(await b.eval(`return document.documentElement.scrollHeight`), Number(process.env.QA_MAX_H ?? 2600));
    const w = mobile ? 390 : 1440;
    const { data } = await b.send('Page.captureScreenshot', { format: 'jpeg', quality: 80, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: mobile ? 0.5 : 0.6 } });
    const { writeFileSync } = await import('node:fs');
    const file = `${out}/${(mobile ? 'm' : 'd') + (p.replace(/[^a-z0-9]+/gi, '_') || '_home')}.jpg`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(file, b.consoleErrors.splice(0).join(' / '));
  }
} finally {
  await b.close();
}

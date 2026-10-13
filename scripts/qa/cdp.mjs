// Minimal Chrome DevTools Protocol driver for QA (headless Chrome, real clicks & file chooser).
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9333, profile, width = 1366, height = 900, mobile = false } = {}) {
  mkdirSync(profile, { recursive: true });
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find((t) => t.type === 'page')) break; } catch {}
    await sleep(200);
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
    else if (msg.method) listeners.forEach((l) => l(msg));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const consoleErrors = [];
  listeners.push((m) => {
    if (m.method === 'Runtime.exceptionThrown') consoleErrors.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0, 300));
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push('console.error ' + m.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300));
  });
  await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable');
  if (mobile) await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  const api = {
    send,
    consoleErrors,
    /** subscribe to raw DevTools events, e.g. Network.responseReceived */
    on: (fn) => listeners.push(fn),
    async goto(url, settle = 1500) {
      const loaded = new Promise((r) => { const l = (m) => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(l), 1); r(); } }; listeners.push(l); });
      await send('Page.navigate', { url });
      // don't hang forever if a page never fires "load" (e.g. a stalled third-party request)
      await Promise.race([loaded, sleep(30000)]);
      await sleep(settle);
    },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
      return r.result.value;
    },
    async setFiles(selector, files) {
      const { root } = await send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
      if (!nodeId) throw new Error('no element ' + selector);
      await send('DOM.setFileInputFiles', { nodeId, files });
    },
    async waitFor(expr, timeout = 20000) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeout) { if (await api.eval(`return !!(${expr})`)) return true; await sleep(250); }
      return false;
    },
    async screenshot(path) {
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const { writeFileSync } = await import('node:fs');
      writeFileSync(path, Buffer.from(data, 'base64'));
    },
    async close() { try { ws.close(); } catch {} proc.kill(); },
  };
  return api;
}

// Check, screenshot and PDF (default: DIN A0) using the installed Chrome/Edge – no npm packages.
// Requires only Node ≥ 22 (built-in WebSocket/fetch) and Chrome, Chromium or Edge.
// Runs on Windows, macOS and Linux.
//
//   node nice2have-printer.mjs check             Check format, overflow, free space, images, fonts, errors
//   node nice2have-printer.mjs shot [file.png]   Check + screenshot (default: shot.png)
//   node nice2have-printer.mjs pdf  [file.pdf]   Check + PDF (default: canvas-a0.pdf)
//
// Set the browser path via the CHROME environment variable if needed.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Print errors as a short message instead of a stack trace
process.on('uncaughtException', (e) => {
  console.error(`!! ${e.message}`);
  process.exit(1);
});

const [cmd = 'shot', outArg] = process.argv.slice(2);
if (!['check', 'shot', 'pdf'].includes(cmd)) {
  console.log('Usage: node nice2have-printer.mjs check | shot [file.png] | pdf [file.pdf]');
  process.exit(1);
}

// Target format. Must match @page and .canvas in canvas.css (see claude.md, "Other DIN formats").
const FORMAT = { name: 'A0', w: 841, h: 1189 }; // mm, portrait

// Pixel size at 96 dpi (CSS pixels), rounded up so nothing gets cut off
const W = Math.ceil((FORMAT.w / 25.4) * 96), H = Math.ceil((FORMAT.h / 25.4) * 96);
const pageUrl = pathToFileURL(resolve('index.html')).href;

// ---------- Launch Chrome (Windows, macOS, Linux) ----------
function chromeCandidates() {
  if (process.platform === 'win32') {
    const pf = process.env.ProgramFiles ?? 'C:\\Program Files';
    const pf86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
    const local = process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local');
    return [
      join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ];
  }
  if (process.platform === 'darwin') {
    // App bundles in /Applications or ~/Applications; the executable has the same name as the app
    const apps = ['Google Chrome', 'Chromium', 'Microsoft Edge', 'Google Chrome Canary', 'Brave Browser'];
    return apps.flatMap((app) => [
      `/Applications/${app}.app/Contents/MacOS/${app}`,
      join(homedir(), 'Applications', `${app}.app`, 'Contents', 'MacOS', app),
    ]);
  }
  return ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']
    .flatMap((bin) => [`/usr/bin/${bin}`, `/usr/local/bin/${bin}`, `/snap/bin/${bin}`]);
}

function findChrome() {
  if (process.env.CHROME) {
    if (!existsSync(process.env.CHROME)) throw new Error(`CHROME does not point to a file: ${process.env.CHROME}`);
    return process.env.CHROME;
  }
  const found = chromeCandidates().find((p) => existsSync(p));
  if (!found) {
    const hint = process.platform === 'darwin'
      ? 'export CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"'
      : process.platform === 'win32'
        ? '$env:CHROME = "C:\\path\\to\\chrome.exe"'
        : 'export CHROME=/path/to/chrome';
    throw new Error(`Chrome/Edge not found. Set the path, e.g.:\n  ${hint}`);
  }
  return found;
}

const chromePath = findChrome();
const profile = mkdtempSync(join(tmpdir(), 'nice2have-printer-chrome-'));
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--no-first-run', '--no-default-browser-check',
  // macOS: don't trigger the keychain prompt; Linux: don't query the password store
  '--use-mock-keychain', '--password-store=basic',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const port = await new Promise((ok, fail) => {
  let log = '';
  const timer = setTimeout(() => fail(new Error(`Chrome did not respond (30 s):\n${log}`)), 30000);
  chrome.stderr.on('data', (d) => {
    log += d;
    const m = log.match(/DevTools listening on ws:\/\/[^:/]+:(\d+)\//);
    if (m) { clearTimeout(timer); ok(m[1]); }
  });
  chrome.on('error', (e) => { clearTimeout(timer); fail(e); });
  chrome.on('exit', (code) => { clearTimeout(timer); fail(new Error(`Chrome exited (${code}):\n${log}`)); });
}).catch((e) => {
  chrome.kill();
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  throw e;
});

// ---------- DevTools connection to the page ----------
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((ok) => ws.addEventListener('open', ok, { once: true }));

let nextId = 0;
const pending = new Map();
const listeners = new Map();
const problems = [];

ws.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id !== undefined) {
    const p = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? p.fail(new Error(msg.error.message)) : p.ok(msg.result);
  } else {
    listeners.get(msg.method)?.(msg.params);
  }
});

const send = (method, params = {}) =>
  new Promise((ok, fail) => {
    const id = ++nextId;
    pending.set(id, { ok, fail });
    ws.send(JSON.stringify({ id, method, params }));
  });
const once = (method) => new Promise((ok) => listeners.set(method, ok));

// Collect console errors, script errors and failed resource loads
listeners.set('Log.entryAdded', ({ entry }) => entry.level === 'error' && problems.push(`${entry.text} ${entry.url ?? ''}`));
listeners.set('Runtime.exceptionThrown', ({ exceptionDetails: e }) => problems.push(e.exception?.description ?? e.text));
listeners.set('Runtime.consoleAPICalled', ({ type, args }) => type === 'error' && problems.push(args.map((a) => a.value ?? a.description).join(' ')));

try {
  await Promise.all([send('Page.enable'), send('Runtime.enable'), send('Log.enable')]);
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: pageUrl });
  await loaded;

  // ---------- Checks in the browser ----------
  const { result } = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `(async () => {
      await document.fonts.ready;
      const mm = (v) => Math.round(v / 96 * 25.4 * 10) / 10;
      const name = (el) => el.tagName.toLowerCase() + [...el.classList].map((c) => '.' + c).join('');
      const canvasEl = document.querySelector('.canvas');
      const canvas = canvasEl.getBoundingClientRect();
      const all = [canvasEl, ...canvasEl.querySelectorAll('*')];

      // Content clipped inside an element with overflow: hidden/clip
      const clipped = all.filter((el) => {
        const cs = getComputedStyle(el);
        return /hidden|clip/.test(cs.overflowX + cs.overflowY) &&
          (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
      }).map((el) => name(el) + ' (+' + mm(el.scrollHeight - el.clientHeight) + ' mm)');

      // Elements extending past the canvas edge (outermost only, not every child)
      const out = new Set(all.slice(1).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width && (r.bottom > canvas.bottom + 1 || r.right > canvas.right + 1 || r.left < canvas.left - 1 || r.top < canvas.top - 1);
      }));
      const outside = [...out].filter((el) => !out.has(el.parentElement)).map(name);

      // Free space in areas with data-measure: inner bottom edge minus bottom of the last child
      const free = [...document.querySelectorAll('[data-measure]')].map((el) => {
        const inner = el.getBoundingClientRect().bottom - parseFloat(getComputedStyle(el).paddingBottom);
        const kids = [...el.children].filter((c) => getComputedStyle(c).position !== 'absolute');
        const bottom = Math.max(...kids.map((c) => c.getBoundingClientRect().bottom));
        return el.dataset.measure + ': ' + mm(inner - bottom) + ' mm';
      });

      return {
        w: mm(canvas.width), h: mm(canvas.height), clipped, outside, free,
        missing: [...document.images].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute('src')),
        fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replaceAll('"', '') + ' ' + f.weight),
      };
    })()`,
  });
  const r = result.value;
  const formatOk = Math.abs(r.w - FORMAT.w) < 0.5 && Math.abs(r.h - FORMAT.h) < 0.5;
  console.log(`Format:      ${r.w} × ${r.h} mm ${formatOk ? `OK (${FORMAT.name})` : `!! WRONG (expected ${FORMAT.name}: ${FORMAT.w} × ${FORMAT.h} mm)`}`);
  if (r.free.length) console.log(`Free space:  ${r.free.join(', ')}`);
  console.log(`Fonts:       ${r.fonts.join(', ') || '!! no web font loaded'}`);
  if (r.clipped.length) console.log(`!! Clipped: ${r.clipped.join(', ')}`);
  if (r.outside.length) console.log(`!! Past the edge: ${r.outside.join(', ')}`);
  if (r.missing.length) console.log(`!! Missing images: ${r.missing.join(', ')}`);
  for (const p of problems) console.log(`!! Error: ${p}`);

  // ---------- Output ----------
  if (cmd === 'shot') {
    const out = resolve(outArg ?? 'shot.png');
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    writeFileSync(out, Buffer.from(data, 'base64'));
    console.log(`Screenshot:  ${out} (${W} × ${H} px)`);
  }

  if (cmd === 'pdf') {
    const out = resolve(outArg ?? `canvas-${FORMAT.name.toLowerCase()}.pdf`);
    const { data } = await send('Page.printToPDF', {
      paperWidth: FORMAT.w / 25.4,
      paperHeight: FORMAT.h / 25.4,
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      printBackground: true,
      preferCSSPageSize: true,
    });
    const pdf = Buffer.from(data, 'base64');
    writeFileSync(out, pdf);
    const text = pdf.toString('latin1');
    const pages = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    const box = text.match(/\/MediaBox\s*\[\s*([\d.\s]+)\]/)?.[1].trim().split(/\s+/).map(Number) ?? [];
    const size = box.length === 4 ? `${(box[2] / 72 * 25.4).toFixed(1)} × ${(box[3] / 72 * 25.4).toFixed(1)} mm` : '?';
    console.log(`PDF:         ${out} (${Math.round(pdf.length / 1024)} KB, ${pages} page(s), MediaBox [${box.join(' ')}] = ${size})`);
    if (pages !== 1) console.log('!! PDF does not have exactly 1 page');
    // Chrome rounds to pixels; more than 1 mm deviation means @page in canvas.css does not match FORMAT
    if (box.length === 4 && (Math.abs(box[2] / 72 * 25.4 - FORMAT.w) > 1 || Math.abs(box[3] / 72 * 25.4 - FORMAT.h) > 1)) {
      console.log(`!! PDF page differs from ${FORMAT.name} (${FORMAT.w} × ${FORMAT.h} mm) – check @page in canvas.css`);
    }
  }
} finally {
  ws.close();
  chrome.kill();
  await new Promise((ok) => (chrome.exitCode !== null ? ok() : chrome.once('exit', ok)));
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

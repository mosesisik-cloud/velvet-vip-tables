// Refs #129. Real app + HTTP server + native Chromium adapter + SQLite journal.
// ONLY the supplier boundary is simulated. Never runs against a remote target.
// Preload mode instruments Chromium's network boundary, NOT the adapter/state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const restaurantId = 'curated-STO-zink-italian-cuisine';
const venue = JSON.parse(fs.readFileSync(path.join(root, 'api/bokabord-restaurants.json')))[restaurantId];
const saveUrl = 'https://app.bokabord.se/reservation/api/booking/saveBooking';
const date = '2030-01-15';
const childMode = process.env.VELVET_INTEGRATED_SUPPLIER_FIXTURE === 'child';

function supplierHtml() {
  return `<!doctype html><html><meta charset="utf-8"><body ng-app="fixture">
<style>body{font:16px Arial;margin:20px}button,input,textarea{box-sizing:border-box;min-height:40px;width:260px;display:block;margin:8px 0}button{background:#eee}h1,h2{font-size:22px}#party{position:absolute;top:90px}#date{position:absolute;top:150px}#slot{position:absolute;top:210px}</style>
<main id="screen"></main><script>
const q={hash:${JSON.stringify(venue.hash)},mealid:9778,date:'',time:'',amount:0,firstname:'',lastname:'',email:'',phone:'',comment:'',products:[],waitlist:false,giftcard:null,linked_meals:[],bookingid:null,terms:{general:true,restaurant:false,bokabord:false}};
const model={meal:{bullets:{},mandatory_products:false},getQuery:()=>q};
window.angular={element:()=>({injector:()=>({get:key=>key==='Booking'?model:key==='$http'?{pendingRequests:[]}:{$$phase:false}}),scope:()=>({isAjaxRequest:()=>false})})};
const screen=document.querySelector('#screen');
screen.innerHTML='<h1>Zink FIXTURE — no real booking</h1><button id="party">2 gäster</button><button id="date">2030-01-15</button><button id="slot" hidden>19:00 TESTDATA</button>';
document.querySelector('#party').onclick=()=>{q.amount=2;document.querySelector('#party').textContent='2 gäster valda';};
document.querySelector('#date').onclick=async()=>{q.date='2030-01-15';const r=await fetch('/reservation/api/booking/getTimes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:q.date,amount:q.amount,hash:q.hash})});const data=await r.json();document.querySelector('#slot').hidden=!data.times.includes('19:00');};
document.querySelector('#slot').onclick=()=>{q.time='19:00';contact();};
function contact(){screen.innerHTML='<h2>Kontaktuppgifter</h2><p>FIXTURE supplier form</p>'+['firstname','lastname','email','phone'].map(n=>'<label>'+n+'<input name="'+n+'" value=""></label>').join('')+'<textarea ng-model="booking.comment"></textarea><button id="next">Nästa</button>';
 for(const input of document.querySelectorAll('input,textarea'))input.oninput=()=>{q[input.name||'comment']=input.value;};
 document.querySelector('#next').onclick=()=>{screen.innerHTML='<h2>Kontrollera din bokning</h2><p>FIXTURE '+q.date+' '+q.time+' '+q.amount+' guests</p><button id="final">Slutför bokningen</button>';document.querySelector('#final').onclick=async()=>{try{const response=await fetch(${JSON.stringify(saveUrl)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(q)});await response.json();history.replaceState({},'', '/reservation/booking/fixture');screen.innerHTML='<h2>FIXTURE response received</h2>';}catch{screen.innerHTML='<h2>FIXTURE network interrupted</h2>';}};};}
</script></body></html>`;
}

if (childMode) {
  // Refuse to act as an arbitrary server preload outside this spawned fixture.
  assert.equal(typeof process.send, 'function');
  assert.ok(process.env.VELVET_PLAYWRIGHT_DB?.startsWith(process.env.VELVET_TEST_DIRECTORY + path.sep));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (address, options) => {
    const url = new URL(typeof address === 'string' || address instanceof URL ? address : address.url);
    if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
      process.send?.({ kind: 'blocked-node-network', host: url.hostname });
      return Promise.reject(new Error('fixture_network_denied'));
    }
    return originalFetch(address, options);
  };
  const launch = chromium.launch.bind(chromium);
  chromium.launch = async options => {
    const browser = await launch(options);
    const newContext = browser.newContext.bind(browser);
    browser.newContext = async options => {
      const context = await newContext({ ...options, serviceWorkers: 'block' });
      const route = context.route.bind(context);
      await context.routeWebSocket('**/*', socket => socket.close());
      // A final guard also catches requests not registered by the production adapter.
      await route('**/*', request => request.abort());
      context.route = async (pattern, handler, ...rest) => route(pattern, intercepted => {
        const boundary = async () => {
          const request = intercepted.request();
          const url = new URL(request.url());
          if (request.method() === 'GET' && request.url() === venue.url) {
            process.send?.({ kind: 'supplier-document' });
            return intercepted.fulfill({ status: 200, contentType: 'text/html', body: supplierHtml() });
          }
          if (request.method() === 'POST' && url.origin === 'https://app.bokabord.se' && url.pathname === '/reservation/api/booking/getTimes') {
            process.send?.({ kind: 'supplier-slots' });
            return intercepted.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ times: ['19:00'] }) });
          }
          if (request.method() === 'POST' && request.url() === saveUrl) {
            // Reaching this boundary means the REAL adapter authorized the call
            // and the REAL journal reserved it. It is fulfilled/aborted, never sent.
            process.send?.({ kind: 'supplier-submit', outcome: process.env.VELVET_TEST_OUTCOME });
            if (process.env.VELVET_TEST_OUTCOME === 'timeout') return intercepted.abort('connectionreset');
            const approved = request.postDataJSON();
            // Synthetic receipt shape from the reviewed policy, no historical
            // guest data, reference, shortcode or capability URL is copied.
            const booking = { ...approved, id: 999999999, status: 1,
              restid: process.env.VELVET_TEST_OUTCOME === 'confirmed' ? 1359 : 9999,
              meal: { type: 3, bullets: {} }, waitlist: 0, require_noshow: false,
              phone: Number(String(approved.phone).replace(/\D/g, '')),
            };
            return intercepted.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, booking }) });
          }
          process.send?.({ kind: 'unexpected-supplier-request', method: request.method(), path: url.pathname });
          return intercepted.abort();
        };
        const proxy = new Proxy(intercepted, { get(target, key) {
          if (key === 'continue' || key === 'fallback') return boundary;
          if (key === 'fetch') return () => { throw new Error('fixture_forbids_route_fetch'); };
          if (key === 'abort') return async (...args) => {
            if (target.request().url() === saveUrl) process.send?.({ kind: 'adapter-blocked-submit' });
            return target.abort(...args);
          };
          const value = Reflect.get(target, key, target);
          return typeof value === 'function' ? value.bind(target) : value;
        } });
        return handler(proxy);
      }, ...rest);
      return context;
    };
    return browser;
  };
} else {
  await main();
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'velvet-integrated-'));
  const messages = [];
  const apiCalls = [];
  let child, backend, browser, base, childLog = '';
  const staticServer = http.createServer(async (req, res) => {
    const url = new URL(req.url, base || 'http://127.0.0.1');
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname).slice(1);
    const file = path.resolve(root, relative);
    if (['GET', 'HEAD'].includes(req.method) && file.startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' })[path.extname(file)] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-store');
      return fs.createReadStream(file).pipe(res);
    }
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    let action;
    try { action = JSON.parse(body).type; } catch {}
    apiCalls.push({ path: url.pathname, method: req.method, action });
    const proxy = http.request(backend + url.pathname + url.search, { method: req.method, headers: { ...req.headers, host: new URL(backend).host } }, upstream => {
      res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res);
    });
    proxy.on('error', () => { res.writeHead(502); res.end('{}'); });
    proxy.end(body);
  });
  await new Promise(resolve => staticServer.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${staticServer.address().port}`;
  async function start(outcome) {
    const portHolder = http.createServer();
    await new Promise(resolve => portHolder.listen(0, '127.0.0.1', resolve));
    const port = portHolder.address().port;
    await new Promise(resolve => portHolder.close(resolve));
    backend = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['--import', import.meta.url, 'api/server.mjs'], { cwd: root, env: {
      ...process.env, VELVET_INTEGRATED_SUPPLIER_FIXTURE: 'child', VELVET_TEST_DIRECTORY: directory,
      VELVET_TEST_OUTCOME: outcome, PORT: String(port), PUBLIC_URL: base,
      VELVET_CRAWL: '0', VELVET_BOKABORD_MIRROR: 'live', VELVET_PLAYWRIGHT_INSPECTION: 'disabled',
      VELVET_DATA: path.join(directory, 'store.json'), VELVET_PAY: path.join(directory, 'pay.json'),
      VELVET_IDV: path.join(directory, 'idv'), VELVET_BOOKINGS_DB: path.join(directory, 'bookings.sqlite'),
      VELVET_PLAYWRIGHT_DB: path.join(directory, 'attempts.sqlite'),
    }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    child.on('message', message => messages.push(message));
    child.stdout.on('data', chunk => { childLog += chunk; });
    child.stderr.on('data', chunk => { childLog += chunk; });
    for (let i = 0; i < 150; i++) {
      if (child.exitCode !== null) throw new Error('API startup failed: ' + childLog.slice(-2000));
      try { if ((await fetch(backend + '/health')).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('API startup timeout: ' + childLog.slice(-2000));
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill();
    await exited;
  }
  async function makeView(width = 390) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.routeWebSocket('**/*', socket => socket.close());
    await context.addInitScript(() => localStorage.setItem('velvet_lang', 'sv'));
    const page = await context.newPage(); page.setDefaultTimeout(20_000);
    let visitNumber = 0;
    const visit = async () => {
      // A changed document query forces a real reload, not same-document hash
      // navigation that would leave the old mirror closure mounted after restart.
      await page.goto(base + '/?api=' + encodeURIComponent(base) + '&fixtureVisit=' + ++visitNumber + '#/restaurant/' + restaurantId);
      await page.locator('#bokabord-mirror [data-start]').waitFor();
      assert.equal(await page.locator('#restaurant-provider-booking').count(), 0, 'Native route wins over registry embed');
    };
    await visit();
    return { context, page, visit };
  }
  const submits = () => messages.filter(m => m.kind === 'supplier-submit').length;
  const panel = page => page.locator('#bokabord-mirror');
  async function settled(page) {
    await page.waitForFunction(() => document.querySelector('#bokabord-mirror')?.getAttribute('aria-busy') === 'false');
  }
  async function pixel(page, y) {
    const image = panel(page).locator('[data-image]');
    const previous = await image.getAttribute('data-revision');
    const width = await image.evaluate(img => img.getBoundingClientRect().width);
    const naturalWidth = await image.evaluate(img => img.naturalWidth);
    await image.click({ position: { x: 100 * width / naturalWidth, y: y * width / naturalWidth } });
    await page.waitForFunction(revision => document.querySelector('#bokabord-mirror [data-image]')?.dataset.revision !== revision, previous);
    await settled(page);
  }
  async function toReview(page) {
    await panel(page).locator('[data-start]').click();
    await panel(page).locator('[data-image]').waitFor(); await settled(page);
    await pixel(page, 110); // party
    await pixel(page, 170); // date -> actual adapter's allowed supplier getTimes
    await pixel(page, 230); // fixture slot -> contact
    for (const [name, value] of Object.entries({ firstname: 'Integration', lastname: 'Fixture', email: 'fixture@example.invalid', phone: '+46700000000' })) {
      const input = panel(page).locator(`[data-provider-field="${name}"]`);
      await input.fill(value); await input.blur();
      await page.waitForFunction(({ name, value }) => document.querySelector(`[data-provider-field="${name}"]`)?.dataset.verifiedValue === value, { name, value });
      await settled(page);
    }
    const before = submits();
    await panel(page).locator('[data-submit]').click(); // without consent
    assert.equal(submits(), before);
    await panel(page).locator('[data-terms]').check();
    await panel(page).locator('[data-submit]').click();
    await page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-submit]')?.textContent === 'Slutför bokningen');
    await settled(page);
    assert.equal(submits(), before, 'Contact-to-review must not reach supplier save');
    assert.equal(await panel(page).locator('[data-terms]').isChecked(), false, 'Review requires fresh consent');
  }
  async function api(page, route, options = {}) {
    return page.evaluate(async ({ route, options }) => {
      const response = await fetch(route, { credentials: 'include', ...options });
      return { status: response.status, body: await response.json() };
    }, { route, options });
  }
  let first, second, third;
  try {
    await start('unverified-success');
    browser = await chromium.launch();
    first = await makeView();
    await toReview(first.page);
    assert.equal(submits(), 0);
    await panel(first.page).locator('[data-terms]').check();
    await panel(first.page).locator('[data-submit]').evaluate(button => { button.click(); button.click(); });
    await first.page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus === 'unknown', null, { timeout: 40_000 });
    await settled(first.page);
    assert.equal(submits(), 1, 'Exactly one supplier boundary attempt');
    let recovered = await api(first.page, '/restaurant-bookings/playwright/attempts');
    assert.equal(recovered.status, 200); assert.equal(recovered.body.attempts.length, 1);
    assert.equal(recovered.body.attempts[0].status, 'unknown');
    assert.ok(!JSON.stringify(recovered.body).includes('fixture@example.invalid'));
    console.log('PASS actual app/API/Chromium/journal: explicit consent, two-step review, one double-click attempt, wrong-restaurant receipt remains unknown');
    second = await makeView(1365);
    assert.equal((await api(second.page, '/restaurant-bookings/playwright/attempts')).status, 401);
    await stop(); await start('unverified-success');
    recovered = await api(first.page, '/restaurant-bookings/playwright/attempts');
    assert.equal(recovered.body.attempts.length, 1); assert.equal(recovered.body.attempts[0].status, 'unknown');
    await first.visit(); await toReview(first.page);
    await panel(first.page).locator('[data-terms]').check();
    await panel(first.page).locator('[data-submit]').click();
    // The public serializer deliberately normalizes internal already_attempted
    // to unknown; assert the supplier boundary block, not an internal status.
    await first.page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus === 'unknown', null, { timeout: 40_000 });
    assert.equal(submits(), 1, 'Restart + new session cannot repeat supplier transmission');
    assert.equal(messages.filter(m => m.kind === 'adapter-blocked-submit').length, 1);
    console.log('PASS actual restart/replay: persisted attempt recovered by same owner; other browser isolated; new session/key blocked');
    await stop(); await start('timeout');
    await second.visit(); await toReview(second.page);
    await panel(second.page).locator('[data-terms]').check();
    await panel(second.page).locator('[data-submit]').click();
    await second.page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus === 'unknown', null, { timeout: 45_000 });
    await settled(second.page); assert.equal(submits(), 2);
    await panel(second.page).locator('[data-refresh]').click(); await settled(second.page);
    assert.equal(submits(), 2);
    assert.equal(await panel(second.page).locator('[data-submit]').isHidden(), true);
    recovered = await api(second.page, '/restaurant-bookings/playwright/attempts');
    assert.equal(recovered.body.attempts.length, 1); assert.equal(recovered.body.attempts[0].status, 'unknown');
    console.log('PASS actual supplier-boundary timeout: unknown journal/current UI, no retry after refresh');
    await stop(); await start('confirmed');
    third = await makeView(1365);
    await toReview(third.page);
    await panel(third.page).locator('[data-terms]').check();
    await panel(third.page).locator('[data-submit]').click();
    await third.page.waitForFunction(() => document.querySelector('#bokabord-mirror [data-status]')?.dataset.bookingStatus === 'confirmed', null, { timeout: 40_000 });
    await settled(third.page);
    assert.equal(submits(), 3);
    assert.match(await panel(third.page).locator('[data-status]').innerText(), /999999999/);
    recovered = await api(third.page, '/restaurant-bookings/playwright/attempts');
    assert.equal(recovered.body.attempts.length, 1);
    assert.equal(recovered.body.attempts[0].status, 'confirmed');
    assert.equal(recovered.body.attempts[0].reference, '999999999');
    assert.ok(!JSON.stringify(recovered.body).includes('fixture@example.invalid'));
    await panel(third.page).locator('[data-refresh]').click(); await settled(third.page);
    assert.equal(submits(), 3);
    assert.equal(await panel(third.page).locator('[data-status]').getAttribute('data-booking-status'), 'confirmed');
    console.log('PASS scoped positive Zink receipt through actual app/API/adapter/journal, owner recovery and reference; supplier remains simulated');
    assert.equal(messages.filter(m => m.kind === 'unexpected-supplier-request').length, 0);
    assert.equal(messages.filter(m => m.kind === 'blocked-node-network').length, 0);
    console.log(JSON.stringify({ status: 'PASS', evidence: 'real_local_app_api_adapter_journal_with_supplier_fixture',
      integrationCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
      supplierBoundaryAttempts: submits(), actualSupplierRequests: 0, liveConfirmationVerified: false,
      backendRestarts: 3, APIRequests: apiCalls.length, deployed: false }));
  } catch (error) {
    console.error('Integrated fixture failure:', error.message);
    console.error('Recent local API calls:', JSON.stringify(apiCalls.slice(-12)));
    console.error('Supplier boundary events:', JSON.stringify(messages));
    throw error;
  } finally {
    await first?.context.close(); await second?.context.close(); await third?.context.close();
    await browser?.close(); await stop();
    staticServer.closeAllConnections(); await new Promise(resolve => staticServer.close(resolve));
    // Only this test's mkdtemp directory is removed, never repository/user data.
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

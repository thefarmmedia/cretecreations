import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(path, 'utf8');
const pages = readdirSync('.').filter(path => path.endsWith('.html'));
const scripts = html => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const sitemap = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const canonical = html => html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
const active = pages.filter(path => path !== 'calculator.html' && !/<meta[^>]*name="robots"[^>]*noindex/.test(read(path)));
const redirectRows = read('_redirects').split('\n')
  .filter(line => line.trim() && !line.startsWith('#')).map(line => line.trim().split(/\s+/));
const redirects = new Map(redirectRows.filter(row => row[0].startsWith('/')).map(row => [row[0], row]));

test('sitemap contains each indexable canonical exactly once', () => {
  assert.equal(active.length, 57);
  assert.equal(new Set(sitemap).size, sitemap.length);
  assert.deepEqual([...sitemap].sort(), active.map(path => canonical(read(path))).sort());
  for (const path of active) {
    const html = read(path);
    assert.equal([...html.matchAll(/rel="canonical"/g)].length, 1, path);
    assert.equal(canonical(html), 'https://cretecreationsllc.com' + (path === 'index.html' ? '/' : '/' + path.replace(/\.html$/, '')), path);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, path);
    assert.equal(html.match(/property="og:url" content="([^"]+)"/)?.[1], canonical(html), path);
  }
  assert.match(read('robots.txt'), /Allow: \//);
  assert.doesNotMatch(read('robots.txt'), /Disallow:\s*\//);
  assert.doesNotMatch(read('_headers'), /X-Robots-Tag:\s*noindex/i);
});

test('existing HTML aliases permanently redirect without shadowing, chains or loops', () => {
  for (const path of pages) {
    const rule = redirects.get('/' + path);
    assert.ok(rule, path);
    assert.equal(rule[2], '301!', path);
    assert.equal(rule[1], canonical(read(path)).replace('https://cretecreationsllc.com', ''), path);
    assert.ok(!redirects.has(rule[1]), path + ' creates a chain');
  }
  for (const [from, to] of [
    ['/calculator', '/contact'], ['/metallic-epoxy-joplin', '/metallic-epoxy'],
    ['/driveway-overlay-joplin', '/driveways'], ['/epoxy-floors-grand-lake-ok', '/grove'],
    ['/epoxy-floors-fayetteville-ar', '/fayetteville'], ['/epoxy-floors-rogers-ar', '/rogers-ar']
  ]) {
    assert.equal(redirects.get(from)?.[1], to);
    assert.equal(redirects.get(from)?.[2], '301!');
  }
});

test('internal page links go directly to canonical pages', () => {
  const paths = new Set(sitemap.map(url => url.replace('https://cretecreationsllc.com', '')));
  const inbound = new Set();
  for (const path of active) {
    const html = read(path);
    for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/g)) {
      const url = match[1].split(/[?#]/)[0];
      if (!url.startsWith('/') || url.startsWith('//')) continue;
      assert.ok(paths.has(url), path + ' links to ' + url);
      inbound.add(url);
    }
    assert.doesNotMatch(html, /<a\b[^>]*href="\/contact"[^>]*>[^<]*417[^<]*<\/a>/, path);
  }
  for (const path of paths) assert.ok(inbound.has(path), 'No incoming link: ' + path);
  assert.match(read('index.html'), /href="\/gallery"[^>]*>View Our Work<\/a>/);
});

test('metadata, structured data and scripts remain valid', () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const path of pages) {
    const html = read(path);
    for (const [, attrs, body] of scripts(html)) {
      if (attrs.includes('ld+json')) JSON.parse(body);
      else new vm.Script(body, { filename: path });
    }
    if (!active.includes(path)) continue;
    const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
    const description = html.match(/name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && !titles.has(title), path + ' duplicate/missing title');
    assert.ok(description && !descriptions.has(description), path + ' duplicate/missing description');
    titles.add(title);
    descriptions.add(description);
    assert.doesNotMatch(title, /(?:,\s*|:\s*|—\s*)\|/, path + ' truncated title');
    assert.doesNotMatch(html, /ballpark|under 60 seconds|under a minute|Price Revealed After|Price Free Quote/i, path);
  }
  const business = JSON.parse(scripts(read('index.html')).find(([, attrs]) => attrs.includes('ld+json'))[2]);
  assert.equal(business.name, 'Crete Creations LLC');
  assert.equal(business.telephone, '+14174837082');
  assert.equal(business.aggregateRating, undefined);
  assert.equal(business.review, undefined);
  assert.deepEqual(business.areaServed.map(area => area.name), ['Missouri', 'Kansas', 'Oklahoma', 'Arkansas']);
});

const cases = [
  { name: 'contact', path: 'contact.html', marker: 'var _formLoadTime', handler: 'handleForm', button: 'formBtn', status: 'quoteStatus', required: ['firstName', 'lastName', 'phone', 'email', 'service', 'city'], honeypot: 'hp_website' },
  { name: 'homepage quick quote', path: 'index.html', marker: 'async function handleForm', handler: 'handleForm', button: 'formBtn', status: 'quickQuoteStatus', required: ['hpPhone', 'hpService'] },
  { name: 'homepage hero', path: 'index.html', marker: 'var _hfLoad', handler: 'submitHeroForm', button: 'hf_btn', status: 'heroQuoteStatus', required: ['hf_name', 'hf_phone', 'hf_email', 'hf_zip', 'hf_service'], honeypot: 'hp_hf' },
  { name: 'locations', path: 'locations.html', marker: 'async function handleLocForm', handler: 'handleLocForm', button: 'locBtn', status: 'locationQuoteStatus', required: ['locPhone'] }
];
const values = {
  firstName: 'Ava', lastName: 'Customer', phone: '(417) 555-0199', email: 'ava@example.com',
  city: 'Joplin 64801', service: 'Epoxy Garage Floor', sqft: '300-500 sq ft', message: 'Test project details',
  hpFirstName: 'Ava', hpLastName: 'Customer', hpPhone: '(417) 555-0199', hpService: 'Epoxy Garage Floor', hpCity: 'Joplin 64801',
  hf_name: 'Ava Customer', hf_phone: '(417) 555-0199', hf_email: 'ava@example.com', hf_zip: '64801', hf_service: 'Epoxy Garage Floor', hf_message: 'Test project details',
  locName: 'Ava Customer', locPhone: '(417) 555-0199', locCity: 'Joplin 64801', locService: 'Epoxy Garage Floor',
  hp_website: '', hp_hf: ''
};

function setup(config, mode = 'ok') {
  const html = read(config.path);
  const elements = {};
  for (const [, tag, attrs] of html.matchAll(/<(input|select|textarea|button|p)\b([^>]*)>/g)) {
    const id = attrs.match(/\bid="([^"]+)"/)?.[1];
    if (!id) continue;
    elements[id] = {
      value: values[id] ?? '', textContent: '', style: {}, disabled: false,
      checkValidity() {
        if (/\brequired\b/.test(attrs) && !this.value.trim()) return false;
        return !/type="email"/.test(attrs) || !this.value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.value);
      }
    };
  }
  let now = 1000;
  let currentMode = mode;
  const requests = [];
  const sandbox = {
    Date: { now: () => now },
    FormData: class {
      constructor() { this.data = {}; }
      append(key, value) { this.data[key] = value; }
    },
    document: { getElementById: id => {
      assert.ok(elements[id], config.name + ' missing element ' + id);
      return elements[id];
    }},
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (currentMode === 'network') throw new Error('Offline');
      if (typeof currentMode === 'function') return currentMode();
      return { ok: currentMode === 'ok', status: currentMode === 'ok' ? 200 : Number(currentMode) };
    }
  };
  const body = scripts(html).find(([, attrs, source]) => !attrs.includes('ld+json') && source.includes(config.marker))?.[2];
  assert.ok(body, config.name + ' handler script missing');
  vm.runInNewContext(body, sandbox);
  now = 5000;
  return {
    elements, requests,
    invoke: () => sandbox[config.handler]({ preventDefault() {} }),
    clock: time => { now = time; },
    mode: value => { currentMode = value; }
  };
}

for (const config of cases) {
  test(config.name + ': successful requests preserve project fields and block repeat sends', async () => {
    const env = setup(config);
    await env.invoke();
    assert.equal(env.requests.length, 1);
    assert.equal(env.requests[0].options.method, 'POST');
    assert.match(env.requests[0].url, /^https:\/\/services\.leadconnectorhq\.com\/hooks\//);
    const payload = typeof env.requests[0].options.body === 'string' ? JSON.parse(env.requests[0].options.body) : env.requests[0].options.body.data;
    assert.equal(payload.service, 'Epoxy Garage Floor');
    assert.equal(payload.phone.replace(/\D/g, ''), '4175550199');
    assert.ok(payload.city === 'Joplin 64801' || payload.zip === '64801');
    if (config.name === 'contact') {
      assert.equal(payload.sq_ft, '300-500 sq ft');
      assert.equal(payload.message, 'Test project details');
      assert.equal(payload.email, 'ava@example.com');
    }
    assert.equal(env.elements[config.button].disabled, true);
    assert.equal(env.elements[config.button].textContent, 'Request Sent');
    assert.match(env.elements[config.status].textContent, /request was sent/i);
    await env.invoke();
    assert.equal(env.requests.length, 1);
  });

  for (const failure of ['400', '500', 'network']) {
    test(config.name + ': ' + failure + ' failures do not report success and permit retry', async () => {
      const env = setup(config, failure);
      await env.invoke();
      assert.equal(env.requests.length, 1);
      assert.equal(env.elements[config.button].disabled, false);
      assert.doesNotMatch(env.elements[config.button].textContent, /sent|submitted/i);
      assert.match(env.elements[config.status].textContent, /could not send.*417.*483-7082/i);
      assert.equal(env.elements[config.required[0]].value, values[config.required[0]]);
      env.mode('ok');
      await env.invoke();
      assert.equal(env.requests.length, 2);
      assert.equal(env.elements[config.button].textContent, 'Request Sent');
    });
  }

  for (const id of config.required) {
    test(config.name + ': missing ' + id + ' never sends', async () => {
      const env = setup(config);
      env.elements[id].value = '   ';
      await env.invoke();
      assert.equal(env.requests.length, 0);
      assert.equal(env.elements[config.button].disabled, false);
      assert.doesNotMatch(env.elements[config.status].textContent, /request was sent/i);
    });
  }

  test(config.name + ': pending request is not reported as sent or duplicated', async () => {
    let resolve;
    const pending = new Promise(done => { resolve = done; });
    const env = setup(config, () => pending);
    const sending = env.invoke();
    await env.invoke();
    assert.equal(env.requests.length, 1);
    assert.equal(env.elements[config.button].textContent, 'Sending...');
    resolve({ ok: true, status: 200 });
    await sending;
    assert.equal(env.elements[config.button].textContent, 'Request Sent');
  });

  if (config.honeypot) {
    test(config.name + ': fast submits stay unsent and can be retried', async () => {
      const env = setup(config);
      env.clock(1500);
      await env.invoke();
      assert.equal(env.requests.length, 0);
      assert.equal(env.elements[config.button].disabled, false);
      assert.match(env.elements[config.status].textContent, /wait a moment/i);
      env.clock(5000);
      await env.invoke();
      assert.equal(env.requests.length, 1);
    });
    test(config.name + ': honeypot submissions never claim success', async () => {
      const env = setup(config);
      env.elements[config.honeypot].value = 'bot';
      await env.invoke();
      assert.equal(env.requests.length, 0);
      assert.doesNotMatch(env.elements[config.button].textContent, /sent|submitted/i);
      assert.doesNotMatch(env.elements[config.status].textContent, /request was sent/i);
    });
    test(config.name + ': invalid email never sends', async () => {
      const env = setup(config);
      env.elements[config.name === 'contact' ? 'email' : 'hf_email'].value = 'invalid-email';
      await env.invoke();
      assert.equal(env.requests.length, 0);
    });
  }
}

test('all quote forms expose accessible status messages and native submit behavior', () => {
  for (const config of cases) {
    const html = read(config.path);
    assert.ok(new RegExp('<p[^>]*id="' + config.status + '"[^>]*role="status"[^>]*aria-live="polite"').test(html), config.name);
  }
  const home = read('index.html');
  assert.match(home, /<form class="hero-form-card" onsubmit="submitHeroForm\(event\)">/);
  assert.match(home, /id="hf_btn" type="submit"/);
  for (const id of cases[2].required) {
    assert.ok(new RegExp('<(?:input|select)\\b[^>]*id="' + id + '"[^>]*\\brequired\\b').test(home), id);
  }
});

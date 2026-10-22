import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const base = process.env.SITE_URL || 'https://cretecreationsllc.com';
const inspect = process.argv.includes('--inspect');
const preview = process.env.PREVIEW_URL;
// Netlify adds this exact collaboration helper to previews at the edge.
// Production must still match the committed bytes without normalization.
const withoutPreviewDrawer = text => preview ? text.replace(/<div data-netlify-deploy-id="[0-9a-f]{24}" data-netlify-site-id="[0-9a-f-]{36}" data-vcs="github" style="position:fixed">\s*<script async src="\/\.netlify\/scripts\/cdp"><\/script>\s*<\/div>\n(?=<\/body>)/, '') : text;
const hash = text => createHash('sha256').update(withoutPreviewDrawer(text)).digest('hex');
const read = path => readFileSync(path, 'utf8');
const paths = [...read('sitemap.xml').matchAll(/<loc>https:\/\/cretecreationsllc.com(.*?)<\/loc>/g)].map(m => m[1]);
const rows = read('_redirects').split('\n').filter(line => line.startsWith('/')).map(line => line.trim().split(/\s+/));
const sourceFor = path => read(path === '/' ? 'index.html' : path.slice(1) + '.html');
const assetPaths = [...new Set(paths.flatMap(path =>
  [...sourceFor(path).matchAll(/(['"])(\/[\w-]+\.(?:jpe?g|png|webp|css))\1/g)].map(match => match[2])
))];
const request = (url, follow = false) => fetch(url, {
  redirect: follow ? 'follow' : 'manual',
  signal: AbortSignal.timeout(20000),
  headers: { 'User-Agent': 'CreteCreations-Site-Verification/1.0', 'Cache-Control': 'no-cache' }
});
async function batch(items, fn, limit = 6) {
  const queue = [...items];
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) await fn(queue.shift());
  }));
}
async function inspectCurrent() {
  if (preview) {
    const r = await request(preview + '/?inspect=current');
    const body = await r.text();
    const expected = read('index.html');
    let diff = 0;
    while (diff < Math.min(body.length, expected.length) && body[diff] === expected[diff]) diff++;
    console.log(JSON.stringify({
      preview, status: r.status, location: r.headers.get('location'),
      bytes: body.length, expectedBytes: expected.length, firstDifference: diff,
      matchesSource: hash(body) === hash(expected),
      netlifyDrawer: body.includes('/.netlify/scripts/cdp')
    }));
  }
  for (const path of ['/', '/index', '/index/', '/joplin', '/joplin/', '/joplin.html', '/epoxy-floors/', '/calculator', '/calculator.html']) {
    const r = await request(base + path);
    const body = await r.text();
    console.log(JSON.stringify({
      url: base + path, status: r.status, location: r.headers.get('location'),
      server: r.headers.get('server'), title: body.match(/<title>(.*?)<\/title>/s)?.[1],
      canonical: body.match(/rel="canonical"[^>]*href="([^"]+)"/)?.[1]
    }));
  }
}
async function verify(target) {
  let ready = false;
  for (let attempt = 0; attempt < 15; attempt++) {
    const r = await request(target + '/?verify=' + (process.env.GITHUB_SHA || 'manual'));
    const body = await r.text();
    if (r.status === 200 && hash(body) === hash(read('index.html'))) { ready = true; break; }
    console.log('Waiting for the expected deployment, attempt ' + (attempt + 1));
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  assert.ok(ready, 'The live homepage does not match this commit');
  let pageCount = 0;
  await batch(paths, async path => {
    const r = await request(target + path);
    assert.equal(r.status, 200, path + ' must return 200');
    if (!preview) assert.doesNotMatch(r.headers.get('x-robots-tag') || '', /noindex/i, path);
    const body = await r.text();
    assert.equal(hash(body), hash(sourceFor(path)), path + ' differs from this commit');
    assert.doesNotMatch(body, /<meta[^>]*name="robots"[^>]*noindex/i, path);
    assert.equal(body.match(/rel="canonical"[^>]*href="([^"]+)"/)?.[1], 'https://cretecreationsllc.com' + path, path);
    pageCount++;
  });
  let aliasCount = 0;
  await batch(rows, async ([from, to]) => {
    const r = await request(target + from + '?probe=canonical');
    assert.equal(r.status, 301, from + ' must permanently redirect');
    const location = new URL(r.headers.get('location'), target);
    assert.equal(location.pathname, to, from);
    assert.equal(location.searchParams.get('probe'), 'canonical', from + ' drops query parameters');
    aliasCount++;
  });
  const indexSlash = await request(target + '/index/?probe=canonical');
  assert.equal(indexSlash.status, 301, '/index/ must permanently redirect');
  const indexDestination = new URL(indexSlash.headers.get('location'), target);
  assert.equal(indexDestination.pathname, '/');
  assert.equal(indexDestination.searchParams.get('probe'), 'canonical');
  // Netlify normalizes slashes before redirect rules. Both served forms must
  // retain the canonical HTML and usable root-relative assets.
  await batch(paths.filter(path => path !== '/'), async path => {
    const r = await request(target + path + '/');
    assert.equal(r.status, 200, path + '/ must remain accessible without a redirect loop');
    if (!preview) assert.doesNotMatch(r.headers.get('x-robots-tag') || '', /noindex/i, path + '/');
    assert.equal(hash(await r.text()), hash(sourceFor(path)), path + '/ differs from its canonical page');
  });
  await batch(assetPaths, async path => {
    const r = await request(target + path);
    assert.equal(r.status, 200, path + ' asset is missing');
    assert.match(r.headers.get('content-type') || '', path.endsWith('.css') ? /^text\/css/i : /^image\//i, path);
    if (path.endsWith('.css')) {
      assert.match(r.headers.get('cache-control') || '', /max-age=0/);
      assert.doesNotMatch(r.headers.get('cache-control') || '', /immutable/);
    }
    await r.arrayBuffer();
  });
  for (const path of ['robots.txt', 'sitemap.xml']) {
    const r = await request(target + '/' + path);
    assert.equal(r.status, 200, path);
    assert.equal(hash(await r.text()), hash(read(path)), path + ' differs from source');
  }
  const missing = await request(target + '/site-verification-missing-page');
  assert.equal(missing.status, 404, 'Unknown URLs must return 404');
  if (!preview) {
    for (const variant of ['http://cretecreationsllc.com/', 'http://www.cretecreationsllc.com/', 'https://www.cretecreationsllc.com/']) {
      let current = variant;
      let hops = 0;
      const seen = new Set();
      while (current !== base + '/' && hops < 3) {
        assert.ok(!seen.has(current), 'Redirect loop: ' + variant);
        seen.add(current);
        const r = await request(current);
        assert.ok([301, 308].includes(r.status), current + ' must permanently redirect');
        assert.ok(r.headers.get('location'), current + ' has no destination');
        const next = new URL(r.headers.get('location'), current);
        assert.ok(['cretecreationsllc.com', 'www.cretecreationsllc.com'].includes(next.hostname), current);
        assert.equal(next.pathname, '/', current);
        current = next.href;
        hops++;
      }
      assert.equal(current, base + '/', variant + ' does not reach the canonical host');
      console.log('Canonical host verified: ' + variant + ' in ' + hops + ' permanent redirect(s)');
    }
  }
  console.log('Verified ' + pageCount + ' exact HTML matches, ' + (pageCount - 1) + ' slash variants, ' + aliasCount + ' permanent path redirects, /index/, ' + assetPaths.length + ' assets, robots.txt, sitemap.xml and 404 handling at ' + target);
}
if (inspect) await inspectCurrent();
else await verify(preview || base);

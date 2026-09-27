const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('app/api/store-media/[...path]/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText;
function handler(fetch) {
  const exports = {};
  vm.runInNewContext(source, { exports, process: { env: { DJANGO_API_URL: 'https://backend.example.com' } }, URL, Response, AbortSignal, fetch });
  return exports.GET;
}
const params = { params: Promise.resolve({ path: ['products', 'phone.webp'] }) };

test('versioned images reuse caches and separate replacements by version', async () => {
  const calls = [];
  const get = handler(async (url, options) => {
    calls.push({ url, options });
    return new Response('image', { headers: { 'Content-Type': 'image/webp' } });
  });
  for (const v of ['123', '124']) {
    const response = await get(new Request(`https://store.example.com/api/store-media/products/phone.webp?v=${v}`), params);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'public, max-age=3600');
    assert.match(response.headers.get('CDN-Cache-Control'), /s-maxage=86400/);
    assert.equal(await response.text(), 'image');
  }
  assert.notEqual(calls[0].url, calls[1].url);
  assert.equal(calls[0].options.next.revalidate, 86400);
  assert.equal(calls[0].options.redirect, 'error');
});

test('unversioned images keep their short freshness window', async () => {
  const get = handler(async (_url, options) => {
    assert.equal(options.next.revalidate, 60);
    return new Response('image', { headers: { 'Content-Type': 'image/webp' } });
  });
  const response = await get(new Request('https://store.example.com/api/store-media/products/phone.webp'), params);
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=60');
});

test('unsafe paths, malformed versions and non-images are not cached', async () => {
  const noFetch = handler(() => { throw new Error('Should not fetch'); });
  assert.equal((await noFetch(new Request('https://store.example.com/image?v=bad'), params)).status, 400);
  assert.equal((await noFetch(new Request('https://store.example.com/image?v=123&v=124'), params)).status, 400);
  assert.equal((await noFetch(new Request('https://store.example.com/image?unknown=value'), params)).status, 400);
  assert.equal((await noFetch(new Request('https://store.example.com/image'), { params: Promise.resolve({ path: ['..', 'secret'] }) })).status, 400);
  const get = handler(async () => new Response('<html>Error</html>', { headers: { 'Content-Type': 'text/html' } }));
  const response = await get(new Request('https://store.example.com/image?v=123'), params);
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('CDN-Cache-Control'), null);
});

test('media upstream failures return an uncached error without internal details', async () => {
  const get = handler(async () => { throw new Error('private upstream details'); });
  const response = await get(new Request('https://store.example.com/image?v=123'), params);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(await response.text(), '');
});

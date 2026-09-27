const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const config = ts.transpileModule(fs.readFileSync('next.config.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const valid = {
  VERCEL: '1', VERCEL_ENV: 'production',
  DJANGO_API_URL: 'https://api.example.com',
  DJANGO_API_TOKEN: 'test-token-'.repeat(5),
  SITE_URL: 'https://example.com',
};
const load = (env) => vm.runInNewContext(config, { process: { env }, exports: {}, URL });

test('Next image loader accepts versioned product media and ordinary local assets', () => {
  const exports = {};
  vm.runInNewContext(config, { process: { env: valid }, exports, URL });
  const { imageConfigDefault } = require('next/dist/shared/lib/image-config');
  const { hasLocalMatch } = require('next/dist/shared/lib/match-local-pattern');
  const loader = require('next/dist/shared/lib/image-loader').default;
  const images = { ...imageConfigDefault, ...exports.default.images };
  for (const src of ['/api/store-media/products/phone.webp?v=1790432831654000', '/main_logo.jpg', '/_next/static/media/hero.abc123.png']) {
    assert.equal(hasLocalMatch(images.localPatterns, src), true);
    assert.doesNotThrow(() => loader({ config: images, src, width: 640, quality: 75 }));
  }
  assert.equal(hasLocalMatch(images.localPatterns, '/unrelated/path?arbitrary=1'), false);
});

test('hosted builds reject missing backend configuration and insecure origins', () => {
  for (const key of ['DJANGO_API_URL', 'DJANGO_API_TOKEN', 'SITE_URL']) {
    assert.throws(() => load({ ...valid, [key]: '' }));
  }
  for (const value of ['http://api.example.com', 'https://api.example.com/', 'https://api.example.com/path']) {
    assert.throws(() => load({ ...valid, DJANGO_API_URL: value }));
  }
  assert.throws(() => load({ ...valid, DJANGO_API_TOKEN: 'short' }));
});

test('production accepts configured origins; previews can use their request origin', () => {
  assert.doesNotThrow(() => load(valid));
  assert.doesNotThrow(() => load({ ...valid, VERCEL_ENV: 'preview', SITE_URL: '' }));
  assert.throws(() => load({ ...valid, VERCEL_ENV: 'preview', SITE_URL: 'https://example.com/checkout' }));
  assert.doesNotThrow(() => load({}));
});

test('malformed URL errors identify the variable without disclosing its value', () => {
  for (const name of ['DJANGO_API_URL', 'SITE_URL']) {
    for (const value of ['private-value-without-scheme', '`https://example.com`', `${name}=https://example.com`]) {
      assert.throws(() => load({ ...valid, [name]: value }), (error) => {
        assert.ok(error.message.startsWith(`${name} is not a valid URL.`));
        assert.ok(!error.message.includes(value));
        assert.equal(error.input, undefined);
        assert.equal(error.cause, undefined);
        return true;
      });
    }
  }
});

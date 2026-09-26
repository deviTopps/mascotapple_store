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

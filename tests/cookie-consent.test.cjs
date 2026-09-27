const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/cookie-consent.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 },
}).outputText, { exports: exportsObject });
const { readConsent, CONSENT_LIFETIME } = exportsObject;
test('optional services require a valid, unexpired explicit choice', () => {
  const now = 1800000000000;
  const valid = { version: 1, maps: true, savedAt: now - 1 };
  assert.equal(readConsent(JSON.stringify(valid), now).maps, true);
  assert.equal(readConsent(JSON.stringify({ ...valid, maps: false }), now).maps, false);
  for (const raw of [null, '', 'invalid', '{}', JSON.stringify({ ...valid, maps: 'true' }), JSON.stringify({ ...valid, version: 2 }), JSON.stringify({ ...valid, savedAt: now + 1 }), JSON.stringify({ ...valid, savedAt: now - CONSENT_LIFETIME })]) {
    assert.equal(readConsent(raw, now), null);
  }
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
require.extensions['.ts'] = function(module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, filename);
};
const { paginate } = require('../app/lib/pagination.ts');
const { productStructuredData, serializeJsonLd } = require('../app/lib/seo.ts');

test('pagination clamps invalid pages without losing or duplicating products', () => {
  const items = Array.from({ length: 55 }, (_, i) => i);
  assert.deepEqual([1, 2, 3].flatMap(page => paginate(items, String(page)).items), items);
  for (const page of [null, '-1', 'NaN', '1.5', 'Infinity']) assert.equal(paginate(items, page).page, 1);
  assert.equal(paginate(items, '999').page, 3);
  assert.equal(paginate([], '999').page, 1);
  assert.deepEqual(paginate([], null).items, []);
});

test('structured data escapes script injection and never invents prices or stock', () => {
  const product = { name: '</script><script>alert(1)</script>', slug: 'phone', image: '/phone.jpg', category: 'iPhone', description: 'Phone', longDescription: '', priceValue: null };
  const schema = productStructuredData(product);
  const serialized = serializeJsonLd(schema);
  assert.ok(!serialized.includes('<'));
  assert.equal(JSON.parse(serialized).name, product.name);
  assert.equal(schema.offers, undefined);
  assert.equal(productStructuredData({ ...product, priceValue: 99.95 }).offers.price, '99.95');
  assert.equal(productStructuredData({ ...product, priceValue: 99.95 }).offers.availability, undefined);
});

test('browser store preserves changes after failed writes and follows cross-tab updates', () => {
  const exports = {};
  const events = new EventTarget();
  let saved = 'old';
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/browser-store.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText,
    { exports, Event, window: events, localStorage: { getItem: () => saved, setItem: () => { throw new Error('Quota exceeded'); } } });
  const store = exports.createBrowserStore('cart', 'change', '[]');
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  assert.equal(store.snapshot(), 'old');
  store.save('new');
  assert.equal(store.snapshot(), 'new');
  assert.equal(updates, 1);
  saved = 'other tab';
  const event = new Event('storage'); event.key = 'cart'; events.dispatchEvent(event);
  assert.equal(store.snapshot(), 'other tab');
  assert.equal(updates, 2);
  unsubscribe();
});

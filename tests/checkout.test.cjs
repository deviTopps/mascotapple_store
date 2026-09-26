const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Load project TypeScript without adding a test dependency.
require.extensions['.ts'] = function(module, filename) {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  module._compile(code, filename);
};
const { validateOrder } = require('../app/lib/checkout.ts');
const { signSession, readSession } = require('../app/lib/paystack.ts');
const order = { name: 'Test Buyer', email: 'buyer@example.com', phone: '+233200000000', delivery: 'pickup', notes: '', items: [{ slug: 'iphone-17-pro', quantity: 2, selections: { storage: '256 GB', color: 'Silver' } }] };
test('calculates pesewa totals from the catalog, ignoring client pricing', () => {
  const result = validateOrder({ ...order, amount: 1, items: [{ ...order.items[0], price: 1 }] });
  assert.equal(result.amount, 199800);
  assert.equal(result.currency, 'GHS');
});
test('rejects unknown, unpriced, duplicate, fractional and excessive cart quantities', () => {
  for (const items of [[{ slug: 'missing', quantity: 1 }], [{ slug: 'iphone-blue', quantity: 1 }], [order.items[0], order.items[0]], [{ slug: 'iphone-17-pro', quantity: 0 }], [{ slug: 'iphone-17-pro', quantity: 1.5 }], [{ slug: 'iphone-17-pro', quantity: 100 }], []]) assert.throws(() => validateOrder({ ...order, items }));
});
test('requires valid contact details and delivery address', () => {
  assert.throws(() => validateOrder({ ...order, email: 'invalid' }));
  assert.throws(() => validateOrder({ ...order, delivery: 'delivery' }));
  assert.equal(validateOrder({ ...order, delivery: 'delivery', address: '123 Example Street', city: 'Accra' }).city, 'Accra');
});
test('payment session validates the signature and expiry', () => {
  const session = { reference: 'mascot-test', amount: 99900, expires: Date.now() + 60000 };
  const token = signSession(session, 'test-secret');
  assert.deepEqual(readSession(token, 'test-secret'), session);
  assert.equal(readSession(token, 'wrong-secret'), null);
  assert.equal(readSession(token + 'x', 'test-secret'), null);
  assert.equal(readSession(signSession({ ...session, expires: Date.now() - 1 }, 'test-secret'), 'test-secret'), null);
});

const { cartLineKey, validSelections } = require('../app/lib/product-options.ts');
test('different variants remain separate and selections are included in payment metadata', () => {
  const items = [order.items[0], { ...order.items[0], quantity: 1, selections: { storage: '512 GB', color: 'Deep Blue' } }];
  const result = validateOrder({ ...order, items });
  assert.equal(result.items.length, 2);
  assert.equal(result.amount, 299700);
  assert.deepEqual(result.items[1].selections, items[1].selections);
  assert.notEqual(cartLineKey(items[0]), cartLineKey(items[1]));
});
test('variant identity ignores object property order', () => {
  assert.equal(cartLineKey(order.items[0]), cartLineKey({ ...order.items[0], selections: { color: 'Silver', storage: '256 GB' } }));
});
test('checkout rejects missing, incomplete, invented and extra options', () => {
  for (const selections of [undefined, {}, { storage: '256 GB' }, { storage: '9 TB', color: 'Silver' }, { storage: '256 GB', color: 'Silver', fake: 'option' }]) {
    assert.throws(() => validateOrder({ ...order, items: [{ ...order.items[0], selections }] }));
  }
});
test('watch and audio options use applicable groups rather than phone storage', () => {
  assert.equal(validSelections('apple-watch-series-11', { size: '42 mm', color: 'Silver' }), true);
  assert.equal(validSelections('airpods-pro', { color: 'White' }), true);
  assert.equal(validSelections('airpods-pro', { storage: '256 GB', color: 'White' }), false);
});

test('delivery preserves a selected Google location in order metadata', () => {
  const location = { placeId: 'test-place-id', latitude: 5.6037, longitude: -0.187 };
  const result = validateOrder({ ...order, delivery: 'delivery', address: '123 Example Street', city: 'Accra', location: JSON.stringify(location) });
  assert.deepEqual(result.location, location);
});
test('manual delivery and pickup do not require coordinates', () => {
  assert.equal(validateOrder({ ...order, delivery: 'delivery', address: '123 Example Street', city: 'Accra', location: '' }).location, null);
  assert.equal(validateOrder({ ...order, location: '{invalid' }).location, null);
});
test('delivery rejects malformed location data and out-of-range coordinates', () => {
  for (const location of ['not json', 'null', JSON.stringify({ placeId: 'x', latitude: 91, longitude: 0 }), JSON.stringify({ placeId: 'x', latitude: 5, longitude: 181 }), JSON.stringify({ placeId: '', latitude: 5, longitude: 0 }), JSON.stringify({ placeId: 'x', latitude: '5', longitude: 0 })]) {
    assert.throws(() => validateOrder({ ...order, delivery: 'delivery', address: '123 Example Street', city: 'Accra', location }));
  }
});

test('supports pay on delivery without skipping order validation', () => {
  assert.equal(validateOrder({ ...order, paymentMethod: 'cod' }).paymentMethod, 'cod');
  assert.throws(() => validateOrder({ ...order, paymentMethod: 'unknown' }));
  assert.throws(() => validateOrder({ ...order, paymentMethod: 'cod', delivery: 'delivery' }));
});

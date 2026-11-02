const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const compile = path => ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const helpers = {};
vm.runInNewContext(compile('app/lib/paystack-webhook.ts'), { exports: helpers, require, Buffer });
const key = 'sk_test_fixture_only';
const reference = 'mascot-test-reference';
const event = { event: 'charge.success', data: { reference } };
function request(value = event, signature = true) {
  const body = JSON.stringify(value);
  return new Request('https://shop.example.com/api/paystack/webhook', { method: 'POST', body, headers: signature ? { 'x-paystack-signature': crypto.createHmac('sha512', key).update(body).digest('hex') } : {} });
}
function handler(transaction = {}, record = async () => {}, secret = key) {
  const exports = {};
  const verified = { reference, status: 'success', currency: 'GHS', domain: 'test', amount: 3180000, metadata: { source: 'mascot-store' }, ...transaction };
  const mocks = { '../../../lib/paystack-webhook': helpers, '../../../lib/paystack': { paystack: async () => verified }, '../../../lib/store-backend': { recordBackendOrder: record } };
  vm.runInNewContext(compile('app/api/paystack/webhook/route.ts'), { exports, require: name => mocks[name], process: { env: { PAYSTACK_SECRET_KEY: secret } }, Response, Buffer, Number });
  return exports.POST;
}
test('validates exact raw webhook bytes and rejects missing or malformed signatures', () => {
  const body = Buffer.from('{"a":1}');
  const signature = crypto.createHmac('sha512', key).update(body).digest('hex');
  assert.equal(helpers.validPaystackSignature(body, signature, key), true);
  for (const value of [null, '', 'abc', '0'.repeat(128)]) assert.equal(helpers.validPaystackSignature(body, value, key), false);
  assert.equal(helpers.validPaystackSignature(Buffer.from('{ "a":1 }'), signature, key), false);
});
test('rejects unsigned events and live keys without recording payment', async () => {
  const record = () => assert.fail('Must not record');
  assert.equal((await handler({}, record)(request(event, false))).status, 401);
  assert.equal((await handler({}, record, 'sk_live_fixture')(request())).status, 503);
});
test('verified test payments record server-verified amounts; retries can be processed', async () => {
  const calls = [];
  const post = handler({}, async (...args) => calls.push(args));
  assert.equal((await post(request())).status, 200);
  assert.equal((await post(request())).status, 200);
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], `/api/orders/${reference}/paid/`);
  assert.equal(calls[0][1].amount, 3180000);
});
test('rejects unsuccessful, foreign, live and malformed verification results', async () => {
  for (const override of [{ reference:'other' }, { status:'failed' }, { currency:'NGN' }, { domain:'live' }, { amount:0 }, { amount:1.5 }, { metadata:{ source:'other' } }]) {
    assert.equal((await handler(override, () => assert.fail('Must not record'))(request())).status, 400);
  }
});
test('returns retryable errors when order recording fails', async () => {
  assert.equal((await handler({}, async () => { throw new Error('Backend unavailable'); })(request())).status, 503);
});
test('ignores unrelated events and bounds streamed webhook payloads', async () => {
  assert.equal((await handler({}, () => assert.fail('Must not record'))(request({ event:'refund.processed' }))).status, 200);
  await assert.rejects(() => helpers.readWebhookBody(new Request('https://example.com', { method:'POST', body:'x'.repeat(100) }), 20));
});

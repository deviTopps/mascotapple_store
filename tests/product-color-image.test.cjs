const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/product-color-image.ts','utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS } }).outputText, { exports:exportsObject });
const { colorImageIndex } = exportsObject;
const images = ['/group.jpg','/api/store-media/products/41PVsRxmokL._AC_.jpg?v=123','/products/61082220-7775-4e3b-a95c-ee565b3b9903.webp','/products/51onh-WXsLL._AC_SL1380_-2.jpg'];
test('online legacy color names switch to verified matching photos', () => {
  assert.equal(colorImageIndex({},images,'BLUE'),3);
  assert.equal(colorImageIndex({},images,'ORANGE'),2);
  assert.equal(colorImageIndex({},images,'SILVER'),1);
  assert.equal(colorImageIndex({},images,'Deep Blue'),3);
});
test('explicit admin mapping wins; unrelated galleries never assume an order', () => {
  assert.equal(colorImageIndex({colorImagePositions:{Blue:2}},images,'BLUE'),1);
  assert.equal(colorImageIndex({},['/unknown1.jpg','/unknown2.jpg'],'BLUE'),0);
  assert.equal(colorImageIndex({},[...images].reverse(),'Silver'),2);
  assert.equal(colorImageIndex({},images,''),0);
});

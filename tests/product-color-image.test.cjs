const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/lib/product-color-image.ts','utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS, esModuleInterop:true } }).outputText, { exports:exportsObject, require: name => name === './product-color-photos.json' ? JSON.parse(fs.readFileSync('app/lib/product-color-photos.json','utf8')) : {} });
const { colorImageIndex } = exportsObject;
const images = ['/group.jpg','/api/store-media/products/41PVsRxmokL._AC_.jpg?v=123','/products/61082220-7775-4e3b-a95c-ee565b3b9903.webp','/products/51onh-WXsLL._AC_SL1380_-2.jpg'];
test('online legacy color names switch to verified matching photos', () => {
  assert.equal(colorImageIndex({slug: 'iphone-17-pro'},images,'BLUE'),3);
  assert.equal(colorImageIndex({slug: 'iphone-17-pro'},images,'ORANGE'),2);
  assert.equal(colorImageIndex({slug: 'iphone-17-pro'},images,'SILVER'),1);
  assert.equal(colorImageIndex({slug: 'iphone-17-pro'},images,'Deep Blue'),3);
});
test('explicit admin mapping wins; unrelated galleries never assume an order', () => {
  assert.equal(colorImageIndex({colorImagePositions:{Blue:2}},images,'BLUE'),1);
  assert.equal(colorImageIndex({slug: 'iphone-17-pro'},['/unknown1.jpg','/unknown2.jpg'],'BLUE'),0);
  assert.equal(colorImageIndex({slug: 'iphone-17-pro'},[...images].reverse(),'Silver'),2);
  assert.equal(colorImageIndex({slug: 'iphone-17-pro'},images,''),0);
});
test('every catalog mapping finds its photo after gallery reordering', () => {
  const mappings = JSON.parse(fs.readFileSync('app/lib/product-color-photos.json','utf8'));
  for (const [slug, colors] of Object.entries(mappings)) {
    const gallery = [...new Set(Object.values(colors))].reverse().map(file => `/api/store-media/products/${file}?v=42`);
    for (const [color,file] of Object.entries(colors)) {
      assert.equal(gallery[colorImageIndex({slug},gallery,color.toUpperCase())].split('?')[0].split('/').pop(),file,`${slug}: ${color}`);
    }
  }
});
test('missing finishes are reported without borrowing another product photo', () => {
  assert.equal(exportsObject.matchingColorImageIndex({slug:'jbl-flip-7'},['/products/71VdQhHUjL_Tr8DAyo._AC_SL1500_.jpg'],'RED'),null);
  assert.equal(exportsObject.matchingColorImageIndex({slug:'unknown-product'},images,'BLUE'),null);
});

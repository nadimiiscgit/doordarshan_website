const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const csvImport = require('../js/csv-import.js');

test('parses quoted commas, escaped quotes, Indian currency, and CRLF rows', () => {
  const csv = '\uFEFFProduct ID,Item Name,Brand,Category,Model,MRP,Rate,Qty,Description\r\n' +
    '51,"LG 43"" QLED, Smart TV",LG,TV,43QLED,"₹ 64,999","₹ 52,000","3 Nos","Bright, clear picture"\r\n';
  const parsed = csvImport.parseProductCsv(csv);

  assert.equal(parsed.mode, 'catalog');
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].name, 'LG 43" QLED, Smart TV');
  assert.equal(parsed.rows[0].id, 51);
  assert.equal(parsed.rows[0].mrp, 64999);
  assert.equal(parsed.rows[0].price, 52000);
  assert.equal(parsed.rows[0].stock, 3);
  assert.equal(parsed.rows[0].description, 'Bright, clear picture');
  assert.deepEqual(parsed.errors, []);
});

test('recognizes alternate headers and semicolon-delimited product files', () => {
  const parsed = csvImport.parseProductCsv(
    'Item Name;Manufacturer;Category;Model Number;List Price;Selling Rate;Closing Stock\n' +
    'Samsung Refrigerator;Samsung;Refrigerators;RT28;₹ 48,000;₹ 42,500;2 units'
  );

  assert.equal(parsed.delimiter, ';');
  assert.equal(parsed.mode, 'catalog');
  assert.equal(parsed.rows[0].brand, 'Samsung');
  assert.equal(parsed.rows[0].category, 'Refrigerators');
  assert.equal(parsed.rows[0].mrp, 48000);
  assert.equal(parsed.rows[0].price, 42500);
  assert.equal(parsed.rows[0].stock, 2);
});

test('parses Indian digit grouping but rejects words that could corrupt a rate', () => {
  assert.equal(csvImport.parseMoney('₹ 1,23,45,678'), 12345678);
  assert.equal(csvImport.parseMoney('INR 1,234,567.50'), 1234567.5);
  assert.equal(csvImport.parseMoney('1.2 lakh'), null);
  assert.equal(csvImport.parseMoney('rate approx. 52000'), null);
});

test('parses the provided stock summary as stock-only and never invents rates or database IDs', () => {
  const file = path.join(__dirname, '..', 'data', 'DOORDARSHAN ELECTRONIC 2017-2026_Stock_Summary.csv');
  const parsed = csvImport.parseProductCsv(fs.readFileSync(file, 'utf8'));

  assert.equal(parsed.mode, 'stock');
  assert.ok(parsed.rows.length > 0);
  assert.equal(parsed.rows[0].id, null);
  assert.equal(parsed.rows[0].price, null);
  assert.equal(parsed.rows[0].mrp, null);
  assert.equal(parsed.rows[0].stock, 1);
  assert.match(parsed.rows[0].name, /BUSH LED 43" BT QLED 1\/8/);
});

test('parses the provided refrigerator stock list without treating line serials as product IDs', () => {
  const file = path.join(__dirname, '..', 'data', 'Fridge stock.csv');
  const parsed = csvImport.parseProductCsv(fs.readFileSync(file, 'utf8'));

  assert.equal(parsed.mode, 'stock');
  assert.ok(parsed.rows.length > 0);
  assert.equal(parsed.rows[0].id, null);
  assert.equal(parsed.rows[0].category, 'refrigerator');
  assert.equal(parsed.rows[0].stock, 1);
});

test('stock-only import changes stock for an exact existing product and leaves its prices alone', () => {
  const parsed = csvImport.parseProductCsv('"Items","","",""\n"1","LG REF B231ASLD","4 NO"');
  const plan = csvImport.buildImportPlan(parsed, [
    { id: 72, name: 'LG REF B231ASLD', model: 'B231ASLD', mrp: 42990, price: 38990, stock: 1 }
  ], [{ key: 'refrigerator' }]);

  assert.deepEqual(plan.errors, []);
  assert.deepEqual(plan.records, [{ mode: 'stock', recordNumber: 2, id: 72, name: 'LG REF B231ASLD', stock: 4 }]);
});

test('does not guess a stock match or import incomplete catalog rows', () => {
  const stockParsed = csvImport.parseProductCsv('"Items","","",""\n"1","Unknown Product Model X","2 NO"');
  const stockPlan = csvImport.buildImportPlan(stockParsed, [
    { id: 72, name: 'LG REF B231ASLD', model: 'B231ASLD', mrp: 42990, price: 38990, stock: 1 }
  ], [{ key: 'refrigerator' }]);
  assert.equal(stockPlan.records.length, 0);
  assert.match(stockPlan.errors[0].message, /No exact existing product matched/);

  const catalogParsed = csvImport.parseProductCsv('Name,Brand,Category,MRP,Price,Stock\nTV,Sony,TV,,0,');
  const catalogPlan = csvImport.buildImportPlan(catalogParsed, [], [{ key: 'tv' }]);
  assert.equal(catalogPlan.records.length, 0);
  assert.ok(catalogPlan.errors.some(error => /sale price\/rate/.test(error.message)));
  assert.ok(catalogPlan.errors.some(error => /MRP/.test(error.message)));
  assert.ok(catalogPlan.errors.some(error => /stock quantity/.test(error.message)));
});

test('rejects malformed quoted CSV instead of silently shifting columns', () => {
  assert.throws(
    () => csvImport.parseProductCsv('Name,Price\n"Unclosed TV,42000'),
    /unfinished quoted value/
  );
});

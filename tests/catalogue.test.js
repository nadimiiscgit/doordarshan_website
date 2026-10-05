const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/supabase-config.js'), 'utf8');

function context(result) {
  const calls = [];
  const query = {
    select(columns) { calls.push(['select', columns]); return this; },
    eq(key, value) { calls.push(['eq', key, value]); return this; },
    order(key) { calls.push(['order', key]); return this; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
    range(start, end) { calls.push(['range', start, end]); return Promise.resolve(result); }
  };
  const db = { from(table) { calls.push(['from', table]); return query; } };
  const sandbox = { supabase: { createClient: () => db }, console };
  vm.createContext(sandbox); vm.runInContext(source, sandbox);
  return { sandbox, calls };
}

test('a valid empty public response stays empty and reads only the public projection', async () => {
  const { sandbox, calls } = context({ data: [], error: null, count: 0 });
  const result = await sandbox.fetchPublicProducts({ category: 'tv', page: 2, pageSize: 12 });
  assert.equal(result.count, 0);
  assert.equal(result.products.length, 0);
  assert.ok(calls.some(call => call[0] === 'from' && call[1] === 'catalogue_products'));
  assert.ok(calls.some(call => call[0] === 'range' && call[1] === 12 && call[2] === 23));
  assert.ok(calls.some(call => call[0] === 'select' && !call[1].includes('stock') && !call[1].includes('reviews')));
});

test('a valid empty category response is not replaced by built-in categories', async () => {
  const { sandbox } = context({ data: [], error: null });
  const categories = await sandbox.fetchCategoriesFromDB();
  assert.equal(categories.length, 0);
});

test('public query failures do not turn into live products', async () => {
  const { sandbox } = context({ data: null, error: new Error('offline') });
  await assert.rejects(sandbox.fetchPublicProducts(), /offline/);
});

test('script and protocol-relative image URLs are rejected', () => {
  const { sandbox } = context({ data: [], error: null, count: 0 });
  assert.equal(sandbox.safeImageUrl('javascript:alert(1)'), '');
  assert.equal(sandbox.safeImageUrl('//example.com/image.png'), '');
});

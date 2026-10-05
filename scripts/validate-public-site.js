const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const errors = [];
for (const page of ['index.html', 'category.html', 'product.html', 'store.html']) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  if (!html.includes('css/site.css') || !html.includes('js/site.js')) errors.push(`${page} does not load the shared public runtime.`);
  if (/js\/products-data\.js|js\/cart\.js|js\/main\.js|v2-tailwind\.css/i.test(html)) errors.push(`${page} loads a legacy retail asset.`);
  if (/rating|reviews|add to cart|checkout|explore our products/i.test(html)) errors.push(`${page} contains a removed retail claim or action.`);
}
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog-snapshot.json'), 'utf8'));
if (!Array.isArray(snapshot.products)) errors.push('Snapshot products must be an array.');
for (const row of snapshot.products || []) {
  if (['price', 'mrp', 'stock', 'rating', 'reviews'].some(key => key in row)) errors.push(`Snapshot product ${row.id} contains an unsafe field.`);
}
const helper = fs.readFileSync(path.join(root, 'js/supabase-config.js'), 'utf8');
if (!helper.includes("from('catalogue_products')")) errors.push('Public products are not read from the approved projection.');
if (errors.length) { errors.forEach(error => console.error(error)); process.exit(1); }
console.log('Public page and sanitized snapshot checks passed.');

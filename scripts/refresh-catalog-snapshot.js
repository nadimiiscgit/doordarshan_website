#!/usr/bin/env node
// Read-only live comparison by default. --write creates a reviewed, price-free public fallback.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const target = path.join(root, 'data/catalog-snapshot.json');
const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!base || !key) { console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY.'); process.exit(2); }
const fields = 'id,name,brand,model,category,subcategory,image,images,type,specs,description';
function publicImage(value) {
  if (typeof value !== 'string' || /\/brands?\/|brand_images/i.test(value)) return '';
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
  catch { return ''; }
}

async function getRows() {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const url = `${base.replace(/\/$/, '')}/rest/v1/catalogue_products?select=${fields}&order=id.asc&limit=500&offset=${offset}`;
    const response = await fetch(url, { headers: { apikey: key } });
    if (!response.ok) throw new Error(`Supabase responded HTTP ${response.status}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Supabase returned a non-array response.');
    rows.push(...batch);
    if (batch.length < 500) break;
  }
  return rows.map(row => ({
    id: row.id, name: row.name, brand: row.brand, model: row.model,
    category: row.category, subcategory: row.subcategory,
    image: publicImage(row.image), images: (Array.isArray(row.images) ? row.images : []).map(publicImage).filter(Boolean),
    type: Array.isArray(row.type) ? row.type : [], specs: row.specs || {}, description: row.description || ''
  }));
}

(async () => {
  const live = await getRows();
  const saved = JSON.parse(fs.readFileSync(target, 'utf8'));
  const oldIds = new Set(saved.products.map(p => String(p.id)));
  const newIds = new Set(live.map(p => String(p.id)));
  const added = live.filter(p => !oldIds.has(String(p.id))).map(p => p.id);
  const removed = saved.products.filter(p => !newIds.has(String(p.id))).map(p => p.id);
  const changed = live.filter(p => oldIds.has(String(p.id)) && JSON.stringify(p) !== JSON.stringify(saved.products.find(old => String(old.id) === String(p.id)))).map(p => p.id);
  console.log(`Live approved: ${live.length}; snapshot: ${saved.products.length}; added: ${added.length}; removed: ${removed.length}; changed: ${changed.length}.`);
  if (added.length || removed.length || changed.length) console.log(`IDs — added: ${added.join(',') || '-'}; removed: ${removed.join(',') || '-'}; changed: ${changed.join(',') || '-'}`);
  if (process.argv.includes('--write')) {
    fs.writeFileSync(target, JSON.stringify({ captured_at: new Date().toISOString(), products: live }, null, 2) + '\n');
    console.log('Sanitized snapshot updated. Review the diff before committing.');
  } else if (added.length || removed.length || changed.length) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 2; });

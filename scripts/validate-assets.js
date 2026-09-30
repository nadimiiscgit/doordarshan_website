const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const errors = [];
const checkedExtensions = new Set(['.html', '.css', '.js', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2']);

function checkLocalAsset(file, value, source) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) return;

  let localPath;
  try {
    localPath = decodeURIComponent(value.split(/[?#]/, 1)[0]);
  } catch (error) {
    errors.push(`${file}: invalid encoded ${source} path: ${value}`);
    return;
  }
  if (!localPath) return;

  const extension = path.extname(localPath).toLowerCase();
  if (!checkedExtensions.has(extension)) return; // Vercel rewrite or query-only route.

  const absolutePath = path.resolve(root, localPath.replace(/^\/+/, ''));
  if (!absolutePath.startsWith(root + path.sep) || !fs.existsSync(absolutePath)) {
    errors.push(`${file}: missing local ${source} target: ${value}`);
  }
}

for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const attributes = html.matchAll(/\b(src|href)\s*=\s*(["'])(.*?)\2/gi);

  for (const match of attributes) {
    const [, attribute, , value] = match;
    checkLocalAsset(file, value, attribute);
  }

  const inlineCss = html.replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
  for (const match of inlineCss.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'"\s]+))\s*\)/gi)) {
    checkLocalAsset(file, match[1] || match[2] || match[3] || '', 'CSS url()');
  }
}

try {
  JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
} catch (error) {
  errors.push(`vercel.json is not valid JSON: ${error.message}`);
}

if (errors.length) {
  console.error('Local HTML asset checks failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Local HTML assets and vercel.json checks passed.');

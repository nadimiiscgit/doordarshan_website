const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const errors = [];

function checkJavaScript(source, label) {
  try {
    new vm.Script(source, { filename: label });
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
  }
}

function visitJavaScript(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) visitJavaScript(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.js')) {
      checkJavaScript(fs.readFileSync(fullPath, 'utf8'), path.relative(root, fullPath));
    }
  }
}

for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi);
  let index = 0;
  for (const match of scripts) {
    index += 1;
    if (/\btype\s*=\s*["'](?:application\/json|application\/ld\+json)["']/i.test(match[1])) continue;
    if (/\bsrc\s*=/i.test(match[1])) continue;
    const startLine = html.slice(0, match.index).split('\n').length;
    checkJavaScript(match[2], `${file}:inline-script-${index} (starts at line ${startLine})`);
  }
}

visitJavaScript(path.join(root, 'js'));

if (errors.length) {
  console.error('JavaScript syntax errors found:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('JavaScript syntax checks passed for inline HTML scripts and js/**/*.js.');

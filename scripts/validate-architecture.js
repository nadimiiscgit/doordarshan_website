/**
 * Architectural Linting Gate & Structural Validator
 * 
 * Enforces:
 * 1. Strict repository isolation (no direct supabase.from or createClient calls in UI/HTML views).
 * 2. Antigravity rule line count ceiling (<= 500 lines per rule file to avoid context bloat/hallucinations).
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const UI_FILES = ['index.html', 'category.html', 'product.html', 'store.html', 'admin.html', 'about.html', 'contact.html'];
const FORBIDDEN_TOKENS = ['supabase.from', 'createClient('];
const UNAUTHORIZED_CREDITS = ['safaz', '7058011774'];
const RULES_DIR = path.join(ROOT_DIR, '.antigravity', 'rules');
const MAX_RULE_LINES = 500;

let hasViolations = false;
const violations = [];

console.log('='.repeat(65));
console.log('🔍 RUNNING ARCHITECTURAL INTEGRITY & LINTING GATE');
console.log('='.repeat(65));

// 1. Scan UI HTML files for direct database / client initialization calls
console.log('\n[Phase 1] Scanning UI files for direct DB queries / client instantiations...');

UI_FILES.forEach((file) => {
  const filePath = path.join(ROOT_DIR, file);
  if (!fs.existsSync(filePath)) {
    violations.push(`File missing: Expected UI view "${file}" was not found.`);
    hasViolations = true;
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  FORBIDDEN_TOKENS.forEach((token) => {
    if (content.includes(token)) {
      const errorMsg = `[ARCH-01] Direct DB access violation in "${file}": Contains "${token}". ` +
        `Direct client-side DB initialization or database calls bypass the repository pattern layer in 'js/supabase-config.js'.`;
      violations.push(errorMsg);
      hasViolations = true;
    }
  });

  const contentLower = content.toLowerCase();
  UNAUTHORIZED_CREDITS.forEach((credit) => {
    if (contentLower.includes(credit)) {
      const errorMsg = `[ARCH-03] Unauthorized credit/signature violation in "${file}": Contains unauthorized term "${credit}". ` +
        `No external third-party credits, developer names, or unauthorized phone numbers are permitted on the UI.`;
      violations.push(errorMsg);
      hasViolations = true;
    }
  });

  if (!violations.some(v => v.includes(file))) {
    console.log(`  ✓ ${file} passed repository pattern checks`);
  }
});

// 2. Scan .antigravity/rules/ files for context limit ceiling (<= 500 lines)
console.log('\n[Phase 2] Verifying .antigravity/rules/ size boundaries (<= 500 lines)...');

if (!fs.existsSync(RULES_DIR)) {
  violations.push(`Rules directory missing: "${RULES_DIR}" not found.`);
  hasViolations = true;
} else {
  const ruleFiles = fs.readdirSync(RULES_DIR).filter(f => f.endsWith('.md'));
  if (ruleFiles.length === 0) {
    violations.push(`No markdown rule files found in "${RULES_DIR}".`);
    hasViolations = true;
  }

  ruleFiles.forEach((file) => {
    const filePath = path.join(RULES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lineCount = content.split(/\r?\n/).length;

    if (lineCount > MAX_RULE_LINES) {
      const errorMsg = `[ARCH-02] Hallucination risk validation error in "${file}": ` +
        `Line count is ${lineCount}, which exceeds the ${MAX_RULE_LINES}-line ceiling.`;
      violations.push(errorMsg);
      hasViolations = true;
    } else {
      console.log(`  ✓ .antigravity/rules/${file} (${lineCount} lines / max ${MAX_RULE_LINES})`);
    }
  });
}

// 3. Final Evaluation
console.log('\n' + '='.repeat(65));
if (hasViolations) {
  console.error('❌ ARCHITECTURAL VIOLATIONS DETECTED:\n');
  violations.forEach((v, idx) => console.error(`  ${idx + 1}. ${v}`));
  console.error('\nPlease resolve the violations above to pass CI/CD gates.\n');
  process.exit(1);
} else {
  console.log('✅ ALL ARCHITECTURAL INTEGRITY GATES PASSED CLEANLY');
  console.log('   - Repository isolation verified across all UI entrypoints.');
  console.log('   - Model context rule ceilings adhered to (< 500 lines).');
  console.log('='.repeat(65) + '\n');
  process.exit(0);
}

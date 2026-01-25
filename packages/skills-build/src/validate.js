import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');
const skillsDir = path.join(rootDir, 'skills');

function validateSkill(skillDir) {
  const errors = [];
  const warnings = [];

  // Check required files
  const requiredFiles = ['SKILL.md', 'metadata.json'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(skillDir, file))) {
      errors.push(`Missing required file: ${file}`);
    }
  }

  // Check rules directory
  const rulesDir = path.join(skillDir, 'rules');
  if (!fs.existsSync(rulesDir)) {
    errors.push('Missing rules directory');
  } else {
    // Check for sections file
    if (!fs.existsSync(path.join(rulesDir, '_sections.md'))) {
      warnings.push('Missing _sections.md file');
    }

    // Validate rule files
    const ruleFiles = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));

    for (const file of ruleFiles) {
      const content = fs.readFileSync(path.join(rulesDir, file), 'utf-8');

      // Check frontmatter
      if (!content.startsWith('---')) {
        errors.push(`${file}: Missing frontmatter`);
        continue;
      }

      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        errors.push(`${file}: Invalid frontmatter format`);
        continue;
      }

      const frontmatter = frontmatterMatch[1];
      if (!frontmatter.includes('title:')) {
        errors.push(`${file}: Missing title in frontmatter`);
      }
      if (!frontmatter.includes('impact:')) {
        warnings.push(`${file}: Missing impact in frontmatter`);
      }

      // Check for incorrect/correct pattern
      if (!content.includes('**Incorrect') || !content.includes('**Correct')) {
        warnings.push(`${file}: Missing Incorrect/Correct pattern`);
      }
    }

    console.log(`Found ${ruleFiles.length} rule files`);
  }

  // Validate metadata
  const metadataPath = path.join(skillDir, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      if (!metadata.version) warnings.push('metadata.json: Missing version');
      if (!metadata.abstract) warnings.push('metadata.json: Missing abstract');
    } catch (e) {
      errors.push('metadata.json: Invalid JSON');
    }
  }

  return { errors, warnings };
}

// Validate all skills
const skills = fs.readdirSync(skillsDir).filter(d =>
  fs.statSync(path.join(skillsDir, d)).isDirectory()
);

let hasErrors = false;

for (const skill of skills) {
  console.log(`\nValidating: ${skill}`);
  console.log('='.repeat(40));

  const { errors, warnings } = validateSkill(path.join(skillsDir, skill));

  if (errors.length > 0) {
    hasErrors = true;
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  ❌ ${e}`));
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(`  ⚠️  ${w}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('  ✅ All checks passed');
  }
}

process.exit(hasErrors ? 1 : 0);

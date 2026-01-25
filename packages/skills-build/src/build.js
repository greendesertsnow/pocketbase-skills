import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');
const skillsDir = path.join(rootDir, 'skills');

function parseMarkdownFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatter = {};
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { frontmatter, content: match[2] };
}

function buildAgentsMd(skillDir) {
  const metadataPath = path.join(skillDir, 'metadata.json');
  const rulesDir = path.join(skillDir, 'rules');

  if (!fs.existsSync(metadataPath) || !fs.existsSync(rulesDir)) {
    console.error('Missing metadata.json or rules directory');
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const sectionsPath = path.join(rulesDir, '_sections.md');
  const sectionsContent = fs.existsSync(sectionsPath)
    ? fs.readFileSync(sectionsPath, 'utf-8')
    : '';

  // Parse sections
  const sections = [];
  const sectionMatches = sectionsContent.matchAll(/## (\d+)\. ([^(]+) \((\w+)\)\n\*\*Impact:\*\* (\w+[-\w]*)\n\*\*Description:\*\* ([^\n]+)/g);
  for (const match of sectionMatches) {
    sections.push({
      num: parseInt(match[1]),
      name: match[2].trim(),
      prefix: match[3],
      impact: match[4],
      description: match[5]
    });
  }

  // Get all rule files
  const ruleFiles = fs.readdirSync(rulesDir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .sort();

  // Group rules by section
  const rulesBySection = {};
  for (const section of sections) {
    rulesBySection[section.prefix] = [];
  }

  for (const file of ruleFiles) {
    const content = fs.readFileSync(path.join(rulesDir, file), 'utf-8');
    const { frontmatter, content: ruleContent } = parseMarkdownFrontmatter(content);
    const prefix = file.split('-')[0];

    if (rulesBySection[prefix]) {
      rulesBySection[prefix].push({
        file,
        title: frontmatter.title || file.replace('.md', ''),
        impact: frontmatter.impact || 'MEDIUM',
        impactDescription: frontmatter.impactDescription || '',
        content: ruleContent.trim()
      });
    }
  }

  // Build AGENTS.md
  let output = `# PocketBase Best Practices

**Version ${metadata.version}**
${metadata.organization}
${metadata.date}

> This document is optimized for AI agents and LLMs. Rules are prioritized by performance and security impact.

---

## Abstract

${metadata.abstract}

---

## Table of Contents

`;

  // Build TOC
  let ruleCounter = {};
  for (const section of sections) {
    const sectionRules = rulesBySection[section.prefix] || [];
    const anchorName = section.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    output += `${section.num}. [${section.name}](#${anchorName}) - **${section.impact}**\n`;

    ruleCounter[section.prefix] = 0;
    for (const rule of sectionRules) {
      ruleCounter[section.prefix]++;
      const ruleAnchor = `${section.num}${ruleCounter[section.prefix]}-${rule.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;
      output += `   - ${section.num}.${ruleCounter[section.prefix]} [${rule.title}](#${ruleAnchor})\n`;
    }
    output += '\n';
  }

  output += '---\n\n';

  // Build sections
  ruleCounter = {};
  for (const section of sections) {
    const sectionRules = rulesBySection[section.prefix] || [];
    output += `## ${section.num}. ${section.name}\n\n`;
    output += `**Impact: ${section.impact}**\n\n`;
    output += `${section.description}\n\n`;

    ruleCounter[section.prefix] = 0;
    for (const rule of sectionRules) {
      ruleCounter[section.prefix]++;
      output += `### ${section.num}.${ruleCounter[section.prefix]} ${rule.title}\n\n`;
      output += `**Impact: ${rule.impact}${rule.impactDescription ? ` (${rule.impactDescription})` : ''}**\n\n`;
      output += `${rule.content}\n\n`;
    }
  }

  // Add references
  output += `---\n\n## References\n\n`;
  for (const ref of metadata.references || []) {
    output += `- ${ref}\n`;
  }

  // Write output
  const outputPath = path.join(skillDir, 'AGENTS.md');
  fs.writeFileSync(outputPath, output);
  console.log(`Built: ${outputPath}`);
}

// Find and build all skills
const skills = fs.readdirSync(skillsDir).filter(d =>
  fs.statSync(path.join(skillsDir, d)).isDirectory()
);

for (const skill of skills) {
  console.log(`Building skill: ${skill}`);
  buildAgentsMd(path.join(skillsDir, skill));
}

console.log('Build complete!');

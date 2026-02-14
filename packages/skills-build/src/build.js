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

function sectionToFilename(sectionName) {
  return sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '.md';
}

function buildSkill(skillDir) {
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
      // Strip leading ## heading from content (will be generated as section heading)
      const cleanContent = ruleContent.trim().replace(/^## [^\n]+\n+/, '');

      rulesBySection[prefix].push({
        file,
        title: frontmatter.title || file.replace('.md', ''),
        impact: frontmatter.impact || 'MEDIUM',
        impactDescription: frontmatter.impactDescription || '',
        content: cleanContent
      });
    }
  }

  // Create references directory
  const refsDir = path.join(skillDir, 'references');
  if (!fs.existsSync(refsDir)) {
    fs.mkdirSync(refsDir, { recursive: true });
  }

  // Build per-category reference files
  for (const section of sections) {
    const sectionRules = rulesBySection[section.prefix] || [];
    const filename = sectionToFilename(section.name);

    let output = `# ${section.name}\n\n`;
    output += `**Impact: ${section.impact}**\n\n`;
    output += `${section.description}\n\n---\n\n`;

    let ruleNum = 0;
    for (const rule of sectionRules) {
      ruleNum++;
      output += `## ${ruleNum}. ${rule.title}\n\n`;
      output += `**Impact: ${rule.impact}${rule.impactDescription ? ` (${rule.impactDescription})` : ''}**\n\n`;
      output += `${rule.content}\n\n`;
    }

    const refPath = path.join(refsDir, filename);
    fs.writeFileSync(refPath, output);
    console.log(`  Built: references/${filename} (${sectionRules.length} rules)`);
  }

  // Build lightweight AGENTS.md (index only)
  let agentsOutput = `# PocketBase Best Practices\n\n`;
  agentsOutput += `**Version ${metadata.version}**\n`;
  agentsOutput += `${metadata.organization}\n`;
  agentsOutput += `${metadata.date}\n\n`;
  agentsOutput += `> ${metadata.abstract}\n\n`;
  agentsOutput += `---\n\n`;
  agentsOutput += `## Categories\n\n`;
  agentsOutput += `Detailed rules are split by category. Load only the relevant file:\n\n`;

  for (const section of sections) {
    const sectionRules = rulesBySection[section.prefix] || [];
    const filename = sectionToFilename(section.name);

    agentsOutput += `### ${section.num}. [${section.name}](references/${filename}) - **${section.impact}**\n\n`;
    agentsOutput += `${section.description}\n\n`;

    let ruleNum = 0;
    for (const rule of sectionRules) {
      ruleNum++;
      agentsOutput += `- ${section.num}.${ruleNum} ${rule.title}\n`;
    }
    agentsOutput += '\n';
  }

  agentsOutput += `---\n\n## References\n\n`;
  for (const ref of metadata.references || []) {
    agentsOutput += `- ${ref}\n`;
  }

  const agentsPath = path.join(skillDir, 'AGENTS.md');
  fs.writeFileSync(agentsPath, agentsOutput);
  console.log(`  Built: AGENTS.md (lightweight index)`);
}

// Find and build all skills
const skills = fs.readdirSync(skillsDir).filter(d =>
  fs.statSync(path.join(skillsDir, d)).isDirectory()
);

for (const skill of skills) {
  console.log(`Building skill: ${skill}`);
  buildSkill(path.join(skillsDir, skill));
}

console.log('\nBuild complete!');

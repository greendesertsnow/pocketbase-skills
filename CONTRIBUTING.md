# Contributing to PocketBase Agent Skills

Thank you for your interest in contributing to PocketBase Agent Skills!

## How to Contribute

### Adding a New Rule

1. **Fork the repository** and create a new branch

2. **Create a rule file** in `skills/pocketbase-best-practices/rules/`
   - Use the appropriate category prefix (see below)
   - Follow the template in `rules/_template.md`

3. **Build and validate**
   ```bash
   npm run build
   npm run validate
   ```

4. **Submit a pull request** with:
   - Description of the rule
   - Why it's important
   - Any references to official docs

### Category Prefixes

| Prefix | Category | Impact |
|--------|----------|--------|
| `coll-` | Collection Design | CRITICAL |
| `rules-` | API Rules & Security | CRITICAL |
| `auth-` | Authentication | CRITICAL |
| `sdk-` | SDK Usage | HIGH |
| `query-` | Query Performance | HIGH |
| `realtime-` | Realtime | MEDIUM |
| `file-` | File Handling | MEDIUM |
| `deploy-` | Production & Deployment | LOW-MEDIUM |

### Rule Template

```markdown
---
title: Clear, Action-Oriented Title
impact: CRITICAL|HIGH|MEDIUM|LOW
impactDescription: Brief description of impact
tags: relevant, comma-separated, tags
---

## [Rule Title]

[1-2 sentence explanation of the problem and why it matters]

**Incorrect (describe the problem):**

\`\`\`javascript
// Comment explaining what makes this problematic
const example = badCode();
\`\`\`

**Correct (describe the solution):**

\`\`\`javascript
// Comment explaining why this is better
const example = goodCode();
\`\`\`

[Optional: Additional context, edge cases, or trade-offs]

Reference: [PocketBase Docs](https://pocketbase.io/docs/)
```

### Guidelines

- **Be specific**: Rules should address concrete patterns, not general advice
- **Show don't tell**: Include realistic code examples
- **Explain the why**: Help users understand the reasoning
- **Keep it concise**: Focus on the most important points
- **Test your examples**: Ensure code is syntactically correct
- **Reference official docs**: Link to authoritative sources

### Improving Existing Rules

- Fix errors in code examples
- Add missing edge cases
- Improve explanations
- Update for new PocketBase versions
- Add better references

### Reporting Issues

If you find an error or have a suggestion:
1. Check existing issues first
2. Open a new issue with:
   - Rule file affected
   - Description of the problem
   - Suggested fix (if any)

## Development

```bash
# Install dependencies
npm install

# Build AGENTS.md from rules
npm run build

# Validate rule structure
npm run validate

# Format code
npm run format
```

## Code of Conduct

- Be respectful and constructive
- Focus on improving the skill quality
- Help others learn

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

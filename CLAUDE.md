# PocketBase Agent Skills - Claude Code Configuration

This repository contains agent skills for PocketBase development best practices.

## For Users

When working with PocketBase code, Claude Code will automatically reference the best practices in `skills/pocketbase-best-practices/AGENTS.md`.

The skill covers:
- Collection design and schema patterns
- API rules and security best practices
- Authentication flows (password, OAuth2, MFA)
- JavaScript SDK usage patterns
- Query performance optimization
- Realtime subscription handling
- File upload and serving
- Production deployment

## For Contributors

### Adding New Rules

1. Create a new rule file in `skills/pocketbase-best-practices/rules/`
2. Use the appropriate prefix for the category:
   - `coll-` for Collection Design
   - `rules-` for API Rules & Security
   - `auth-` for Authentication
   - `sdk-` for SDK Usage
   - `query-` for Query Performance
   - `realtime-` for Realtime
   - `file-` for File Handling
   - `deploy-` for Production & Deployment

3. Follow the template in `rules/_template.md`
4. Run `npm run build` to regenerate AGENTS.md
5. Run `npm run validate` to check for issues

### Rule Format

Each rule should include:
- YAML frontmatter with title, impact, impactDescription, and tags
- Clear explanation of the problem
- **Incorrect** code example with explanation
- **Correct** code example with explanation
- Reference link to official docs

### Building

```bash
npm run build     # Regenerate AGENTS.md
npm run validate  # Check rule structure
```

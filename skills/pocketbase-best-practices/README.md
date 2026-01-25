# PocketBase Best Practices Skill

Development best practices and performance optimization guidelines for PocketBase v0.36+.

## Overview

This skill provides AI agents with comprehensive guidance for building PocketBase applications, covering:

- **Collection Design** - Schema patterns, field types, relations, indexes
- **API Rules & Security** - Access control, filter expressions, security patterns
- **Authentication** - Password auth, OAuth2, MFA, token management
- **SDK Usage** - JavaScript SDK patterns, error handling, auth stores
- **Query Performance** - Pagination, expansion, batch operations
- **Realtime** - SSE subscriptions, event handling
- **File Handling** - Uploads, serving, validation
- **Production** - Deployment, backup, configuration

## Installation

```bash
npx skills add pocketbase/agent-skills --skill pocketbase-best-practices
```

## Usage

Once installed, agents will automatically apply these best practices when working with PocketBase code.

**Example prompts:**

- "Design a PocketBase schema for a multi-tenant SaaS"
- "Help me secure my API rules"
- "Set up Google OAuth2 authentication"
- "Optimize my PocketBase queries"

## Rule Categories

| Category | Priority | Rules |
|----------|----------|-------|
| Collection Design | CRITICAL | 6 rules |
| API Rules & Security | CRITICAL | 5 rules |
| Authentication | CRITICAL | 5 rules |
| SDK Usage | HIGH | 7 rules |
| Query Performance | HIGH | 7 rules |
| Realtime | MEDIUM | 4 rules |
| File Handling | MEDIUM | 3 rules |
| Production & Deployment | LOW-MEDIUM | 5 rules |

## Files

- `SKILL.md` - Agent instructions and category overview
- `AGENTS.md` - Complete compiled guide (auto-generated)
- `rules/` - Individual rule files by category
- `metadata.json` - Version and reference information

# PocketBase Agent Skills

[![skills.sh](https://img.shields.io/badge/skills.sh-greendesertsnow%2Fpocketbase--skills-blue)](https://skills.sh)
[![Agent Skills](https://img.shields.io/badge/format-Agent%20Skills-green)](https://agentskills.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Agent Skills for PocketBase development. Works with Claude Code, Cursor, GitHub Copilot, Gemini CLI, and other [Agent Skills-compatible](https://agentskills.io/) tools.

## Installation

```bash
npx skills add greendesertsnow/pocketbase-skills
```

### Alternative Installation Methods

**Claude Code:**
```bash
claude /add-skill greendesertsnow/pocketbase-skills
```

**Manual:** Clone and add to your project's `.claude/settings.json`:
```json
{
  "includedFiles": ["path/to/skills/pocketbase-best-practices/AGENTS.md"]
}
```

## Available Skills

<details>
<summary><strong>pocketbase-best-practices</strong></summary>

PocketBase development best practices and performance optimization guidelines.
Contains rules across 8 categories, prioritized by impact.

**Use when:**

- Designing collections and schemas
- Implementing API rules and access control
- Setting up authentication flows
- Using the PocketBase JavaScript SDK
- Optimizing query performance
- Working with realtime subscriptions
- Handling file uploads
- Deploying to production

**Categories covered:**

- Collection Design (Critical)
- API Rules & Security (Critical)
- Authentication (Critical)
- SDK Usage (High)
- Query Performance (High)
- Realtime (Medium)
- File Handling (Medium)
- Production & Deployment (Low-Medium)

</details>

## Usage

Skills are automatically available once installed. The agent will use them when
relevant tasks are detected.

**Examples:**

```
Help me design a PocketBase collection for a blog
```

```
Review my API rules for security issues
```

```
Set up OAuth2 authentication with Google
```

```
Optimize my PocketBase queries
```

## Skill Structure

Each skill contains:

- `SKILL.md` - Instructions for the agent
- `AGENTS.md` - Compiled rules document (generated)
- `rules/` - Individual rule files
- `metadata.json` - Version and metadata

## Contributing

1. Fork the repository
2. Create a new branch for your changes
3. Add or modify rules following the template in `rules/_template.md`
4. Run `npm run build` to regenerate AGENTS.md
5. Submit a pull request

## License

MIT

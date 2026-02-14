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

Skills are automatically available once installed. The agent will reference best practices when relevant PocketBase tasks are detected.

### Schema & Collection Design

```
Design a PocketBase schema for a multi-tenant SaaS app with organizations, members, and projects
```

```
I have a users collection and a posts collection. Set up the relations with proper cascade options
```

```
Create a view collection that shows post counts per author with their latest post date
```

### Security & API Rules

```
Write API rules for a private notes app where users can only see their own notes
```

```
Review my collection rules for security issues - I want admins to manage content but users to only edit their own
```

```
Set up role-based access control with admin, editor, and viewer roles
```

### Authentication

```
Implement a complete login flow with email/password and Google OAuth2
```

```
Add multi-factor authentication with OTP to my app's login
```

```
Set up SSR authentication with SvelteKit using secure cookie handling
```

### SDK & Query Patterns

```
I'm getting N+1 query issues loading posts with author names. Fix it
```

```
Implement infinite scroll with cursor-based pagination for a feed
```

```
Create a batch operation to transfer funds between two accounts atomically
```

### Realtime

```
Build a live chat component in React with PocketBase realtime subscriptions
```

```
Add reconnection handling to my realtime subscriptions with missed update sync
```

### Files & Deployment

```
Set up file uploads with client-side validation and thumbnail generation
```

```
Configure Nginx as a reverse proxy for PocketBase with HTTPS and rate limiting
```

```
Optimize my PocketBase SQLite database for production with proper indexes
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

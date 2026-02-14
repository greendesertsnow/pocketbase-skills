---
name: pocketbase-best-practices
description: PocketBase development best practices covering collection design, API rules, authentication, SDK usage, query optimization, realtime subscriptions, file handling, and deployment. Use when building PocketBase backends, designing schemas, implementing access control, setting up auth flows, or optimizing performance.
license: MIT
compatibility: Works with any agent. Requires PocketBase v0.36+.
metadata:
  author: community
  version: "1.1.0"
  repository: https://github.com/greendesertsnow/pocketbase-skills
  documentation: https://pocketbase.io/docs/
---

# PocketBase Best Practices

42 rules across 8 categories for PocketBase v0.36+, prioritized by impact.

## Categories by Priority

| Priority | Category | Impact | Rules |
|----------|----------|--------|-------|
| 1 | Collection Design | CRITICAL | coll-field-types, coll-auth-vs-base, coll-relations, coll-indexes, coll-view-collections, coll-geopoint |
| 2 | API Rules & Security | CRITICAL | rules-basics, rules-filter-syntax, rules-request-context, rules-cross-collection, rules-locked-vs-open |
| 3 | Authentication | CRITICAL | auth-password, auth-oauth2, auth-token-management, auth-mfa, auth-impersonation |
| 4 | SDK Usage | HIGH | sdk-initialization, sdk-auth-store, sdk-error-handling, sdk-auto-cancellation, sdk-filter-binding, sdk-field-modifiers, sdk-send-hooks |
| 5 | Query Performance | HIGH | query-pagination, query-expand, query-field-selection, query-batch-operations, query-n-plus-one, query-first-item, query-back-relations |
| 6 | Realtime | MEDIUM | realtime-subscribe, realtime-events, realtime-auth, realtime-reconnection |
| 7 | File Handling | MEDIUM | file-upload, file-serving, file-validation |
| 8 | Production & Deployment | MEDIUM | deploy-backup, deploy-configuration, deploy-reverse-proxy, deploy-sqlite-considerations, deploy-rate-limiting |

## Quick Reference

### Collection Design (CRITICAL)
- **coll-field-types**: Use appropriate field types (json for objects, select for enums)
- **coll-auth-vs-base**: Extend auth collection for users, base for non-auth data
- **coll-relations**: Use relation fields, not manual ID strings
- **coll-indexes**: Create indexes on frequently filtered/sorted fields
- **coll-view-collections**: Use views for complex aggregations
- **coll-geopoint**: Store coordinates as json field with lat/lng

### API Rules (CRITICAL)
- **rules-basics**: Always set API rules; empty = public access
- **rules-filter-syntax**: Use @request.auth, @collection, @now in rules
- **rules-request-context**: Access request data via @request.body, @request.query
- **rules-cross-collection**: Use @collection.name.field for cross-collection checks
- **rules-locked-vs-open**: Start locked, open selectively

### Authentication (CRITICAL)
- **auth-password**: Use authWithPassword for email/password login
- **auth-oauth2**: Configure OAuth2 providers via Admin UI
- **auth-token-management**: Store tokens securely, refresh before expiry
- **auth-mfa**: Enable MFA for sensitive applications
- **auth-impersonation**: Use impersonation for admin actions on behalf of users

### SDK Usage (HIGH)
- **sdk-initialization**: Initialize client once, reuse instance
- **sdk-auth-store**: Use AsyncAuthStore for React Native/SSR
- **sdk-error-handling**: Catch ClientResponseError, check status codes
- **sdk-auto-cancellation**: Disable auto-cancel for concurrent requests
- **sdk-filter-binding**: Use filter binding to prevent injection

### Query Performance (HIGH)
- **query-expand**: Expand relations to avoid N+1 queries
- **query-field-selection**: Select only needed fields
- **query-pagination**: Use cursor pagination for large datasets
- **query-batch-operations**: Batch creates/updates when possible

### Realtime (MEDIUM)
- **realtime-subscribe**: Subscribe to specific records or collections
- **realtime-events**: Handle create, update, delete events separately
- **realtime-auth**: Realtime respects API rules automatically
- **realtime-reconnection**: Implement reconnection logic

### File Handling (MEDIUM)
- **file-upload**: Use FormData for uploads, set proper content types
- **file-serving**: Use pb.files.getURL() for file URLs
- **file-validation**: Validate file types and sizes server-side

### Deployment (MEDIUM)
- **deploy-backup**: Schedule regular backups of pb_data
- **deploy-configuration**: Use environment variables for config
- **deploy-reverse-proxy**: Put behind nginx/caddy in production
- **deploy-sqlite-considerations**: Optimize SQLite for production workloads

## Example Prompts

Try these with your AI agent to see the skill in action:

**Building a new feature:**
- "Design a PocketBase schema for an e-commerce app with products, orders, and reviews"
- "Implement OAuth2 login with Google and GitHub for my app"
- "Build a real-time notification system with PocketBase subscriptions"
- "Create a file upload form with image validation and thumbnail previews"

**Fixing issues:**
- "My list query is slow on 100k records -- optimize it"
- "I'm getting 403 errors on my batch operations"
- "Fix the N+1 query problem in my posts list that loads author data in a loop"
- "My realtime subscriptions stop working after a few minutes"

**Security review:**
- "Review my API rules -- users should only access their own data"
- "Set up proper access control: admins manage all content, users edit only their own"
- "Are my authentication cookies configured securely for SSR?"
- "Audit my collection rules for IDOR vulnerabilities"

**Going to production:**
- "Configure Nginx with HTTPS, rate limiting, and security headers for PocketBase"
- "Set up automated backups for my PocketBase database"
- "Optimize SQLite settings for a production workload with ~500 concurrent users"
- "Deploy PocketBase with Docker Compose and Caddy"

## Detailed Rules

Load the relevant category for complete rule documentation with code examples:

- [Collection Design](references/collection-design.md) - Schema patterns, field types, relations, indexes
- [API Rules & Security](references/api-rules-security.md) - Access control, filter expressions, security patterns
- [Authentication](references/authentication.md) - Password auth, OAuth2, MFA, token management
- [SDK Usage](references/sdk-usage.md) - Client initialization, auth stores, error handling, hooks
- [Query Performance](references/query-performance.md) - Pagination, expansion, batch operations, N+1 prevention
- [Realtime](references/realtime.md) - SSE subscriptions, event handling, reconnection
- [File Handling](references/file-handling.md) - Uploads, serving, validation
- [Production & Deployment](references/production-deployment.md) - Backup, configuration, reverse proxy, SQLite optimization

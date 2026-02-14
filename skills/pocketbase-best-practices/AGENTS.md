# PocketBase Best Practices

**Version 1.1.0**
Community
January 2026

> Comprehensive PocketBase development best practices and performance optimization guide. Contains rules across 8 categories, prioritized by impact from critical (collection design, API rules, authentication) to incremental (production deployment). Each rule includes detailed explanations, incorrect vs. correct code examples, and specific guidance to help AI agents generate better PocketBase code.

---

## Categories

Detailed rules are split by category. Load only the relevant file:

### 1. [Collection Design](references/collection-design.md) - **CRITICAL**

Schema design, field types, relations, indexes, and collection type selection. Foundation for application architecture and long-term maintainability.

- 1.1 Use Auth Collections for User Accounts
- 1.2 Choose Appropriate Field Types for Your Data
- 1.3 Use GeoPoint Fields for Location Data
- 1.4 Create Indexes for Frequently Filtered Fields
- 1.5 Configure Relations with Proper Cascade Options
- 1.6 Use View Collections for Complex Read-Only Queries

### 2. [API Rules & Security](references/api-rules-security.md) - **CRITICAL**

Access control rules, filter expressions, request context usage, and security patterns. Critical for protecting data and enforcing authorization.

- 2.1 Understand API Rule Types and Defaults
- 2.2 Use @collection for Cross-Collection Lookups
- 2.3 Master Filter Expression Syntax
- 2.4 Default to Locked Rules, Open Explicitly
- 2.5 Use @request Context in API Rules

### 3. [Authentication](references/authentication.md) - **CRITICAL**

Password authentication, OAuth2 integration, token management, MFA setup, and auth collection configuration.

- 3.1 Use Impersonation for Admin Operations
- 3.2 Implement Multi-Factor Authentication
- 3.3 Integrate OAuth2 Providers Correctly
- 3.4 Implement Secure Password Authentication
- 3.5 Manage Auth Tokens Properly

### 4. [SDK Usage](references/sdk-usage.md) - **HIGH**

JavaScript SDK initialization, auth store patterns, error handling, request cancellation, and safe parameter binding.

- 4.1 Use Appropriate Auth Store for Your Platform
- 4.2 Understand and Control Auto-Cancellation
- 4.3 Handle SDK Errors Properly
- 4.4 Use Field Modifiers for Incremental Updates
- 4.5 Use Safe Parameter Binding in Filters
- 4.6 Initialize PocketBase Client Correctly
- 4.7 Use Send Hooks for Request Customization

### 5. [Query Performance](references/query-performance.md) - **HIGH**

Pagination strategies, relation expansion, field selection, batch operations, and N+1 query prevention.

- 5.1 Use Back-Relations for Inverse Lookups
- 5.2 Use Batch Operations for Multiple Writes
- 5.3 Expand Relations Efficiently
- 5.4 Select Only Required Fields
- 5.5 Use getFirstListItem for Single Record Lookups
- 5.6 Prevent N+1 Query Problems
- 5.7 Use Efficient Pagination Strategies

### 6. [Realtime](references/realtime.md) - **MEDIUM**

SSE subscriptions, event handling, connection management, and authentication with realtime.

- 6.1 Authenticate Realtime Connections
- 6.2 Handle Realtime Events Properly
- 6.3 Handle Realtime Connection Issues
- 6.4 Implement Realtime Subscriptions Correctly

### 7. [File Handling](references/file-handling.md) - **MEDIUM**

File uploads, URL generation, thumbnail creation, and validation patterns.

- 7.1 Generate File URLs Correctly
- 7.2 Upload Files Correctly
- 7.3 Validate File Uploads

### 8. [Production & Deployment](references/production-deployment.md) - **LOW-MEDIUM**

Backup strategies, configuration management, reverse proxy setup, and SQLite optimization.

- 8.1 Implement Proper Backup Strategies
- 8.2 Configure Production Settings Properly
- 8.3 Enable Rate Limiting for API Protection
- 8.4 Configure Reverse Proxy Correctly
- 8.5 Optimize SQLite for Production

---

## References

- https://pocketbase.io/docs/
- https://github.com/pocketbase/pocketbase
- https://github.com/pocketbase/js-sdk
- https://pocketbase.io/docs/api-records/
- https://pocketbase.io/docs/api-rules-and-filters/

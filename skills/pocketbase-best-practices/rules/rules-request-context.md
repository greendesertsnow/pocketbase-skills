---
title: Use @request Context in API Rules
impact: CRITICAL
impactDescription: Enables dynamic, user-aware access control
tags: api-rules, security, request-context, authentication
---

## Use @request Context in API Rules

The `@request` object provides access to the current request context including authenticated user, request body, query parameters, and headers. Use it to build dynamic access rules.

**Incorrect (hardcoded or missing auth checks):**

```javascript
// No authentication check
const collection = {
  listRule: '',  // Anyone can see everything
  createRule: ''  // Anyone can create
};

// Hardcoded user ID (never do this)
const collection = {
  listRule: 'owner = "specific_user_id"'  // Only one user can access
};
```

**Correct (using @request context):**

```javascript
// Check if user is authenticated
createRule: '@request.auth.id != ""'

// Check ownership via auth record
listRule: 'owner = @request.auth.id'
viewRule: 'owner = @request.auth.id'
updateRule: 'owner = @request.auth.id'
deleteRule: 'owner = @request.auth.id'

// Access auth record fields
listRule: '@request.auth.role = "admin"'
listRule: '@request.auth.verified = true'

// Validate request body on create/update
createRule: '@request.auth.id != "" && @request.body.owner = @request.auth.id'

// Prevent changing certain fields
updateRule: 'owner = @request.auth.id && @request.body.owner:isset = false'

// Check query parameters
listRule: '@request.query.publicOnly = "true" || owner = @request.auth.id'

// Access nested auth relations
listRule: 'team.members ?= @request.auth.id'
```

**Available @request fields:**

| Field | Description |
|-------|-------------|
| `@request.auth.id` | Authenticated user's ID (empty string if not authenticated) |
| `@request.auth.*` | Any field from auth record (role, verified, email, etc.) |
| `@request.body.*` | Request body fields (create/update only) |
| `@request.query.*` | URL query parameters |
| `@request.headers.*` | Request headers |
| `@request.method` | HTTP method (GET, POST, etc.) |
| `@request.context` | Request context (default, realtime, etc.) |

**Body field modifiers:**

```javascript
// Check if field is being set
updateRule: '@request.body.status:isset = false'  // Can't change status

// Check if field changed from current value
updateRule: '@request.body.owner:changed = false'  // Can't change owner

// Get length of array/string
createRule: '@request.body.tags:length <= 5'  // Max 5 tags
```

Reference: [PocketBase API Rules](https://pocketbase.io/docs/api-rules-and-filters/#available-fields)

# PocketBase Best Practices

**Version 1.0.0**
Community
January 2026

> This document is optimized for AI agents and LLMs. Rules are prioritized by performance and security impact.

---

## Abstract

Comprehensive PocketBase development best practices and performance optimization guide. Contains rules across 8 categories, prioritized by impact from critical (collection design, API rules, authentication) to incremental (production deployment). Each rule includes detailed explanations, incorrect vs. correct code examples, and specific guidance to help AI agents generate better PocketBase code.

---

## Table of Contents

1. [Collection Design](#collection-design) - **CRITICAL**
   - 1.1 [Use Auth Collections for User Accounts](#11-use-auth-collections-for-user-accounts)
   - 1.2 [Choose Appropriate Field Types for Your Data](#12-choose-appropriate-field-types-for-your-data)
   - 1.3 [Use GeoPoint Fields for Location Data](#13-use-geopoint-fields-for-location-data)
   - 1.4 [Create Indexes for Frequently Filtered Fields](#14-create-indexes-for-frequently-filtered-fields)
   - 1.5 [Configure Relations with Proper Cascade Options](#15-configure-relations-with-proper-cascade-options)
   - 1.6 [Use View Collections for Complex Read-Only Queries](#16-use-view-collections-for-complex-read-only-queries)

2. [API Rules & Security](#api-rules-security) - **CRITICAL**
   - 2.1 [Understand API Rule Types and Defaults](#21-understand-api-rule-types-and-defaults)
   - 2.2 [Use @collection for Cross-Collection Lookups](#22-use-collection-for-cross-collection-lookups)
   - 2.3 [Master Filter Expression Syntax](#23-master-filter-expression-syntax)
   - 2.4 [Default to Locked Rules, Open Explicitly](#24-default-to-locked-rules-open-explicitly)
   - 2.5 [Use @request Context in API Rules](#25-use-request-context-in-api-rules)

3. [Authentication](#authentication) - **CRITICAL**
   - 3.1 [Use Impersonation for Admin Operations](#31-use-impersonation-for-admin-operations)
   - 3.2 [Implement Multi-Factor Authentication](#32-implement-multi-factor-authentication)
   - 3.3 [Integrate OAuth2 Providers Correctly](#33-integrate-oauth2-providers-correctly)
   - 3.4 [Implement Secure Password Authentication](#34-implement-secure-password-authentication)
   - 3.5 [Manage Auth Tokens Properly](#35-manage-auth-tokens-properly)

4. [SDK Usage](#sdk-usage) - **HIGH**
   - 4.1 [Use Appropriate Auth Store for Your Platform](#41-use-appropriate-auth-store-for-your-platform)
   - 4.2 [Understand and Control Auto-Cancellation](#42-understand-and-control-auto-cancellation)
   - 4.3 [Handle SDK Errors Properly](#43-handle-sdk-errors-properly)
   - 4.4 [Use Field Modifiers for Incremental Updates](#44-use-field-modifiers-for-incremental-updates)
   - 4.5 [Use Safe Parameter Binding in Filters](#45-use-safe-parameter-binding-in-filters)
   - 4.6 [Initialize PocketBase Client Correctly](#46-initialize-pocketbase-client-correctly)
   - 4.7 [Use Send Hooks for Request Customization](#47-use-send-hooks-for-request-customization)

5. [Query Performance](#query-performance) - **HIGH**
   - 5.1 [Use Back-Relations for Inverse Lookups](#51-use-back-relations-for-inverse-lookups)
   - 5.2 [Use Batch Operations for Multiple Writes](#52-use-batch-operations-for-multiple-writes)
   - 5.3 [Expand Relations Efficiently](#53-expand-relations-efficiently)
   - 5.4 [Select Only Required Fields](#54-select-only-required-fields)
   - 5.5 [Use getFirstListItem for Single Record Lookups](#55-use-getfirstlistitem-for-single-record-lookups)
   - 5.6 [Prevent N+1 Query Problems](#56-prevent-n-1-query-problems)
   - 5.7 [Use Efficient Pagination Strategies](#57-use-efficient-pagination-strategies)

6. [Realtime](#realtime) - **MEDIUM**
   - 6.1 [Authenticate Realtime Connections](#61-authenticate-realtime-connections)
   - 6.2 [Handle Realtime Events Properly](#62-handle-realtime-events-properly)
   - 6.3 [Handle Realtime Connection Issues](#63-handle-realtime-connection-issues)
   - 6.4 [Implement Realtime Subscriptions Correctly](#64-implement-realtime-subscriptions-correctly)

7. [File Handling](#file-handling) - **MEDIUM**
   - 7.1 [Generate File URLs Correctly](#71-generate-file-urls-correctly)
   - 7.2 [Upload Files Correctly](#72-upload-files-correctly)
   - 7.3 [Validate File Uploads](#73-validate-file-uploads)

8. [Production & Deployment](#production-deployment) - **LOW-MEDIUM**
   - 8.1 [Implement Proper Backup Strategies](#81-implement-proper-backup-strategies)
   - 8.2 [Configure Production Settings Properly](#82-configure-production-settings-properly)
   - 8.3 [Enable Rate Limiting for API Protection](#83-enable-rate-limiting-for-api-protection)
   - 8.4 [Configure Reverse Proxy Correctly](#84-configure-reverse-proxy-correctly)
   - 8.5 [Optimize SQLite for Production](#85-optimize-sqlite-for-production)

---

## 1. Collection Design

**Impact: CRITICAL**

Schema design, field types, relations, indexes, and collection type selection. Foundation for application architecture and long-term maintainability.

### 1.1 Use Auth Collections for User Accounts

**Impact: CRITICAL (Built-in authentication, password hashing, OAuth2 support)**

## Use Auth Collections for User Accounts

Auth collections provide built-in authentication features including secure password hashing, email verification, OAuth2 support, and token management. Using base collections for users requires reimplementing these security-critical features.

**Incorrect (using base collection for users):**

```javascript
// Base collection loses all auth features
const usersCollection = {
  name: 'users',
  type: 'base',  // Wrong! No auth capabilities
  schema: [
    { name: 'email', type: 'email' },
    { name: 'password', type: 'text' },  // Stored in plain text!
    { name: 'name', type: 'text' }
  ]
};

// Manual login implementation - insecure
const user = await pb.collection('users').getFirstListItem(
  `email = "${email}" && password = "${password}"`  // SQL injection risk!
);
```

**Correct (using auth collection):**

```javascript
// Auth collection with built-in security
const usersCollection = {
  name: 'users',
  type: 'auth',  // Enables authentication features
  schema: [
    { name: 'name', type: 'text' },
    { name: 'avatar', type: 'file', options: { maxSelect: 1 } }
  ],
  options: {
    allowEmailAuth: true,
    allowOAuth2Auth: true,
    requireEmail: true,
    minPasswordLength: 8
  }
};

// Secure authentication with password hashing
const authData = await pb.collection('users').authWithPassword(
  'user@example.com',
  'securePassword123'
);

// Token automatically stored in authStore
console.log(pb.authStore.token);
console.log(pb.authStore.record.id);
```

**When to use each type:**
- **Auth collection**: User accounts, admin accounts, any entity that needs to log in
- **Base collection**: Regular data like posts, products, orders, comments
- **View collection**: Read-only aggregations or complex queries

Reference: [PocketBase Auth Collections](https://pocketbase.io/docs/collections/#auth-collection)

### 1.2 Choose Appropriate Field Types for Your Data

**Impact: CRITICAL (Prevents data corruption, improves query performance, reduces storage)**

## Choose Appropriate Field Types for Your Data

Selecting the wrong field type leads to data validation issues, wasted storage, and poor query performance. PocketBase provides specialized field types that enforce constraints at the database level.

**Incorrect (using text for everything):**

```javascript
// Using plain text fields for structured data
const collection = {
  name: 'products',
  schema: [
    { name: 'price', type: 'text' },      // Should be number
    { name: 'email', type: 'text' },       // Should be email
    { name: 'website', type: 'text' },     // Should be url
    { name: 'active', type: 'text' },      // Should be bool
    { name: 'tags', type: 'text' },        // Should be select or json
    { name: 'created', type: 'text' }      // Should be autodate
  ]
};
// No validation, inconsistent data, manual parsing required
```

**Correct (using appropriate field types):**

```javascript
// Using specialized field types with proper validation
const collection = {
  name: 'products',
  type: 'base',
  schema: [
    { name: 'price', type: 'number', options: { min: 0 } },
    { name: 'email', type: 'email' },
    { name: 'website', type: 'url' },
    { name: 'active', type: 'bool' },
    { name: 'tags', type: 'select', options: {
      maxSelect: 5,
      values: ['electronics', 'clothing', 'food', 'other']
    }},
    { name: 'metadata', type: 'json' }
    // created/updated are automatic system fields
  ]
};
// Built-in validation, proper indexing, type-safe queries
```

**Available field types:**
- `text` - Plain text with optional min/max length, regex pattern
- `number` - Integer or decimal with optional min/max
- `bool` - True/false values
- `email` - Email with format validation
- `url` - URL with format validation
- `date` - Date/datetime values
- `autodate` - Auto-set on create/update
- `select` - Single or multi-select from predefined values
- `json` - Arbitrary JSON data
- `file` - File attachments
- `relation` - References to other collections
- `editor` - Rich text HTML content

Reference: [PocketBase Collections](https://pocketbase.io/docs/collections/)

### 1.3 Use GeoPoint Fields for Location Data

**Impact: MEDIUM (Built-in geographic queries, distance calculations)**

## Use GeoPoint Fields for Location Data

PocketBase provides a dedicated GeoPoint field type for storing geographic coordinates with built-in distance query support via `geoDistance()`.

**Incorrect (storing coordinates as separate fields):**

```javascript
// Separate lat/lon fields - no built-in distance queries
const placesSchema = [
  { name: 'name', type: 'text' },
  { name: 'latitude', type: 'number' },
  { name: 'longitude', type: 'number' }
];

// Manual distance calculation - complex and slow
async function findNearby(lat, lon, maxKm) {
  const places = await pb.collection('places').getFullList();

  // Calculate distance for every record client-side
  return places.filter(place => {
    const dist = haversine(lat, lon, place.latitude, place.longitude);
    return dist <= maxKm;
  });
}
```

**Correct (using GeoPoint field):**

```javascript
// GeoPoint field stores coordinates as { lon, lat } object
const placesSchema = [
  { name: 'name', type: 'text' },
  { name: 'location', type: 'geopoint' }
];

// Creating a record with GeoPoint
await pb.collection('places').create({
  name: 'Coffee Shop',
  location: { lon: -73.9857, lat: 40.7484 }  // Note: lon first!
});

// Or using "lon,lat" string format
await pb.collection('places').create({
  name: 'Restaurant',
  location: '-73.9857,40.7484'  // String format also works
});

// Query nearby locations using geoDistance()
async function findNearby(lon, lat, maxKm) {
  // geoDistance returns distance in kilometers
  const places = await pb.collection('places').getList(1, 50, {
    filter: pb.filter(
      'geoDistance(location, {:point}) <= {:maxKm}',
      {
        point: { lon, lat },
        maxKm: maxKm
      }
    ),
    sort: pb.filter('geoDistance(location, {:point})', { point: { lon, lat } })
  });

  return places;
}

// Find places within 5km of Times Square
const nearbyPlaces = await findNearby(-73.9857, 40.7580, 5);

// Use in API rules for location-based access
// listRule: geoDistance(location, @request.query.point) <= 10
```

**geoDistance() function:**

```javascript
// Syntax: geoDistance(geopointField, referencePoint)
// Returns: distance in kilometers

// In filter expressions
filter: 'geoDistance(location, "-73.9857,40.7484") <= 5'

// With parameter binding (recommended)
filter: pb.filter('geoDistance(location, {:center}) <= {:radius}', {
  center: { lon: -73.9857, lat: 40.7484 },
  radius: 5
})

// Sorting by distance
sort: 'geoDistance(location, "-73.9857,40.7484")'  // Closest first
sort: '-geoDistance(location, "-73.9857,40.7484")' // Farthest first
```

**GeoPoint data format:**

```javascript
// Object format (recommended)
{ lon: -73.9857, lat: 40.7484 }

// String format
"-73.9857,40.7484"  // "lon,lat" order

// Important: longitude comes FIRST (GeoJSON convention)
```

**Use cases:**
- Store-locator / find nearby
- Delivery radius validation
- Geofencing in API rules
- Location-based search results

**Limitations:**
- Spherical Earth calculation (accurate to ~0.3%)
- No polygon/area containment queries
- Single point per field (use multiple fields for routes)

Reference: [PocketBase GeoPoint](https://pocketbase.io/docs/collections/#geopoint)

### 1.4 Create Indexes for Frequently Filtered Fields

**Impact: CRITICAL (10-100x faster queries on large collections)**

## Create Indexes for Frequently Filtered Fields

PocketBase uses SQLite which benefits significantly from proper indexing. Queries filtering or sorting on unindexed fields perform full table scans.

**Incorrect (no indexes on filtered fields):**

```javascript
// Querying without indexes
const posts = await pb.collection('posts').getList(1, 20, {
  filter: 'author = "user123" && status = "published"',
  sort: '-publishedAt'
});
// Full table scan on large collections - very slow

// API rules also query without indexes
// listRule: "author = @request.auth.id"
// Every list request scans entire table
```

**Correct (indexed fields):**

```javascript
// Create collection with indexes via Admin UI or migration
// In PocketBase Admin: Collection > Indexes > Add Index

// Common index patterns:
// 1. Single field index for equality filters
//    CREATE INDEX idx_posts_author ON posts(author)

// 2. Composite index for multiple filters
//    CREATE INDEX idx_posts_author_status ON posts(author, status)

// 3. Index with sort field
//    CREATE INDEX idx_posts_status_published ON posts(status, publishedAt DESC)

// Queries now use indexes
const posts = await pb.collection('posts').getList(1, 20, {
  filter: 'author = "user123" && status = "published"',
  sort: '-publishedAt'
});
// Index scan - fast even with millions of records

// For unique constraints (e.g., slug)
// CREATE UNIQUE INDEX idx_posts_slug ON posts(slug)
```

**Index recommendations:**
- Fields used in `filter` expressions
- Fields used in `sort` parameters
- Fields used in API rules (`listRule`, `viewRule`, etc.)
- Relation fields (automatically indexed)
- Unique fields like slugs or codes

**Index considerations for SQLite:**
- Composite indexes work left-to-right (order matters)
- Too many indexes slow down writes
- Use `EXPLAIN QUERY PLAN` in SQL to verify index usage
- Partial indexes for filtered subsets

```sql
-- Check if index is used
EXPLAIN QUERY PLAN
SELECT * FROM posts WHERE author = 'user123' AND status = 'published';
-- Should show "USING INDEX" not "SCAN"
```

Reference: [SQLite Query Planning](https://www.sqlite.org/queryplanner.html)

### 1.5 Configure Relations with Proper Cascade Options

**Impact: CRITICAL (Maintains referential integrity, prevents orphaned records, controls deletion behavior)**

## Configure Relations with Proper Cascade Options

Relation fields connect collections together. Proper cascade configuration ensures data integrity when referenced records are deleted.

**Incorrect (default cascade behavior not considered):**

```javascript
// Relation without considering deletion behavior
const ordersSchema = [
  { name: 'customer', type: 'relation', options: {
    collectionId: 'customers_collection_id',
    maxSelect: 1
    // No cascade options specified - defaults may cause issues
  }},
  { name: 'products', type: 'relation', options: {
    collectionId: 'products_collection_id'
    // Multiple products, no cascade handling
  }}
];

// Deleting a customer may fail or orphan orders
await pb.collection('customers').delete(customerId);
// Error: record is referenced by other records
```

**Correct (explicit cascade configuration):**

```javascript
// Carefully configured relations
const ordersSchema = [
  {
    name: 'customer',
    type: 'relation',
    required: true,
    options: {
      collectionId: 'customers_collection_id',
      maxSelect: 1,
      cascadeDelete: false  // Prevent accidental mass deletion
    }
  },
  {
    name: 'products',
    type: 'relation',
    options: {
      collectionId: 'products_collection_id',
      maxSelect: 99,
      cascadeDelete: false
    }
  }
];

// For audit logs - cascade delete makes sense
const auditLogsSchema = [
  {
    name: 'user',
    type: 'relation',
    options: {
      collectionId: 'users_collection_id',
      maxSelect: 1,
      cascadeDelete: true  // Delete logs when user is deleted
    }
  }
];

// Handle deletion manually when cascade is false
try {
  await pb.collection('customers').delete(customerId);
} catch (e) {
  if (e.status === 400) {
    // Customer has orders - handle appropriately
    // Option 1: Soft delete (set 'deleted' flag)
    // Option 2: Reassign orders
    // Option 3: Delete orders first
  }
}
```

**Cascade options:**
- `cascadeDelete: true` - Delete referencing records when referenced record is deleted
- `cascadeDelete: false` - Block deletion if references exist (default for required relations)

**Best practices:**
- Use `cascadeDelete: true` for dependent data (comments on posts, logs for users)
- Use `cascadeDelete: false` for important data (orders, transactions)
- Consider soft deletes for audit trails
- Document your cascade strategy

Reference: [PocketBase Relations](https://pocketbase.io/docs/collections/#relation)

### 1.6 Use View Collections for Complex Read-Only Queries

**Impact: HIGH (Simplifies complex queries, improves maintainability, enables aggregations)**

## Use View Collections for Complex Read-Only Queries

View collections execute custom SQL queries and expose results through the standard API. They're ideal for aggregations, joins, and computed fields without duplicating logic across your application.

**Incorrect (computing aggregations client-side):**

```javascript
// Fetching all records to compute stats client-side
const orders = await pb.collection('orders').getFullList();
const products = await pb.collection('products').getFullList();

// Expensive client-side computation
const stats = orders.reduce((acc, order) => {
  const product = products.find(p => p.id === order.product);
  acc.totalRevenue += order.quantity * product.price;
  acc.orderCount++;
  return acc;
}, { totalRevenue: 0, orderCount: 0 });
// Fetches all data, slow, memory-intensive
```

**Correct (using view collection):**

```javascript
// Create a view collection in PocketBase Admin UI or via API
// View SQL:
// SELECT
//   p.id,
//   p.name,
//   COUNT(o.id) as order_count,
//   SUM(o.quantity) as total_sold,
//   SUM(o.quantity * p.price) as revenue
// FROM products p
// LEFT JOIN orders o ON o.product = p.id
// GROUP BY p.id

// Simple, efficient query
const productStats = await pb.collection('product_stats').getList(1, 20, {
  sort: '-revenue'
});

// Each record has computed fields
productStats.items.forEach(stat => {
  console.log(`${stat.name}: ${stat.order_count} orders, $${stat.revenue}`);
});
```

**View collection use cases:**
- Aggregations (COUNT, SUM, AVG)
- Joining data from multiple collections
- Computed/derived fields
- Denormalized read models
- Dashboard statistics

**Limitations:**
- Read-only (no create/update/delete)
- Must return `id` column
- No realtime subscriptions
- API rules still apply for access control

Reference: [PocketBase View Collections](https://pocketbase.io/docs/collections/#view-collection)

## 2. API Rules & Security

**Impact: CRITICAL**

Access control rules, filter expressions, request context usage, and security patterns. Critical for protecting data and enforcing authorization.

### 2.1 Understand API Rule Types and Defaults

**Impact: CRITICAL (Prevents unauthorized access, data leaks, and security vulnerabilities)**

## Understand API Rule Types and Defaults

PocketBase uses five collection-level rules to control access. Understanding the difference between locked (null), open (""), and expression rules is critical for security.

**Incorrect (leaving rules open unintentionally):**

```javascript
// Collection with overly permissive rules
const collection = {
  name: 'messages',
  listRule: '',      // Anyone can list all messages!
  viewRule: '',      // Anyone can view any message!
  createRule: '',    // Anyone can create messages!
  updateRule: '',    // Anyone can update any message!
  deleteRule: ''     // Anyone can delete any message!
};
// Complete security bypass - all data exposed
```

**Correct (explicit, restrictive rules):**

```javascript
// Collection with proper access control
const collection = {
  name: 'messages',
  // null = locked, only superusers can access
  listRule: null,    // Default: locked to superusers

  // '' (empty string) = open to everyone (use sparingly)
  viewRule: '@request.auth.id != ""',  // Any authenticated user

  // Expression = conditional access
  createRule: '@request.auth.id != ""',  // Must be logged in
  updateRule: 'author = @request.auth.id',  // Only author
  deleteRule: 'author = @request.auth.id'   // Only author
};
```

**Rule types explained:**

| Rule Value | Meaning | Use Case |
|------------|---------|----------|
| `null` | Locked (superusers only) | Admin-only data, system tables |
| `''` (empty string) | Open to everyone | Public content, no auth required |
| `'expression'` | Conditional access | Most common - check auth, ownership |

**Common patterns:**

```javascript
// Public read, authenticated write
listRule: '',
viewRule: '',
createRule: '@request.auth.id != ""',
updateRule: 'author = @request.auth.id',
deleteRule: 'author = @request.auth.id'

// Private to owner only
listRule: 'owner = @request.auth.id',
viewRule: 'owner = @request.auth.id',
createRule: '@request.auth.id != ""',
updateRule: 'owner = @request.auth.id',
deleteRule: 'owner = @request.auth.id'

// Read-only public data
listRule: '',
viewRule: '',
createRule: null,
updateRule: null,
deleteRule: null
```

**Error responses by rule type:**
- List rule fail: 200 with empty items
- View/Update/Delete fail: 404 (hides existence)
- Create fail: 400
- Locked rule violation: 403

Reference: [PocketBase API Rules](https://pocketbase.io/docs/api-rules-and-filters/)

### 2.2 Use @collection for Cross-Collection Lookups

**Impact: HIGH (Enables complex authorization without denormalization)**

## Use @collection for Cross-Collection Lookups

The `@collection` reference allows rules to query other collections, enabling complex authorization patterns like role-based access, team membership, and resource permissions.

**Incorrect (denormalizing data for access control):**

```javascript
// Duplicating team membership in every resource
const documentsSchema = [
  { name: 'title', type: 'text' },
  { name: 'team', type: 'relation' },
  // Duplicated member list for access control - gets out of sync!
  { name: 'allowedUsers', type: 'relation', options: { maxSelect: 999 } }
];

// Rule checks duplicated data
listRule: 'allowedUsers ?= @request.auth.id'
// Problem: must update allowedUsers whenever team membership changes
```

**Correct (using @collection lookup):**

```javascript
// Clean schema - no duplication
const documentsSchema = [
  { name: 'title', type: 'text' },
  { name: 'team', type: 'relation', options: { collectionId: 'teams' } }
];

// Check team membership via @collection lookup
listRule: '@collection.team_members.user ?= @request.auth.id && @collection.team_members.team ?= team'

// Alternative: check if user is in team's members array
listRule: 'team.members ?= @request.auth.id'

// Role-based access via separate roles collection
listRule: '@collection.user_roles.user = @request.auth.id && @collection.user_roles.role = "admin"'
```

**Common patterns:**

```javascript
// Team-based access
// teams: { name, members (relation to users) }
// documents: { title, team (relation to teams) }
viewRule: 'team.members ?= @request.auth.id'

// Organization hierarchy
// orgs: { name }
// org_members: { org, user, role }
// projects: { name, org }
listRule: '@collection.org_members.org = org && @collection.org_members.user = @request.auth.id'

// Permission-based access
// permissions: { resource, user, level }
updateRule: '@collection.permissions.resource = id && @collection.permissions.user = @request.auth.id && @collection.permissions.level = "write"'

// Using aliases for complex queries
listRule: '@collection.memberships:m.user = @request.auth.id && @collection.memberships:m.team = team'
```

**Performance considerations:**
- Cross-collection lookups add query complexity
- Ensure referenced fields are indexed
- Consider caching for frequently accessed permissions
- Test performance with realistic data volumes

Reference: [PocketBase Collection Reference](https://pocketbase.io/docs/api-rules-and-filters/#collection-fields)

### 2.3 Master Filter Expression Syntax

**Impact: CRITICAL (Enables complex access control and efficient querying)**

## Master Filter Expression Syntax

PocketBase filter expressions use a specific syntax for both API rules and client-side queries. Understanding operators and composition is essential.

**Incorrect (invalid filter syntax):**

```javascript
// Wrong operator syntax
const posts = await pb.collection('posts').getList(1, 20, {
  filter: 'status == "published"'  // Wrong: == instead of =
});

// Missing quotes around strings
const posts = await pb.collection('posts').getList(1, 20, {
  filter: 'status = published'  // Wrong: unquoted string
});

// Wrong boolean logic
const posts = await pb.collection('posts').getList(1, 20, {
  filter: 'status = "published" AND featured = true'  // Wrong: AND instead of &&
});
```

**Correct (proper filter syntax):**

```javascript
// Equality and comparison operators
const posts = await pb.collection('posts').getList(1, 20, {
  filter: 'status = "published"'           // Equals
});
filter: 'views != 0'                        // Not equals
filter: 'views > 100'                       // Greater than
filter: 'views >= 100'                      // Greater or equal
filter: 'price < 50.00'                     // Less than
filter: 'created <= "2024-01-01 00:00:00"'  // Less or equal

// String operators
filter: 'title ~ "hello"'   // Contains (case-insensitive)
filter: 'title !~ "spam"'   // Does not contain

// Logical operators
filter: 'status = "published" && featured = true'   // AND
filter: 'category = "news" || category = "blog"'    // OR
filter: '(status = "draft" || status = "review") && author = "abc"'  // Grouping

// Array/multi-value operators (for select, relation fields)
filter: 'tags ?= "featured"'    // Any tag equals "featured"
filter: 'tags ?~ "tech"'        // Any tag contains "tech"

// Null checks
filter: 'deletedAt = null'      // Is null
filter: 'avatar != null'        // Is not null

// Date comparisons
filter: 'created > "2024-01-01 00:00:00"'
filter: 'created >= @now'       // Current timestamp
filter: 'expires < @today'      // Start of today (UTC)
```

**Available operators:**

| Operator | Description |
|----------|-------------|
| `=` | Equal |
| `!=` | Not equal |
| `>` `>=` `<` `<=` | Comparison |
| `~` | Contains (LIKE %value%) |
| `!~` | Does not contain |
| `?=` `?!=` `?>` `?~` | Any element matches |
| `&&` | AND |
| `\|\|` | OR |
| `()` | Grouping |

**Date macros:**
- `@now` - Current UTC datetime
- `@today` - Start of today UTC
- `@month` - Start of current month UTC
- `@year` - Start of current year UTC

Reference: [PocketBase Filters](https://pocketbase.io/docs/api-rules-and-filters/#filters-syntax)

### 2.4 Default to Locked Rules, Open Explicitly

**Impact: CRITICAL (Defense in depth, prevents accidental data exposure)**

## Default to Locked Rules, Open Explicitly

New collections should start with locked (null) rules and explicitly open only what's needed. This prevents accidental data exposure and follows the principle of least privilege.

**Incorrect (starting with open rules):**

```javascript
// Dangerous: copying rules from examples without thinking
const collection = {
  name: 'user_settings',
  listRule: '',      // Open - leaks all user settings!
  viewRule: '',      // Open - anyone can view any setting
  createRule: '',    // Open - no auth required
  updateRule: '',    // Open - anyone can modify!
  deleteRule: ''     // Open - anyone can delete!
};

// Also dangerous: using auth check when ownership needed
const collection = {
  name: 'private_notes',
  listRule: '@request.auth.id != ""',  // Any logged-in user sees ALL notes
  viewRule: '@request.auth.id != ""',
  updateRule: '@request.auth.id != ""',  // Any user can edit ANY note!
};
```

**Correct (locked by default, explicitly opened):**

```javascript
// Step 1: Start locked
const collection = {
  name: 'user_settings',
  listRule: null,    // Locked - superusers only
  viewRule: null,
  createRule: null,
  updateRule: null,
  deleteRule: null
};

// Step 2: Open only what's needed with proper checks
const collection = {
  name: 'user_settings',
  // Users can only see their own settings
  listRule: 'user = @request.auth.id',
  viewRule: 'user = @request.auth.id',
  // Users can only create settings for themselves
  createRule: '@request.auth.id != "" && @request.body.user = @request.auth.id',
  // Users can only update their own settings
  updateRule: 'user = @request.auth.id',
  // Prevent deletion or restrict to owner
  deleteRule: 'user = @request.auth.id'
};

// For truly public data, document why it's open
const collection = {
  name: 'public_announcements',
  // Intentionally public - these are site-wide announcements
  listRule: '',
  viewRule: '',
  // Only admins can manage
  createRule: '@request.auth.role = "admin"',
  updateRule: '@request.auth.role = "admin"',
  deleteRule: '@request.auth.role = "admin"'
};
```

**Rule development workflow:**

1. **Start locked** - All rules `null`
2. **Identify access needs** - Who needs what access?
3. **Write minimal rules** - Open only required operations
4. **Test thoroughly** - Verify both allowed and denied cases
5. **Document decisions** - Comment why rules are set as they are

**Security checklist:**
- [ ] No empty string rules without justification
- [ ] Ownership checks on personal data
- [ ] Auth checks on write operations
- [ ] Admin-only rules for sensitive operations
- [ ] Tested with different user contexts

Reference: [PocketBase API Rules](https://pocketbase.io/docs/api-rules-and-filters/)

### 2.5 Use @request Context in API Rules

**Impact: CRITICAL (Enables dynamic, user-aware access control)**

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

## 3. Authentication

**Impact: CRITICAL**

Password authentication, OAuth2 integration, token management, MFA setup, and auth collection configuration.

### 3.1 Use Impersonation for Admin Operations

**Impact: MEDIUM (Safe admin access to user data without password sharing)**

## Use Impersonation for Admin Operations

Impersonation allows superusers to generate tokens for other users, enabling admin support tasks and API key functionality without sharing passwords.

**Incorrect (sharing credentials or bypassing auth):**

```javascript
// Bad: sharing user passwords for support
async function helpUser(userId, userPassword) {
  await pb.collection('users').authWithPassword(userEmail, userPassword);
  // Support team knows user's password!
}

// Bad: directly modifying records without proper context
async function fixUserData(userId) {
  // Bypasses user's perspective and rules
  await pb.collection('posts').update(postId, { fixed: true });
}
```

**Correct (using impersonation):**

```javascript
import PocketBase from 'pocketbase';

// Admin client with superuser auth
const adminPb = new PocketBase('http://127.0.0.1:8090');
await adminPb.collection('_superusers').authWithPassword(
  'admin@example.com',
  'adminPassword'
);

async function impersonateUser(userId) {
  // Generate impersonation token (non-renewable)
  const impersonatedClient = await adminPb
    .collection('users')
    .impersonate(userId, 3600);  // 1 hour duration

  // impersonatedClient has user's auth context
  console.log('Acting as:', impersonatedClient.authStore.record.email);

  // Operations use user's permissions
  const userPosts = await impersonatedClient.collection('posts').getList();

  return impersonatedClient;
}

// Use case: Admin viewing user's data
async function adminViewUserPosts(userId) {
  const userClient = await impersonateUser(userId);

  // See exactly what the user sees (respects API rules)
  const posts = await userClient.collection('posts').getList();

  return posts;
}

// Use case: API keys for server-to-server communication
async function createApiKey(serviceUserId) {
  // Create a long-lived impersonation token
  const serviceClient = await adminPb
    .collection('service_accounts')
    .impersonate(serviceUserId, 86400 * 365);  // 1 year

  // Return token for service to use
  return serviceClient.authStore.token;
}

// Using API key token in another service
async function useApiKey(apiToken) {
  const pb = new PocketBase('http://127.0.0.1:8090');

  // Manually set the token
  pb.authStore.save(apiToken, null);

  // Now requests use the service account's permissions
  const data = await pb.collection('data').getList();
  return data;
}
```

**Important considerations:**

```javascript
// Impersonation tokens are non-renewable
const client = await adminPb.collection('users').impersonate(userId, 3600);

// This will fail - can't refresh impersonation tokens
try {
  await client.collection('users').authRefresh();
} catch (error) {
  // Expected: impersonation tokens can't be refreshed
}

// For continuous access, generate new token when needed
async function getImpersonatedClient(userId) {
  // Check if existing token is still valid
  if (cachedClient?.authStore.isValid) {
    return cachedClient;
  }

  // Generate fresh token
  return await adminPb.collection('users').impersonate(userId, 3600);
}
```

**Security best practices:**
- Use short durations for support tasks
- Log all impersonation events
- Restrict impersonation to specific admin roles
- Never expose impersonation capability in client code
- Use dedicated service accounts for API keys

Reference: [PocketBase Impersonation](https://pocketbase.io/docs/authentication/#impersonate-authentication)

### 3.2 Implement Multi-Factor Authentication

**Impact: HIGH (Additional security layer for sensitive applications)**

## Implement Multi-Factor Authentication

MFA requires users to authenticate with two different methods. PocketBase supports OTP (One-Time Password) via email as the second factor.

**Incorrect (single-factor only for sensitive apps):**

```javascript
// Insufficient for sensitive applications
async function login(email, password) {
  const authData = await pb.collection('users').authWithPassword(email, password);
  // User immediately has full access - no second factor
  return authData;
}
```

**Correct (MFA flow with OTP):**

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function loginWithMFA(email, password) {
  try {
    // First factor: password
    const authData = await pb.collection('users').authWithPassword(email, password);

    // If MFA not required, auth succeeds immediately
    return { success: true, authData };

  } catch (error) {
    // MFA required - returns 401 with mfaId
    if (error.status === 401 && error.response?.mfaId) {
      return {
        success: false,
        mfaRequired: true,
        mfaId: error.response.mfaId
      };
    }
    throw error;
  }
}

async function requestOTP(email) {
  // Request OTP to be sent via email
  const result = await pb.collection('users').requestOTP(email);

  // Returns otpId - needed to verify the OTP
  // Note: Returns otpId even if email doesn't exist (prevents enumeration)
  return result.otpId;
}

async function completeMFAWithOTP(mfaId, otpId, otpCode) {
  try {
    // Second factor: OTP verification
    const authData = await pb.collection('users').authWithOTP(
      otpId,
      otpCode,
      { mfaId }  // Include mfaId from first factor
    );

    return { success: true, authData };
  } catch (error) {
    if (error.status === 400) {
      throw new Error('Invalid or expired code');
    }
    throw error;
  }
}

// Complete flow example
async function fullMFAFlow(email, password, otpCode = null) {
  // Step 1: Password authentication
  const step1 = await loginWithMFA(email, password);

  if (step1.success) {
    return step1.authData;  // MFA not required
  }

  if (step1.mfaRequired) {
    // Step 2: Request OTP
    const otpId = await requestOTP(email);

    // Step 3: UI prompts user for OTP code...
    // (In real app, wait for user input)

    if (otpCode) {
      // Step 4: Complete MFA
      const step2 = await completeMFAWithOTP(step1.mfaId, otpId, otpCode);
      return step2.authData;
    }

    return { pendingMFA: true, mfaId: step1.mfaId, otpId };
  }
}
```

**Configure MFA (Admin UI or API):**

```javascript
// Enable MFA on auth collection (superuser only)
await pb.collections.update('users', {
  mfa: {
    enabled: true,
    duration: 1800,  // MFA session duration (30 min)
    rule: ''  // When to require MFA (empty = always after first auth)
    // rule: '@request.auth.role = "admin"' // Only for admins
  },
  otp: {
    enabled: true,
    duration: 300,  // OTP validity (5 min)
    length: 6,      // OTP code length
    emailTemplate: {
      subject: 'Your verification code',
      body: 'Your code is: {OTP}'
    }
  }
});
```

**MFA best practices:**
- Always enable for admin accounts
- Consider making MFA optional for regular users
- Use short OTP durations (5-10 minutes)
- Implement rate limiting on OTP requests
- Log MFA events for security auditing

Reference: [PocketBase MFA](https://pocketbase.io/docs/authentication/#mfa)

### 3.3 Integrate OAuth2 Providers Correctly

**Impact: CRITICAL (Secure third-party authentication with proper flow handling)**

## Integrate OAuth2 Providers Correctly

OAuth2 integration should use the all-in-one method for simplicity and security. Manual code exchange should only be used when necessary (e.g., mobile apps with deep links).

**Incorrect (manual implementation without SDK):**

```javascript
// Don't manually handle OAuth flow
async function loginWithGoogle() {
  // Redirect user to Google manually
  window.location.href = 'https://accounts.google.com/oauth/authorize?...';
}

// Manual callback handling
async function handleCallback(code) {
  // Exchange code manually - error prone!
  const response = await fetch('/api/auth/callback', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
}
```

**Correct (using SDK's all-in-one method):**

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// All-in-one OAuth2 (recommended for web apps)
async function loginWithOAuth2(providerName) {
  try {
    const authData = await pb.collection('users').authWithOAuth2({
      provider: providerName,  // 'google', 'github', 'microsoft', etc.
      // Optional: create new user data if not exists
      createData: {
        emailVisibility: true,
        name: ''  // Will be populated from OAuth provider
      }
    });

    console.log('Logged in via', providerName);
    console.log('User:', authData.record.email);
    console.log('Is new user:', authData.meta?.isNew);

    return authData;
  } catch (error) {
    if (error.isAbort) {
      console.log('OAuth popup was closed');
      return null;
    }
    throw error;
  }
}

// Usage
document.getElementById('google-btn').onclick = () => loginWithOAuth2('google');
document.getElementById('github-btn').onclick = () => loginWithOAuth2('github');
```

**Manual code exchange (for React Native / deep links):**

```javascript
// Only use when all-in-one isn't possible
async function loginWithOAuth2Manual() {
  // Get auth methods to find provider config
  const authMethods = await pb.collection('users').listAuthMethods();
  const provider = authMethods.oauth2.providers.find(p => p.name === 'google');

  // Generate code verifier for PKCE
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Open OAuth URL (handle redirect in your app)
  const authUrl = provider.authURL +
    `?client_id=${provider.clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256` +
    `&response_type=code` +
    `&scope=openid%20email%20profile`;

  // After redirect, exchange code
  const authData = await pb.collection('users').authWithOAuth2Code(
    'google',
    code,           // From redirect URL
    codeVerifier,   // Must match the challenge
    redirectUri,
    { emailVisibility: true }
  );

  return authData;
}
```

**Configure OAuth2 provider (Admin UI or API):**

```javascript
// Via API (superuser only) - usually done in Admin UI
await pb.collections.update('users', {
  oauth2: {
    enabled: true,
    providers: [{
      name: 'google',
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret'
    }],
    mappedFields: {
      avatarURL: 'avatar'  // Map OAuth field to collection field
    }
  }
});
```

Reference: [PocketBase OAuth2](https://pocketbase.io/docs/authentication/#oauth2-authentication)

### 3.4 Implement Secure Password Authentication

**Impact: CRITICAL (Secure user login with proper error handling and token management)**

## Implement Secure Password Authentication

Password authentication should include proper error handling, avoid exposing whether emails exist, and correctly manage the auth store.

**Incorrect (exposing information and poor error handling):**

```javascript
// Dangerous: exposes whether email exists
async function login(email, password) {
  const user = await pb.collection('users').getFirstListItem(`email = "${email}"`);
  if (!user) {
    throw new Error('Email not found');  // Reveals email doesn't exist
  }

  // Manual password check - never do this!
  if (user.password !== password) {
    throw new Error('Wrong password');  // Reveals password is wrong
  }

  return user;
}
```

**Correct (secure authentication):**

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function login(email, password) {
  try {
    // authWithPassword handles hashing and returns token
    const authData = await pb.collection('users').authWithPassword(email, password);

    // Token is automatically stored in pb.authStore
    console.log('Logged in as:', authData.record.email);
    console.log('Token valid:', pb.authStore.isValid);

    return authData;
  } catch (error) {
    // Generic error message - don't reveal if email exists
    if (error.status === 400) {
      throw new Error('Invalid email or password');
    }
    throw error;
  }
}

// Check if user is authenticated
function isAuthenticated() {
  return pb.authStore.isValid;
}

// Get current user
function getCurrentUser() {
  return pb.authStore.record;
}

// Logout
function logout() {
  pb.authStore.clear();
}

// Listen for auth changes
pb.authStore.onChange((token, record) => {
  console.log('Auth state changed:', record?.email || 'logged out');
}, true);  // true = fire immediately with current state
```

**Auth collection configuration for password auth:**

```javascript
// When creating auth collection via API (superuser only)
await pb.collections.create({
  name: 'users',
  type: 'auth',
  fields: [
    { name: 'name', type: 'text' },
    { name: 'avatar', type: 'file', options: { maxSelect: 1 } }
  ],
  passwordAuth: {
    enabled: true,
    identityFields: ['email', 'username']  // Fields that can be used to login
  },
  // Require minimum password length
  // (configured in Admin UI under collection options)
});
```

**Security considerations:**
- Never store passwords in plain text
- Use generic error messages
- Implement rate limiting on your server
- Consider adding MFA for sensitive applications

Reference: [PocketBase Auth](https://pocketbase.io/docs/authentication/)

### 3.5 Manage Auth Tokens Properly

**Impact: CRITICAL (Prevents unauthorized access, handles token expiration gracefully)**

## Manage Auth Tokens Properly

Auth tokens should be refreshed before expiration, validated on critical operations, and properly cleared on logout. The SDK's authStore handles most of this automatically.

**Incorrect (ignoring token expiration):**

```javascript
// Bad: never checking token validity
async function fetchUserData() {
  // Token might be expired!
  const records = await pb.collection('posts').getList();
  return records;
}

// Bad: manually managing tokens
let authToken = localStorage.getItem('token');
fetch('/api/posts', {
  headers: { 'Authorization': authToken }  // Token might be invalid
});
```

**Correct (proper token management):**

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Check token validity before operations
async function fetchSecureData() {
  // authStore.isValid checks if token exists and isn't expired
  if (!pb.authStore.isValid) {
    throw new Error('Please log in');
  }

  return pb.collection('posts').getList();
}

// Refresh token periodically or before expiration
async function refreshAuthIfNeeded() {
  if (!pb.authStore.isValid) {
    return false;
  }

  try {
    // Verifies current token and returns fresh one
    await pb.collection('users').authRefresh();
    console.log('Token refreshed');
    return true;
  } catch (error) {
    // Token invalid - user needs to re-authenticate
    pb.authStore.clear();
    return false;
  }
}

// Auto-refresh on app initialization
async function initializeAuth() {
  if (pb.authStore.token) {
    try {
      await pb.collection('users').authRefresh();
    } catch {
      pb.authStore.clear();
    }
  }
}

// Listen for auth changes and handle expiration
pb.authStore.onChange((token, record) => {
  if (!token) {
    // User logged out or token cleared
    redirectToLogin();
  }
});

// Setup periodic refresh (e.g., every 10 minutes)
setInterval(async () => {
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
    } catch {
      pb.authStore.clear();
    }
  }
}, 10 * 60 * 1000);
```

**SSR / Server-side token handling:**

```javascript
// Server-side: create fresh client per request
export async function handleRequest(request) {
  const pb = new PocketBase('http://127.0.0.1:8090');

  // Load auth from cookie
  pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

  // Validate and refresh
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
    } catch {
      pb.authStore.clear();
    }
  }

  // ... handle request ...

  // Send updated cookie
  const response = new Response();
  response.headers.set('set-cookie', pb.authStore.exportToCookie());
  return response;
}
```

**Token configuration (Admin UI or migration):**

```javascript
// Configure token durations (superuser only)
await pb.collections.update('users', {
  authToken: {
    duration: 1209600  // 14 days in seconds
  },
  verificationToken: {
    duration: 604800   // 7 days
  }
});
```

Reference: [PocketBase Auth Store](https://pocketbase.io/docs/authentication/)

## 4. SDK Usage

**Impact: HIGH**

JavaScript SDK initialization, auth store patterns, error handling, request cancellation, and safe parameter binding.

### 4.1 Use Appropriate Auth Store for Your Platform

**Impact: HIGH (Proper auth persistence across sessions and page reloads)**

## Use Appropriate Auth Store for Your Platform

The auth store persists authentication state. Choose the right store type based on your platform: LocalAuthStore for browsers, AsyncAuthStore for React Native, or custom stores for specific needs.

**Incorrect (wrong store for platform):**

```javascript
// React Native: LocalAuthStore doesn't work correctly
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');
// Auth state lost on app restart!

// Deno server: LocalStorage shared between all clients
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');
// All clients share the same auth state!

// Server-side: Reusing single client for multiple users
const pb = new PocketBase('http://127.0.0.1:8090');
// User A logs in...
// User B's request uses User A's auth!
```

**Correct (platform-appropriate stores):**

```javascript
// Browser (default LocalAuthStore - works automatically)
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');
// Automatically persists to localStorage and syncs between tabs

// React Native (AsyncAuthStore)
import PocketBase, { AsyncAuthStore } from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const store = new AsyncAuthStore({
  save: async (serialized) => {
    await AsyncStorage.setItem('pb_auth', serialized);
  },
  initial: AsyncStorage.getItem('pb_auth'),
  clear: async () => {
    await AsyncStorage.removeItem('pb_auth');
  }
});

const pb = new PocketBase('http://127.0.0.1:8090', store);

// Server-side / SSR (create client per request)
import PocketBase from 'pocketbase';

export function createServerClient(cookieHeader) {
  const pb = new PocketBase('http://127.0.0.1:8090');
  pb.authStore.loadFromCookie(cookieHeader || '');
  return pb;
}

// Deno/Cloudflare Workers (memory-only store)
import PocketBase, { BaseAuthStore } from 'pocketbase';

class MemoryAuthStore extends BaseAuthStore {
  // Token only persists for request duration
  // Each request must include auth via cookie/header
}

const pb = new PocketBase('http://127.0.0.1:8090', new MemoryAuthStore());
```

**Custom auth store example:**

```javascript
import PocketBase, { BaseAuthStore } from 'pocketbase';

class SecureAuthStore extends BaseAuthStore {
  constructor() {
    super();
    // Load initial state from secure storage
    const data = secureStorage.get('pb_auth');
    if (data) {
      const { token, record } = JSON.parse(data);
      this.save(token, record);
    }
  }

  save(token, record) {
    super.save(token, record);
    // Persist to secure storage
    secureStorage.set('pb_auth', JSON.stringify({ token, record }));
  }

  clear() {
    super.clear();
    secureStorage.remove('pb_auth');
  }
}

const pb = new PocketBase('http://127.0.0.1:8090', new SecureAuthStore());
```

**Auth store methods:**

```javascript
// Available on all auth stores
pb.authStore.token;        // Current token
pb.authStore.record;       // Current auth record
pb.authStore.isValid;      // Token exists and not expired
pb.authStore.isSuperuser;  // Is superuser token

pb.authStore.save(token, record);  // Save auth state
pb.authStore.clear();              // Clear auth state

// Listen for changes
const unsubscribe = pb.authStore.onChange((token, record) => {
  console.log('Auth changed:', record?.email);
}, true);  // true = fire immediately

// Cookie helpers (for SSR)
pb.authStore.loadFromCookie(cookieString);
pb.authStore.exportToCookie({ httpOnly: false, secure: true });
```

Reference: [PocketBase Auth Store](https://github.com/pocketbase/js-sdk#auth-store)

### 4.2 Understand and Control Auto-Cancellation

**Impact: MEDIUM (Prevents race conditions, improves UX for search/typeahead)**

## Understand and Control Auto-Cancellation

The SDK automatically cancels duplicate pending requests. This prevents race conditions but requires understanding for proper use in concurrent scenarios.

**Incorrect (confused by auto-cancellation):**

```javascript
// These requests will interfere with each other!
async function loadDashboard() {
  // Only the last one executes, others cancelled
  const posts = pb.collection('posts').getList(1, 20);
  const users = pb.collection('posts').getList(1, 10);  // Different params but same path
  const comments = pb.collection('posts').getList(1, 5);

  // posts and users are cancelled, only comments executes
  return Promise.all([posts, users, comments]);  // First two fail!
}

// Realtime combined with polling causes cancellation
pb.collection('posts').subscribe('*', callback);
setInterval(() => {
  pb.collection('posts').getList();  // May cancel realtime!
}, 5000);
```

**Correct (controlling auto-cancellation):**

```javascript
// Disable auto-cancellation for parallel requests
async function loadDashboard() {
  const [posts, users, recent] = await Promise.all([
    pb.collection('posts').getList(1, 20, { requestKey: null }),
    pb.collection('users').getList(1, 10, { requestKey: null }),
    pb.collection('posts').getList(1, 5, { requestKey: 'recent' })
  ]);
  // All requests complete independently
  return { posts, users, recent };
}

// Use unique request keys for different purposes
async function searchPosts(query) {
  return pb.collection('posts').getList(1, 20, {
    filter: pb.filter('title ~ {:q}', { q: query }),
    requestKey: 'post-search'  // Cancels previous searches only
  });
}

async function loadPostDetails(postId) {
  return pb.collection('posts').getOne(postId, {
    requestKey: `post-${postId}`  // Unique per post
  });
}

// Typeahead search - auto-cancellation is helpful here
async function typeaheadSearch(query) {
  // Previous search automatically cancelled when user types more
  return pb.collection('products').getList(1, 10, {
    filter: pb.filter('name ~ {:q}', { q: query })
    // No requestKey = uses default (path-based), previous cancelled
  });
}

// Globally disable auto-cancellation (use carefully)
pb.autoCancellation(false);

// Now all requests are independent
await Promise.all([
  pb.collection('posts').getList(1, 20),
  pb.collection('posts').getList(1, 10),
  pb.collection('posts').getList(1, 5)
]);

// Re-enable
pb.autoCancellation(true);
```

**Manual cancellation:**

```javascript
// Cancel all pending requests
pb.cancelAllRequests();

// Cancel specific request by key
pb.cancelRequest('post-search');

// Example: Cancel on component unmount
function PostList() {
  useEffect(() => {
    loadPosts();

    return () => {
      // Cleanup: cancel pending requests
      pb.cancelRequest('post-list');
    };
  }, []);

  async function loadPosts() {
    const result = await pb.collection('posts').getList(1, 20, {
      requestKey: 'post-list'
    });
    setPosts(result.items);
  }
}

// Handle cancellation in catch
async function fetchWithCancellation() {
  try {
    return await pb.collection('posts').getList();
  } catch (error) {
    if (error.isAbort) {
      // Request was cancelled - this is expected
      console.log('Request cancelled');
      return null;
    }
    throw error;
  }
}
```

**When to use each approach:**

| Scenario | Approach |
|----------|----------|
| Search/typeahead | Default (let it cancel) |
| Parallel data loading | `requestKey: null` |
| Grouped requests | Custom `requestKey` |
| Component cleanup | `cancelRequest(key)` |
| Testing/debugging | `autoCancellation(false)` |

Reference: [PocketBase Auto-Cancellation](https://github.com/pocketbase/js-sdk#auto-cancellation)

### 4.3 Handle SDK Errors Properly

**Impact: HIGH (Graceful error recovery, better UX, easier debugging)**

## Handle SDK Errors Properly

All SDK methods return Promises that may reject with `ClientResponseError`. Proper error handling improves user experience and simplifies debugging.

**Incorrect (ignoring or poorly handling errors):**

```javascript
// No error handling
const posts = await pb.collection('posts').getList();

// Generic catch that loses information
try {
  await pb.collection('posts').create({ title: '' });
} catch (e) {
  alert('Something went wrong');  // No useful info
}

// Not checking specific error types
try {
  await pb.collection('posts').getOne('nonexistent');
} catch (e) {
  console.log(e.message);  // Missing status, response details
}
```

**Correct (comprehensive error handling):**

```javascript
import PocketBase, { ClientResponseError } from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Basic error handling with ClientResponseError
async function createPost(data) {
  try {
    return await pb.collection('posts').create(data);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      console.log('Status:', error.status);
      console.log('Response:', error.response);
      console.log('URL:', error.url);
      console.log('Is abort:', error.isAbort);

      // Handle specific status codes
      switch (error.status) {
        case 400:
          // Validation error - response contains field errors
          return { error: 'validation', fields: error.response.data };
        case 401:
          // Unauthorized - need to login
          return { error: 'unauthorized' };
        case 403:
          // Forbidden - no permission
          return { error: 'forbidden' };
        case 404:
          // Not found
          return { error: 'not_found' };
        default:
          return { error: 'server_error' };
      }
    }
    throw error;  // Re-throw non-PocketBase errors
  }
}

// Handle validation errors with field details
async function updateProfile(userId, data) {
  try {
    return await pb.collection('users').update(userId, data);
  } catch (error) {
    if (error.status === 400 && error.response?.data) {
      // Extract field-specific errors
      const fieldErrors = {};
      for (const [field, details] of Object.entries(error.response.data)) {
        fieldErrors[field] = details.message;
      }
      return { success: false, errors: fieldErrors };
      // { errors: { email: "Invalid email format", name: "Required field" } }
    }
    throw error;
  }
}

// Handle request cancellation
async function searchWithCancel(query) {
  try {
    return await pb.collection('posts').getList(1, 20, {
      filter: pb.filter('title ~ {:query}', { query })
    });
  } catch (error) {
    if (error.isAbort) {
      // Request was cancelled (e.g., user typed again)
      console.log('Search cancelled');
      return null;
    }
    throw error;
  }
}

// Wrapper function for consistent error handling
async function pbRequest(fn) {
  try {
    return { data: await fn(), error: null };
  } catch (error) {
    if (error instanceof ClientResponseError) {
      return {
        data: null,
        error: {
          status: error.status,
          message: error.response?.message || 'Request failed',
          data: error.response?.data || null
        }
      };
    }
    return {
      data: null,
      error: { status: 0, message: error.message, data: null }
    };
  }
}

// Usage
const { data, error } = await pbRequest(() =>
  pb.collection('posts').getList(1, 20)
);

if (error) {
  console.log('Failed:', error.message);
} else {
  console.log('Posts:', data.items);
}
```

**ClientResponseError structure:**

```typescript
interface ClientResponseError {
  url: string;           // The request URL
  status: number;        // HTTP status code (0 if network error)
  response: {            // API response body
    code: number;
    message: string;
    data: { [field: string]: { code: string; message: string } };
  };
  isAbort: boolean;      // True if request was cancelled
  originalError: Error;  // Original error if any
}
```

Reference: [PocketBase Error Handling](https://github.com/pocketbase/js-sdk#error-handling)

### 4.4 Use Field Modifiers for Incremental Updates

**Impact: HIGH (Atomic updates, prevents race conditions, cleaner code)**

## Use Field Modifiers for Incremental Updates

PocketBase supports `+` and `-` modifiers for incrementing numbers, appending/removing relation IDs, and managing file arrays without replacing the entire value.

**Incorrect (read-modify-write pattern):**

```javascript
// Race condition: two users adding tags simultaneously
async function addTag(postId, newTagId) {
  const post = await pb.collection('posts').getOne(postId);
  const currentTags = post.tags || [];

  // Another user might have added a tag in between!
  await pb.collection('posts').update(postId, {
    tags: [...currentTags, newTagId]  // Might overwrite the other user's tag
  });
}

// Inefficient for incrementing counters
async function incrementViews(postId) {
  const post = await pb.collection('posts').getOne(postId);
  await pb.collection('posts').update(postId, {
    views: post.views + 1  // Extra read, race condition
  });
}
```

**Correct (using field modifiers):**

```javascript
// Atomic relation append with + modifier
async function addTag(postId, newTagId) {
  await pb.collection('posts').update(postId, {
    'tags+': newTagId  // Appends to existing tags atomically
  });
}

// Append multiple relations
async function addTags(postId, tagIds) {
  await pb.collection('posts').update(postId, {
    'tags+': tagIds  // Appends array of IDs
  });
}

// Prepend relations (+ prefix)
async function prependTag(postId, tagId) {
  await pb.collection('posts').update(postId, {
    '+tags': tagId  // Prepends to start of array
  });
}

// Remove relations with - modifier
async function removeTag(postId, tagId) {
  await pb.collection('posts').update(postId, {
    'tags-': tagId  // Removes specific tag
  });
}

// Remove multiple relations
async function removeTags(postId, tagIds) {
  await pb.collection('posts').update(postId, {
    'tags-': tagIds  // Removes all specified tags
  });
}

// Atomic number increment
async function incrementViews(postId) {
  await pb.collection('posts').update(postId, {
    'views+': 1  // Atomic increment, no race condition
  });
}

// Atomic number decrement
async function decrementStock(productId, quantity) {
  await pb.collection('products').update(productId, {
    'stock-': quantity  // Atomic decrement
  });
}

// File append (for multi-file fields)
async function addImage(albumId, newImage) {
  await pb.collection('albums').update(albumId, {
    'images+': newImage  // Appends new file to existing
  });
}

// File removal
async function removeImage(albumId, filename) {
  await pb.collection('albums').update(albumId, {
    'images-': filename  // Removes specific file by name
  });
}

// Combined modifiers in single update
async function updatePost(postId, data) {
  await pb.collection('posts').update(postId, {
    title: data.title,        // Replace field
    'views+': 1,              // Increment number
    'tags+': data.newTagId,   // Append relation
    'tags-': data.oldTagId,   // Remove relation
    'images+': data.newImage  // Append file
  });
}
```

**Modifier reference:**

| Modifier | Field Types | Description |
|----------|-------------|-------------|
| `field+` or `+field` | relation, file | Append/prepend to array |
| `field-` | relation, file | Remove from array |
| `field+` | number | Increment by value |
| `field-` | number | Decrement by value |

**Benefits:**
- **Atomic**: No read-modify-write race conditions
- **Efficient**: Single request, no extra read needed
- **Clean**: Expresses intent clearly

**Note:** Modifiers only work with `update()`, not `create()`.

Reference: [PocketBase Relations](https://pocketbase.io/docs/working-with-relations/)

### 4.5 Use Safe Parameter Binding in Filters

**Impact: CRITICAL (Prevents injection attacks, handles special characters correctly)**

## Use Safe Parameter Binding in Filters

Always use `pb.filter()` with parameter binding when constructing filters with user input. String concatenation is vulnerable to injection attacks.

**Incorrect (string concatenation - DANGEROUS):**

```javascript
// SQL/filter injection vulnerability!
async function searchPosts(userInput) {
  // User input: `test" || id != "` breaks out of string
  const posts = await pb.collection('posts').getList(1, 20, {
    filter: `title ~ "${userInput}"`  // VULNERABLE!
  });
  return posts;
}

// Even with escaping, easy to get wrong
async function searchByEmail(email) {
  const escaped = email.replace(/"/g, '\\"');  // Incomplete escaping
  const users = await pb.collection('users').getList(1, 1, {
    filter: `email = "${escaped}"`  // Still potentially vulnerable
  });
  return users;
}

// Template literals are just as dangerous
const filter = `status = "${status}" && author = "${authorId}"`;
```

**Correct (using pb.filter with parameters):**

```javascript
// Safe parameter binding
async function searchPosts(userInput) {
  const posts = await pb.collection('posts').getList(1, 20, {
    filter: pb.filter('title ~ {:search}', { search: userInput })
  });
  return posts;
}

// Multiple parameters
async function filterPosts(status, authorId, minViews) {
  const posts = await pb.collection('posts').getList(1, 20, {
    filter: pb.filter(
      'status = {:status} && author = {:author} && views >= {:views}',
      { status, author: authorId, views: minViews }
    )
  });
  return posts;
}

// Reusing parameters
async function searchBothFields(query) {
  const results = await pb.collection('posts').getList(1, 20, {
    filter: pb.filter(
      'title ~ {:q} || content ~ {:q}',
      { q: query }  // Same parameter used twice
    )
  });
  return results;
}

// Different parameter types
async function complexFilter(options) {
  const filter = pb.filter(
    'created > {:date} && active = {:active} && category = {:cat}',
    {
      date: new Date('2024-01-01'),  // Date objects handled correctly
      active: true,                    // Booleans
      cat: options.category            // Strings auto-escaped
    }
  );

  return pb.collection('posts').getList(1, 20, { filter });
}

// Null handling
async function filterWithOptional(category) {
  // Only include filter if value provided
  const filter = category
    ? pb.filter('category = {:cat}', { cat: category })
    : '';

  return pb.collection('posts').getList(1, 20, { filter });
}

// Building dynamic filters
async function dynamicSearch(filters) {
  const conditions = [];
  const params = {};

  if (filters.title) {
    conditions.push('title ~ {:title}');
    params.title = filters.title;
  }

  if (filters.author) {
    conditions.push('author = {:author}');
    params.author = filters.author;
  }

  if (filters.minDate) {
    conditions.push('created >= {:minDate}');
    params.minDate = filters.minDate;
  }

  const filter = conditions.length > 0
    ? pb.filter(conditions.join(' && '), params)
    : '';

  return pb.collection('posts').getList(1, 20, { filter });
}
```

**Supported parameter types:**

| Type | Example | Notes |
|------|---------|-------|
| string | `'hello'` | Auto-escaped, quotes handled |
| number | `123`, `45.67` | No quotes added |
| boolean | `true`, `false` | Converted correctly |
| Date | `new Date()` | Formatted for PocketBase |
| null | `null` | For null comparisons |
| other | `{...}` | JSON.stringify() applied |

**Server-side is especially critical:**

```javascript
// Server-side code (Node.js, Deno, etc.) MUST use binding
// because malicious users control the input directly

export async function searchHandler(req) {
  const userQuery = req.query.q;  // Untrusted input!

  // ALWAYS use pb.filter() on server
  const results = await pb.collection('posts').getList(1, 20, {
    filter: pb.filter('title ~ {:q}', { q: userQuery })
  });

  return results;
}
```

Reference: [PocketBase Filter Binding](https://github.com/pocketbase/js-sdk#binding-filter-parameters)

### 4.6 Initialize PocketBase Client Correctly

**Impact: HIGH (Proper setup enables auth persistence, SSR support, and optimal performance)**

## Initialize PocketBase Client Correctly

Client initialization should consider the environment (browser, Node.js, SSR), auth store persistence, and any required polyfills.

**Incorrect (environment-agnostic initialization):**

```javascript
// Missing polyfills in Node.js
import PocketBase from 'pocketbase';
const pb = new PocketBase('http://127.0.0.1:8090');

// Node.js: EventSource not defined error on realtime
pb.collection('posts').subscribe('*', callback);  // Fails!

// Missing base URL
const pb = new PocketBase();  // Uses '/' - likely wrong
```

**Correct (environment-aware initialization):**

```javascript
// Browser setup (no polyfills needed)
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Node.js setup (requires polyfills for realtime)
import PocketBase from 'pocketbase';
import { EventSource } from 'eventsource';

// Global polyfill for realtime
global.EventSource = EventSource;

const pb = new PocketBase('http://127.0.0.1:8090');

// React Native setup (async auth store)
import PocketBase, { AsyncAuthStore } from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventSource from 'react-native-sse';

global.EventSource = EventSource;

const store = new AsyncAuthStore({
  save: async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
  initial: AsyncStorage.getItem('pb_auth'),
});

const pb = new PocketBase('http://127.0.0.1:8090', store);
```

**SSR initialization (per-request client):**

```javascript
// SvelteKit example
// src/hooks.server.js
import PocketBase from 'pocketbase';

export async function handle({ event, resolve }) {
  // Create fresh client for each request
  event.locals.pb = new PocketBase('http://127.0.0.1:8090');

  // Load auth from request cookie
  event.locals.pb.authStore.loadFromCookie(
    event.request.headers.get('cookie') || ''
  );

  // Validate token
  if (event.locals.pb.authStore.isValid) {
    try {
      await event.locals.pb.collection('users').authRefresh();
    } catch {
      event.locals.pb.authStore.clear();
    }
  }

  const response = await resolve(event);

  // Send updated auth cookie
  response.headers.append(
    'set-cookie',
    event.locals.pb.authStore.exportToCookie()
  );

  return response;
}
```

**TypeScript with typed collections:**

```typescript
import PocketBase, { RecordService } from 'pocketbase';

// Define your record types
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  published: boolean;
}

// Create typed client interface
interface TypedPocketBase extends PocketBase {
  collection(idOrName: string): RecordService;
  collection(idOrName: 'users'): RecordService<User>;
  collection(idOrName: 'posts'): RecordService<Post>;
}

const pb = new PocketBase('http://127.0.0.1:8090') as TypedPocketBase;

// Now methods are typed
const post = await pb.collection('posts').getOne('abc');  // Returns Post
const users = await pb.collection('users').getList();      // Returns ListResult<User>
```

Reference: [PocketBase JS SDK](https://github.com/pocketbase/js-sdk)

### 4.7 Use Send Hooks for Request Customization

**Impact: MEDIUM (Custom headers, logging, response transformation)**

## Use Send Hooks for Request Customization

The SDK provides `beforeSend` and `afterSend` hooks for intercepting and modifying requests and responses globally.

**Incorrect (repeating logic in every request):**

```javascript
// Adding headers to every request manually
const posts = await pb.collection('posts').getList(1, 20, {
  headers: { 'X-Custom-Header': 'value' }
});

const users = await pb.collection('users').getList(1, 20, {
  headers: { 'X-Custom-Header': 'value' }  // Repeated!
});

// Logging each request manually
console.log('Fetching posts...');
const posts = await pb.collection('posts').getList();
console.log('Done');
```

**Correct (using send hooks):**

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// beforeSend - modify requests before they're sent
pb.beforeSend = function(url, options) {
  // Add custom headers to all requests
  options.headers = Object.assign({}, options.headers, {
    'X-Custom-Header': 'value',
    'X-Request-ID': crypto.randomUUID()
  });

  // Log outgoing requests
  console.log(`[${options.method}] ${url}`);

  // Must return { url, options }
  return { url, options };
};

// afterSend - process responses
pb.afterSend = function(response, data) {
  // Log response status
  console.log(`Response: ${response.status}`);

  // Transform or extend response data
  if (data && typeof data === 'object') {
    data._fetchedAt = new Date().toISOString();
  }

  // Return the (possibly modified) data
  return data;
};

// All requests now automatically have headers and logging
const posts = await pb.collection('posts').getList();
const users = await pb.collection('users').getList();
```

**Practical examples:**

```javascript
// Request timing / performance monitoring
pb.beforeSend = function(url, options) {
  options._startTime = performance.now();
  return { url, options };
};

pb.afterSend = function(response, data, options) {
  const duration = performance.now() - options._startTime;
  console.log(`${options.method} ${response.url}: ${duration.toFixed(2)}ms`);

  // Send to analytics
  trackApiPerformance(response.url, duration);

  return data;
};

// Add auth token from different source
pb.beforeSend = function(url, options) {
  const externalToken = getTokenFromExternalAuth();
  if (externalToken) {
    options.headers = Object.assign({}, options.headers, {
      'X-External-Auth': externalToken
    });
  }
  return { url, options };
};

// Handle specific response codes globally
pb.afterSend = function(response, data) {
  if (response.status === 401) {
    // Token expired - trigger re-auth
    handleAuthExpired();
  }

  if (response.status === 503) {
    // Service unavailable - show maintenance message
    showMaintenanceMode();
  }

  return data;
};

// Retry failed requests (simplified example)
const originalSend = pb.send.bind(pb);
pb.send = async function(path, options) {
  try {
    return await originalSend(path, options);
  } catch (error) {
    if (error.status === 429) {  // Rate limited
      await sleep(1000);
      return originalSend(path, options);  // Retry once
    }
    throw error;
  }
};

// Add request correlation for debugging
let requestId = 0;
pb.beforeSend = function(url, options) {
  requestId++;
  const correlationId = `req-${Date.now()}-${requestId}`;

  options.headers = Object.assign({}, options.headers, {
    'X-Correlation-ID': correlationId
  });

  console.log(`[${correlationId}] Starting: ${url}`);
  options._correlationId = correlationId;

  return { url, options };
};

pb.afterSend = function(response, data, options) {
  console.log(`[${options._correlationId}] Complete: ${response.status}`);
  return data;
};
```

**Hook signatures:**

```typescript
// beforeSend
beforeSend?: (
  url: string,
  options: SendOptions
) => { url: string; options: SendOptions } | Promise<{ url: string; options: SendOptions }>;

// afterSend
afterSend?: (
  response: Response,
  data: any,
  options: SendOptions
) => any | Promise<any>;
```

**Use cases:**
- Add custom headers (API keys, correlation IDs)
- Request/response logging
- Performance monitoring
- Global error handling
- Response transformation
- Authentication middleware

Reference: [PocketBase Send Hooks](https://github.com/pocketbase/js-sdk#send-hooks)

## 5. Query Performance

**Impact: HIGH**

Pagination strategies, relation expansion, field selection, batch operations, and N+1 query prevention.

### 5.1 Use Back-Relations for Inverse Lookups

**Impact: HIGH (Fetch related records without separate queries)**

## Use Back-Relations for Inverse Lookups

Back-relations allow you to expand records that reference the current record, enabling inverse lookups in a single request. Use the `collectionName_via_fieldName` syntax.

**Incorrect (manual inverse lookup):**

```javascript
// Fetching a user, then their posts separately
async function getUserWithPosts(userId) {
  const user = await pb.collection('users').getOne(userId);

  // Extra request for posts
  const posts = await pb.collection('posts').getList(1, 100, {
    filter: pb.filter('author = {:userId}', { userId })
  });

  return { ...user, posts: posts.items };
}
// 2 API calls

// Fetching a post, then its comments
async function getPostWithComments(postId) {
  const post = await pb.collection('posts').getOne(postId);
  const comments = await pb.collection('comments').getFullList({
    filter: pb.filter('post = {:postId}', { postId }),
    expand: 'author'
  });

  return { ...post, comments };
}
// 2 API calls
```

**Correct (using back-relation expand):**

```javascript
// Expand posts that reference this user
// posts collection has: author (relation to users)
async function getUserWithPosts(userId) {
  const user = await pb.collection('users').getOne(userId, {
    expand: 'posts_via_author'  // collectionName_via_fieldName
  });

  console.log('User:', user.name);
  console.log('Posts:', user.expand?.posts_via_author);
  return user;
}
// 1 API call!

// Expand comments that reference this post
// comments collection has: post (relation to posts)
async function getPostWithComments(postId) {
  const post = await pb.collection('posts').getOne(postId, {
    expand: 'comments_via_post,comments_via_post.author'
  });

  const comments = post.expand?.comments_via_post || [];
  comments.forEach(comment => {
    console.log(`${comment.expand?.author?.name}: ${comment.content}`);
  });

  return post;
}
// 1 API call with nested expansion!

// Multiple back-relations
async function getUserWithAllContent(userId) {
  const user = await pb.collection('users').getOne(userId, {
    expand: 'posts_via_author,comments_via_author,likes_via_user'
  });

  return {
    user,
    posts: user.expand?.posts_via_author || [],
    comments: user.expand?.comments_via_author || [],
    likes: user.expand?.likes_via_user || []
  };
}
```

**Back-relation syntax:**

```
{referencing_collection}_via_{relation_field}

Examples:
- posts_via_author      -> posts where author = current record
- comments_via_post     -> comments where post = current record
- order_items_via_order -> order_items where order = current record
- team_members_via_team -> team_members where team = current record
```

**Nested back-relations:**

```javascript
// Get user with posts and each post's comments
const user = await pb.collection('users').getOne(userId, {
  expand: 'posts_via_author.comments_via_post'
});

// Access nested data
const posts = user.expand?.posts_via_author || [];
posts.forEach(post => {
  console.log('Post:', post.title);
  const comments = post.expand?.comments_via_post || [];
  comments.forEach(c => console.log('  Comment:', c.content));
});
```

**Important considerations:**

```javascript
// Back-relations return arrays (even for single relations)
// unless the relation field has a UNIQUE index

// Limited to 1000 records per back-relation
// For more, use separate paginated query
const user = await pb.collection('users').getOne(userId, {
  expand: 'posts_via_author'
});
// If user has 1500 posts, only first 1000 are included

// For large datasets, use paginated approach
async function getUserPostsPaginated(userId, page = 1) {
  return pb.collection('posts').getList(page, 50, {
    filter: pb.filter('author = {:userId}', { userId }),
    sort: '-created'
  });
}
```

**Use in list queries:**

```javascript
// Get all users with their post counts
// (Use view collection for actual counts)
const users = await pb.collection('users').getList(1, 20, {
  expand: 'posts_via_author'
});

users.items.forEach(user => {
  const postCount = user.expand?.posts_via_author?.length || 0;
  console.log(`${user.name}: ${postCount} posts`);
});
```

**When to use back-relations vs separate queries:**

| Scenario | Approach |
|----------|----------|
| < 1000 related records | Back-relation expand |
| Need pagination | Separate query with filter |
| Need sorting/filtering | Separate query |
| Just need count | View collection |
| Display in list | Back-relation (if small) |

Reference: [PocketBase Back-Relations](https://pocketbase.io/docs/working-with-relations/#back-relation-expand)

### 5.2 Use Batch Operations for Multiple Writes

**Impact: HIGH (Atomic transactions, 10x fewer API calls, consistent state)**

## Use Batch Operations for Multiple Writes

Batch operations combine multiple create/update/delete operations into a single atomic transaction. This ensures consistency and dramatically reduces API calls.

**Incorrect (individual requests):**

```javascript
// Creating multiple records individually
async function createOrderWithItems(order, items) {
  // If any fails, partial data remains!
  const createdOrder = await pb.collection('orders').create(order);

  for (const item of items) {
    await pb.collection('order_items').create({
      ...item,
      order: createdOrder.id
    });
  }
  // 1 + N API calls, not atomic
}

// Updating multiple records
async function updatePrices(products) {
  for (const product of products) {
    await pb.collection('products').update(product.id, {
      price: product.newPrice
    });
  }
  // N API calls, some might fail leaving inconsistent state
}

// Mixed operations
async function transferFunds(fromId, toId, amount) {
  // NOT ATOMIC - can leave invalid state!
  await pb.collection('accounts').update(fromId, { 'balance-': amount });
  // If this fails, money disappears!
  await pb.collection('accounts').update(toId, { 'balance+': amount });
}
```

**Correct (using batch operations):**

```javascript
// Atomic batch create
async function createOrderWithItems(order, items) {
  const batch = pb.createBatch();

  // Queue order creation
  batch.collection('orders').create(order);

  // Queue all items (order ID will be available in transaction)
  items.forEach((item, index) => {
    batch.collection('order_items').create({
      ...item,
      // Reference the order that will be created
      order: `@request.body.requests.0.body.id`
    });
  });

  // Execute atomically
  const results = await batch.send();
  // All succeed or all fail together

  return {
    order: results[0],
    items: results.slice(1)
  };
}

// Batch updates
async function updatePrices(products) {
  const batch = pb.createBatch();

  products.forEach(product => {
    batch.collection('products').update(product.id, {
      price: product.newPrice
    });
  });

  const results = await batch.send();
  // 1 API call, atomic
  return results;
}

// Batch upsert (create or update)
async function syncProducts(products) {
  const batch = pb.createBatch();

  products.forEach(product => {
    batch.collection('products').upsert({
      id: product.sku,  // Use SKU as ID for upsert matching
      name: product.name,
      price: product.price,
      stock: product.stock
    });
  });

  return batch.send();
}

// Mixed operations in transaction
async function transferFunds(fromId, toId, amount) {
  const batch = pb.createBatch();

  batch.collection('accounts').update(fromId, { 'balance-': amount });
  batch.collection('accounts').update(toId, { 'balance+': amount });

  // Create audit record
  batch.collection('transfers').create({
    from: fromId,
    to: toId,
    amount,
    timestamp: new Date()
  });

  // All three operations atomic
  const [fromAccount, toAccount, transfer] = await batch.send();
  return { fromAccount, toAccount, transfer };
}

// Batch delete
async function deletePostWithComments(postId) {
  // First get comment IDs
  const comments = await pb.collection('comments').getFullList({
    filter: pb.filter('post = {:postId}', { postId }),
    fields: 'id'
  });

  const batch = pb.createBatch();

  // Queue all deletions
  comments.forEach(comment => {
    batch.collection('comments').delete(comment.id);
  });
  batch.collection('posts').delete(postId);

  await batch.send();
  // Post and all comments deleted atomically
}
```

**Batch operation limits:**
- Operations execute in a single database transaction
- All succeed or all rollback
- Respects API rules for each operation
- Maximum batch size depends on server configuration

**When to use batch:**

| Scenario | Use Batch? |
|----------|-----------|
| Creating parent + children | Yes |
| Bulk import/update | Yes |
| Financial transactions | Yes |
| Single record operations | No |
| Independent operations | Optional |

Reference: [PocketBase Batch API](https://pocketbase.io/docs/api-records/#batch-operations)

### 5.3 Expand Relations Efficiently

**Impact: HIGH (Eliminates N+1 queries, reduces API calls by 90%+)**

## Expand Relations Efficiently

Use the `expand` parameter to fetch related records in a single request. This eliminates N+1 query problems and dramatically reduces API calls.

**Incorrect (N+1 queries):**

```javascript
// Fetching posts then authors separately - N+1 problem
async function getPostsWithAuthors() {
  const posts = await pb.collection('posts').getList(1, 20);

  // N additional requests for N posts!
  for (const post of posts.items) {
    post.authorData = await pb.collection('users').getOne(post.author);
  }

  return posts;
}
// 21 API calls for 20 posts!

// Even worse with multiple relations
async function getPostsWithAll() {
  const posts = await pb.collection('posts').getList(1, 20);

  for (const post of posts.items) {
    post.author = await pb.collection('users').getOne(post.author);
    post.category = await pb.collection('categories').getOne(post.category);
    post.tags = await Promise.all(
      post.tags.map(id => pb.collection('tags').getOne(id))
    );
  }
  // 60+ API calls!
}
```

**Correct (using expand):**

```javascript
// Single request with expanded relations
async function getPostsWithAuthors() {
  const posts = await pb.collection('posts').getList(1, 20, {
    expand: 'author'
  });

  // Access expanded data
  posts.items.forEach(post => {
    console.log('Author:', post.expand?.author?.name);
  });

  return posts;
}
// 1 API call!

// Multiple relations
async function getPostsWithAll() {
  const posts = await pb.collection('posts').getList(1, 20, {
    expand: 'author,category,tags'
  });

  posts.items.forEach(post => {
    console.log('Author:', post.expand?.author?.name);
    console.log('Category:', post.expand?.category?.name);
    console.log('Tags:', post.expand?.tags?.map(t => t.name));
  });
}
// Still just 1 API call!

// Nested expansion (up to 6 levels)
async function getPostsWithNestedData() {
  const posts = await pb.collection('posts').getList(1, 20, {
    expand: 'author.profile,category.parent,comments_via_post.author'
  });

  posts.items.forEach(post => {
    // Nested relations
    console.log('Author profile:', post.expand?.author?.expand?.profile);
    console.log('Parent category:', post.expand?.category?.expand?.parent);

    // Back-relations (comments that reference this post)
    console.log('Comments:', post.expand?.['comments_via_post']);
  });
}

// Back-relation expansion
// If comments collection has a 'post' relation field pointing to posts
async function getPostWithComments(postId) {
  const post = await pb.collection('posts').getOne(postId, {
    expand: 'comments_via_post,comments_via_post.author'
  });

  // Access comments that reference this post
  const comments = post.expand?.['comments_via_post'] || [];
  comments.forEach(comment => {
    console.log(`${comment.expand?.author?.name}: ${comment.text}`);
  });

  return post;
}
```

**Expand syntax:**

| Syntax | Description |
|--------|-------------|
| `expand: 'author'` | Single relation |
| `expand: 'author,tags'` | Multiple relations |
| `expand: 'author.profile'` | Nested relation (2 levels) |
| `expand: 'comments_via_post'` | Back-relation (records pointing to this) |

**Handling optional expand data:**

```javascript
// Always use optional chaining - expand may be undefined
const authorName = post.expand?.author?.name || 'Unknown';

// Type-safe access with TypeScript
interface Post {
  id: string;
  title: string;
  author: string;  // Relation ID
  expand?: {
    author?: User;
  };
}

const posts = await pb.collection('posts').getList<Post>(1, 20, {
  expand: 'author'
});
```

**Limitations:**
- Maximum 6 levels of nesting
- Respects API rules on expanded collections
- Large expansions may impact performance

Reference: [PocketBase Expand](https://pocketbase.io/docs/api-records/#expand)

### 5.4 Select Only Required Fields

**Impact: MEDIUM (Reduces payload size, improves response time)**

## Select Only Required Fields

Use the `fields` parameter to request only the data you need. This reduces bandwidth and can improve query performance, especially with large text or file fields.

**Incorrect (fetching everything):**

```javascript
// Fetching all fields when only a few are needed
const posts = await pb.collection('posts').getList(1, 20);
// Returns: id, title, content (10KB), thumbnail, author, tags, created, updated...

// Only displaying titles in a list
posts.items.forEach(post => {
  renderListItem(post.title);  // Only using title!
});
// Wasted bandwidth on content, thumbnail URLs, etc.

// Fetching user data with large profile fields
const users = await pb.collection('users').getFullList();
// Includes: avatar (file), bio (text), settings (json)...
// When you only need names for a dropdown
```

**Correct (selecting specific fields):**

```javascript
// Select only needed fields
const posts = await pb.collection('posts').getList(1, 20, {
  fields: 'id,title,created'
});
// Returns only: { id, title, created }

// For a dropdown/autocomplete
const users = await pb.collection('users').getFullList({
  fields: 'id,name,avatar'
});

// Include expanded relation fields
const posts = await pb.collection('posts').getList(1, 20, {
  expand: 'author',
  fields: 'id,title,expand.author.name,expand.author.avatar'
});
// Returns: { id, title, expand: { author: { name, avatar } } }

// Wildcard for all direct fields, specific for expand
const posts = await pb.collection('posts').getList(1, 20, {
  expand: 'author,category',
  fields: '*,expand.author.name,expand.category.name'
});
// All post fields + only name from expanded relations
```

**Using excerpt modifier:**

```javascript
// Get truncated text content
const posts = await pb.collection('posts').getList(1, 20, {
  fields: 'id,title,content:excerpt(200,true)'
});
// content is truncated to 200 chars with "..." appended

// Multiple excerpts
const posts = await pb.collection('posts').getList(1, 20, {
  fields: 'id,title:excerpt(50),content:excerpt(150,true)'
});

// Excerpt syntax: field:excerpt(maxLength, withEllipsis?)
// - maxLength: maximum characters
// - withEllipsis: append "..." if truncated (default: false)
```

**Common field selection patterns:**

```javascript
// List view - minimal data
const listFields = 'id,title,thumbnail,author,created';

// Card view - slightly more
const cardFields = 'id,title,content:excerpt(200,true),thumbnail,author,created';

// Detail view - most fields
const detailFields = '*,expand.author.name,expand.author.avatar';

// Autocomplete - just id and display text
const autocompleteFields = 'id,name';

// Table export - specific columns
const exportFields = 'id,email,name,created,status';

// Usage
async function getPostsList() {
  return pb.collection('posts').getList(1, 20, {
    fields: listFields,
    expand: 'author'
  });
}
```

**Performance impact:**

| Field Type | Impact of Selecting |
|------------|-------------------|
| text/editor | High (can be large) |
| file | Medium (URLs generated) |
| json | Medium (can be large) |
| relation | Low (just IDs) |
| number/bool | Low |

**Note:** Field selection happens after data is fetched from database, so it primarily saves bandwidth, not database queries. For database-level optimization, ensure proper indexes.

Reference: [PocketBase Fields Parameter](https://pocketbase.io/docs/api-records/#fields)

### 5.5 Use getFirstListItem for Single Record Lookups

**Impact: MEDIUM (Cleaner code, automatic error handling for not found)**

## Use getFirstListItem for Single Record Lookups

Use `getFirstListItem()` when you need to find a single record by a field value other than ID. It's cleaner than `getList()` with limit 1 and provides proper error handling.

**Incorrect (manual single-record lookup):**

```javascript
// Using getList with limit 1 - verbose
async function findUserByEmail(email) {
  const result = await pb.collection('users').getList(1, 1, {
    filter: pb.filter('email = {:email}', { email })
  });

  if (result.items.length === 0) {
    throw new Error('User not found');
  }

  return result.items[0];
}

// Using getFullList then filtering - wasteful
async function findUserByUsername(username) {
  const users = await pb.collection('users').getFullList({
    filter: pb.filter('username = {:username}', { username })
  });
  return users[0];  // Might be undefined!
}

// Fetching by ID when you have a different identifier
async function findProductBySku(sku) {
  // Wrong: getOne expects the record ID
  const product = await pb.collection('products').getOne(sku);  // Fails!
}
```

**Correct (using getFirstListItem):**

```javascript
// Clean single-record lookup by any field
async function findUserByEmail(email) {
  try {
    const user = await pb.collection('users').getFirstListItem(
      pb.filter('email = {:email}', { email })
    );
    return user;
  } catch (error) {
    if (error.status === 404) {
      return null;  // Not found
    }
    throw error;
  }
}

// Lookup by unique field
async function findProductBySku(sku) {
  return pb.collection('products').getFirstListItem(
    pb.filter('sku = {:sku}', { sku })
  );
}

// Lookup with expand
async function findOrderByNumber(orderNumber) {
  return pb.collection('orders').getFirstListItem(
    pb.filter('orderNumber = {:num}', { num: orderNumber }),
    { expand: 'customer,items' }
  );
}

// Complex filter conditions
async function findActiveSubscription(userId) {
  return pb.collection('subscriptions').getFirstListItem(
    pb.filter(
      'user = {:userId} && status = "active" && expiresAt > @now',
      { userId }
    )
  );
}

// With field selection
async function getUserIdByEmail(email) {
  const user = await pb.collection('users').getFirstListItem(
    pb.filter('email = {:email}', { email }),
    { fields: 'id' }
  );
  return user.id;
}
```

**Comparison with getOne:**

```javascript
// getOne - fetch by record ID
const post = await pb.collection('posts').getOne('abc123');

// getFirstListItem - fetch by any filter
const post = await pb.collection('posts').getFirstListItem('slug = "hello-world"');
const user = await pb.collection('users').getFirstListItem('username = "john"');
const order = await pb.collection('orders').getFirstListItem('orderNumber = 12345');
```

**Error handling:**

```javascript
// getFirstListItem throws 404 if no match found
try {
  const user = await pb.collection('users').getFirstListItem(
    pb.filter('email = {:email}', { email })
  );
  return user;
} catch (error) {
  if (error.status === 404) {
    // No matching record - handle appropriately
    return null;
  }
  // Other error (network, auth, etc.)
  throw error;
}

// Wrapper function for optional lookup
async function findFirst(collection, filter, options = {}) {
  try {
    return await pb.collection(collection).getFirstListItem(filter, options);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// Usage
const user = await findFirst('users', pb.filter('email = {:e}', { e: email }));
if (!user) {
  console.log('User not found');
}
```

**When to use each method:**

| Method | Use When |
|--------|----------|
| `getOne(id)` | You have the record ID |
| `getFirstListItem(filter)` | Finding by unique field (email, slug, sku) |
| `getList(1, 1, { filter })` | Need pagination metadata |
| `getFullList({ filter })` | Expecting multiple results |

Reference: [PocketBase Records API](https://pocketbase.io/docs/api-records/)

### 5.6 Prevent N+1 Query Problems

**Impact: HIGH (Reduces API calls from N+1 to 1-2, dramatically faster page loads)**

## Prevent N+1 Query Problems

N+1 queries occur when you fetch a list of records, then make additional requests for each record's related data. This pattern causes severe performance issues at scale.

**Incorrect (N+1 patterns):**

```javascript
// Classic N+1: fetching related data in a loop
async function getPostsWithDetails() {
  const posts = await pb.collection('posts').getList(1, 20);  // 1 query

  for (const post of posts.items) {
    // N additional queries!
    post.author = await pb.collection('users').getOne(post.author);
    post.category = await pb.collection('categories').getOne(post.category);
  }
  // Total: 1 + 20 + 20 = 41 queries for 20 posts
}

// N+1 with Promise.all (faster but still N+1)
async function getPostsParallel() {
  const posts = await pb.collection('posts').getList(1, 20);

  await Promise.all(posts.items.map(async post => {
    post.author = await pb.collection('users').getOne(post.author);
  }));
  // Still 21 API calls, just parallel
}

// Hidden N+1 in rendering
function PostList({ posts }) {
  return posts.map(post => (
    <PostCard
      post={post}
      author={useAuthor(post.author)}  // Each triggers a fetch!
    />
  ));
}
```

**Correct (eliminate N+1):**

```javascript
// Solution 1: Use expand for relations
async function getPostsWithDetails() {
  const posts = await pb.collection('posts').getList(1, 20, {
    expand: 'author,category,tags'
  });

  // All data in one request
  posts.items.forEach(post => {
    console.log(post.expand?.author?.name);
    console.log(post.expand?.category?.name);
  });
  // Total: 1 query
}

// Solution 2: Batch fetch related records
async function getPostsWithAuthorsBatch() {
  const posts = await pb.collection('posts').getList(1, 20);

  // Collect unique author IDs
  const authorIds = [...new Set(posts.items.map(p => p.author))];

  // Single query for all authors
  const authors = await pb.collection('users').getList(1, authorIds.length, {
    filter: authorIds.map(id => `id = "${id}"`).join(' || ')
  });

  // Create lookup map
  const authorMap = Object.fromEntries(
    authors.items.map(a => [a.id, a])
  );

  // Attach to posts
  posts.items.forEach(post => {
    post.authorData = authorMap[post.author];
  });
  // Total: 2 queries regardless of post count
}

// Solution 3: Use view collection for complex joins
// Create a view that joins posts with authors:
// SELECT p.*, u.name as author_name, u.avatar as author_avatar
// FROM posts p LEFT JOIN users u ON p.author = u.id

async function getPostsFromView() {
  const posts = await pb.collection('posts_with_authors').getList(1, 20);
  // Single query, data already joined
}

// Solution 4: Back-relations with expand
async function getUserWithPosts(userId) {
  const user = await pb.collection('users').getOne(userId, {
    expand: 'posts_via_author'  // All posts by this user
  });

  console.log('Posts by user:', user.expand?.posts_via_author);
  // 1 query gets user + all their posts
}
```

**Detecting N+1 in your code:**

```javascript
// Add request logging to detect N+1
let requestCount = 0;
pb.beforeSend = (url, options) => {
  requestCount++;
  console.log(`Request #${requestCount}: ${options.method} ${url}`);
  return { url, options };
};

// Monitor during development
async function loadPage() {
  requestCount = 0;
  await loadAllData();
  console.log(`Total requests: ${requestCount}`);
  // If this is >> number of records, you have N+1
}
```

**Prevention checklist:**
- [ ] Always use `expand` for displaying related data
- [ ] Never fetch related records in loops
- [ ] Batch fetch when expand isn't available
- [ ] Consider view collections for complex joins
- [ ] Monitor request counts during development

Reference: [PocketBase Expand](https://pocketbase.io/docs/api-records/#expand)

### 5.7 Use Efficient Pagination Strategies

**Impact: HIGH (10-100x faster list queries on large collections)**

## Use Efficient Pagination Strategies

Pagination impacts performance significantly. Use `skipTotal` for large datasets, cursor-based pagination for infinite scroll, and appropriate page sizes.

**Incorrect (inefficient pagination):**

```javascript
// Fetching all records - memory and performance disaster
const allPosts = await pb.collection('posts').getFullList();
// Downloads entire table, crashes on large datasets

// Default pagination without skipTotal
const posts = await pb.collection('posts').getList(100, 20);
// COUNT(*) runs on every request - slow on large tables

// Using offset for infinite scroll
async function loadMore(page) {
  // As page increases, offset queries get slower
  return pb.collection('posts').getList(page, 20);
  // Page 1000: skips 19,980 rows before returning 20
}
```

**Correct (optimized pagination):**

```javascript
// Use skipTotal for better performance on large collections
const posts = await pb.collection('posts').getList(1, 20, {
  skipTotal: true,  // Skip COUNT(*) query
  sort: '-created'
});
// Returns items without totalItems/totalPages (faster)

// Cursor-based pagination for infinite scroll
async function loadMorePosts(lastCreated = null) {
  const filter = lastCreated
    ? pb.filter('created < {:cursor}', { cursor: lastCreated })
    : '';

  const result = await pb.collection('posts').getList(1, 20, {
    filter,
    sort: '-created',
    skipTotal: true
  });

  // Next cursor is the last item's created date
  const nextCursor = result.items.length > 0
    ? result.items[result.items.length - 1].created
    : null;

  return { items: result.items, nextCursor };
}

// Usage for infinite scroll
let cursor = null;
async function loadNextPage() {
  const { items, nextCursor } = await loadMorePosts(cursor);
  cursor = nextCursor;
  appendToList(items);
}

// Batched fetching when you need all records
async function getAllPostsEfficiently() {
  const allPosts = [];
  let page = 1;
  const perPage = 200;  // Larger batches = fewer requests

  while (true) {
    const result = await pb.collection('posts').getList(page, perPage, {
      skipTotal: true
    });

    allPosts.push(...result.items);

    if (result.items.length < perPage) {
      break;  // No more records
    }
    page++;
  }

  return allPosts;
}

// Or use getFullList with batch option
const allPosts = await pb.collection('posts').getFullList({
  batch: 200,  // Records per request (default 500)
  sort: '-created'
});
```

**Choose the right approach:**

| Use Case | Approach |
|----------|----------|
| Standard list with page numbers | `getList()` with page/perPage |
| Large dataset, no total needed | `getList()` with `skipTotal: true` |
| Infinite scroll | Cursor-based with `skipTotal: true` |
| Export all data | `getFullList()` with batch size |
| First N records only | `getList(1, N, { skipTotal: true })` |

**Performance tips:**
- Use `skipTotal: true` unless you need page count
- Keep `perPage` reasonable (20-100 for UI, 200-500 for batch)
- Index fields used in sort and filter
- Cursor pagination scales better than offset

Reference: [PocketBase Records API](https://pocketbase.io/docs/api-records/)

## 6. Realtime

**Impact: MEDIUM**

SSE subscriptions, event handling, connection management, and authentication with realtime.

### 6.1 Authenticate Realtime Connections

**Impact: MEDIUM (Secure subscriptions respecting API rules)**

## Authenticate Realtime Connections

Realtime subscriptions respect collection API rules. Ensure the connection is authenticated before subscribing to protected data.

**Incorrect (subscribing without auth context):**

```javascript
// Subscribing before authentication
const pb = new PocketBase('http://127.0.0.1:8090');

// This will fail or return no data if collection requires auth
pb.collection('private_messages').subscribe('*', (e) => {
  // Won't receive events - not authenticated!
  console.log(e.record);
});

// Later user logs in, but subscription doesn't update
await pb.collection('users').authWithPassword(email, password);
// Existing subscription still unauthenticated!
```

**Correct (authenticated subscriptions):**

```javascript
// Subscribe after authentication
const pb = new PocketBase('http://127.0.0.1:8090');

async function initRealtime() {
  // First authenticate
  await pb.collection('users').authWithPassword(email, password);

  // Now subscribe - will use auth context
  pb.collection('private_messages').subscribe('*', (e) => {
    // Receives events for messages user can access
    console.log('New message:', e.record);
  });
}

// Re-subscribe after auth changes
function useAuthenticatedRealtime() {
  const [messages, setMessages] = useState([]);
  const unsubRef = useRef(null);

  // Watch auth changes
  useEffect(() => {
    const removeListener = pb.authStore.onChange((token, record) => {
      // Unsubscribe old connection
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }

      // Re-subscribe with new auth context if logged in
      if (record) {
        setupSubscription();
      } else {
        setMessages([]);
      }
    }, true);

    return () => {
      removeListener();
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  async function setupSubscription() {
    unsubRef.current = await pb.collection('private_messages').subscribe('*', (e) => {
      handleMessage(e);
    });
  }
}

// Handle auth token refresh with realtime
pb.realtime.subscribe('PB_CONNECT', async (e) => {
  console.log('Realtime connected');

  // Verify auth is still valid
  if (pb.authStore.isValid) {
    try {
      await pb.collection('users').authRefresh();
    } catch {
      pb.authStore.clear();
      // Redirect to login
    }
  }
});
```

**API rules apply to subscriptions:**

```javascript
// Collection rule: listRule: 'owner = @request.auth.id'

// User A subscribed
await pb.collection('users').authWithPassword('a@test.com', 'password');
pb.collection('notes').subscribe('*', handler);
// Only receives events for notes where owner = User A

// Events from other users' notes are filtered out automatically
```

**Subscription authorization flow:**

1. SSE connection established (no auth check)
2. First subscription triggers authorization
3. Auth token from `pb.authStore` is used
4. Collection rules evaluated for each event
5. Only matching events sent to client

**Handling auth expiration:**

```javascript
// Setup disconnect handler
pb.realtime.onDisconnect = (subscriptions) => {
  console.log('Disconnected, had subscriptions:', subscriptions);

  // Check if auth expired
  if (!pb.authStore.isValid) {
    // Token expired - need to re-authenticate
    redirectToLogin();
    return;
  }

  // Connection issue - realtime will auto-reconnect
  // Re-subscribe after reconnection
  pb.realtime.subscribe('PB_CONNECT', () => {
    resubscribeAll(subscriptions);
  });
};

function resubscribeAll(subscriptions) {
  subscriptions.forEach(sub => {
    const [collection, topic] = sub.split('/');
    pb.collection(collection).subscribe(topic, handlers[sub]);
  });
}
```

Reference: [PocketBase Realtime Auth](https://pocketbase.io/docs/api-realtime/)

### 6.2 Handle Realtime Events Properly

**Impact: MEDIUM (Consistent UI state, proper optimistic updates)**

## Handle Realtime Events Properly

Realtime events should update local state correctly, handle edge cases, and maintain UI consistency.

**Incorrect (naive event handling):**

```javascript
// Blindly appending creates - may add duplicates
pb.collection('posts').subscribe('*', (e) => {
  if (e.action === 'create') {
    posts.push(e.record);  // Might already exist from optimistic update!
  }
});

// Not handling own actions
pb.collection('posts').subscribe('*', (e) => {
  // User creates post -> optimistic update
  // Realtime event arrives -> duplicate!
  setPosts(prev => [...prev, e.record]);
});

// Missing action types
pb.collection('posts').subscribe('*', (e) => {
  if (e.action === 'create') handleCreate(e);
  // Ignoring update and delete!
});
```

**Correct (robust event handling):**

```javascript
// Handle all action types with deduplication
function useRealtimePosts() {
  const [posts, setPosts] = useState([]);
  const pendingCreates = useRef(new Set());

  useEffect(() => {
    loadPosts();

    const unsub = pb.collection('posts').subscribe('*', (e) => {
      switch (e.action) {
        case 'create':
          // Skip if we created it (optimistic update already applied)
          if (pendingCreates.current.has(e.record.id)) {
            pendingCreates.current.delete(e.record.id);
            return;
          }
          setPosts(prev => {
            // Deduplicate - might already exist
            if (prev.some(p => p.id === e.record.id)) return prev;
            return [e.record, ...prev];
          });
          break;

        case 'update':
          setPosts(prev => prev.map(p =>
            p.id === e.record.id ? e.record : p
          ));
          break;

        case 'delete':
          setPosts(prev => prev.filter(p => p.id !== e.record.id));
          break;
      }
    });

    return unsub;
  }, []);

  async function createPost(data) {
    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticPost = { ...data, id: tempId };
    setPosts(prev => [optimisticPost, ...prev]);

    try {
      const created = await pb.collection('posts').create(data);
      // Mark as pending so realtime event is ignored
      pendingCreates.current.add(created.id);
      // Replace optimistic with real
      setPosts(prev => prev.map(p =>
        p.id === tempId ? created : p
      ));
      return created;
    } catch (error) {
      // Rollback optimistic update
      setPosts(prev => prev.filter(p => p.id !== tempId));
      throw error;
    }
  }

  return { posts, createPost };
}

// Batched updates for high-frequency changes
function useRealtimeWithBatching() {
  const [posts, setPosts] = useState([]);
  const pendingUpdates = useRef([]);
  const flushTimeout = useRef(null);

  useEffect(() => {
    const unsub = pb.collection('posts').subscribe('*', (e) => {
      pendingUpdates.current.push(e);

      // Batch updates every 100ms
      if (!flushTimeout.current) {
        flushTimeout.current = setTimeout(() => {
          flushUpdates();
          flushTimeout.current = null;
        }, 100);
      }
    });

    return () => {
      unsub();
      if (flushTimeout.current) clearTimeout(flushTimeout.current);
    };
  }, []);

  function flushUpdates() {
    const updates = pendingUpdates.current;
    pendingUpdates.current = [];

    setPosts(prev => {
      let next = [...prev];
      for (const e of updates) {
        if (e.action === 'create') {
          if (!next.some(p => p.id === e.record.id)) {
            next.unshift(e.record);
          }
        } else if (e.action === 'update') {
          next = next.map(p => p.id === e.record.id ? e.record : p);
        } else if (e.action === 'delete') {
          next = next.filter(p => p.id !== e.record.id);
        }
      }
      return next;
    });
  }
}
```

**Filtering events:**

```javascript
// Only handle events matching certain criteria
pb.collection('posts').subscribe('*', (e) => {
  // Only published posts
  if (e.record.status !== 'published') return;

  // Only posts by current user
  if (e.record.author !== pb.authStore.record?.id) return;

  handleEvent(e);
});

// Subscribe with expand to get related data
pb.collection('posts').subscribe('*', (e) => {
  // Note: expand data is included in realtime events
  // if the subscription options include expand
  console.log(e.record.expand?.author?.name);
}, { expand: 'author' });
```

Reference: [PocketBase Realtime Events](https://pocketbase.io/docs/api-realtime/)

### 6.3 Handle Realtime Connection Issues

**Impact: MEDIUM (Reliable realtime even with network interruptions)**

## Handle Realtime Connection Issues

Realtime connections can disconnect due to network issues or server restarts. Implement proper reconnection handling and state synchronization.

**Incorrect (ignoring connection issues):**

```javascript
// No reconnection handling - stale data after disconnect
pb.collection('posts').subscribe('*', (e) => {
  updateUI(e.record);
});
// If connection drops, UI shows stale data indefinitely

// Assuming connection is always stable
function PostList() {
  useEffect(() => {
    pb.collection('posts').subscribe('*', handleChange);
  }, []);
  // No awareness of connection state
}
```

**Correct (robust connection handling):**

```javascript
// Monitor connection state
function useRealtimeConnection() {
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Track connection state
    const unsubConnect = pb.realtime.subscribe('PB_CONNECT', (e) => {
      console.log('Connected, client ID:', e.clientId);
      setConnected(true);

      // Re-sync data after reconnection
      if (lastSync) {
        syncMissedUpdates(lastSync);
      }
      setLastSync(new Date());
    });

    // Handle disconnection
    pb.realtime.onDisconnect = (activeSubscriptions) => {
      console.log('Disconnected');
      setConnected(false);
      showOfflineIndicator();
    };

    return () => {
      unsubConnect();
    };
  }, [lastSync]);

  return { connected };
}

// Sync missed updates after reconnection
async function syncMissedUpdates(since) {
  // Fetch records modified since last sync
  const updatedPosts = await pb.collection('posts').getList(1, 100, {
    filter: pb.filter('updated > {:since}', { since }),
    sort: '-updated'
  });

  // Merge with local state
  updateLocalState(updatedPosts.items);
}

// Full implementation with resilience
class RealtimeManager {
  constructor(pb) {
    this.pb = pb;
    this.subscriptions = new Map();
    this.lastSyncTimes = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000;

    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.pb.realtime.subscribe('PB_CONNECT', () => {
      console.log('Realtime connected');
      this.reconnectAttempts = 0;
      this.onReconnect();
    });

    this.pb.realtime.onDisconnect = (subs) => {
      console.log('Realtime disconnected');
      this.scheduleReconnect();
    };
  }

  scheduleReconnect() {
    // Exponential backoff with jitter
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;

    setTimeout(() => {
      if (!this.pb.realtime.isConnected) {
        this.resubscribeAll();
      }
    }, delay);
  }

  async onReconnect() {
    // Sync data for each tracked collection
    for (const [collection, lastSync] of this.lastSyncTimes) {
      await this.syncCollection(collection, lastSync);
    }
  }

  async syncCollection(collection, since) {
    try {
      const updates = await this.pb.collection(collection).getList(1, 1000, {
        filter: this.pb.filter('updated > {:since}', { since }),
        sort: 'updated'
      });

      // Notify subscribers of missed updates
      const handler = this.subscriptions.get(collection);
      if (handler) {
        updates.items.forEach(record => {
          handler({ action: 'update', record });
        });
      }

      this.lastSyncTimes.set(collection, new Date());
    } catch (error) {
      console.error(`Failed to sync ${collection}:`, error);
    }
  }

  async subscribe(collection, handler) {
    this.subscriptions.set(collection, handler);
    this.lastSyncTimes.set(collection, new Date());

    return this.pb.collection(collection).subscribe('*', (e) => {
      this.lastSyncTimes.set(collection, new Date());
      handler(e);
    });
  }

  resubscribeAll() {
    for (const [collection, handler] of this.subscriptions) {
      this.pb.collection(collection).subscribe('*', handler);
    }
  }
}

// Usage
const realtime = new RealtimeManager(pb);
await realtime.subscribe('posts', handlePostChange);
```

**Connection timeout handling:**

```javascript
// Server sends disconnect after 5 min of no messages
// SDK auto-reconnects, but you can handle it explicitly

let lastHeartbeat = Date.now();

pb.realtime.subscribe('PB_CONNECT', () => {
  lastHeartbeat = Date.now();
});

// Check for stale connection
setInterval(() => {
  if (Date.now() - lastHeartbeat > 6 * 60 * 1000) {
    console.log('Connection may be stale, refreshing...');
    pb.realtime.unsubscribe();
    resubscribeAll();
  }
}, 60000);
```

Reference: [PocketBase Realtime](https://pocketbase.io/docs/api-realtime/)

### 6.4 Implement Realtime Subscriptions Correctly

**Impact: MEDIUM (Live updates without polling, reduced server load)**

## Implement Realtime Subscriptions Correctly

PocketBase uses Server-Sent Events (SSE) for realtime updates. Proper subscription management prevents memory leaks and ensures reliable event delivery.

**Incorrect (memory leaks and poor management):**

```javascript
// Missing unsubscribe - memory leak!
function PostList() {
  useEffect(() => {
    pb.collection('posts').subscribe('*', (e) => {
      updatePosts(e);
    });
    // No cleanup - subscription persists forever!
  }, []);
}

// Subscribing multiple times
function loadPosts() {
  // Called on every render - creates duplicate subscriptions!
  pb.collection('posts').subscribe('*', handleChange);
}

// Not handling reconnection
pb.collection('posts').subscribe('*', (e) => {
  // Assumes connection is always stable
  updateUI(e);
});
```

**Correct (proper subscription management):**

```javascript
// React example with cleanup
function PostList() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Initial load
    loadPosts();

    // Subscribe to changes
    const unsubscribe = pb.collection('posts').subscribe('*', (e) => {
      if (e.action === 'create') {
        setPosts(prev => [e.record, ...prev]);
      } else if (e.action === 'update') {
        setPosts(prev => prev.map(p =>
          p.id === e.record.id ? e.record : p
        ));
      } else if (e.action === 'delete') {
        setPosts(prev => prev.filter(p => p.id !== e.record.id));
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  async function loadPosts() {
    const result = await pb.collection('posts').getList(1, 50);
    setPosts(result.items);
  }

  return <PostListUI posts={posts} />;
}

// Subscribe to specific record
async function watchPost(postId) {
  return pb.collection('posts').subscribe(postId, (e) => {
    console.log('Post changed:', e.action, e.record);
  });
}

// Subscribe to collection changes
async function watchAllPosts() {
  return pb.collection('posts').subscribe('*', (e) => {
    console.log(`Post ${e.action}:`, e.record.title);
  });
}

// Handle connection events
pb.realtime.subscribe('PB_CONNECT', (e) => {
  console.log('Realtime connected, client ID:', e.clientId);
  // Re-sync data after reconnection
  refreshData();
});

// Vanilla JS with proper cleanup
class PostManager {
  unsubscribes = [];

  async init() {
    this.unsubscribes.push(
      await pb.collection('posts').subscribe('*', this.handlePostChange)
    );
    this.unsubscribes.push(
      await pb.collection('comments').subscribe('*', this.handleCommentChange)
    );
  }

  destroy() {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  }

  handlePostChange = (e) => { /* ... */ };
  handleCommentChange = (e) => { /* ... */ };
}
```

**Subscription event structure:**

```javascript
pb.collection('posts').subscribe('*', (event) => {
  event.action;  // 'create' | 'update' | 'delete'
  event.record;  // The affected record
});

// Full event type
interface RealtimeEvent {
  action: 'create' | 'update' | 'delete';
  record: RecordModel;
}
```

**Unsubscribe patterns:**

```javascript
// Unsubscribe from specific callback
const unsub = await pb.collection('posts').subscribe('*', callback);
unsub();  // Remove this specific subscription

// Unsubscribe from all subscriptions on a topic
pb.collection('posts').unsubscribe('*');  // All collection subs
pb.collection('posts').unsubscribe('RECORD_ID');  // Specific record

// Unsubscribe from all collection subscriptions
pb.collection('posts').unsubscribe();

// Unsubscribe from everything
pb.realtime.unsubscribe();
```

Reference: [PocketBase Realtime](https://pocketbase.io/docs/api-realtime/)

## 7. File Handling

**Impact: MEDIUM**

File uploads, URL generation, thumbnail creation, and validation patterns.

### 7.1 Generate File URLs Correctly

**Impact: MEDIUM (Proper URLs with thumbnails and access control)**

## Generate File URLs Correctly

Use the SDK's `getURL` method to generate proper file URLs with thumbnail support and access tokens for protected files.

**Incorrect (manually constructing URLs):**

```javascript
// Hardcoded URL construction - brittle
const imageUrl = `http://localhost:8090/api/files/${record.collectionId}/${record.id}/${record.image}`;

// Missing token for protected files
const privateUrl = pb.files.getURL(record, record.document);
// Returns URL but file access denied if protected!

// Wrong thumbnail syntax
const thumb = `${imageUrl}?thumb=100x100`;  // Wrong format
```

**Correct (using SDK methods):**

```javascript
// Basic file URL
const imageUrl = pb.files.getURL(record, record.image);
// Returns: http://host/api/files/COLLECTION/RECORD_ID/filename.jpg

// With thumbnail (for images only)
const thumbUrl = pb.files.getURL(record, record.image, {
  thumb: '100x100'  // Width x Height
});

// Thumbnail options
const thumbs = {
  square: pb.files.getURL(record, record.image, { thumb: '100x100' }),
  fit: pb.files.getURL(record, record.image, { thumb: '100x0' }),     // Fit width
  fitHeight: pb.files.getURL(record, record.image, { thumb: '0x100' }), // Fit height
  crop: pb.files.getURL(record, record.image, { thumb: '100x100t' }), // Top crop
  cropBottom: pb.files.getURL(record, record.image, { thumb: '100x100b' }), // Bottom
  force: pb.files.getURL(record, record.image, { thumb: '100x100f' }), // Force exact
};

// Protected files (require auth)
async function getProtectedFileUrl(record, filename) {
  // Get file access token (valid for limited time)
  const token = await pb.files.getToken();

  // Include token in URL
  return pb.files.getURL(record, filename, { token });
}

// Example with protected document
async function downloadDocument(record) {
  const token = await pb.files.getToken();
  const url = pb.files.getURL(record, record.document, { token });

  // Token is appended: ...?token=xxx
  window.open(url, '_blank');
}
```

**React component example:**

```jsx
function UserAvatar({ user, size = 50 }) {
  if (!user.avatar) {
    return <DefaultAvatar size={size} />;
  }

  const avatarUrl = pb.files.getURL(user, user.avatar, {
    thumb: `${size}x${size}`
  });

  return (
    <img
      src={avatarUrl}
      alt={user.name}
      width={size}
      height={size}
      loading="lazy"
    />
  );
}

function ImageGallery({ record }) {
  // Record has multiple images
  const images = record.images || [];

  return (
    <div className="gallery">
      {images.map((filename, index) => (
        <img
          key={filename}
          src={pb.files.getURL(record, filename, { thumb: '200x200' })}
          onClick={() => openFullSize(record, filename)}
          loading="lazy"
        />
      ))}
    </div>
  );
}

function openFullSize(record, filename) {
  const fullUrl = pb.files.getURL(record, filename);
  window.open(fullUrl, '_blank');
}
```

**Handling file URLs in lists:**

```javascript
// Efficiently generate URLs for list of records
const posts = await pb.collection('posts').getList(1, 20, {
  expand: 'author'
});

const postsWithUrls = posts.items.map(post => ({
  ...post,
  thumbnailUrl: post.image
    ? pb.files.getURL(post, post.image, { thumb: '300x200' })
    : null,
  authorAvatarUrl: post.expand?.author?.avatar
    ? pb.files.getURL(post.expand.author, post.expand.author.avatar, { thumb: '40x40' })
    : null
}));
```

**Thumbnail format reference:**

| Format | Description |
|--------|-------------|
| `WxH` | Fit within dimensions |
| `Wx0` | Fit width, auto height |
| `0xH` | Auto width, fit height |
| `WxHt` | Crop from top |
| `WxHb` | Crop from bottom |
| `WxHf` | Force exact dimensions |

Reference: [PocketBase Files](https://pocketbase.io/docs/files-handling/)

### 7.2 Upload Files Correctly

**Impact: MEDIUM (Reliable uploads with progress tracking and validation)**

## Upload Files Correctly

File uploads can use plain objects or FormData. Handle large files properly with progress tracking and appropriate error handling.

**Incorrect (naive file upload):**

```javascript
// Missing error handling
async function uploadFile(file) {
  await pb.collection('documents').create({
    title: file.name,
    file: file
  });
  // No error handling, no progress feedback
}

// Uploading without validation
async function uploadAvatar(file) {
  await pb.collection('users').update(userId, {
    avatar: file  // No size/type check - might fail server-side
  });
}

// Base64 upload (inefficient)
async function uploadImage(base64) {
  await pb.collection('images').create({
    image: base64  // Wrong! PocketBase expects File/Blob
  });
}
```

**Correct (proper file uploads):**

```javascript
// Basic upload with object (auto-converts to FormData)
async function uploadDocument(file, metadata) {
  try {
    const record = await pb.collection('documents').create({
      title: metadata.title,
      description: metadata.description,
      file: file  // File object from input
    });
    return record;
  } catch (error) {
    if (error.response?.data?.file) {
      throw new Error(`File error: ${error.response.data.file.message}`);
    }
    throw error;
  }
}

// Upload multiple files
async function uploadGallery(files, albumId) {
  const record = await pb.collection('albums').update(albumId, {
    images: files  // Array of File objects
  });
  return record;
}

// FormData for more control
async function uploadWithProgress(file, onProgress) {
  const formData = new FormData();
  formData.append('title', file.name);
  formData.append('file', file);

  // Using fetch directly for progress (SDK doesn't expose progress)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', `${pb.baseURL}/api/collections/documents/records`);
    xhr.setRequestHeader('Authorization', pb.authStore.token);
    xhr.send(formData);
  });
}

// Client-side validation before upload
function validateFile(file, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024,  // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxNameLength = 100
  } = options;

  const errors = [];

  if (file.size > maxSize) {
    errors.push(`File too large. Max: ${maxSize / 1024 / 1024}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}`);
  }

  if (file.name.length > maxNameLength) {
    errors.push(`Filename too long`);
  }

  return { valid: errors.length === 0, errors };
}

// Complete upload flow
async function handleFileUpload(inputEvent) {
  const file = inputEvent.target.files[0];
  if (!file) return;

  // Validate
  const validation = validateFile(file, {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png']
  });

  if (!validation.valid) {
    showError(validation.errors.join(', '));
    return;
  }

  // Upload with progress
  try {
    setUploading(true);
    const record = await uploadWithProgress(file, setProgress);
    showSuccess('Upload complete!');
    return record;
  } catch (error) {
    showError(error.message);
  } finally {
    setUploading(false);
  }
}
```

**Deleting files:**

```javascript
// Remove specific file(s) from record
await pb.collection('albums').update(albumId, {
  'images-': ['filename1.jpg', 'filename2.jpg']  // Remove these files
});

// Clear all files
await pb.collection('documents').update(docId, {
  file: null  // Removes the file
});
```

Reference: [PocketBase File Upload](https://pocketbase.io/docs/files-handling/)

### 7.3 Validate File Uploads

**Impact: MEDIUM (Prevents invalid uploads, improves security and UX)**

## Validate File Uploads

Validate files on both client and server side. Client validation improves UX; server validation (via collection settings) enforces security.

**Incorrect (no validation):**

```javascript
// Accepting any file without checks
async function uploadFile(file) {
  return pb.collection('uploads').create({ file });
  // Could upload 1GB executable!
}

// Only checking extension (easily bypassed)
function validateFile(file) {
  const ext = file.name.split('.').pop();
  return ['jpg', 'png'].includes(ext);
  // User can rename virus.exe to virus.jpg
}

// Client-only validation (can be bypassed)
async function uploadAvatar(file) {
  if (file.size > 1024 * 1024) {
    throw new Error('Too large');
  }
  // Attacker can bypass this with dev tools
  return pb.collection('users').update(userId, { avatar: file });
}
```

**Correct (comprehensive validation):**

```javascript
// 1. Configure server-side validation in collection settings
// In Admin UI or via API:
const collectionConfig = {
  schema: [
    {
      name: 'avatar',
      type: 'file',
      options: {
        maxSelect: 1,           // Single file only
        maxSize: 5242880,       // 5MB in bytes
        mimeTypes: [            // Allowed types
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp'
        ],
        thumbs: ['100x100', '200x200']  // Auto-generate thumbnails
      }
    },
    {
      name: 'documents',
      type: 'file',
      options: {
        maxSelect: 10,
        maxSize: 10485760,  // 10MB
        mimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      }
    }
  ]
};

// 2. Client-side validation for better UX
const FILE_CONSTRAINTS = {
  avatar: {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 1
  },
  documents: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['application/pdf'],
    maxFiles: 10
  }
};

function validateFiles(files, constraintKey) {
  const constraints = FILE_CONSTRAINTS[constraintKey];
  const errors = [];
  const validFiles = [];

  if (files.length > constraints.maxFiles) {
    errors.push(`Maximum ${constraints.maxFiles} file(s) allowed`);
  }

  for (const file of files) {
    const fileErrors = [];

    // Check size
    if (file.size > constraints.maxSize) {
      const maxMB = constraints.maxSize / 1024 / 1024;
      fileErrors.push(`${file.name}: exceeds ${maxMB}MB limit`);
    }

    // Check MIME type (more reliable than extension)
    if (!constraints.allowedTypes.includes(file.type)) {
      fileErrors.push(`${file.name}: invalid file type (${file.type || 'unknown'})`);
    }

    // Check for suspicious patterns
    if (file.name.includes('..') || file.name.includes('/')) {
      fileErrors.push(`${file.name}: invalid filename`);
    }

    if (fileErrors.length === 0) {
      validFiles.push(file);
    } else {
      errors.push(...fileErrors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
}

// 3. Complete upload with validation
async function handleAvatarUpload(inputElement) {
  const files = Array.from(inputElement.files);

  // Client validation
  const validation = validateFiles(files, 'avatar');
  if (!validation.valid) {
    showErrors(validation.errors);
    return null;
  }

  // Upload (server will also validate)
  try {
    const updated = await pb.collection('users').update(userId, {
      avatar: validation.validFiles[0]
    });
    showSuccess('Avatar updated!');
    return updated;
  } catch (error) {
    // Handle server validation errors
    if (error.response?.data?.avatar) {
      showError(error.response.data.avatar.message);
    } else {
      showError('Upload failed');
    }
    return null;
  }
}

// 4. Image-specific validation
async function validateImage(file, options = {}) {
  const { minWidth = 0, minHeight = 0, maxWidth = Infinity, maxHeight = Infinity } = options;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const errors = [];

      if (img.width < minWidth || img.height < minHeight) {
        errors.push(`Image must be at least ${minWidth}x${minHeight}px`);
      }
      if (img.width > maxWidth || img.height > maxHeight) {
        errors.push(`Image must be at most ${maxWidth}x${maxHeight}px`);
      }

      resolve({ valid: errors.length === 0, errors, width: img.width, height: img.height });
    };
    img.onerror = () => resolve({ valid: false, errors: ['Invalid image file'] });
    img.src = URL.createObjectURL(file);
  });
}
```

Reference: [PocketBase Files Configuration](https://pocketbase.io/docs/files-handling/)

## 8. Production & Deployment

**Impact: LOW-MEDIUM**

Backup strategies, configuration management, reverse proxy setup, and SQLite optimization.

### 8.1 Implement Proper Backup Strategies

**Impact: LOW-MEDIUM (Prevents data loss, enables disaster recovery)**

## Implement Proper Backup Strategies

Regular backups are essential for production deployments. PocketBase provides built-in backup functionality and supports external S3 storage.

**Incorrect (no backup strategy):**

```javascript
// No backups at all - disaster waiting to happen
// Just running: ./pocketbase serve

// Manual file copy while server running - can corrupt data
// cp pb_data/data.db backup/

// Only backing up database, missing files
// sqlite3 pb_data/data.db ".backup backup.db"
```

**Correct (comprehensive backup strategy):**

```javascript
// 1. Using PocketBase Admin API for backups
const adminPb = new PocketBase('http://127.0.0.1:8090');
await adminPb.collection('_superusers').authWithPassword(admin, password);

// Create backup (includes database and files)
async function createBackup(name = '') {
  const backup = await adminPb.backups.create(name);
  console.log('Backup created:', backup.key);
  return backup;
}

// List available backups
async function listBackups() {
  const backups = await adminPb.backups.getFullList();
  backups.forEach(b => {
    console.log(`${b.key} - ${b.size} bytes - ${b.modified}`);
  });
  return backups;
}

// Download backup
async function downloadBackup(key) {
  const token = await adminPb.files.getToken();
  const url = adminPb.backups.getDownloadURL(token, key);
  // url can be used to download the backup file
  return url;
}

// Restore from backup (CAUTION: overwrites current data!)
async function restoreBackup(key) {
  await adminPb.backups.restore(key);
  console.log('Restore initiated - server will restart');
}

// Delete old backups
async function cleanupOldBackups(keepCount = 7) {
  const backups = await adminPb.backups.getFullList();

  // Sort by date, keep newest
  const sorted = backups.sort((a, b) =>
    new Date(b.modified) - new Date(a.modified)
  );

  const toDelete = sorted.slice(keepCount);
  for (const backup of toDelete) {
    await adminPb.backups.delete(backup.key);
    console.log('Deleted old backup:', backup.key);
  }
}
```

**Automated backup script (cron job):**

```bash
#!/bin/bash
# backup.sh - Run daily via cron

POCKETBASE_URL="http://127.0.0.1:8090"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"
BACKUP_DIR="/path/to/backups"
KEEP_DAYS=7

# Create timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup via API
curl -X POST "${POCKETBASE_URL}/api/backups" \
  -H "Authorization: $(curl -s -X POST "${POCKETBASE_URL}/api/collections/_superusers/auth-with-password" \
    -d "identity=${ADMIN_EMAIL}&password=${ADMIN_PASSWORD}" | jq -r '.token')" \
  -d "name=backup_${TIMESTAMP}"

# Clean old local backups
find "${BACKUP_DIR}" -name "*.zip" -mtime +${KEEP_DAYS} -delete

echo "Backup completed: backup_${TIMESTAMP}"
```

**Configure S3 for backup storage:**

```javascript
// In Admin UI: Settings > Backups > S3
// Or via API:
await adminPb.settings.update({
  backups: {
    s3: {
      enabled: true,
      bucket: 'my-pocketbase-backups',
      region: 'us-east-1',
      endpoint: 's3.amazonaws.com',
      accessKey: process.env.AWS_ACCESS_KEY,
      secret: process.env.AWS_SECRET_KEY
    }
  }
});
```

**Backup best practices:**

| Aspect | Recommendation |
|--------|---------------|
| Frequency | Daily minimum, hourly for critical apps |
| Retention | 7-30 days of daily backups |
| Storage | Off-site (S3, separate server) |
| Testing | Monthly restore tests |
| Monitoring | Alert on backup failures |

**Pre-backup checklist:**
- [ ] S3 or external storage configured
- [ ] Automated schedule set up
- [ ] Retention policy defined
- [ ] Restore procedure documented
- [ ] Restore tested successfully

Reference: [PocketBase Backups](https://pocketbase.io/docs/going-to-production/#backups)

### 8.2 Configure Production Settings Properly

**Impact: LOW-MEDIUM (Secure and optimized production environment)**

## Configure Production Settings Properly

Production deployments require proper configuration of URLs, secrets, SMTP, and security settings.

**Incorrect (development defaults in production):**

```bash
# Running with defaults - insecure!
./pocketbase serve

# Hardcoded secrets
./pocketbase serve --encryptionEnv="mySecretKey123"

# Wrong origin for CORS
# Leaving http://localhost:8090 as allowed origin
```

**Correct (production configuration):**

```bash
# Production startup with essential flags
./pocketbase serve \
  --http="0.0.0.0:8090" \
  --origins="https://myapp.com,https://www.myapp.com" \
  --encryptionEnv="PB_ENCRYPTION_KEY"

# Using environment variables
export PB_ENCRYPTION_KEY="your-32-char-encryption-key-here"
export SMTP_HOST="smtp.sendgrid.net"
export SMTP_PORT="587"
export SMTP_USER="apikey"
export SMTP_PASS="your-sendgrid-api-key"

./pocketbase serve --http="0.0.0.0:8090"
```

**Configure SMTP for emails:**

```javascript
// Via Admin UI or API
await adminPb.settings.update({
  smtp: {
    enabled: true,
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    username: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    tls: true
  },
  meta: {
    appName: 'My App',
    appURL: 'https://myapp.com',
    senderName: 'My App',
    senderAddress: 'noreply@myapp.com'
  }
});

// Test email configuration
await adminPb.settings.testEmail('users', 'test@example.com', 'verification');
```

**Configure S3 for file storage:**

```javascript
// Move file storage to S3 for scalability
await adminPb.settings.update({
  s3: {
    enabled: true,
    bucket: 'my-app-files',
    region: 'us-east-1',
    endpoint: 's3.amazonaws.com',
    accessKey: process.env.AWS_ACCESS_KEY,
    secret: process.env.AWS_SECRET_KEY,
    forcePathStyle: false
  }
});

// Test S3 connection
await adminPb.settings.testS3('storage');
```

**Systemd service file:**

```ini
# /etc/systemd/system/pocketbase.service
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=pocketbase
Group=pocketbase
LimitNOFILE=4096
Restart=always
RestartSec=5s
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http="127.0.0.1:8090"

# Environment variables
EnvironmentFile=/opt/pocketbase/.env

# Security hardening
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/pocketbase/pb_data

[Install]
WantedBy=multi-user.target
```

**Environment file (.env):**

```bash
# /opt/pocketbase/.env
PB_ENCRYPTION_KEY=your-32-character-encryption-key

# SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx

# S3 (optional)
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# OAuth (optional)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

**Production checklist:**

- [ ] HTTPS enabled (via reverse proxy)
- [ ] Strong encryption key set
- [ ] CORS origins configured
- [ ] SMTP configured and tested
- [ ] Superuser password changed
- [ ] S3 configured (for scalability)
- [ ] Backup schedule configured
- [ ] Rate limiting enabled (via reverse proxy)
- [ ] Logging configured

Reference: [PocketBase Going to Production](https://pocketbase.io/docs/going-to-production/)

### 8.3 Enable Rate Limiting for API Protection

**Impact: MEDIUM (Prevents abuse, brute-force attacks, and DoS)**

## Enable Rate Limiting for API Protection

PocketBase v0.23+ includes built-in rate limiting. Enable it to protect against brute-force attacks, API abuse, and excessive resource consumption.

**Incorrect (no rate limiting):**

```bash
# Running without rate limiting
./pocketbase serve

# Vulnerable to:
# - Brute-force password attacks
# - API abuse and scraping
# - DoS from excessive requests
# - Account enumeration attempts
```

**Correct (enable rate limiting):**

```bash
# Enable via command line flag
./pocketbase serve --rateLimiter=true

# Or configure specific limits (requests per second per IP)
./pocketbase serve --rateLimiter=true --rateLimiterRPS=10
```

**Configure via Admin Dashboard:**

Navigate to Settings > Rate Limiter:
- **Enable rate limiter**: Toggle on
- **Max requests/second**: Default 10, adjust based on needs
- **Exempt endpoints**: Optionally whitelist certain paths

**Configure programmatically (Go/JS hooks):**

```javascript
// In pb_hooks/rate_limit.pb.js
routerAdd("GET", "/api/public/*", (e) => {
  // Custom rate limit for specific endpoints
}, $apis.rateLimit(100, "10s")); // 100 requests per 10 seconds

// Stricter limit for auth endpoints
routerAdd("POST", "/api/collections/users/auth-*", (e) => {
  // Auth endpoints need stricter limits
}, $apis.rateLimit(5, "1m")); // 5 attempts per minute
```

**Rate limiting with reverse proxy (additional layer):**

```nginx
# Nginx rate limiting (defense in depth)
http {
    # Define rate limit zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

    server {
        # General API rate limit
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://pocketbase;
        }

        # Strict limit for auth endpoints
        location /api/collections/users/auth {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://pocketbase;
        }

        # Stricter limit for superuser auth
        location /api/collections/_superusers/auth {
            limit_req zone=auth burst=3 nodelay;
            proxy_pass http://pocketbase;
        }
    }
}
```

```caddyfile
# Caddy with rate limiting plugin
myapp.com {
    rate_limit {
        zone api {
            key {remote_host}
            events 100
            window 10s
        }
        zone auth {
            key {remote_host}
            events 5
            window 1m
        }
    }

    @auth path /api/collections/*/auth*
    handle @auth {
        rate_limit { zone auth }
        reverse_proxy 127.0.0.1:8090
    }

    handle {
        rate_limit { zone api }
        reverse_proxy 127.0.0.1:8090
    }
}
```

**Handle rate limit errors in client:**

```javascript
async function makeRequest(fn) {
  try {
    return await fn();
  } catch (error) {
    if (error.status === 429) {
      // Rate limited - wait and retry
      const retryAfter = error.response?.retryAfter || 60;
      console.log(`Rate limited. Retry after ${retryAfter}s`);

      // Show user-friendly message
      showMessage('Too many requests. Please wait a moment.');

      // Optional: queue for retry
      await sleep(retryAfter * 1000);
      return makeRequest(fn);
    }
    throw error;
  }
}

// Usage
const result = await makeRequest(() =>
  pb.collection('posts').getList(1, 20)
);
```

**Recommended limits by endpoint type:**

| Endpoint Type | Suggested Limit | Reason |
|--------------|-----------------|--------|
| Auth endpoints | 5-10/min | Prevent brute-force |
| Password reset | 3/hour | Prevent enumeration |
| Record creation | 30/min | Prevent spam |
| General API | 60-100/min | Normal usage |
| Public read | 100-200/min | Higher for reads |
| File uploads | 10/min | Resource-intensive |

**Monitoring rate limit hits:**

```javascript
// Check PocketBase logs for rate limit events
// Or set up alerting in your monitoring system

// Client-side tracking
pb.afterSend = function(response, data) {
  if (response.status === 429) {
    trackEvent('rate_limit_hit', {
      endpoint: response.url,
      timestamp: new Date()
    });
  }
  return data;
};
```

Reference: [PocketBase Going to Production](https://pocketbase.io/docs/going-to-production/)

### 8.4 Configure Reverse Proxy Correctly

**Impact: LOW-MEDIUM (HTTPS, caching, rate limiting, and security headers)**

## Configure Reverse Proxy Correctly

Use a reverse proxy (Nginx, Caddy) for HTTPS termination, caching, rate limiting, and security headers.

**Incorrect (exposing PocketBase directly):**

```bash
# Direct exposure - no HTTPS, no rate limiting
./pocketbase serve --http="0.0.0.0:8090"

# Port forwarding without proxy
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 8090
# Still no HTTPS!
```

**Correct (Caddy - simplest option):**

```caddyfile
# /etc/caddy/Caddyfile
myapp.com {
    # Automatic HTTPS via Let's Encrypt
    reverse_proxy 127.0.0.1:8090 {
        # Required for SSE/Realtime
        flush_interval -1
    }

    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    # Rate limiting (requires caddy-ratelimit plugin)
    # rate_limit {
    #     zone api {
    #         key {remote_host}
    #         events 100
    #         window 1m
    #     }
    # }
}
```

**Correct (Nginx configuration):**

```nginx
# /etc/nginx/sites-available/pocketbase
upstream pocketbase {
    server 127.0.0.1:8090;
    keepalive 64;
}

server {
    listen 80;
    server_name myapp.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name myapp.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/myapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapp.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        proxy_pass http://pocketbase;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE/Realtime support
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;

        # Timeouts
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Rate limit API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://pocketbase;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection '';
        proxy_buffering off;
    }

    # Static file caching
    location /api/files/ {
        proxy_pass http://pocketbase;
        proxy_cache_valid 200 1d;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;
}
```

**Docker Compose with Caddy:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    restart: unless-stopped
    volumes:
      - ./pb_data:/pb_data
    environment:
      - PB_ENCRYPTION_KEY=${PB_ENCRYPTION_KEY}

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - pocketbase

volumes:
  caddy_data:
  caddy_config:
```

**Key configuration points:**

| Feature | Why It Matters |
|---------|---------------|
| HTTPS | Encrypts traffic, required for auth |
| SSE support | `proxy_buffering off` for realtime |
| Rate limiting | Prevents abuse |
| Security headers | XSS/clickjacking protection |
| Keepalive | Connection reuse, better performance |

Reference: [PocketBase Going to Production](https://pocketbase.io/docs/going-to-production/)

### 8.5 Optimize SQLite for Production

**Impact: LOW-MEDIUM (Better performance and reliability for SQLite database)**

## Optimize SQLite for Production

PocketBase uses SQLite. Understanding its characteristics helps optimize performance and avoid common pitfalls.

**Incorrect (ignoring SQLite characteristics):**

```javascript
// Heavy concurrent writes - SQLite bottleneck
async function bulkInsert(items) {
  // Parallel writes cause lock contention
  await Promise.all(items.map(item =>
    pb.collection('items').create(item)
  ));
}

// Not using transactions for batch operations
async function updateMany(items) {
  for (const item of items) {
    await pb.collection('items').update(item.id, item);
  }
  // Each write is a separate transaction - slow!
}

// Large text fields without consideration
const schema = [{
  name: 'content',
  type: 'text'  // Could be megabytes - affects all queries
}];
```

**Correct (SQLite-optimized patterns):**

```javascript
// Use batch operations for multiple writes
async function bulkInsert(items) {
  const batch = pb.createBatch();
  items.forEach(item => {
    batch.collection('items').create(item);
  });
  await batch.send();  // Single transaction, much faster
}

// Batch updates
async function updateMany(items) {
  const batch = pb.createBatch();
  items.forEach(item => {
    batch.collection('items').update(item.id, item);
  });
  await batch.send();
}

// For very large batches, chunk them
async function bulkInsertLarge(items, chunkSize = 100) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const batch = pb.createBatch();
    chunk.forEach(item => batch.collection('items').create(item));
    await batch.send();
  }
}
```

**Schema considerations:**

```javascript
// Separate large content into dedicated collection
const postsSchema = [
  { name: 'title', type: 'text' },
  { name: 'summary', type: 'text', options: { maxLength: 500 } },
  { name: 'author', type: 'relation' }
  // Content in separate collection
];

const postContentsSchema = [
  { name: 'post', type: 'relation', required: true },
  { name: 'content', type: 'editor' }  // Large HTML content
];

// Fetch content only when needed
async function getPostList() {
  return pb.collection('posts').getList(1, 20);  // Fast, no content
}

async function getPostWithContent(id) {
  const post = await pb.collection('posts').getOne(id);
  const content = await pb.collection('post_contents').getFirstListItem(
    pb.filter('post = {:id}', { id })
  );
  return { ...post, content: content.content };
}
```

**Index optimization:**

```sql
-- Create indexes for commonly filtered/sorted fields
CREATE INDEX idx_posts_author ON posts(author);
CREATE INDEX idx_posts_created ON posts(created DESC);
CREATE INDEX idx_posts_status_created ON posts(status, created DESC);

-- Verify indexes are being used
EXPLAIN QUERY PLAN
SELECT * FROM posts WHERE author = 'xxx' ORDER BY created DESC;
-- Should show: "USING INDEX idx_posts_author"
```

**SQLite limitations and workarounds:**

| Limitation | Workaround |
|------------|------------|
| Single writer | Use batch operations, queue writes |
| No full-text by default | Use view collections with FTS5 |
| File-based | SSD storage, avoid network mounts |
| Memory for large queries | Pagination, limit result sizes |

**Performance monitoring:**

```javascript
// Monitor slow queries via hooks (requires custom PocketBase build)
// Or use SQLite's built-in profiling

// From sqlite3 CLI:
// .timer on
// SELECT * FROM posts WHERE author = 'xxx';
// Run Time: real 0.003 user 0.002 sys 0.001

// Check database size
// ls -lh pb_data/data.db

// Vacuum to reclaim space after deletes
// sqlite3 pb_data/data.db "VACUUM;"
```

**When to consider alternatives:**

Consider migrating from single PocketBase if:
- Write throughput consistently > 1000/sec needed
- Database size > 100GB
- Complex transactions across tables
- Multi-region deployment required

**Scaling options:**
1. **Read replicas**: Litestream for SQLite replication
2. **Sharding**: Multiple PocketBase instances by tenant/feature
3. **Caching**: Redis/Memcached for read-heavy loads
4. **Migration**: PostgreSQL via custom PocketBase build

Reference: [SQLite Performance](https://www.sqlite.org/speed.html)

---

## References

- https://pocketbase.io/docs/
- https://github.com/pocketbase/pocketbase
- https://github.com/pocketbase/js-sdk
- https://pocketbase.io/docs/api-records/
- https://pocketbase.io/docs/api-rules-and-filters/

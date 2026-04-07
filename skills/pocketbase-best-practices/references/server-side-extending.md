# Server-Side Extending

**Impact: HIGH**

Extending PocketBase with Go or embedded JavaScript (JSVM) - event hooks, custom routes, transactions, cron jobs, filesystem, migrations, and safe server-side filter binding.

---

## 1. Use DBConnect Only When You Need a Custom SQLite Driver

**Impact: MEDIUM (Incorrect driver setup breaks both data.db and auxiliary.db, or introduces unnecessary CGO)**

PocketBase ships with the **pure-Go** `modernc.org/sqlite` driver (no CGO required). Only reach for a custom driver when you specifically need SQLite extensions like ICU, FTS5, or spatialite that the default driver doesn't expose. `DBConnect` is called **twice** — once for `pb_data/data.db` and once for `pb_data/auxiliary.db` — so driver registration and PRAGMAs must be idempotent.

**Incorrect (unnecessary custom driver, mismatched builder, CGO without justification):**

```go
// ❌ Adding a CGO dependency with no need for extensions
import _ "github.com/mattn/go-sqlite3"

func main() {
    app := pocketbase.NewWithConfig(pocketbase.Config{
        DBConnect: func(dbPath string) (*dbx.DB, error) {
            // ❌ "sqlite3" builder name used but "pb_sqlite3" driver was registered —
            //    or vice versa — causing "unknown driver" / broken query generation
            return dbx.Open("sqlite3", dbPath)
        },
    })
    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

**Correct (mattn/go-sqlite3 with CGO — proper PRAGMA init hook and builder map entry):**

```go
package main

import (
    "database/sql"
    "log"

    "github.com/mattn/go-sqlite3"
    "github.com/pocketbase/dbx"
    "github.com/pocketbase/pocketbase"
)

func init() {
    // Use a unique driver name to avoid conflicts with other packages.
    // sql.Register panics if called twice with the same name, so put it in init().
    sql.Register("pb_sqlite3", &sqlite3.SQLiteDriver{
        ConnectHook: func(conn *sqlite3.SQLiteConn) error {
            _, err := conn.Exec(`
                PRAGMA busy_timeout      = 10000;
                PRAGMA journal_mode      = WAL;
                PRAGMA journal_size_limit = 200000000;
                PRAGMA synchronous       = NORMAL;
                PRAGMA foreign_keys      = ON;
                PRAGMA temp_store        = MEMORY;
                PRAGMA cache_size        = -32000;
            `, nil)
            return err
        },
    })
    // Mirror the sqlite3 query builder so PocketBase generates correct SQL
    dbx.BuilderFuncMap["pb_sqlite3"] = dbx.BuilderFuncMap["sqlite3"]
}

func main() {
    app := pocketbase.NewWithConfig(pocketbase.Config{
        DBConnect: func(dbPath string) (*dbx.DB, error) {
            return dbx.Open("pb_sqlite3", dbPath)
        },
    })
    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

**Correct (ncruces/go-sqlite3 — no CGO, PRAGMAs via DSN query string):**

```go
package main

import (
    "log"

    "github.com/pocketbase/dbx"
    "github.com/pocketbase/pocketbase"
    _ "github.com/ncruces/go-sqlite3/driver"
    _ "github.com/ncruces/go-sqlite3/embed"
)

func main() {
    const pragmas = "?_pragma=busy_timeout(10000)" +
        "&_pragma=journal_mode(WAL)" +
        "&_pragma=journal_size_limit(200000000)" +
        "&_pragma=synchronous(NORMAL)" +
        "&_pragma=foreign_keys(ON)" +
        "&_pragma=temp_store(MEMORY)" +
        "&_pragma=cache_size(-32000)"

    app := pocketbase.NewWithConfig(pocketbase.Config{
        DBConnect: func(dbPath string) (*dbx.DB, error) {
            return dbx.Open("sqlite3", "file:"+dbPath+pragmas)
        },
    })
    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

**Conditional custom driver with default fallback:**

```go
app := pocketbase.NewWithConfig(pocketbase.Config{
    DBConnect: func(dbPath string) (*dbx.DB, error) {
        // Use custom driver only for the main data file; fall back for auxiliary
        if strings.HasSuffix(dbPath, "data.db") {
            return dbx.Open("pb_sqlite3", dbPath)
        }
        return core.DefaultDBConnect(dbPath)
    },
})
```

**Decision guide:**

| Need | Driver |
|------|--------|
| Default (no extensions) | Built-in `modernc.org/sqlite` — no `DBConnect` config needed |
| FTS5, ICU, spatialite | `mattn/go-sqlite3` (CGO) or `ncruces/go-sqlite3` (WASM, no CGO) |
| Reduce binary size | `go build -tags no_default_driver` to exclude the default driver (~4 MB saved) |
| Conditional fallback | Call `core.DefaultDBConnect(dbPath)` inside your `DBConnect` function |

Reference: [Extend with Go - Custom SQLite driver](https://pocketbase.io/docs/go-overview/#custom-sqlite-driver)

## 2. Set Up a Go-Extended PocketBase Application

**Impact: HIGH (Foundation for all custom Go business logic, hooks, and routing)**

When extending PocketBase as a Go framework (v0.36+), the entry point is a small `main.go` that creates the app, registers hooks on `OnServe()`, and calls `app.Start()`. Avoid reaching for a global `app` variable inside hook handlers - use `e.App` instead so code works inside transactions.

**Incorrect (global app reuse, no OnServe hook, bare http.Handler):**

```go
package main

import (
    "log"
    "net/http"

    "github.com/pocketbase/pocketbase"
)

var app = pocketbase.New() // global reference used inside handlers

func main() {
    // Routes registered directly via net/http - bypasses PocketBase's router,
    // middleware chain, auth, rate limiter and body limit
    http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("hello"))
    })

    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

**Correct (register routes inside `OnServe`, use `e.App` in handlers):**

```go
package main

import (
    "log"
    "net/http"
    "os"

    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/apis"
    "github.com/pocketbase/pocketbase/core"
)

func main() {
    app := pocketbase.New()

    app.OnServe().BindFunc(func(se *core.ServeEvent) error {
        // Serve static assets from ./pb_public (if present)
        se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

        // Custom API route - namespaced under /api/{yourapp}/ to avoid
        // colliding with built-in /api/collections, /api/realtime, etc.
        se.Router.GET("/api/myapp/hello/{name}", func(e *core.RequestEvent) error {
            return e.JSON(http.StatusOK, map[string]string{
                "message": "hello " + e.Request.PathValue("name"),
            })
        }).Bind(apis.RequireAuth())

        return se.Next()
    })

    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}
```

**Project bootstrap:**

```bash
go mod init myapp
go mod tidy
go run . serve           # development
go build && ./myapp serve  # production (statically linked binary)
```

**Key details:**
- Requires **Go 1.25.0+** (PocketBase v0.36.7+ bumped the minimum to Go 1.25.0).
- PocketBase ships with the pure-Go `modernc.org/sqlite` driver - **no CGO required** by default.
- If you need FTS5, ICU, or a custom SQLite build, pass `core.DBConnect` in `pocketbase.NewWithConfig(...)` - it is called twice (once for `pb_data/data.db`, once for `pb_data/auxiliary.db`).
- Inside hooks, prefer `e.App` over a captured parent-scope `app` - the hook may run inside a transaction and the parent `app` would deadlock.

Reference: [Extend with Go - Overview](https://pocketbase.io/docs/go-overview/)

## 3. Always Call e.Next() and Use e.App Inside Hook Handlers

**Impact: CRITICAL (Forgetting e.Next() silently breaks the execution chain; reusing parent-scope app causes deadlocks)**

Every PocketBase event hook handler is part of an execution chain. If the handler does not call `e.Next()` (Go) or `e.next()` (JS), **the remaining handlers and the core framework action are skipped silently**. Also, hooks may run inside a DB transaction - any database call made through a captured parent-scope `app`/`$app` instead of the event's own `e.App`/`e.app` will deadlock against the transaction.

**Incorrect (missing `Next`, captured parent-scope app, global mutex):**

```go
var mu sync.Mutex // ❌ global lock invoked recursively by cascade hooks = deadlock
app := pocketbase.New()

app.OnRecordAfterCreateSuccess("articles").BindFunc(func(e *core.RecordEvent) error {
    mu.Lock()
    defer mu.Unlock()

    // ❌ uses outer `app`, not `e.App` - deadlocks when the hook fires
    //    inside a transaction, because the outer app is blocked on the
    //    transaction's write lock
    _, err := app.FindRecordById("audit", e.Record.Id)
    if err != nil {
        return err
    }
    return nil // ❌ forgot e.Next() - framework never persists the record
})
```

```javascript
// JSVM
onRecordAfterCreateSuccess((e) => {
    // ❌ no e.next() = downstream hooks and response serialization skipped
    console.log("created", e.record.id);
}, "articles");
```

**Correct (call Next, use `e.App`, attach an Id for later unbinding):**

```go
app := pocketbase.New()

app.OnRecordAfterCreateSuccess("articles").Bind(&hook.Handler[*core.RecordEvent]{
    Id:       "audit-article-create",
    Priority: 10, // higher = later; default 0 = order of registration
    Func: func(e *core.RecordEvent) error {
        // Always use e.App - it is the transactional app when inside a tx
        audit := core.NewRecord(/* ... */)
        audit.Set("record", e.Record.Id)
        if err := e.App.Save(audit); err != nil {
            return err
        }
        return e.Next() // REQUIRED
    },
})

// Later: app.OnRecordAfterCreateSuccess("articles").Unbind("audit-article-create")
```

```javascript
// JSVM - e.app is the transactional app instance
onRecordAfterCreateSuccess((e) => {
    const audit = new Record($app.findCollectionByNameOrId("audit"));
    audit.set("record", e.record.id);
    e.app.save(audit);

    e.next(); // REQUIRED
}, "articles");
```

**Rules of the execution chain:**

- `Bind(handler)` vs `BindFunc(func)`: `Bind` lets you set `Id` (for `Unbind`) and `Priority`; `BindFunc` auto-generates both.
- Priority defaults to `0` = order of source registration. Lower numbers run first, negative priorities run before defaults (the built-in middlewares use priorities like `-1010`, `-1000`, `-990`).
- **Never hold a global mutex across `e.Next()`** - cascade-delete and nested saves can re-enter the same hook and deadlock.
- `Unbind(id)` removes a specific handler; `UnbindAll()` also removes **system handlers**, so only call it if you really mean to replace the default behavior.
- `Trigger(event, ...)` is almost never needed in user code.

Reference: [Go Event hooks](https://pocketbase.io/docs/go-event-hooks/) · [JS Event hooks](https://pocketbase.io/docs/js-event-hooks/)

## 4. Pick the Right Record Hook - Model vs Request vs Enrich

**Impact: HIGH (Wrong hook = missing request context, double-fired logic, or leaked fields in realtime events)**

PocketBase v0.23+ splits record hooks into three families. Using the wrong one is the #1 source of "my hook doesn't fire" and "my hidden field still shows up in realtime events" bugs.

| Family | Examples | Fires for | Has request context? |
|--------|----------|-----------|----------------------|
| **Model hooks** | `OnRecordCreate`, `OnRecordAfterCreateSuccess`, `OnRecordValidate` | Any save path - Web API **and** cron jobs, custom commands, migrations, calls from other hooks | No - `e.Record`, `e.App`, **no** `e.RequestInfo` |
| **Request hooks** | `OnRecordCreateRequest`, `OnRecordsListRequest`, `OnRecordViewRequest` | **Only** the built-in Web API endpoints | Yes - `e.RequestInfo`, `e.Auth`, HTTP headers/body |
| **Enrich hook** | `OnRecordEnrich` | Every response serialization, **including realtime SSE events** and `apis.enrichRecord` | Yes, via `e.RequestInfo` |

**Incorrect (hiding a field in the request hook - leaks in realtime):**

```go
// ❌ Only runs for GET /api/collections/users/records/{id}.
//    Realtime SSE subscribers still receive the "role" field.
app.OnRecordViewRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
    e.Record.Hide("role")
    return e.Next()
})
```

**Correct (use `OnRecordEnrich` so realtime and list responses also hide the field):**

```go
app.OnRecordEnrich("users").BindFunc(func(e *core.RecordEnrichEvent) error {
    e.Record.Hide("role")

    // Add a computed field only for authenticated users
    if e.RequestInfo.Auth != nil {
        e.Record.WithCustomData(true) // required to attach non-schema data
        e.Record.Set("isOwner", e.Record.Id == e.RequestInfo.Auth.Id)
    }
    return e.Next()
})
```

```javascript
// JSVM
onRecordEnrich((e) => {
    e.record.hide("role");

    if (e.requestInfo.auth?.collection()?.name === "users") {
        e.record.withCustomData(true);
        e.record.set("computedScore",
            e.record.get("score") * e.requestInfo.auth.get("base"));
    }
    e.next();
}, "users");
```

**Selection guide:**
- Need to mutate the record before **any** save (API, cron, migration, nested hook)? → `OnRecordCreate` / `OnRecordUpdate` (pre-save) or `OnRecord*Success` (post-save).
- Need access to HTTP headers, query params, or the authenticated client? → `OnRecord*Request`.
- Need to hide fields, redact values, or attach computed props on responses including realtime? → **`OnRecordEnrich`** - this is the safest default for response shaping.
- Need to validate before save? → `OnRecordValidate` (proxy over `OnModelValidate`).

Reference: [Go Record request hooks](https://pocketbase.io/docs/go-event-hooks/#record-crud-request-hooks) · [JS Record model hooks](https://pocketbase.io/docs/js-event-hooks/#record-model-hooks)

## 5. Set Up JSVM (pb_hooks) for Server-Side JavaScript

**Impact: HIGH (Correct setup unlocks hot-reload, type-completion, and the full JSVM API)**

The prebuilt PocketBase executable embeds an ES5 JavaScript engine (goja). Drop `*.pb.js` files into a `pb_hooks` directory next to the executable and they load automatically at startup. Files are loaded in **filename sort order**, and on UNIX platforms the process auto-reloads when any `pb_hooks` file changes.

**Incorrect (TypeScript without transpile, wrong filename, missing types reference):**

```typescript
// pb_hooks/main.ts  ❌ PocketBase loads ONLY *.pb.js - a .ts file is ignored
import { something } from "./lib"; // ❌ ES modules not supported in goja

routerAdd("GET", "/hello", (e) => e.json(200, { ok: true }));
```

```javascript
// pb_hooks/hooks.js  ❌ wrong extension - must be *.pb.js
// No /// reference -> editor shows every call as "any"
onRecordAfterUpdateSuccess((e) => {
    console.log(e.record.get("email"));
    // Missing e.next() - stops the execution chain silently
}, "users");
```

**Correct (valid filename, types reference, `e.next()` called):**

```javascript
// pb_hooks/main.pb.js
/// <reference path="../pb_data/types.d.ts" />

// Hooks defined earlier in the filename sort order run first.
// Use prefixes like "01_", "10_", "99_" if order matters.

routerAdd("GET", "/api/myapp/hello/{name}", (e) => {
    const name = e.request.pathValue("name");
    return e.json(200, { message: "Hello " + name });
});

onRecordAfterUpdateSuccess((e) => {
    console.log("user updated:", e.record.get("email"));
    e.next(); // REQUIRED - otherwise the execution chain is broken
}, "users");
```

**Key details:**
- JS method names are **camelCase** versions of their Go equivalents (`FindRecordById` → `$app.findRecordById`).
- Errors are thrown as regular JS exceptions, not returned as values.
- Global objects: `$app` (the app), `$apis` (routing helpers/middlewares), `$os` (OS primitives), `$security` (JWT, random strings, AES), `$filesystem` (file factories), `$dbx` (query builder), `$mails` (email helpers), `__hooks` (absolute path to `pb_hooks`).
- `pb_data/types.d.ts` is regenerated automatically - commit the triple-slash reference but not the file itself if you prefer.
- Auto-reload on file change works on UNIX only. On Windows, restart the process manually.

Reference: [Extend with JavaScript - Overview](https://pocketbase.io/docs/js-overview/)

## 6. Load Shared Code with CommonJS require() in pb_hooks

**Impact: MEDIUM (Correct module usage prevents require() failures, race conditions, and ESM import errors)**

The embedded JSVM (goja) supports **only CommonJS** (`require()`). ES module `import` syntax is not supported without pre-bundling. Modules use a shared registry — they are evaluated once and cached, so avoid mutable module-level state to prevent race conditions across concurrent requests.

**Incorrect (ESM imports, mutable shared state, Node.js APIs):**

```javascript
// ❌ ESM import syntax — not supported by goja
import { sendEmail } from "./utils.js";

// ❌ Node.js APIs don't exist in the JSVM sandbox
const fs = require("fs");
fs.writeFileSync("output.txt", "hello"); // ReferenceError

// ❌ Mutable module-level state is shared across concurrent requests
// pb_hooks/counter.js
let requestCount = 0;
module.exports = { increment: () => ++requestCount }; // race condition
```

**Correct (CommonJS require, stateless helpers, JSVM bindings for OS/file ops):**

```javascript
// pb_hooks/utils.js  — stateless helper module
module.exports = {
    formatDate: (d) => new Date(d).toISOString().slice(0, 10),
    validateEmail: (addr) => /^[^@]+@[^@]+\.[^@]+$/.test(addr),
};

// pb_hooks/main.pb.js
/// <reference path="../pb_data/types.d.ts" />

onRecordAfterCreateSuccess((e) => {
    const utils = require(`${__hooks}/utils.js`);
    const date = utils.formatDate(e.record.get("created"));
    console.log("Record created on:", date);
    e.next();
}, "posts");

// Use $os.* for file system operations (not Node.js fs)
routerAdd("GET", "/api/myapp/read-config", (e) => {
    const raw = $os.readFile(`${__hooks}/config.json`);
    const cfg = JSON.parse(raw);
    return e.json(200, { name: cfg.appName });
});

// Use $filesystem.s3(...) or $filesystem.local(...) for storage (v0.36.4+)
routerAdd("POST", "/api/myapp/upload", (e) => {
    const bucket = $filesystem.s3({
        endpoint: "s3.amazonaws.com",
        bucket:   "my-bucket",
        region:   "us-east-1",
        accessKey: $app.settings().s3.accessKey,
        secret:    $app.settings().s3.secret,
    });
    // ... use bucket to store/retrieve files
    return e.json(200, { ok: true });
}, $apis.requireAuth());
```

**Using third-party CJS packages:**

```javascript
// node_modules/ is searched automatically alongside __hooks.
// Install packages with npm next to the pb_hooks directory, then require by name.
onBootstrap((e) => {
    e.next();
    // Only CJS-compatible packages work without bundling
    const slugify = require("slugify");
    console.log(slugify("Hello World")); // "Hello-World"
});
```

**Using ESM-only packages (bundle to CJS first):**

```bash
# Bundle an ESM package to CJS with rollup before committing it to pb_hooks
npx rollup node_modules/some-esm-pkg/index.js \
  --file pb_hooks/vendor/some-esm-pkg.js \
  --format cjs
```

```javascript
onBootstrap((e) => {
    e.next();
    const pkg = require(`${__hooks}/vendor/some-esm-pkg.js`);
});
```

**JSVM engine limitations:**
- No `setTimeout` / `setInterval` — no async scheduling inside handlers.
- No Node.js APIs (`fs`, `Buffer`, `process`, etc.) — use `$os.*` and `$filesystem.*` JSVM bindings instead.
- No browser APIs (`fetch`, `window`, `localStorage`) — use `$app.newHttpClient()` for outbound HTTP requests.
- ES6 is mostly supported but not fully spec-compliant (goja engine).
- The prebuilt PocketBase executable starts a **pool of 15 JS runtimes** by default; adjust with `--hooksPool=N` for high-concurrency workloads (more runtimes = more memory, better throughput).
- `nullString()`, `nullInt()`, `nullFloat()`, `nullBool()`, `nullArray()`, `nullObject()` helpers are available (v0.35.0+) for scanning nullable DB columns safely.

Reference: [Extend with JavaScript - Loading modules](https://pocketbase.io/docs/js-overview/#loading-modules)

## 7. Avoid Capturing Variables Outside JSVM Handler Scope

**Impact: HIGH (Variables defined outside a handler are undefined at runtime due to handler serialization)**

Each JSVM handler (hook, route, middleware) is **serialized and executed as an isolated program**. Variables or functions declared at the module/file scope are NOT accessible inside handler bodies. This is the most common source of `undefined` errors in `pb_hooks` code.

**Incorrect (accessing outer-scope variable inside handler):**

```javascript
// pb_hooks/main.pb.js
const APP_NAME = "myapp"; // ❌ will be undefined inside handlers

onBootstrap((e) => {
    e.next();
    console.log(APP_NAME); // ❌ undefined — APP_NAME is not in handler scope
});

// ❌ Even $app references captured here may not work as expected
const helper = (id) => $app.findRecordById("posts", id);

onRecordAfterCreateSuccess((e) => {
    helper(e.record.id); // ❌ helper is undefined inside the handler
}, "posts");
```

**Correct (move shared state into a required module, or use `$app`/`e.app` directly):**

```javascript
// pb_hooks/config.js  — stateless CommonJS module
module.exports = {
    APP_NAME: "myapp",
    MAX_RETRIES: 3,
};

// pb_hooks/main.pb.js
/// <reference path="../pb_data/types.d.ts" />

onBootstrap((e) => {
    e.next();
    // Load the shared module INSIDE the handler
    const config = require(`${__hooks}/config.js`);
    console.log(config.APP_NAME); // ✅ "myapp"
});

routerAdd("GET", "/api/myapp/status", (e) => {
    const config = require(`${__hooks}/config.js`);
    return e.json(200, { app: config.APP_NAME });
});

onRecordAfterCreateSuccess((e) => {
    // Access the app directly via e.app inside the handler
    const post = e.app.findRecordById("posts", e.record.id);
    e.next();
}, "posts");
```

**Key rules:**
- Every handler body is serialized to a string and executed in its own isolated goja runtime context. There is no shared global state between handlers at runtime.
- `require()` loads modules from a **shared registry** — modules are evaluated once and cached. Keep module-level code stateless; avoid mutable module exports to prevent data races under concurrent requests.
- `__hooks` is always available inside handlers and resolves to the absolute path of the `pb_hooks` directory.
- Error stack trace line numbers may not be accurate because of the handler serialization — log meaningful context manually when debugging.
- Workaround for simple constants: move them to a `config.js` module and `require()` it inside each handler that needs it.

Reference: [Extend with JavaScript - Handlers scope](https://pocketbase.io/docs/js-overview/#handlers-scope)

## 8. Register Custom Routes Safely with Built-in Middlewares

**Impact: HIGH (Protects custom endpoints with auth, avoids /api path collisions, inherits rate limiting)**

PocketBase routing is built on top of `net/http.ServeMux`. Custom routes are registered inside the `OnServe()` hook (Go) or via `routerAdd()` / `routerUse()` (JSVM). **Always** namespace custom routes under `/api/{yourapp}/...` to avoid colliding with built-in endpoints, and attach `apis.RequireAuth()` / `$apis.requireAuth()` (or stricter) to anything that is not meant to be public.

**Incorrect (path collision, no auth, raw ResponseWriter):**

```go
// ❌ "/api/records" collides with /api/collections/{name}/records built-in
se.Router.POST("/api/records", func(e *core.RequestEvent) error {
    // ❌ no auth check - anyone can call this
    // ❌ returns raw text; no content-type
    e.Response.Write([]byte("ok"))
    return nil
})
```

**Correct (namespaced, authenticated, group-scoped middleware):**

```go
app.OnServe().BindFunc(func(se *core.ServeEvent) error {
    // Group everything under /api/myapp/ and require auth for the entire group
    g := se.Router.Group("/api/myapp")
    g.Bind(apis.RequireAuth())                  // authenticated users only
    g.Bind(apis.Gzip())                         // compress responses
    g.Bind(apis.BodyLimit(10 << 20))            // per-route override of default 32MB limit

    g.GET("/profile", func(e *core.RequestEvent) error {
        return e.JSON(http.StatusOK, map[string]any{
            "id":    e.Auth.Id,
            "email": e.Auth.GetString("email"),
        })
    })

    // Superuser-only admin endpoint
    g.POST("/admin/rebuild-index", func(e *core.RequestEvent) error {
        // ... do the work
        return e.JSON(http.StatusOK, map[string]bool{"ok": true})
    }).Bind(apis.RequireSuperuserAuth())

    // Resource the owner (or a superuser) can access
    g.GET("/users/{id}/private", func(e *core.RequestEvent) error {
        return e.JSON(http.StatusOK, map[string]string{"private": "data"})
    }).Bind(apis.RequireSuperuserOrOwnerAuth("id"))

    return se.Next()
})
```

```javascript
// JSVM
routerAdd("GET", "/api/myapp/profile", (e) => {
    return e.json(200, {
        id: e.auth.id,
        email: e.auth.getString("email"),
    });
}, $apis.requireAuth());

routerAdd("POST", "/api/myapp/admin/rebuild-index", (e) => {
    return e.json(200, { ok: true });
}, $apis.requireSuperuserAuth());
```

**Built-in middlewares (Go: `apis.*`, JS: `$apis.*`):**

| Middleware | Use |
|---|---|
| `RequireGuestOnly()` | Reject authenticated clients (e.g. public signup forms) |
| `RequireAuth(...collections)` | Require any auth record; optionally restrict to specific auth collections |
| `RequireSuperuserAuth()` | Alias for `RequireAuth("_superusers")` |
| `RequireSuperuserOrOwnerAuth("id")` | Allow superusers OR the auth record whose id matches the named path param |
| `Gzip()` | Gzip-compress the response |
| `BodyLimit(bytes)` | Override the default 32MB request body cap (0 = no limit) |
| `SkipSuccessActivityLog()` | Suppress activity log for successful responses |

**Path details:**
- Patterns follow `net/http.ServeMux`: `{name}` = single segment, `{name...}` = catch-all.
- A trailing `/` acts as a prefix wildcard; use `{$}` to anchor to the exact path only.
- **Always** prefix custom routes with `/api/{yourapp}/` - do not put them under `/api/` alone, which collides with built-in collection / realtime / settings endpoints.
- Order: global middlewares → group middlewares → route middlewares → handler. Use negative priorities to run before built-ins if needed.

Reference: [Go Routing](https://pocketbase.io/docs/go-routing/) · [JS Routing](https://pocketbase.io/docs/js-routing/)


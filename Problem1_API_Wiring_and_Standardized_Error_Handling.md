# Problem1: API Wiring + Standardized Error Handling

## Overview

This document summarizes all server-side changes made to fix API wiring, standardize error handling, and improve overall code quality in the CritiQ backend.

---

## Changes Made

### 1. Route Wiring (`app.js`)

**What:** Uncommented all 4 route imports and mounts (`/users`, `/questions`, `/customers`, `/phone`).

**Why:** All routes were commented out — no endpoints worked at all. The server started successfully but every API call returned 404.

---

### 2. Duplicate Middleware Removed (`app.js`)

**What:** Removed the second `app.use(cors())` call. Removed the unused `fastwinston` import.

**Why:** CORS was registered twice (redundant). `fastwinston` was monkey-patching Express and hanging every incoming request indefinitely — it was imported but never actually used anywhere in the codebase.

---

### 3. Unified Response Shape (`lib/response.js`) — New File

**What:** Created a `sendSuccess()` helper used by all controllers.

**Why:** Controllers returned inconsistent response shapes — `{ message }`, `{ data, message }`, `{ status: 1 }`, bare arrays. Now every endpoint returns a consistent shape:

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error (centralized middleware):**
```json
{ "success": false, "message": "...", "code": 400, "stack": null }
```

---

### 4. Controller Rewrites (All 4 Controllers)

**What:** Rewrote `user.js`, `question.js`, `customer.js`, `phone.js`.

**Why (per fix):**

| Controller | Issue | Fix |
|------------|-------|-----|
| `user.js` | `CONSTANTS` was used but never imported → `ReferenceError` on every signup | Added `require('../lib/contants')` import |
| `customer.js` | `getBalance` called `res.send()` inside a `forEach` loop → crashed with "headers already sent" | Replaced with `.map()` + single `sendSuccess()` |
| `customer.js` | SMTP credentials hardcoded in source file | Moved to `config.server.smtpMail` / `config.server.smtpPassword` from env vars |
| `question.js` | Unused model import; manual `res.json(404)` instead of throwing | Removed dead import; replaced with thrown error caught by centralized middleware |
| All | No input validation on any endpoint | Added early-throw validation (400) on 6 endpoints: user signup/login, question create, customer create/login, phone create |
| All | Inconsistent async error handling (mix of try/catch inline and `wrapAsync`) | Standardized all controllers to use `wrapAsync` + throw pattern |

---

### 5. Deleted Duplicate Controllers and Schemas

**What:** Deleted the following files:
- `controller/companyController.js`
- `controller/questionController.js`
- `controller/customerController.js`
- `controller/phoneController.js`
- `models/customerSchema.js`
- `models/phoneSchema.js`

**Why:** Each domain had two controller files — a clean `wrapAsync` version and a messy inline try/catch version. The duplicates were not used by any active route but created confusion and inconsistency. The duplicate schema files were only referenced by the deleted controllers.

---

### 6. Route File Cleanup

**What:** Removed stale destructured imports from `routes/users.js`, `routes/customer.js`, `routes/phone.js`.

**Why:** Lines like `const { createComapny, loginCompany } = require('../controller/user')` imported names that did not exist on the exported object — they resolved silently to `undefined` and served no purpose.

---

### 7. Bug Fixes in `lib/helper.js`

**What:** Added the missing `isJsonObj()` function and `showErrorLogs` variable.

**Why:** Both were referenced inside `helper.js` but never defined. This caused a `ReferenceError` every time `wrapAsync` tried to log a caught error, meaning error details were silently lost.

---

### 8. Mongoose Model Safety Fix (All 4 Models)

**What:** Added `mongoose.models.X ||` guard before each `mongoose.model(...)` call in all model files.

**Why:** Mongoose throws `OverwriteModelError: Cannot overwrite model once compiled` when a model is registered more than once in the same process — which happens during testing when multiple test files import the same model. The guard checks if the model is already registered before re-compiling it.

---

### 9. Friendbot Non-Blocking (`customer.js`)

**What:** Wrapped the Diamante friendbot API call in a try/catch, making failure a warning instead of a fatal error.

**Why:** The external Diamante testnet friendbot service (`https://friendbot.diamcircle.io`) is unreliable and returns Bad Gateway errors frequently. Previously this crashed the entire customer signup flow. Now the keypair is still generated and the customer is saved — activation is simply skipped with a server-side warning log.

---

### 10. Unit and E2E Tests Added

**What:** Added 53 tests across 8 files:
- **Unit tests** (29): Mock the service layer, test controller logic in isolation
- **E2E tests** (24): Use `supertest` + real in-memory MongoDB via `mongodb-memory-server`

**Test commands:**
```bash
npm test          # run all 53 tests
npm run test:unit # unit tests only
npm run test:e2e  # E2E tests only
```

**Why:** No tests existed at all. Writing tests also uncovered the `lib/helper.js` undefined variable bugs and the Mongoose model overwrite error — bugs that would have been invisible without a test environment.

---

## Summary Table

| # | File(s) Changed | Problem | Fix |
|---|----------------|---------|-----|
| 1 | `app.js` | All routes commented out — no endpoints worked | Uncommented route imports and mounts |
| 2 | `app.js` | Duplicate CORS + `fastwinston` hanging all requests | Removed duplicate and unused import |
| 3 | `lib/response.js` | No unified response shape | Created `sendSuccess()` helper |
| 4 | All 4 controllers | Missing imports, `forEach` crash, no validation, mixed error patterns | Rewrote with `wrapAsync`, validation, and `sendSuccess()` |
| 5 | 4 controllers + 2 schemas | Duplicate files causing confusion | Deleted unused duplicates |
| 6 | 3 route files | Stale imports resolving to `undefined` | Removed dead import lines |
| 7 | `lib/helper.js` | `isJsonObj` and `showErrorLogs` used but never defined | Added missing definitions |
| 8 | All 4 models | `OverwriteModelError` in test environment | Added `mongoose.models.X \|\|` guard |
| 9 | `customer.js` | Friendbot failure crashed customer signup | Made friendbot non-blocking with try/catch |
| 10 | `tests/` | No tests existed | Added 53 unit + E2E tests |

# Problem 2: Customer & Question Module Hardening

## Overview

This document summarises all server-side changes made to bring the customer and question flows to production-level robustness. The existing code was functional but lacked structured input validation, had blockchain/email business logic embedded directly inside controllers, contained a completely non-functional audit logging system, applied rate limiting only globally (never tighter on sensitive endpoints), and had incomplete test coverage for failure paths.

---

## Changes Made

### 1. Joi Dependency Added (`server/package.json`)

**What:** Installed `joi` as a production dependency.

**Why:** The codebase had no validation library — all validation was ad-hoc `if (!field)` null-checks with no format enforcement, no length limits, and no sanitisation. `joi` provides declarative schema validation with built-in coercion (`lowercase`, `trim`) and generates clear, structured error messages automatically.

```bash
npm install joi
```

---

### 2. Joi Validator Schemas — New Files

**What:** Created two schema files:
- `server/lib/validators/customer.js`
- `server/lib/validators/question.js`

**Why:** Centralising schemas in one place means validation rules are defined once and reused across the route, the controller test, and any future middleware — no duplication.

#### `customer.js` schemas

| Endpoint | Field | Rule |
|---|---|---|
| `createCustomer` | `name` | string, trimmed, 2–100 chars |
| | `companyEmail` | valid email, lowercased |
| | `walletAddress` | alphanumeric, exactly 56 chars (Diamante/Stellar key format) |
| `loginCustomer` | `walletAddress` | same |
| `sendOtp` | `email` | valid email |
| | `otp` | 4–8 digit numeric string |
| `sendMoney` | `key` | alphanumeric, 56 chars |
| `getBalance` | `pkey` (query param) | alphanumeric, 56 chars |

#### `question.js` schema

| Field | Rule |
|---|---|
| `productName` | string, 1–200 chars |
| `productDescription` | string, 1–1000 chars |
| `productImageUrl` | must be a valid URI |
| `isOrderIdTracking` | boolean (strict) |
| `questions` | array, at least 1 item |
| Each question — `q` | non-empty string |
| Each question — `type` | one of `SHORT`, `MCQ` |
| Each question — `options` | required when `type === MCQ`, minimum 2 items |

---

### 3. Validate Middleware Factory — New File

**What:** Created `server/middlewares/validate.js` — a single-function factory that wraps any Joi schema into an Express middleware.

**Why:** Without a shared factory, each route would need to repeat the same `schema.validate() → if (error) → next(err)` boilerplate. The factory runs `stripUnknown: true` automatically, which removes any undeclared keys from the request body — a lightweight defence against parameter pollution.

```js
const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
        abortEarly: false,   // collect all errors, not just the first
        stripUnknown: true,  // remove undeclared keys (sanitisation)
    });
    if (error) {
        const err = new Error(error.details.map(d => d.message).join('; '));
        err.statusCode = 400;
        return next(err);
    }
    req[source] = value; // overwrite with sanitised/coerced value
    next();
};
```

The `abortEarly: false` option means a single bad request surfaces all validation errors at once instead of requiring the client to fix and re-submit one error at a time.

---

### 4. Business Logic Moved to Customer Service (`server/services/customer.js`)

**What:** Added four new exported functions to the customer service:

| New function | What it does | Moved from |
|---|---|---|
| `createWithWallet(data)` | Generates Diamante keypair, activates via Friendbot (best-effort), then persists customer | `controller/customer.js` |
| `sendOTPEmail(email, otp)` | Creates nodemailer transporter and sends OTP email | `controller/customer.js` (`sendOTPViaEmail` helper) |
| `fetchBalance(pkey)` | Loads account from Diamante Horizon and maps balances | `controller/customer.js` |
| `executePayment(destinationKey)` | Builds, signs, and submits a 1-DIAM blockchain transaction | `controller/customer.js` |

**Why:** Controllers are meant to handle HTTP concerns — extracting request data, calling services, sending responses. Business logic (blockchain operations, email delivery) does not belong there. Putting it in the service layer means:
- The controller can be unit-tested without mocking `diamante-base`, `diamante-sdk-js`, and `nodemailer` directly.
- The service functions can be reused from other controllers or background workers in the future without duplicating code.
- The controller file shrinks from 175 lines to 55 lines.

The existing basic CRUD functions (`create`, `getAll`, `getOne`, `getById`, `updateById`) were left unchanged.

---

### 5. Customer Controller Thinned Out (`server/controller/customer.js`)

**What:** Removed all validation logic, all blockchain imports (`diamante-base`, `diamante-sdk-js`), and the `nodemailer` import. Each handler now does exactly one thing: delegate to the service and return a response.

**Why:** The controller's job is to map HTTP ↔ service, not to own business logic. With validation in middleware and business logic in the service, the controller is purely a thin adapter:

```
Request → validate middleware → controller → service → response
```

**Before (createCustomer):** 40 lines — null checks, Keypair generation, dynamic import, Friendbot call, model create.

**After (createCustomer):** 3 lines — call `createWithWallet`, send 201.

---

### 6. Question Controller Thinned Out (`server/controller/question.js`)

**What:** Removed the manual `if (!productName || !productDescription || ...)` validation block. The controller now only builds the payload and calls `QuestionService.create`.

**Why:** The Joi schema `createQuestionSetSchema` (applied via the `validate` middleware in the route) now enforces all field-level rules including individual question object structure — something the old if-check never did. The old check would accept `questions: [{}]` (an object with no fields) and let Mongoose's schema validation catch it much later with a less user-friendly error.

---

### 7. Per-Endpoint Rate Limits Added (`server/routes/customer.js`, `server/routes/users.js`)

**What:** Added two stricter rate limiters applied directly to sensitive endpoints, layered on top of the existing global limiter (100 req/15 min):

| Limiter | Limit | Applied to |
|---|---|---|
| `loginLimit` | 10 requests / 15 min per IP | `POST /customers/login`, `POST /customers/sendmoney`, `POST /users/login` |
| `otpLimit` | 5 requests / 15 min per IP | `POST /customers/sendotp` |

**Why:** The global limiter (100 req/15 min) is too permissive for credential and OTP endpoints. An attacker can make 100 login attempts every 15 minutes before being blocked — that is effectively no brute-force protection. The tighter per-endpoint limits reduce the attack window dramatically without affecting normal users (who rarely call these endpoints more than 2–3 times in a window).

The rate limit responses return a JSON body matching the rest of the API:
```json
{ "success": false, "message": "Too many attempts. Please try again later." }
```

---

### 8. Validate Middleware Wired to All Routes

**What:** Updated all four route files to apply the validate middleware before controllers:

```
POST /customers/create    → validate(createCustomerSchema)           → controller
POST /customers/login     → loginLimit → validate(loginCustomerSchema) → controller
POST /customers/sendotp   → otpLimit   → validate(sendOtpSchema)      → controller
POST /customers/sendmoney → loginLimit → validate(sendMoneySchema)    → controller
GET  /customers/getbalance→ validate(getBalanceSchema, 'query')      → controller
POST /questions           → validate(createQuestionSetSchema)         → controller
```

**Why:** Attaching validation at the route level (not inside the controller) means the controller function is only ever called with a clean, coerced, sanitised `req.body` or `req.query`. There is no way for invalid data to reach the database.

---

### 9. Audit Logging Fixed and Correlation ID Added (`server/app.js`, `server/middlewares/logs.js`)

**What — the bug:** The existing audit logging middleware in `app.js` never populated `res.locals.jsonReq` or `res.locals.auditPDetail`. The `auditPersonJson()` function was defined and exported but never called. As a result, every request fell into the `else` branch of `createUserApiLog()` and logged only `console.log('res.locals is null')` — audit logs were completely silent. Additionally, `isEmpty()` in `logs.js` called `isJsonObj()` which was never defined, causing a silent `ReferenceError` every time the non-empty branch ran.

**What — the fix:**

`server/app.js` — replaced the logging middleware:
```js
app.use(function (req, res, next) {
    const correlationId = crypto.randomUUID(); // built-in Node ≥14.17, no extra package
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);          // visible to clients

    res.locals.startTimeStamp = performance.now();
    res.locals.startTime      = format(new Date(), 'HH:mm:ss.SSS');
    res.locals.jsonReq        = req.body;                       // was never set before
    res.locals.auditPDetail   = auditPersonJson(req, correlationId); // was never called

    res.once('end', () => createUserApiLog(req, res));
    const oldSend = res.send;
    res.send = function (data) {
        res.locals.resBody = isJsonStr(data) ? JSON.parse(data) : data;
        oldSend.apply(res, arguments);
    };
    next();
});
```

`server/middlewares/logs.js` — updated the log payload to include new fields and fixed `isJsonObj`:

| Field added | Value |
|---|---|
| `correlationId` | UUID from `req.correlationId` |
| `method` | HTTP verb (GET, POST, …) |
| `endpoint` | Full request URL including query string |
| `latencyMs` | `(performance.now() - startTimeStamp).toFixed(2) + 'ms'` |

Fixed: replaced the undefined `isJsonObj(string)` call with `typeof string === 'object' && string !== null`.

**Why:** Without a correlation ID there is no way to trace a single request across multiple log lines. Without latency in the log, slow endpoints are invisible until a user complains. Without the audit log working at all, there is zero observability into what the API is doing in production.

Every response now includes an `X-Correlation-Id` header so clients and API gateways can correlate their logs with server logs:

```
X-Correlation-Id: 3f2a1c9d-84b3-4e12-a901-dc3b2f8e7a61
```

---

### 10. Tests Updated and Extended

**What:** Updated and extended tests across 4 files, reaching 70 passing tests total.

**Test commands (unchanged):**
```bash
npm test           # all 70 tests
npm run test:unit  # unit tests only
npm run test:e2e   # E2E tests only (--runInBand)
```

#### Unit tests — `tests/unit/controllers/customer.test.js`

**Why they needed updating:** The old unit tests verified that the controller threw 400 for missing fields. That logic no longer lives in the controller — it is in the validate middleware. Keeping those tests would have been testing code that no longer exists; they would have started passing for the wrong reason (service returning undefined → 201, not 400).

| Old tests removed | Replacement |
|---|---|
| `createCustomer` throws 400 if fields missing (×2) | `createCustomer` delegates to `CustomerService.createWithWallet` and returns 201 |
| (blockchain mocks that no longer belong in controller test) | Removed — controller no longer imports blockchain libs |

New tests added:
- `createCustomer` calls `next` when service throws (error propagation check)
- `sendOtp` verifies `CustomerService.sendOTPEmail` is called with correct args
- `sendMoney` verifies `CustomerService.executePayment` is called and response contains "DIAM"
- `getBalance` now sets up `CustomerService.fetchBalance` mock with return value (previously used blockchain mock directly)

#### Unit tests — `tests/unit/controllers/question.test.js`

**Why they needed updating:** Three tests verified that the controller threw 400 for missing required fields and non-array questions. This is now the middleware's responsibility.

Removed:
- `create` throws 400 if required fields missing
- `create` throws 400 if questions is not an array
- `create` throws 400 if questions is empty array

Added:
- `create` calls `next` when service throws

All payload-shaping tests (`reviewDate`/`excelFile` conditional logic) kept — that logic remains in the controller and is worth verifying.

#### E2E tests — `tests/e2e/customers.test.js`

**Why the existing tests needed fixing:** The existing `sendmoney` and `getbalance` tests used short wallet strings (`'GDEST999RECIPIENT'` = 16 chars, `'GPUBKEY123TESTONLY'` = 17 chars). These now correctly return 400 under the new Joi validation, so both tests would have failed. Updated to use a valid 56-character alphanumeric wallet string.

Added `Customer.init()` in `beforeAll`:
- Mongoose v8 builds unique indexes lazily (asynchronously after connect). Without `await Customer.init()`, the 409 duplicate-wallet test ran before the index existed and got 201 instead of 409.

New test coverage:

| Endpoint | Scenario | Expected |
|---|---|---|
| `POST /create` | Missing `name` | 400 |
| `POST /create` | Invalid email format | 400 |
| `POST /create` | `walletAddress` not 56 chars | 400 |
| `POST /create` | Duplicate `walletAddress` | 409 |
| `POST /create` | All valid | 201 |
| `POST /login` | `walletAddress` not 56 chars | 400 |
| `POST /sendotp` | Missing `email` | 400 |
| `POST /sendotp` | Invalid email format | 400 |
| `POST /sendotp` | Missing `otp` | 400 |
| `POST /sendotp` | Non-numeric `otp` | 400 |
| `POST /sendmoney` | Missing `key` | 400 |
| `POST /sendmoney` | `key` not 56 chars | 400 |
| `GET /getbalance` | Missing `pkey` query param | 400 |
| `GET /getbalance` | `pkey` not 56 chars | 400 |
| Any endpoint | Response header | `X-Correlation-Id` present and UUID-shaped |

#### E2E tests — `tests/e2e/questions.test.js`

New tests added for question-item level validation (the old code accepted structurally invalid question objects and let Mongoose catch them with a worse error message):

| Scenario | Expected |
|---|---|
| Question `type` is `RATING` (not in enum) | 400 |
| MCQ question with only 1 option | 400 |
| Question missing `q` field | 400 |
| `productImageUrl` is not a valid URL | 400 |

---

## Summary Table

| # | File(s) Changed | Problem | Fix |
|---|---|---|---|
| 1 | `server/package.json` | No validation library | Added `joi` |
| 2 | `server/lib/validators/customer.js` *(new)* | No format/length validation on any customer endpoint | Joi schemas: email format, wallet 56-char, otp numeric |
| 3 | `server/lib/validators/question.js` *(new)* | Questions array accepted structurally invalid items | Joi schema: type enum, MCQ requires ≥2 options, `q` required |
| 4 | `server/middlewares/validate.js` *(new)* | No shared validation middleware | Factory: runs schema, strips unknown keys, passes 400 on failure |
| 5 | `server/services/customer.js` | Blockchain + email business logic lived in the controller | Moved `createWithWallet`, `sendOTPEmail`, `fetchBalance`, `executePayment` into service |
| 6 | `server/controller/customer.js` | Controller was 175 lines; owned blockchain/email logic | Thinned to 55 lines; delegates entirely to service |
| 7 | `server/controller/question.js` | Manual if-check missed structural question validation | Removed if-check; Joi middleware enforces all rules |
| 8 | `server/routes/customer.js` | Only global rate limit (100/15 min) protected login, OTP, sendmoney | Per-endpoint `loginLimit` (10/15 min) and `otpLimit` (5/15 min) |
| 9 | `server/routes/users.js` | User login had no endpoint-specific rate limit | Added `loginLimit` (10/15 min) to `POST /login` |
| 10 | `server/routes/questions.js` | No validation before question creation | Wired `validate(createQuestionSetSchema)` |
| 11 | `server/app.js` | Audit logging never initialised — `auditPersonJson` never called, `res.locals.jsonReq` never set | Fixed middleware to call `auditPersonJson`, set all `res.locals`, generate `correlationId` |
| 12 | `server/middlewares/logs.js` | Log payload missing correlation ID, method, endpoint, latency; `isJsonObj` undefined crash | Added `correlationId`, `method`, `endpoint`, `latencyMs`; fixed undefined reference |
| 13 | `tests/unit/controllers/customer.test.js` | Tests verified controller-level validation that no longer exists | Rewrote to test service delegation, error propagation |
| 14 | `tests/unit/controllers/question.test.js` | Tests verified controller-level validation that no longer exists | Removed stale tests; added service-throw propagation test |
| 15 | `tests/e2e/customers.test.js` | Short wallet strings broke under new Joi rules; 14 failure-path scenarios untested | Fixed existing tests; added 14 new validation/conflict/header tests |
| 16 | `tests/e2e/questions.test.js` | Question-item structural validation not tested | Added 4 tests: invalid type, MCQ <2 options, missing `q`, invalid URL |

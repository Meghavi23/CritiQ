# CritiQ
![](https://github.com/ankushroy25/CritiQ/blob/main/preview/Cover.png)


## Overview
CritiQ is an decentralised web application for handling customer reviews and feedback for products and services. 
It incentivises the reviewer and prevents them from posting gibberish reviews to maintain authenticity.
Companies are assisted with LLMs to improve their competition in market. 
It provides a range of endpoints for managing users, reviews, and validation processes.

## API Architecture

### Base URL
All routes are mounted under `/api` (configurable via the `ROUTE` environment variable).

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/users/signup | Register a new company |
| POST | /api/users/login | Log in with wallet address |
| POST | /api/questions | Create a question set |
| GET | /api/questions/:id | Get questions by ID |
| POST | /api/customers/create | Register a new customer |
| POST | /api/customers/login | Log in as customer |
| POST | /api/customers/sendotp | Send OTP via email |
| POST | /api/customers/sendmoney | Send DIAM token payment |
| GET | /api/customers/getbalance | Get blockchain wallet balance |
| GET | /api/customers/getall | List all customers |
| POST | /api/phone | Add a phone record |
| GET | /api/phone | Look up a phone record |

### Standard Response Shape

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error (handled by centralized middleware):**
```json
{ "success": false, "message": "...", "code": 400, "stack": null }
```

### What Was Broken and What Was Fixed

| # | Problem | Fix Applied |
|---|---------|-------------|
| 1 | All 4 route groups were commented out in `app.js` — no endpoints worked | Uncommented route imports and mounts under `config.server.route` |
| 2 | Duplicate CORS middleware registered twice in `app.js` | Removed the second `app.use(cors())` call |
| 3 | `controller/user.js` referenced `CONSTANTS` without importing it — ReferenceError on first request | Added `require('../lib/contants')` import |
| 4 | `getBalance` called `res.send()` inside a `forEach` loop — crashed with "Cannot set headers after they are sent" | Replaced with `.map()` collecting all balances, then a single `sendSuccess()` |
| 5 | 4 duplicate `*Controller.js` files (inline try/catch, direct model access) alongside clean wrapAsync controllers | Deleted duplicates; all routes now use the wrapAsync controllers exclusively |
| 6 | No unified API response shape — controllers returned mixed shapes (`{ message }`, `{ data, message }`, `{ status: 1 }`, bare arrays) | Introduced `lib/response.js` with `sendSuccess()` applied to all controller handlers |
| 7 | No input validation on any endpoint | Added early-throw validation (statusCode 400) on 6 endpoints: user signup/login, question create, customer create/login, phone create |
| 8 | Stale destructured import lines in 3 route files (names not exported, resolved to `undefined`) | Removed dead import lines from `routes/users.js`, `routes/customer.js`, `routes/phone.js` |
| 9 | Hardcoded SMTP credentials in `controller/customer.js` | Moved to `config.server.smtpMail` / `config.server.smtpPassword` read from env vars |
| 10 | Error response shape inconsistent with success shape | Updated centralized error middleware to emit `{ success: false, message, code, stack }` |

## Setup
### Prerequisites
- Node.js (v22 or higher)

1. Install dependencies:
        ```npm install npm-run-all --save-dev```
        ```npm run install:all```
    
2. Create a .env file with the following variables or replace .env.example file as .env file at server directory:
        ```    MONGODB_URI=your_mongodb_uri ```    
3. Start the project:
```        npm start```
    
## Contributing
1. Fork the repository
2. Create a new branch (git checkout -b feature/your-feature)
3. Commit your changes (git commit -m 'Add some feature')
4. Push to the branch (git push origin feature/your-feature)
5. Open a pull request

## License
This project is licensed under the MIT License.

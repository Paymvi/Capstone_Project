# Testing Overview – Roamie Backend

## Objective

This test suite validates the security, authentication, and core gameplay functionality of the Roamie backend. The goal is to ensure that both user interactions and security mechanisms behave correctly under normal and adversarial conditions.

---

## Testing Tools

* Jest (test runner)
* Supertest (API testing)
* Node.js (ES Modules)
* PostgreSQL (test database)

---

## Test Cases

| Test ID | Category | Description            | Expected Result                  |
| ------- | -------- | ---------------------- | -------------------------------- |
| TC-01   | Security | SQL injection attempt  | 400 or blocked                   |
| TC-02   | Auth     | Invalid login          | 401 or 403                       |
| TC-03   | Security | Rate limiting          | 429 or 403                       |
| TC-04   | Security | Account lockout        | 403 after threshold              |
| TC-05   | Security | Password hashing       | Password not stored in plaintext |
| TC-06   | Core     | Collect item           | Item added to inventory          |
| TC-07   | Core     | Equip item             | Equipment updated                |
| TC-08   | Core     | Get markers            | Returns array of markers         |
| TC-09   | Core     | Duplicate collection   | No duplicate entries             |
| TC-10   | Core     | Hide collected markers | Collected items not returned     |

---

## Security Testing

### SQL Injection Protection

* Simulates malicious input (`' OR 1=1 --`)
* Ensures input validation prevents query manipulation

Expected:

* Request rejected (400/403)

---

### Authentication & Invalid Credentials

* Tests incorrect login attempts

Expected:

* 401 or 403 response

---

### Rate Limiting & Abuse Prevention

* Sends repeated login attempts

Expected:

* 429 or 403 response

---

### Account Lockout

* Simulates repeated failed logins

Expected:

* Initial attempts → 401
* Threshold reached → 403

---

### Password Hashing

* Registers user and inspects stored password
* Verifies bcrypt hashing

Expected:

* Password ≠ plaintext
* bcrypt comparison succeeds

---

## Core Gameplay Testing

### Collect Item

* Verifies item is added to user inventory

### Equip Item

* Verifies equipment state updates correctly

### Markers Endpoint

* Ensures markers are returned as an array

### Duplicate Collection Prevention

* Ensures same item cannot be added twice

### Marker Filtering

* Ensures collected items no longer appear in map markers

---

## Defense-in-Depth

Roamie implements multiple overlapping security layers:

* Input validation (Zod)
* SQL injection detection
* Rate limiting
* Account lockout
* IP-based blocking
* Password hashing (bcrypt)

Tests validate that **at least one security mechanism is triggered** when malicious behavior is detected.

---

## Running Tests

```bash
npm test
```

---

## Cleanup

Tests automatically close database connections:

```js
afterAll(async () => {
  await pool.end();
});
```

---

## ✅ Results

All test cases passed successfully.

This confirms that the backend:

* Prevents common attack vectors
* Enforces authentication and authorization
* Maintains data integrity
* Supports core gameplay functionality reliably

Additionally, testing uncovered and resolved a critical edge-case bug related to handling non-existent users during login.

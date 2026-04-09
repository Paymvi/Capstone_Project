# Testing Overview – Roamie Backend

## Objective

This test suite validates the security, authentication, and core gameplay functionality of the Roamie backend. The goal is to ensure that both user interactions and security mechanisms behave correctly under normal and adversarial conditions.

This test suite includes **16 automated test cases** across authentication, security, and core gameplay functionality.
---

## Testing Tools

* Jest (test runner)
* Supertest (API testing)
* Node.js (ES Modules)
* PostgreSQL (test database)

---

## Test Cases

| Test ID | Category | Description | Expected Result |
|--------|---------|------------|----------------|
| TC-01 | Auth | Register user | 200 success |
| TC-02 | Auth | Duplicate username | 400 error |
| TC-03 | Auth | Login returns JWT | Token returned |
| TC-04 | Auth | JWT validation | Correct payload |
| TC-05 | Auth | Protected route requires token | 401 |
| TC-06 | Auth | Invalid token rejected | 401 |
| TC-07 | Core | Collect item | Item added |
| TC-08 | Core | Equip item | Equipment updated |
| TC-09 | Core | Get markers | Returns array |
| TC-10 | Core | Prevent duplicate collection | No duplicates |
| TC-11 | Core | Hide collected markers | Not returned |
| TC-12 | Security | SQL injection attempt | Blocked |
| TC-13 | Security | Invalid login | 401/403 |
| TC-14 | Security | Rate limiting | 429/403 |
| TC-15 | Security | Account lockout | 403 |
| TC-16 | Security | Password hashing | Not plaintext |

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

## Authentication Testing

Additional authentication-focused tests were implemented to ensure correct user account behavior and token handling.

Tests include:

* **User Registration**

  * Verifies that new users can successfully register
  * Ensures required fields are validated

* **Duplicate Username Handling**

  * Prevents multiple accounts with the same username
  * Returns an error when attempting to register an existing username

* **Login & JWT Generation**

  * Confirms successful login returns a valid JWT token
  * Verifies token contains correct user metadata

* **Protected Route Access**

  * Ensures endpoints require authentication
  * Rejects requests with missing or invalid tokens

---

## Test Organization

Tests are organized into three categories:

- `auth.test.js` → Authentication and JWT validation  
- `core.test.js` → Core gameplay functionality  
- `security.test.js` → Security and abuse prevention  

This separation improves maintainability and clarity of test coverage.

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

## Results

All test cases passed successfully.

This confirms that the backend:

* Prevents common attack vectors
* Enforces authentication and authorization
* Maintains data integrity
* Supports core gameplay functionality reliably

Additionally, testing uncovered and resolved a critical edge-case bug related to handling non-existent users during login.

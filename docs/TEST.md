# Testing Overview – Roamie Backend

## Purpose
This test suite validates the security and authentication mechanisms of the Roamie backend. The goal is to ensure that common attack vectors and misuse scenarios are properly handled using a defense-in-depth approach.

---

## Testing Tools
- Jest (test runner)
- Supertest (API testing)
- Node.js (ES Modules)

---

## Test Categories

| Test ID | Description | Expected Result |
|--------|------------|----------------|
| TC-01 | SQL injection attempt | 400 or blocked |
| TC-02 | Invalid login | 401 or 403 |
| TC-03 | Rate limiting | 429 or 403 |
| TC-04 | Account lockout | 403 after threshold |
| TC-05 | Password hashing | Password not stored in plaintext |

### 1. SQL Injection Protection
- Simulates malicious input such as `' OR 1=1 --`
- Verifies that input validation detects and blocks injection attempts

Expected Result:
- Request is rejected (HTTP 400 or 403)

---

### 2. Invalid Credentials Handling
- Tests login with incorrect username/password combinations

Expected Result:
- Request is rejected (HTTP 401 or 403)

---

### 3. Rate Limiting / Abuse Prevention
- Sends multiple rapid login attempts
- Verifies that excessive requests are blocked

Expected Result:
- Request is blocked (HTTP 429 or 403)

---

### 4. Account Lockout Mechanism
- Simulates repeated failed login attempts
- Verifies account is temporarily locked after threshold

Expected Result:
- Initial attempts → 401
- Threshold reached → 403 (account locked)

---

### 5. Password Hashing Verification
- Registers a new user and retrieves stored password from the database
- Verifies that passwords are not stored in plaintext
- Confirms bcrypt hashing is used

Expected Result:
- Stored password differs from input password
- bcrypt comparison returns true

## Notes on Defense-in-Depth

Roamie implements multiple overlapping security layers:
- Input validation (Zod + custom checks)
- SQL injection detection
- Rate limiting
- Account lockout
- IP-based blocking

Because of this layered design, responses may vary depending on system state. Tests are designed to confirm that **at least one security mechanism is triggered**, rather than enforcing a single fixed response.

---

## How to Run Tests

```bash
npm test
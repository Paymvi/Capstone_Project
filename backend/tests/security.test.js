import request from "supertest";
import app from "../server.js";
import bcrypt from "bcrypt";
import pool from "../db.js";
import { describe, test, expect, afterAll } from "@jest/globals";

async function getAuthToken() {
    const username = `testtokenuser_${Date.now()}`;
    const password = "StrongPass123!";

    await request(app)
        .post("/auth/register")
        .send({ username, password });

    const loginRes = await request(app)
        .post("/auth/login")
        .send({ username, password });

    return loginRes.body.token || loginRes.body.accessToken || loginRes.body.authToken;
}

describe("Security Tests", () => {
    test("Should detect SQL injection attempt", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
                username: "' OR 1=1 --",
                password: "anything"
            });

        expect([400, 403]).toContain(res.statusCode);
    })

    test("Should fail login with existing username but incorrect password", async () => {
        const username = `wrongpassuser_${Date.now()}`;
        const password = "StrongPass123!";

        await request(app)
            .post("/auth/register")
            .send({ username, password });

        const res = await request(app)
            .post("/auth/login")
            .send({
                username,
                password: "WrongPass123!"
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Invalid credentials");
        expect(res.body.token).toBeUndefined();
    });

    test("Should fail login with non-existing username", async () => {
        const res = await request(app)
            .post("/auth/login")
            .send({
            username: `doesnotexist_${Date.now()}`,
            password: "WrongPass123!"
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toBe("Invalid credentials");
        expect(res.body.token).toBeUndefined();
    });

    test("Should not reveal whether username exists during failed login", async () => {
        const username = `enumuser_${Date.now()}`;
        const password = "StrongPass123!";

        await request(app)
            .post("/auth/register")
            .send({ username, password });

        const existingUserWrongPassword = await request(app)
            .post("/auth/login")
            .send({
            username,
            password: "WrongPass123!"
            });

        const nonExistingUser = await request(app)
            .post("/auth/login")
            .send({
            username: `fakeuser_${Date.now()}`,
            password: "WrongPass123!"
            });

        expect(existingUserWrongPassword.statusCode).toBe(401);
        expect(nonExistingUser.statusCode).toBe(401);

        expect(existingUserWrongPassword.body.error).toBe("Invalid credentials");
        expect(nonExistingUser.body.error).toBe("Invalid credentials");

        expect(existingUserWrongPassword.body).toEqual(nonExistingUser.body);
    });

    test("Rate limit or lockout triggers", async () => { 
        let lastResponse; 

        for (let i = 0; i < 10; i++) {
            lastResponse = await request(app)
                .post("/auth/login")
                .send({
                    username: "fakeuser2",
                    password: "WrongPass123!"
                });
        }

        expect([403, 429]).toContain(lastResponse.statusCode);
    });

    // Testing account lockout after repeated failed attempts
    test("Account locks after repeated failed attempts", async () => {
        const username = `lockuser_${Date.now()}`;
        const password = "StrongPass123!";

        await request(app)
            .post("/auth/register")
            .send({ username, password });

        let response;

        for (let i = 0; i < 5; i++) {
            response = await request(app)
                .post("/auth/login")
                .send({
                    username,
                    password: "WrongPass123!"
                });
        }

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toMatch(/locked|unavailable|try again/i);
    });

    // Testing rate limiting on login endpoint
    test("Rate limits repeated login attempts", async () => {
        const username = `ratelimituser_${Date.now()}`;
        const password = "StrongPass123!";

        await request(app)
            .post("/auth/register")
            .send({ username, password });

        let response;

        for (let i = 0; i < 10; i++) {
            response = await request(app)
                .post("/auth/login")
                .send({
                    username,
                    password: "WrongPass123!"
                });
        }

        expect(response.statusCode).toBe(429);
        expect(response.body.error).toMatch(/too many/i);
    });

    test("Passwords are stored hashed (not plaintext)", async () => {
        const username = `testuser_${Date.now()}`;
        const password = "StrongPass123!";

        const registerRes = await request(app)
            .post("/auth/register")
            .send({
                username,
                password
            });

        expect(registerRes.statusCode).toBe(200);

        const result = await pool.query(
            "SELECT password FROM users WHERE username = $1",
            [username]
        );

        expect(result.rows.length).toBe(1);

        const storedPassword = result.rows[0].password;

        expect(storedPassword).not.toBe(password);

        const isMatch = await bcrypt.compare(password, storedPassword);
        expect(isMatch).toBe(true);
    });

    test("Cannot equip item that user has not collected", async () => {
        const token = await getAuthToken();

        const res = await request(app)
            .put("/equip")
            .set("Authorization", `Bearer ${token}`)
            .send({
            hat: "hat_crown",
            body: "body_coat",
            outside: "outside_shield"
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe("Cannot equip items you have not collected");
    });

    test("Regular users should not access all markers", async () => {
        const token = await getAuthToken();

        const res = await request(app)
            .get("/admin/markers")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(403);
    });
});

afterAll(async () => {
  await pool.end();
});
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

    test("Should fail with incorrect credentials", async () => {
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

        expect([401, 403]).toContain(res.statusCode);
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

    test("Account locks after repeated failed attempts", async () => {
        const username = `lockuser_${Date.now()}`;
        const password = "StrongPass123!";

        await request(app)
            .post("/auth/register")
            .send({ username, password });

        let response;

        // Repeated wrong password attempts against the same account
        for (let i = 0; i < 5; i++) {
            response = await request(app)
                .post("/auth/login")
                .send({
                    username,
                    password: "WrongPass123!"
                });

            expect([401, 429, 403]).toContain(response.statusCode);
        }

        // After repeated failures, it should either be locked or rate-limited
        expect([403, 429]).toContain(response.statusCode);
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
});

afterAll(async () => {
  await pool.end();
});
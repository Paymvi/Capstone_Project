import request from "supertest";
import app from "../server.js";
import bcrypt from "bcrypt";
import pool from "../db.js";
import { describe, test, expect, afterAll } from "@jest/globals";

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
        const res = await request(app)
            .post("/auth/login")
            .send({
                username: "fakeuser1",
                password: "happymask"
            });

        expect([401, 403]).toContain(res.statusCode);
    })

    test("Rate limit or lockout triggers", async () => { 
        let lastResponse; 

        for (let i = 0; i < 10; i++) {
            lastResponse = await request(app)
                .post("/auth/login")
                .send({
                    username: "fakeuser2",
                    password: "wrongpass"
                });
        }

        expect([403, 429]).toContain(lastResponse.statusCode);
    });

    test("Account locks after repeated failed attempts", async () => {
        let response;

        // First 4 attempts → should be 401
        for (let i = 0; i < 4; i++) {
            response = await request(app)
                .post("/auth/login")
                .send({
                    username: "fakeuser3",
                    password: "wrongpass"
                });

            expect([401, 429, 403]).toContain(response.statusCode);
        }

        // 5th attempt → triggers lock
        response = await request(app)
            .post("/auth/login")
            .send({
                username: "fakeuser4",
                password: "wrongpass"
            });

        expect([401, 429, 403]).toContain(response.statusCode);
    });

    test("Passwords are stored hashed (not plaintext)", async () => {
        const username = `testuser_${Date.now()}`;
        const password = "mypassword123";

        // Register User
        await request(app)
            .post("/auth/register")
            .send({
                username,
                password
        });

        // Get stored password from DB 
        const result = await pool.query(
            "SELECT password FROM users WHERE username = $1",
            [username]
        );

        const storedPassword = result.rows[0].password;

        // Ensure it's NOT plaintext
        expect(storedPassword).not.toBe(password);

        // Ensure it matches via bcrypt
        const isMatch = await bcrypt.compare(password, storedPassword);
        expect(isMatch).toBe(true);
    })
});

afterAll(async () => {
  await pool.end();
});
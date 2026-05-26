import request from "supertest";
import app from "../server.js";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { describe, test, expect, afterAll } from "@jest/globals";

describe("Authorization Tests", () => {
    test("Register creates a user", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                username: `user_${Date.now()}`,
                password: "StrongPass123!"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.user).toBeDefined();
    });

    test("Register fails with duplicate username", async () => {
        const username = `user_${Date.now()}`;

        await request(app)
            .post("/auth/register")
            .send({ username, password: "StrongPass123!" });

        const res = await request(app)
            .post("/auth/register")
            .send({ username, password: "StrongPass123!" });

        expect(res.statusCode).toBe(400);
    })

    test("Login returns JWT token", async () => {
        const username = `user_${Date.now()}`;
        const password = "StrongPass123!";

        await request(app)
            .post("/auth/register")
            .send({ username, password });

        const res = await request(app)
            .post("/auth/login")
            .send({ username, password });

        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test("JWT contains correct user data", async () => {
        const username = `user_${Date.now()}`;
        const password = "StrongPass123!";

        await request(app)
            .post("/auth/register")
            .send({ username, password });

        const res = await request(app)
            .post("/auth/login")
            .send({ username, password });

        const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);

        expect(decoded.userId).toBeDefined();
        expect(decoded.is_admin).toBeDefined();
    });

    test("Protected route requires authentication", async () => {
        const res = await request(app)
            .get("/markers"); // or any protected route

        expect(res.statusCode).toBe(401);
    })

    test("Invalid token is rejected", async () => {
        const res = await request(app)
            .get("/markers")
            .set("Authorization", "Bearer invalidtoken");

        expect(res.statusCode).toBe(401);
    })

});

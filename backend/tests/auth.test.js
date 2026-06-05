import request from "supertest";
import app from "../server.js";
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

    test("Should block unauthenticated user creation through /users", async () => {
        const res = await request(app)
            .post("/users")
            .send({
            username: `ghost_${Date.now()}`,
            email: `ghost_${Date.now()}@example.com`,
            name: "Ghost User",
            });

        expect(res.statusCode).toBe(401);
    });

    test("Should block non-admin user creation through /users", async () => {
        const agent = request.agent(app);

        const username = `normal_${Date.now()}`;
        const password = "StrongPass123!";

        await agent
            .post("/auth/register")
            .send({ username, password });

        await agent
            .post("/auth/login")
            .send({ username, password });

        const res = await agent
            .post("/users")
            .send({
            username: `ghost_${Date.now()}`,
            email: `ghost_${Date.now()}@example.com`,
            name: "Ghost User",
            });

        expect(res.statusCode).toBe(403);
    });

});

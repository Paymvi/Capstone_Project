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
            password: "password123"
        });

    expect(res.statusCode).toBe(200);
    });
});

afterAll(async () => {
  await pool.end();
});
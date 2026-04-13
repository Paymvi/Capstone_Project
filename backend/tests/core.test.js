import request from "supertest";
import app from "../server.js";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { describe, test, expect, afterAll, beforeEach } from "@jest/globals";

async function getAuthToken() {
    const username = `testuser_${Date.now()}`;
    const password = "password123";

    await request(app)
        .post("/auth/register")
        .send({ username, password });

    const res = await request(app)
        .post("/auth/login")
        .send({ username, password });

    if (!res.body.token) {
        console.log("LOGIN FAILED:", res.body);
        throw new Error("No token returned");
    }

    return res.body.token;
}

beforeEach(async () => {
    // optional: clear relevant tables if needed
});

describe("Core Gameplay Tests", () => {
    test("Collect item adds to inventory", async () => {
        const token = await getAuthToken();

        const res = await request(app)
            .post("/items/collect")
            .set("Authorization", `Bearer ${token}`)
            .send({
                itemId: 1 // make sure this exists in the DB
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test("Equip item updates equipment", async () => {
        const token = await getAuthToken();

        const res = await request(app)
            .put("/equip")
            .set("Authorization", `Bearer ${token}`)
            .send({
                hat: 1,
                body: null,
                outside: null
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test("Markers endpoint returns data", async () => {
        const token = await getAuthToken();

        const res = await request(app)
            .get("/markers")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test("Collected same item twice does not duplicate", async () => {
        const token = await getAuthToken();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        await request(app)
            .post("/items/collect")
            .set("Authorization", `Bearer ${token}`)
            .send({ itemId: 1 });

        await request(app)
            .post("/items/collect")
            .set("Authorization", `Bearer ${token}`)
            .send({ itemId: 1 });

        const result = await pool.query(
            "SELECT * FROM user_inventory WHERE user_id = $1 AND item_id = $2",
            [decoded.userId, 1]
        );

        expect(result.rows.length).toBe(1);
    });

    test("Collected items no longer appear in markers", async () => {
        const token = await getAuthToken();

        // Collect item
        await request(app)
            .post("/items/collect")
            .set("Authorization", `Bearer ${token}`)
            .send({ itemId: 1 });

        // Fetch markers
        const res = await request(app)
            .get("/markers")
            .set("Authorization", `Bearer ${token}`);

        expect(Array.isArray(res.body)).toBe(true);
        
        const markerIds = res.body.map(m => m.item_id);

        expect(markerIds).not.toContain(1);
    });
});

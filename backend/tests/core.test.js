import request from "supertest";
import app from "../server.js";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { describe, test, expect, afterAll, beforeEach } from "@jest/globals";

async function getAuthToken() {
    const username = `testuser_${Date.now()}`;
    const password = "StrongPass123!";

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

        const markerRes = await request(app)
            .get("/markers")
            .set("Authorization", `Bearer ${token}`);

        expect(markerRes.statusCode).toBe(200);
        expect(markerRes.body.length).toBeGreaterThan(0);

        const marker = markerRes.body[0];

        const res = await request(app)
            .post("/items/collect")
            .set("Authorization", `Bearer ${token}`)
            .send({
                markerId: marker.id,
                itemId: marker.item_id,
                lat: marker.latitude,
                lng: marker.longitude
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

        const markerRes = await request(app)
            .get("/markers")
            .set("Authorization", `Bearer ${token}`);

        expect(markerRes.statusCode).toBe(200);
        expect(markerRes.body.length).toBeGreaterThan(0);

        const marker = markerRes.body[0];

        const collectBody = {
            markerId: marker.id,
            itemId: marker.item_id,
            lat: marker.latitude,
            lng: marker.longitude
        };

        await request(app)
            .post("/items/collect")
            .set("Authorization", `Bearer ${token}`)
            .send(collectBody);

        await request(app)
            .post("/items/collect")
            .set("Authorization", `Bearer ${token}`)
            .send(collectBody);

        const result = await pool.query(
            "SELECT * FROM user_inventory WHERE user_id = $1 AND item_id = $2",
            [decoded.userId, marker.item_id]
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

    test("Can equip item that user has collected", async () => {
        const token = await getAuthToken();

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const testUserId = decoded.userId;

        // However your test inserts inventory:
        await pool.query(
            `INSERT INTO user_inventory (user_id, item_id) VALUES ($1, $2)`,
            [testUserId, "hat_crown"]
        );

        const res = await request(app)
            .put("/equip")
            .set("Authorization", `Bearer ${token}`)
            .send({
            hat: "hat_crown"
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.equipped.hat_item_id).toBe("hat_crown");
    });
    
    test("Regular users should not receive all marker coordinates from /me/state", async () => {
        const token = await getAuthToken();

        const res = await request(app)
            .get("/me/state")
            .set("Authorization", `Bearer ${token}`);

        console.log("ME STATE STATUS:", res.status);
        console.log("ME STATE BODY:", res.body);

        expect(res.status).toBe(200);
        expect(res.body.markers).toBeUndefined();
    });

    test("Regular users should only receive nearby markers", async () => {
        const token = await getAuthToken();

        const res = await request(app)
            .get("/markers/nearby?lat=43.038&lng=-71.451")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.markers)).toBe(true);

        for (const marker of res.body.markers) {
            expect(marker.distance_meters).toBeLessThanOrEqual(200);
        }
    });
});

afterAll(async () => {
    await pool.end();
});
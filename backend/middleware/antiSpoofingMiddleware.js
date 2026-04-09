import pool from "../db.js";

// Get the distance in meters
function getDistanceMeters(lat1, lng1, lat2, lng2){
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = 
    Math.sin(dLat / 2) ** 2 + 
    Math.cos(toRad(lat1)) * 
      Math.cos(toRad(lat2)) * 
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function antiSpoofMiddleware(req, res, next) {
  try {
    const userId = req.user.id;

    const { lat, lng } = req.body;

    // Missing location
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing location data" });
    }

    const result = await pool.query(
      "SELECT last_lat, last_lng, last_location_update FROM users WHERE id = $1",
      [userId]
    );

    const user = result.rows[0];

    // First-time location (no checks)
    if (!user.last_lat || !user.last_lng || !user.last_location_update) {
      await pool.query(
        "UPDATE users SET last_lat=$1, last_lng=$2, last_location_update=NOW() WHERE id=$3",
        [lat, lng, userId]
      );

      return next();
    }

    const distance = getDistanceMeters(
      user.last_lat,
      user.last_lng,
      lat,
      lng
    );

    const timeDiff =
      (Date.now() - new Date(user.last_location_update).getTime()) / 1000;

    const speed = distance / timeDiff; // meters per second

    console.log("ANTI-SPOOF CHECK:", {
      distance,
      timeDiff,
      speed
    });

    // Rule 1: Speed check (human max ~15 m/s running)
    if (speed > 50) {
      return res.status(403).json({
        error: "Unrealistic movement detected (speed too high)"
      });
    }

    // 🌍 Rule 2: Teleport check (huge jump)
    if (distance > 10000) { // 10km jump
      return res.status(403).json({
        error: "Teleporting detected"
      });
    }

    // Update location if valid
    await pool.query(
      "UPDATE users SET last_lat=$1, last_lng=$2, last_location_update=NOW() WHERE id=$3",
      [lat, lng, userId]
    );

    next();

  } catch (err) {
    console.error("Anti-spoof error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export default antiSpoofMiddleware;
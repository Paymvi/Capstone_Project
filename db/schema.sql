DROP TABLE IF EXISTS user_equipment CASCADE;
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS markers CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(255),
	email VARCHAR(255),
	google_sub VARCHAR(255),
	name VARCHAR(255),
	password VARCHAR(255),
	is_admin BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
	id SERIAL PRIMARY KEY,
	item_id VARCHAR(255) UNIQUE NOT NULL,
	name VARCHAR(255),
	type VARCHAR(50),
	image VARCHAR(255),
	description TEXT
);

CREATE TABLE user_inventory (
	id SERIAL PRIMARY KEY,
	user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
	item_id VARCHAR(255) NOT NULL,
	collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(user_id, item_id)
);

CREATE TABLE markers (
	id SERIAL PRIMARY KEY,
	latitude FLOAT NOT NULL,
	longitude FLOAT NOT NULL,
	item_id VARCHAR(255) REFERENCES items(item_id),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_equipment (
	user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	hat_item_id VARCHAR(255),
	body_item_id VARCHAR(255),
	outside_item_id VARCHAR(255)
);

-- Index for faster inventory lookups
CREATE INDEX idx_inventory_user
ON user_inventory(user_id);
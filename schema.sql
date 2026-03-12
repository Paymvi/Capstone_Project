CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255),
  email VARCHAR(255),
  google_sub VARCHAR(255),
  name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
	id SERIAL PRIMARY KEY,
	item_id VARCHAR(255) UNIQUE NOT NULL,
	name VARCHAR(255),
	type VARCHAR(50),
	image VARCHAR(255)
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
	user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
	latitude FLOAT NOT NULL,
	longitude FLOAT NOT NULL
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

-- Seed default collectible items

INSERT INTO items (item_id, name, type, image) VALUES
('hat_crown', 'Crown', 'hat', '/Roamie-Crown-2.png'),
('hat_santahat', 'Santa Hat', 'hat', '/Roamie-SantaHat.png'),
('hat_flower', 'Flower', 'hat', '/Roamie-Flower.png'),
('body_coat', 'Coat', 'body', '/Roamie-Coat-2.png'),
('outside_shield', 'Shield', 'outside', '/Roamie-Shield-2.png'),
('outside_dumbbell', 'Dumbbell', 'outside', '/Roamie-Dumbbell-2.png')
ON CONFLICT (item_id) DO NOTHING;
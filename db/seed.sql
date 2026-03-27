-- Seed default collectible items
INSERT INTO items (item_id, name, type, image, description) VALUES
('hat_crown', 'Crown', 'hat', '/Roamie-Crown-2.png', 'Collect your crown at the library!'),
('hat_santahat', 'Santa Hat', 'hat', '/Roamie-SantaHat.png', 'Santa hat drop!!!'),
('hat_flower', 'Flower', 'hat', '/Roamie-Flower.png', 'Flower Power Drop!!!'),
('body_coat', 'Coat', 'body', '/Roamie-Coat-2.png', 'Stay warm and collect this fluffy coat!!!'),
('outside_shield', 'Shield', 'outside', '/Roamie-Shield-2.png', 'Collect this Shiny Shield!!!'),
('outside_dumbbell', 'Dumbbell', 'outside', '/Roamie-Dumbbell-2.png', 'Collect this limited edition dumbbell!')
('outside_pizza', 'Pizza', 'outside', '/Roamie-Pizza.png', 'Collect this delicious slice!')
ON CONFLICT (item_id) DO NOTHING;


-- Seed admin user
UPDATE users
SET is_admin = TRUE
WHERE email = 'quark.labs25@gmail.com';
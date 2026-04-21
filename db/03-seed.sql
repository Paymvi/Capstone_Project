-- Seed default collectible items
INSERT INTO items (item_id, name, type, image, description) VALUES
('hat_crown', 'Crown', 'hat', '/Roamie-Crown-2.png', 'Collect your crown at the library!'),
('hat_santahat', 'Santa Hat', 'hat', '/Roamie-SantaHat.png', 'Santa hat drop!!!'),
('hat_flower', 'Flower', 'hat', '/Roamie-Flower.png', 'Flower Power Drop!!!'),
('body_coat', 'Coat', 'body', '/coatwinter.png', 'Stay warm and collect this fluffy coat!!!'),
('outside_shield', 'Shield', 'outside', '/shield.png', 'Collect this Shiny Shield!!!'),
('outside_dumbbell', 'Dumbbell', 'outside', '/dumbell.png', 'Collect this limited edition dumbbell!'),
('outside_pizza', 'Dumbbell', 'outside', '/pizza.png', 'This mouth watering pizza waiting for you to pick it up!')
ON CONFLICT (item_id) DO NOTHING;


-- Seed admin user
UPDATE users
SET is_admin = TRUE
WHERE email = 'quark.labs25@gmail.com';
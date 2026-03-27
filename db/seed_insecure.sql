-- ⚠️ Insecure demo data (plaintext passwords)

INSERT INTO users (username, password, email, name, is_admin) VALUES
('alice', 'password123', 'alice@example.com', 'Alice', false),
('bob', 'qwerty', 'bob@example.com', 'Bob', false),
('charlie', 'letmein', 'charlie@example.com', 'Charlie', false),
('admin', 'admin123', 'admin@roamie.com', 'Admin', true);
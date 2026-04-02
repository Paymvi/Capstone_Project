ALTER TABLE users ENABLE ROW LEVEL SECUIRTY;

CREATE POLICY user_isolation_policy 
ON users
FOR SELECT 
USING (id = current_setting('app.user_id')::int);
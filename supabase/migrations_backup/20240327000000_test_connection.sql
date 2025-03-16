-- Test connection migration
CREATE OR REPLACE FUNCTION test_connection()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Connection successful!';
END;
$$ LANGUAGE plpgsql; 
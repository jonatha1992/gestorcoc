"""
Direct psycopg2 backfill — single transaction to minimize Railway proxy connection time.
"""
import psycopg2

DATABASE_URL = "postgresql://postgres:WtrsPcmhpYVeieplYSJrPnKGiKAnuawI@switchyard.proxy.rlwy.net:17507/railway"

# Use a single connection with a single transaction containing all work
SQL = """
DO $$
DECLARE
    v_units INT[];
    v_unit_count INT;
    v_idx INT := 0;
    rec RECORD;
    updated INT := 0;
BEGIN
    -- Collect map-enabled unit IDs
    SELECT ARRAY(SELECT id FROM assets_unit WHERE map_enabled = true ORDER BY code)
    INTO v_units;
    v_unit_count := array_length(v_units, 1);

    IF v_unit_count IS NULL OR v_unit_count = 0 THEN
        RAISE NOTICE 'No map-enabled units found.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found % map units', v_unit_count;

    -- Iterate null-generator_unit records and assign round-robin
    FOR rec IN
        SELECT id FROM records_filmrecord WHERE generator_unit_id IS NULL ORDER BY id
    LOOP
        UPDATE records_filmrecord
        SET generator_unit_id = v_units[(v_idx % v_unit_count) + 1]
        WHERE id = rec.id;
        v_idx := v_idx + 1;
        updated := updated + 1;
    END LOOP;

    RAISE NOTICE 'Updated % records', updated;
END;
$$;

-- Show result
SELECT u.code, COUNT(r.id) AS records
FROM assets_unit u
LEFT JOIN records_filmrecord r ON r.generator_unit_id = u.id
WHERE u.map_enabled = true
GROUP BY u.code
ORDER BY u.code;
"""

print("Connecting to Railway PostgreSQL...")
conn = psycopg2.connect(DATABASE_URL, connect_timeout=20)
conn.autocommit = False
cur = conn.cursor()
print("Connected. Running backfill...")
cur.execute(SQL)
conn.commit()
rows = cur.fetchall()
print("\nResult after backfill:")
for code, cnt in rows:
    print(f"  {code}: {cnt} records")
cur.close()
conn.close()
print("\nDone.")

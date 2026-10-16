import sqlite3
import hashlib
from backend.app.database.connection import get_db

def hash_password(password: str) -> str:
    salt = "airline_revenue_salt_2026_"
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

def run_migration():
    with get_db() as conn:
        cursor = conn.cursor()

        # Recreate users table to support all 6 roles without check constraint violation
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('administrator', 'revenue_manager', 'analyst', 'operations_manager', 'viewer', 'guest')),
            full_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deactivated')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );
        """)

        # Copy existing users into users_new
        cursor.execute("PRAGMA table_info(users);")
        old_cols = [c["name"] for c in cursor.fetchall()]
        has_status = "status" in old_cols
        has_last_login = "last_login" in old_cols

        cursor.execute("SELECT id, username, email, hashed_password, role, full_name" + (", status" if has_status else "") + (", last_login" if has_last_login else "") + " FROM users;")
        existing_users = cursor.fetchall()
        for u in existing_users:
            cursor.execute("""
                INSERT OR IGNORE INTO users_new (id, username, email, hashed_password, role, full_name, status, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                u["id"], u["username"], u["email"], u["hashed_password"], u["role"], u["full_name"],
                u["status"] if has_status else "active",
                u["last_login"] if has_last_login else None
            ))

        cursor.execute("DROP TABLE users;")
        cursor.execute("ALTER TABLE users_new RENAME TO users;")

        # Create audit_logs table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            details TEXT,
            ip_address TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Ensure performance indexes
        print("Ensuring composite performance indexes...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_travel_status ON tickets (travel_date, ticket_status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_travel_date ON tickets (travel_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (ticket_status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_flight ON tickets (flight_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_date ON flights (departure_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_route ON flights (route_code);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_airline ON flights (airline);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (booking_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_channel ON bookings (sales_channel);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);")

        # Seed all 5 test accounts for all roles
        all_test_users = [
            ("admin", "admin@aeroanalytics.com", hash_password("admin123"), "administrator", "System Administrator", "active"),
            ("revmanager", "revmanager@aeroanalytics.com", hash_password("revmanager123"), "revenue_manager", "Senior Revenue Manager", "active"),
            ("analyst", "analyst@aeroanalytics.com", hash_password("analyst123"), "analyst", "Commercial Analyst", "active"),
            ("opsmanager", "opsmanager@aeroanalytics.com", hash_password("opsmanager123"), "operations_manager", "Flight Operations Lead", "active"),
            ("viewer", "viewer@aeroanalytics.com", hash_password("viewer123"), "viewer", "Executive Guest Viewer", "active")
        ]

        for u in all_test_users:
            cursor.execute("SELECT id FROM users WHERE username = ?;", (u[0],))
            exists = cursor.fetchone()
            if exists:
                cursor.execute("""
                    UPDATE users SET email = ?, role = ?, full_name = ?, status = ? WHERE username = ?;
                """, (u[1], u[3], u[4], u[5], u[0]))
            else:
                cursor.execute("""
                    INSERT INTO users (username, email, hashed_password, role, full_name, status)
                    VALUES (?, ?, ?, ?, ?, ?);
                """, u)

        print("Migration and role seeding completed successfully.")

if __name__ == "__main__":
    run_migration()

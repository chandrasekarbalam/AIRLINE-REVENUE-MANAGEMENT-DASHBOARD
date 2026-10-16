import sqlite3
import hashlib
import random
import datetime
from pathlib import Path
import csv
from backend.app.database.connection import get_db, DB_PATH, PROJECT_ROOT

def hash_password(password: str) -> str:
    """Generate salted SHA-256 hash for authentication."""
    salt = "airline_revenue_salt_2026_"
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

def create_tables():
    with get_db() as conn:
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('administrator', 'analyst')),
            full_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Airports table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS airports (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            city TEXT NOT NULL,
            country TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL
        );
        """)

        # Routes table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_code TEXT UNIQUE NOT NULL,
            origin_code TEXT NOT NULL,
            destination_code TEXT NOT NULL,
            distance_km REAL NOT NULL,
            flight_duration_min INTEGER NOT NULL,
            FOREIGN KEY (origin_code) REFERENCES airports (code),
            FOREIGN KEY (destination_code) REFERENCES airports (code)
        );
        """)

        # Flights table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS flights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flight_number TEXT NOT NULL,
            airline TEXT NOT NULL,
            route_id INTEGER NOT NULL,
            route_code TEXT NOT NULL,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            departure_date DATE NOT NULL,
            departure_time TEXT NOT NULL,
            arrival_time TEXT NOT NULL,
            aircraft_type TEXT NOT NULL,
            seat_capacity INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'Completed',
            FOREIGN KEY (route_id) REFERENCES routes (id)
        );
        """)

        # Fare classes
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS fare_classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            cabin_type TEXT NOT NULL,
            multiplier REAL NOT NULL
        );
        """)

        # Bookings table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_reference TEXT UNIQUE NOT NULL,
            booking_date DATE NOT NULL,
            travel_date DATE NOT NULL,
            customer_id TEXT NOT NULL,
            sales_channel TEXT NOT NULL,
            total_amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            status TEXT NOT NULL CHECK(status IN ('Confirmed', 'Cancelled', 'Refunded')),
            booking_lead_days INTEGER NOT NULL
        );
        """)

        # Tickets table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_number TEXT UNIQUE NOT NULL,
            booking_id INTEGER NOT NULL,
            flight_id INTEGER NOT NULL,
            passenger_name TEXT NOT NULL,
            passenger_id TEXT NOT NULL,
            booking_class TEXT NOT NULL,
            fare_amount REAL NOT NULL,
            tax_amount REAL NOT NULL DEFAULT 0.0,
            discount_amount REAL NOT NULL DEFAULT 0.0,
            total_price REAL NOT NULL,
            ticket_status TEXT NOT NULL CHECK(ticket_status IN ('Confirmed', 'Cancelled', 'Refunded')),
            booked_at DATE NOT NULL,
            travel_date DATE NOT NULL,
            seat_number TEXT,
            FOREIGN KEY (booking_id) REFERENCES bookings (id),
            FOREIGN KEY (flight_id) REFERENCES flights (id)
        );
        """)

        # Seat inventory table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS seat_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flight_id INTEGER UNIQUE NOT NULL,
            total_seats INTEGER NOT NULL,
            booked_seats INTEGER NOT NULL,
            available_seats INTEGER NOT NULL,
            blocked_seats INTEGER NOT NULL DEFAULT 0,
            load_factor REAL NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (flight_id) REFERENCES flights (id)
        );
        """)

        # Revenue summary records table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS revenue_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_date DATE NOT NULL,
            route_code TEXT NOT NULL,
            flight_number TEXT NOT NULL,
            gross_revenue REAL NOT NULL,
            net_revenue REAL NOT NULL,
            refunds_amount REAL NOT NULL,
            tickets_sold INTEGER NOT NULL,
            passenger_count INTEGER NOT NULL,
            rask REAL NOT NULL,
            yield_val REAL NOT NULL
        );
        """)

        # Forecast results table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS forecast_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            forecast_date DATE NOT NULL,
            target_date DATE NOT NULL,
            metric TEXT NOT NULL,
            horizon_days INTEGER NOT NULL,
            actual_value REAL,
            forecast_value REAL NOT NULL,
            lower_bound REAL,
            upper_bound REAL,
            model_type TEXT NOT NULL,
            mae REAL,
            rmse REAL
        );
        """)

        # Audit logs table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # App Settings table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT
        );
        """)

        # Performance Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_flight ON tickets (flight_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_travel_date ON tickets (travel_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_booked_at ON tickets (booked_at);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (ticket_status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tickets_class ON tickets (booking_class);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_date ON flights (departure_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_route ON flights (route_code);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_flights_origin_dest ON flights (origin, destination);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (booking_date);")

def seed_users():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM users;")
        if cursor.fetchone()["cnt"] == 0:
            users = [
                ("admin", "admin@aeroanalytics.com", hash_password("admin123"), "administrator", "Executive Administrator"),
                ("analyst", "analyst@aeroanalytics.com", hash_password("analyst123"), "analyst", "Revenue Analyst")
            ]
            cursor.executemany("""
                INSERT INTO users (username, email, hashed_password, role, full_name)
                VALUES (?, ?, ?, ?, ?);
            """, users)

def seed_settings():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM app_settings;")
        if cursor.fetchone()["cnt"] == 0:
            settings = [
                ("currency", "USD", "Display currency (USD or INR)"),
                ("exchange_rate_usd_inr", "85.0", "Exchange rate: 1 USD to INR"),
                ("date_format", "YYYY-MM-DD", "Date presentation format"),
                ("time_zone", "UTC", "Default display timezone"),
                ("default_report_period", "90", "Default period in days for initial load"),
                ("low_load_factor_threshold", "0.70", "Alert threshold for low load factor (< 70%)"),
                ("high_demand_threshold", "0.85", "Threshold for high demand classification (> 85%)"),
                ("capacity_alert_threshold", "0.92", "Alert threshold for flights approaching capacity (> 92%)"),
                ("forecast_horizon", "30", "Default forecasting horizon in days")
            ]
            cursor.executemany("""
                INSERT INTO app_settings (key, value, description)
                VALUES (?, ?, ?);
            """, settings)

def seed_airports_and_routes():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM airports;")
        if cursor.fetchone()["cnt"] > 0:
            return

        airports_data = [
            ("DEL", "Indira Gandhi International Airport", "New Delhi", "India", 28.5562, 77.1000),
            ("BOM", "Chhatrapati Shivaji Maharaj International Airport", "Mumbai", "India", 19.0896, 72.8656),
            ("BLR", "Kempegowda International Airport", "Bengaluru", "India", 13.1986, 77.7066),
            ("HYD", "Rajiv Gandhi International Airport", "Hyderabad", "India", 17.2403, 78.4294),
            ("MAA", "Chennai International Airport", "Chennai", "India", 12.9941, 80.1709),
            ("CCU", "Netaji Subhash Chandra Bose International Airport", "Kolkata", "India", 22.6547, 88.4467),
            ("DXB", "Dubai International Airport", "Dubai", "UAE", 25.2532, 55.3657),
            ("LHR", "Heathrow Airport", "London", "United Kingdom", 51.4700, -0.4543),
            ("JFK", "John F. Kennedy International Airport", "New York", "USA", 40.6413, -73.7781),
            ("SIN", "Singapore Changi Airport", "Singapore", "Singapore", 1.3644, 103.9915)
        ]
        cursor.executemany("""
            INSERT INTO airports (code, name, city, country, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?);
        """, airports_data)

        # Routes with realistic distances and flight times
        routes_data = [
            ("DEL-BOM", "DEL", "BOM", 1148.0, 130),
            ("BOM-DEL", "BOM", "DEL", 1148.0, 130),
            ("BOM-BLR", "BOM", "BLR", 842.0, 100),
            ("BLR-BOM", "BLR", "BOM", 842.0, 100),
            ("DEL-BLR", "DEL", "BLR", 1740.0, 165),
            ("BLR-DEL", "BLR", "DEL", 1740.0, 165),
            ("DEL-DXB", "DEL", "DXB", 2185.0, 230),
            ("DXB-DEL", "DXB", "DEL", 2185.0, 230),
            ("BOM-DXB", "BOM", "DXB", 1928.0, 205),
            ("DXB-BOM", "DXB", "BOM", 1928.0, 205),
            ("DEL-LHR", "DEL", "LHR", 6710.0, 560),
            ("LHR-DEL", "LHR", "DEL", 6710.0, 540),
            ("BOM-LHR", "BOM", "LHR", 7200.0, 590),
            ("LHR-BOM", "LHR", "BOM", 7200.0, 570),
            ("DEL-SIN", "DEL", "SIN", 4150.0, 340),
            ("SIN-DEL", "SIN", "DEL", 4150.0, 350),
            ("DEL-JFK", "DEL", "JFK", 11760.0, 930),
            ("JFK-DEL", "JFK", "DEL", 11760.0, 890),
            ("BLR-HYD", "BLR", "HYD", 500.0, 70),
            ("HYD-BLR", "HYD", "BLR", 500.0, 70)
        ]
        cursor.executemany("""
            INSERT INTO routes (route_code, origin_code, destination_code, distance_km, flight_duration_min)
            VALUES (?, ?, ?, ?, ?);
        """, routes_data)

        # Fare Classes
        fare_classes = [
            ("Economy", "Economy Class", "Economy", 1.0),
            ("Premium Economy", "Premium Economy", "Premium", 1.6),
            ("Business", "Business Class", "Business", 3.2),
            ("First Class", "First Class Suites", "First", 5.5)
        ]
        cursor.executemany("""
            INSERT INTO fare_classes (code, name, cabin_type, multiplier)
            VALUES (?, ?, ?, ?);
        """, fare_classes)

def seed_sample_dataset(days_history: int = 120):
    """
    Generate realistic airline operations data for the past N days.
    Generates flights, bookings, tickets, and seat inventories.
    Also saves a clean copy to data/sample_airline_data.csv.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM flights;")
        if cursor.fetchone()["cnt"] > 0:
            print("Database already contains flight data.")
            return

        print("Generating realistic synthetic airline dataset...")
        random.seed(42)

        # Retrieve routes
        cursor.execute("SELECT id, route_code, origin_code, destination_code, distance_km FROM routes;")
        routes = cursor.fetchall()

        airlines = [
            ("SkyWings Airways", "SW"),
            ("AeroIndia Global", "AI"),
            ("Pacific Express", "PE"),
            ("Vistara Skyline", "VS")
        ]

        aircraft_specs = [
            {"type": "Airbus A320neo", "seats": 186, "long_haul": False},
            {"type": "Boeing 737 MAX 8", "seats": 180, "long_haul": False},
            {"type": "Boeing 787-9 Dreamliner", "seats": 296, "long_haul": True},
            {"type": "Airbus A350-900", "seats": 316, "long_haul": True},
            {"type": "Boeing 777-300ER", "seats": 350, "long_haul": True}
        ]

        # Base fares per route in USD
        base_fares_usd = {
            "DEL-BOM": 85.0,
            "BOM-DEL": 85.0,
            "BOM-BLR": 65.0,
            "BLR-BOM": 65.0,
            "DEL-BLR": 110.0,
            "BLR-DEL": 110.0,
            "BLR-HYD": 45.0,
            "HYD-BLR": 45.0,
            "DEL-DXB": 240.0,
            "DXB-DEL": 240.0,
            "BOM-DXB": 220.0,
            "DXB-BOM": 220.0,
            "DEL-SIN": 380.0,
            "SIN-DEL": 380.0,
            "DEL-LHR": 720.0,
            "LHR-DEL": 720.0,
            "BOM-LHR": 740.0,
            "LHR-BOM": 740.0,
            "DEL-JFK": 1150.0,
            "JFK-DEL": 1150.0
        }

        sales_channels = [
            ("Direct Web", 0.40),
            ("Mobile App", 0.32),
            ("OTA", 0.18),
            ("Travel Agency", 0.07),
            ("Corporate", 0.03)
        ]

        class_distribution = [
            ("Economy", 0.76, 1.0),
            ("Premium Economy", 0.14, 1.55),
            ("Business", 0.08, 3.1),
            ("First Class", 0.02, 5.2)
        ]

        first_names = ["Aarav", "Priya", "Rahul", "Ananya", "Rohan", "Sneha", "Vikram", "Neha", 
                       "James", "Emily", "Michael", "Sarah", "David", "Emma", "Daniel", "Olivia",
                       "Amit", "Pooja", "Arjun", "Kavita", "Siddharth", "Deepa", "Rajesh", "Meera"]
        last_names = ["Sharma", "Verma", "Patel", "Singh", "Reddy", "Iyer", "Gupta", "Nair", 
                      "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson",
                      "Chopra", "Kapoor", "Bose", "Menon", "Joshi", "Deshmukh", "Mukherjee", "Das"]

        end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=days_history)

        flight_id_counter = 1
        booking_id_counter = 1
        ticket_id_counter = 1

        all_flights_records = []
        all_inventory_records = []
        all_booking_records = []
        all_ticket_records = []

        csv_sample_rows = []

        current_date = start_date
        while current_date <= end_date:
            day_of_week = current_date.weekday() # 0 = Monday, 6 = Sunday
            # Weekend and Friday demand boost
            demand_multiplier = 1.15 if day_of_week in [4, 6] else (0.92 if day_of_week in [1, 2] else 1.0)

            # Pick a subset of routes operating on this day (e.g. 10 to 14 flights per day)
            for route in routes:
                route_id = route["id"]
                route_code = route["route_code"]
                origin = route["origin_code"]
                dest = route["destination_code"]
                dist = route["distance_km"]

                # Flight frequency: popular domestic routes have daily flights; long haul 3-4 times a week
                is_long_haul = dist > 4000
                if is_long_haul and day_of_week not in [0, 2, 4, 6]:
                    continue

                airline_name, airline_prefix = random.choice(airlines)
                flight_num = f"{airline_prefix}-{random.randint(101, 899)}"

                if is_long_haul:
                    aircraft = random.choice([a for a in aircraft_specs if a["long_haul"]])
                else:
                    aircraft = random.choice([a for a in aircraft_specs if not a["long_haul"]])

                seat_cap = aircraft["seats"]
                dep_hour = random.choice([6, 8, 10, 13, 16, 19, 21, 23])
                dep_time = f"{dep_hour:02d}:{random.choice(['00', '15', '30', '45'])}"
                duration = int(dist / 12) + 40 # approx minutes
                arr_dt = datetime.datetime.combine(current_date, datetime.time(dep_hour, 0)) + datetime.timedelta(minutes=duration)
                arr_time = arr_dt.strftime("%H:%M")

                # Flight status
                flight_status = "Completed" if current_date < end_date else "Scheduled"
                if random.random() < 0.02:
                    flight_status = "Cancelled"

                flight_rec = (
                    flight_id_counter,
                    flight_num,
                    airline_name,
                    route_id,
                    route_code,
                    origin,
                    dest,
                    current_date.strftime("%Y-%m-%d"),
                    dep_time,
                    arr_time,
                    aircraft["type"],
                    seat_cap,
                    flight_status
                )
                all_flights_records.append(flight_rec)

                # Generate passenger demand & tickets if flight is not cancelled
                if flight_status != "Cancelled":
                    # Load factor usually between 70% and 94%
                    base_lf = random.uniform(0.72, 0.94) * demand_multiplier
                    base_lf = min(0.98, max(0.55, base_lf))
                    booked_seats = int(seat_cap * base_lf)
                    avail_seats = seat_cap - booked_seats

                    # Inventory
                    inv_rec = (
                        flight_id_counter,
                        seat_cap,
                        booked_seats,
                        avail_seats,
                        0,
                        round(base_lf * 100, 2)
                    )
                    all_inventory_records.append(inv_rec)

                    # Now generate bookings & tickets for this flight
                    base_fare = base_fares_usd.get(route_code, 120.0)

                    # We bundle passengers into small bookings (1 to 4 passengers per booking)
                    seats_allocated = 0
                    while seats_allocated < booked_seats:
                        party_size = random.choices([1, 2, 3, 4], weights=[0.60, 0.28, 0.08, 0.04])[0]
                        if seats_allocated + party_size > booked_seats:
                            party_size = booked_seats - seats_allocated

                        # Booking lead time: from 1 to 60 days before travel
                        lead_days = int(random.expovariate(1/14)) + 1
                        lead_days = min(90, max(1, lead_days))
                        booking_date = current_date - datetime.timedelta(days=lead_days)

                        # Lead time price curve: last minute surge (up to +40%) or advance discount (-15%)
                        if lead_days < 3:
                            lead_price_factor = 1.35
                        elif lead_days < 7:
                            lead_price_factor = 1.15
                        elif lead_days > 30:
                            lead_price_factor = 0.88
                        else:
                            lead_price_factor = 1.0

                        # Channel
                        channel = random.choices([c[0] for c in sales_channels], weights=[c[1] for c in sales_channels])[0]

                        # Class
                        b_class, _, class_mult = random.choices(
                            class_distribution, 
                            weights=[c[1] for c in class_distribution]
                        )[0]

                        # Ticket status: mostly confirmed, some cancelled or refunded
                        stat_rand = random.random()
                        if stat_rand < 0.89:
                            t_status = "Confirmed"
                        elif stat_rand < 0.96:
                            t_status = "Cancelled"
                        else:
                            t_status = "Refunded"

                        ticket_fare = round(base_fare * class_mult * lead_price_factor * random.uniform(0.95, 1.08), 2)
                        tax = round(ticket_fare * 0.12, 2)
                        discount = round(ticket_fare * 0.05, 2) if channel in ["Mobile App", "Direct Web"] and random.random() < 0.3 else 0.0
                        total_ticket_price = round(ticket_fare + tax - discount, 2)

                        b_ref = f"BK{booking_id_counter:07d}"
                        cust_id = f"CUST{random.randint(10000, 99999)}"
                        b_total = round(total_ticket_price * party_size, 2)

                        all_booking_records.append((
                            booking_id_counter,
                            b_ref,
                            booking_date.strftime("%Y-%m-%d"),
                            current_date.strftime("%Y-%m-%d"),
                            cust_id,
                            channel,
                            b_total,
                            "USD",
                            t_status,
                            lead_days
                        ))

                        for p in range(party_size):
                            p_name = f"{random.choice(first_names)} {random.choice(last_names)}"
                            p_id = f"P{random.randint(100000, 999999)}"
                            t_num = f"TK-{flight_num[:2]}-{ticket_id_counter:08d}"
                            seat_letter = random.choice(["A", "B", "C", "D", "E", "F"])
                            seat_row = random.randint(1, 45)
                            seat_no = f"{seat_row}{seat_letter}"

                            all_ticket_records.append((
                                ticket_id_counter,
                                t_num,
                                booking_id_counter,
                                flight_id_counter,
                                p_name,
                                p_id,
                                b_class,
                                ticket_fare,
                                tax,
                                discount,
                                total_ticket_price,
                                t_status,
                                booking_date.strftime("%Y-%m-%d"),
                                current_date.strftime("%Y-%m-%d"),
                                seat_no
                            ))

                            # Keep a representative sample for the exportable CSV
                            if len(csv_sample_rows) < 5000:
                                csv_sample_rows.append({
                                    "Ticket ID": t_num,
                                    "Booking Reference": b_ref,
                                    "Flight Number": flight_num,
                                    "Airline": airline_name,
                                    "Origin": origin,
                                    "Destination": dest,
                                    "Route": route_code,
                                    "Booking Date": booking_date.strftime("%Y-%m-%d"),
                                    "Departure Date": current_date.strftime("%Y-%m-%d"),
                                    "Booking Class": b_class,
                                    "Fare (USD)": ticket_fare,
                                    "Taxes (USD)": tax,
                                    "Discount (USD)": discount,
                                    "Total Price (USD)": total_ticket_price,
                                    "Ticket Status": t_status,
                                    "Sales Channel": channel,
                                    "Passenger Name": p_name,
                                    "Seat Capacity": seat_cap
                                })

                            ticket_id_counter += 1

                        seats_allocated += party_size
                        booking_id_counter += 1
                else:
                    # Cancelled flight
                    inv_rec = (
                        flight_id_counter,
                        seat_cap,
                        0,
                        seat_cap,
                        0,
                        0.0
                    )
                    all_inventory_records.append(inv_rec)

                flight_id_counter += 1

            current_date += datetime.timedelta(days=1)

        print(f"Inserting {len(all_flights_records)} flights...")
        cursor.executemany("""
            INSERT INTO flights (id, flight_number, airline, route_id, route_code, origin, destination, 
                                 departure_date, departure_time, arrival_time, aircraft_type, seat_capacity, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, all_flights_records)

        print(f"Inserting {len(all_inventory_records)} seat inventory records...")
        cursor.executemany("""
            INSERT INTO seat_inventory (flight_id, total_seats, booked_seats, available_seats, blocked_seats, load_factor)
            VALUES (?, ?, ?, ?, ?, ?);
        """, all_inventory_records)

        print(f"Inserting {len(all_booking_records)} bookings...")
        cursor.executemany("""
            INSERT INTO bookings (id, booking_reference, booking_date, travel_date, customer_id, 
                                  sales_channel, total_amount, currency, status, booking_lead_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, all_booking_records)

        print(f"Inserting {len(all_ticket_records)} tickets...")
        cursor.executemany("""
            INSERT INTO tickets (id, ticket_number, booking_id, flight_id, passenger_name, passenger_id, 
                                 booking_class, fare_amount, tax_amount, discount_amount, total_price, 
                                 ticket_status, booked_at, travel_date, seat_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, all_ticket_records)

        # Write sample CSV for download and testing
        csv_path = PROJECT_ROOT / "data" / "sample_airline_data.csv"
        print(f"Writing sample CSV to {csv_path}...")
        if csv_sample_rows:
            with open(csv_path, mode="w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=list(csv_sample_rows[0].keys()))
                writer.writeheader()
                writer.writerows(csv_sample_rows)

        print("Synthetic database initialization completed successfully!")

def init_all():
    print("Initializing SQLite Database...")
    create_tables()
    seed_users()
    seed_settings()
    seed_airports_and_routes()
    seed_sample_dataset()
    print("Database ready!")

if __name__ == "__main__":
    init_all()

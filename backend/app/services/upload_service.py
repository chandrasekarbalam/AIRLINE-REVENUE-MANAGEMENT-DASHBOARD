import io
import re
import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
from backend.app.database.connection import get_db

REQUIRED_CANONICAL_FIELDS = [
    "flight_number", "origin", "destination", "booking_date", 
    "departure_date", "booking_class", "fare"
]

CANONICAL_FIELD_SYNONYMS = {
    "ticket_id": ["ticket id", "ticket_number", "ticket no", "ticketid", "ticket"],
    "booking_reference": ["booking reference", "booking id", "booking_id", "pnr", "booking ref"],
    "flight_number": ["flight number", "flight no", "flight", "flight_num", "flightid"],
    "airline": ["airline", "carrier", "operator"],
    "origin": ["origin", "from", "departure airport", "source", "orig"],
    "destination": ["destination", "to", "arrival airport", "dest"],
    "route": ["route", "route_code", "sector"],
    "booking_date": ["booking date", "booked at", "date of booking", "booked_date", "booked_at"],
    "departure_date": ["departure date", "travel date", "flight date", "date of flight", "dep_date"],
    "booking_class": ["booking class", "class", "cabin class", "fare class", "cabin"],
    "fare": ["fare", "fare (usd)", "fare (inr)", "fare_amount", "base fare", "price", "ticket fare"],
    "tax": ["taxes", "tax", "taxes (usd)", "tax_amount", "fees"],
    "discount": ["discount", "discount (usd)", "discount_amount"],
    "status": ["status", "ticket status", "booking status", "ticket_status"],
    "sales_channel": ["sales channel", "channel", "booking source", "agent"],
    "passenger_name": ["passenger name", "passenger", "name", "traveler"],
    "seat_capacity": ["seat capacity", "capacity", "seats"]
}

def guess_column_mapping(columns: List[str]) -> Dict[str, str]:
    """Auto-detect column mappings from header names."""
    mapping = {}
    normalized = {col: re.sub(r'[^a-z0-9]', '', col.lower()) for col in columns}

    for canonical, synonyms in CANONICAL_FIELD_SYNONYMS.items():
        matched = None
        for syn in synonyms:
            clean_syn = re.sub(r'[^a-z0-9]', '', syn.lower())
            for orig_col, norm_col in normalized.items():
                if norm_col == clean_syn or clean_syn in norm_col:
                    matched = orig_col
                    break
            if matched:
                break
        if matched:
            mapping[canonical] = matched

    return mapping

def preview_uploaded_file(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Parse file and return preview rows and detected column mappings."""
    if len(file_bytes) > 50 * 1024 * 1024:
        raise ValueError("File exceeds maximum allowed size of 50 MB.")

    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes), nrows=100)
    elif filename.endswith((".xls", ".xlsx")):
        df = pd.read_excel(io.BytesIO(file_bytes), nrows=100)
    else:
        raise ValueError("Unsupported file format. Please upload a CSV or Excel (.xlsx/.xls) file.")

    columns = list(df.columns)
    suggested_mapping = guess_column_mapping(columns)

    preview_records = df.head(10).fillna("").to_dict(orient="records")

    return {
        "filename": filename,
        "total_preview_rows": len(df),
        "columns": columns,
        "suggested_mapping": suggested_mapping,
        "preview": preview_records
    }

def parse_date_string(date_val: Any) -> Optional[str]:
    """Safely parse various date formats into YYYY-MM-DD."""
    if pd.isna(date_val) or not date_val:
        return None
    if isinstance(date_val, (datetime.date, datetime.datetime)):
        return date_val.strftime("%Y-%m-%d")
    
    val_str = str(date_val).strip()
    formats = [
        "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", 
        "%Y/%m/%d", "%d.%m.%Y", "%Y-%m-%d %H:%M:%S"
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(val_str[:10], fmt[:10] if len(fmt) >= 10 else fmt).strftime("%Y-%m-%d")
        except Exception:
            continue
    try:
        dt = pd.to_datetime(val_str)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None

def process_and_import_data(
    file_bytes: bytes,
    filename: str,
    column_mapping: Dict[str, str]
) -> Dict[str, Any]:
    """Validate, clean, and insert imported dataset into the relational database."""
    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif filename.endswith((".xls", ".xlsx")):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError("Unsupported file format. Upload .csv or .xlsx")

    # Invert mapping to read from uploaded columns
    req_missing = []
    for req in REQUIRED_CANONICAL_FIELDS:
        if req not in column_mapping or not column_mapping[req]:
            req_missing.append(req)

    if req_missing:
        return {
            "success": False,
            "error": f"Required fields missing from mapping: {', '.join(req_missing)}",
            "imported_count": 0,
            "rejected_count": len(df),
            "rejected_rows": []
        }

    valid_tickets = []
    rejected_rows = []
    seen_ticket_ids = set()

    with get_db() as conn:
        cursor = conn.cursor()
        # Fetch existing flight map and ticket numbers to avoid collision
        cursor.execute("SELECT ticket_number FROM tickets LIMIT 10000;")
        existing_tickets = set(r["ticket_number"] for r in cursor.fetchall())

        for idx, row in df.iterrows():
            row_idx = idx + 1
            errors = []

            # Extract fields
            f_num = str(row.get(column_mapping.get("flight_number", ""), "")).strip()
            origin = str(row.get(column_mapping.get("origin", ""), "")).strip().upper()
            dest = str(row.get(column_mapping.get("destination", ""), "")).strip().upper()
            b_class = str(row.get(column_mapping.get("booking_class", ""), "Economy")).strip()
            
            raw_b_date = row.get(column_mapping.get("booking_date", ""), None)
            raw_d_date = row.get(column_mapping.get("departure_date", ""), None)
            b_date = parse_date_string(raw_b_date)
            d_date = parse_date_string(raw_d_date)

            raw_fare = row.get(column_mapping.get("fare", ""), 0.0)
            try:
                fare = float(re.sub(r'[^\d.]', '', str(raw_fare)))
            except Exception:
                fare = 0.0
                errors.append("Invalid fare value")

            t_status = str(row.get(column_mapping.get("status", ""), "Confirmed")).strip().title()
            if t_status not in ["Confirmed", "Cancelled", "Refunded"]:
                t_status = "Confirmed"

            channel = str(row.get(column_mapping.get("sales_channel", ""), "Direct Web")).strip()
            p_name = str(row.get(column_mapping.get("passenger_name", ""), f"Passenger {row_idx}")).strip()
            t_id = str(row.get(column_mapping.get("ticket_id", ""), f"TK-IMP-{row_idx:07d}")).strip()

            # Validations
            if not f_num:
                errors.append("Missing flight number")
            if not origin or len(origin) != 3:
                errors.append("Origin must be a 3-letter IATA code")
            if not dest or len(dest) != 3:
                errors.append("Destination must be a 3-letter IATA code")
            if not b_date:
                errors.append("Invalid or unparseable booking date")
            if not d_date:
                errors.append("Invalid or unparseable departure date")
            if fare <= 0:
                errors.append("Fare must be greater than zero")
            if t_id in seen_ticket_ids or t_id in existing_tickets:
                errors.append(f"Duplicate ticket ID: {t_id}")

            if errors:
                rejected_rows.append({
                    "row_number": row_idx,
                    "ticket_id": t_id,
                    "flight_number": f_num,
                    "errors": errors
                })
                continue

            seen_ticket_ids.add(t_id)

            # Route code
            route_code = f"{origin}-{dest}"

            valid_tickets.append({
                "ticket_number": t_id,
                "flight_number": f_num,
                "origin": origin,
                "destination": dest,
                "route_code": route_code,
                "booking_date": b_date,
                "departure_date": d_date,
                "booking_class": b_class,
                "fare": fare,
                "status": t_status,
                "sales_channel": channel,
                "passenger_name": p_name,
                "tax": round(fare * 0.12, 2),
                "discount": 0.0,
                "total_price": round(fare * 1.12, 2)
            })

        # Batch insert valid items
        imported_count = 0
        if valid_tickets:
            for vt in valid_tickets:
                # Find or create route
                cursor.execute("SELECT id FROM routes WHERE route_code = ?;", (vt["route_code"],))
                r_row = cursor.fetchone()
                if r_row:
                    r_id = r_row["id"]
                else:
                    cursor.execute("""
                        INSERT INTO routes (route_code, origin_code, destination_code, distance_km, flight_duration_min)
                        VALUES (?, ?, ?, 1200.0, 120);
                    """, (vt["route_code"], vt["origin"], vt["destination"]))
                    r_id = cursor.lastrowid

                # Find or create flight
                cursor.execute("""
                    SELECT id FROM flights 
                    WHERE flight_number = ? AND departure_date = ?;
                """, (vt["flight_number"], vt["departure_date"]))
                f_row = cursor.fetchone()
                if f_row:
                    f_id = f_row["id"]
                else:
                    cursor.execute("""
                        INSERT INTO flights (flight_number, airline, route_id, route_code, origin, destination, 
                                             departure_date, departure_time, arrival_time, aircraft_type, seat_capacity, status)
                        VALUES (?, 'Partner Airline', ?, ?, ?, ?, ?, '12:00', '14:30', 'Airbus A320', 180, 'Completed');
                    """, (vt["flight_number"], r_id, vt["route_code"], vt["origin"], vt["destination"], vt["departure_date"]))
                    f_id = cursor.lastrowid

                    # Create seat inventory record
                    cursor.execute("""
                        INSERT INTO seat_inventory (flight_id, total_seats, booked_seats, available_seats, blocked_seats, load_factor)
                        VALUES (?, 180, 1, 179, 0, 0.55);
                    """, (f_id,))

                # Create booking
                b_ref = f"BK-IMP-{cursor.lastrowid or 1000}"
                cursor.execute("""
                    INSERT INTO bookings (booking_reference, booking_date, travel_date, customer_id, 
                                          sales_channel, total_amount, currency, status, booking_lead_days)
                    VALUES (?, ?, ?, 'CUST-IMP', ?, ?, 'USD', ?, 14);
                """, (b_ref, vt["booking_date"], vt["departure_date"], vt["sales_channel"], vt["total_price"], vt["status"]))
                b_id = cursor.lastrowid

                # Insert ticket
                cursor.execute("""
                    INSERT INTO tickets (ticket_number, booking_id, flight_id, passenger_name, passenger_id, 
                                         booking_class, fare_amount, tax_amount, discount_amount, total_price, 
                                         ticket_status, booked_at, travel_date, seat_number)
                    VALUES (?, ?, ?, ?, 'P-IMP', ?, ?, ?, ?, ?, ?, ?, ?, '12A');
                """, (
                    vt["ticket_number"], b_id, f_id, vt["passenger_name"],
                    vt["booking_class"], vt["fare"], vt["tax"], vt["discount"],
                    vt["total_price"], vt["status"], vt["booking_date"], vt["departure_date"]
                ))
                imported_count += 1

    return {
        "success": True,
        "filename": filename,
        "total_rows_processed": len(df),
        "imported_count": imported_count,
        "rejected_count": len(rejected_rows),
        "rejected_rows": rejected_rows[:50]  # Return first 50 rejected rows for review
    }

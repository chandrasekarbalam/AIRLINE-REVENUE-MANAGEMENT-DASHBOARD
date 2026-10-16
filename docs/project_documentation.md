# Airline Revenue Management Dashboard (ARMD)
## Comprehensive Technical Documentation & Architecture Specification

---

## 1. Executive Summary

The **Airline Revenue Management Dashboard (ARMD)** is an enterprise-grade commercial intelligence and decision-support web application. Designed for network airline planners, pricing analysts, and commercial executives, ARMD enables comprehensive monitoring of ticket sales, passenger demand curves, flight-level capacity utilization, route yield metrics (RASK, Yield, Load Factor), dynamic fare simulation, and time-series revenue forecasting.

---

## 2. Core Aviation Financial & Operational Metrics

### 2.1 Passenger Load Factor (\%)
The proportion of aircraft passenger carrying capacity that is commercially utilized:
$$\text{Load Factor} = \left( \frac{\text{Occupied Passenger Seats}}{\text{Available Seat Capacity}} \right) \times 100$$

### 2.2 Revenue per Available Seat Kilometer (RASK)
A fundamental airline commercial efficiency benchmark measuring total passenger revenue generated per unit of flying capacity:
$$\text{ASK} = \sum_{i} \left( \text{Seat Capacity}_i \times \text{Distance in Kilometers}_i \right)$$
$$\text{RASK} = \frac{\text{Total Passenger Revenue}}{\text{Available Seat Kilometers (ASK)}}$$

### 2.3 Passenger Yield (Revenue per Revenue Passenger Kilometer - RPK)
The average revenue earned per passenger carried over one kilometer:
$$\text{RPK} = \sum_{i} \left( \text{Occupied Seats}_i \times \text{Distance in Kilometers}_i \right)$$
$$\text{Yield} = \frac{\text{Total Passenger Revenue}}{\text{Revenue Passenger Kilometers (RPK)}}$$

### 2.4 Average Ticket Fare
$$\text{Average Fare} = \frac{\text{Total Completed Ticket Revenue}}{\text{Confirmed Tickets Sold}}$$

### 2.5 Price Elasticity of Demand & What-If Pricing Model
The simulator models passenger demand sensitivity to fare changes:
$$E_d = \frac{\% \Delta Q}{\% \Delta P} = \frac{(Q_{\text{sim}} - Q_{\text{base}})/Q_{\text{base}}}{(P_{\text{sim}} - P_{\text{base}})/P_{\text{base}}}$$
$$Q_{\text{unconstrained}} = Q_{\text{base}} \times \left(1 + E_d \times \frac{\Delta P}{P_{\text{base}}}\right)$$
$$\text{Boarded Demand} = \min\left( \text{Aircraft Capacity}, \max(0, \lfloor Q_{\text{unconstrained}} \rfloor) \right)$$
$$\text{Spillover Demand} = \max(0, Q_{\text{unconstrained}} - \text{Aircraft Capacity})$$

### 2.6 Time-Series Forecasting: Holt's Linear Exponential Smoothing
Chronological forecasting incorporates level, linear trend, and 7-day cyclical day-of-week seasonality:
- **Level Equation**:
  $$L_t = \alpha Y_t + (1 - \alpha)(L_{t-1} + b_{t-1})$$
- **Trend Equation**:
  $$b_t = \beta (L_t - L_{t-1}) + (1 - \beta) b_{t-1}$$
- **Forecast for Horizon $h$**:
  $$\hat{Y}_{t+h} = (L_t + h \cdot b_t) \times S_{\text{dow}(t+h)}$$
- **Prediction Intervals (95%)**:
  $$\text{Interval}_{t+h} = \hat{Y}_{t+h} \pm 1.96 \cdot \hat{\sigma}_{\epsilon} \sqrt{h}$$
- **Evaluation**: Out-of-sample chronological holdout measuring Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).

---

## 3. System Architecture

```
[ Client: Browser ]
       │
       ▼
[ Frontend: React + Vite + Tailwind CSS + Lucide Icons + Recharts ]
       │  (REST API calls via JSON / Multipart Uploads)
       ▼
[ Reverse Proxy / Vite Dev Server (port 5173 -> 8000) ]
       │
       ▼
[ Backend: Python FastAPI (port 8000) ]
  ├── Security & Auth (JWT Tokens, Role-Based Access Control)
  ├── Global Filter Engine (Dates, Routes, Status, Class, Channel)
  ├── Analytics & Time-Series Engine (Holt's Exponential Smoothing, Elasticity)
  ├── Report Engine (CSV & Excel Streaming Exporters)
  └── Upload Engine (Column Mapping, Cleaning, Duplicate & Type Validation)
       │
       ▼
[ Relational Database: SQLite with WAL Mode & Composite Performance Indexes ]
  ├── users
  ├── airports
  ├── routes
  ├── flights
  ├── bookings
  ├── tickets
  ├── seat_inventory
  ├── forecast_results
  ├── app_settings
  └── audit_logs
```

---

## 4. Database Schema Specification

### 4.1 `airports`
- `code` (TEXT, PK): 3-letter IATA code (DEL, BOM, BLR, HYD, MAA, CCU, DXB, LHR, JFK, SIN)
- `name` (TEXT): Full international airport name
- `city`, `country`: Geographic metadata
- `latitude`, `longitude`: Decimal coordinates

### 4.2 `routes`
- `id` (INTEGER, PK): Primary key
- `route_code` (TEXT, Unique): e.g. DEL-BOM
- `origin_code` (TEXT, FK -> airports.code)
- `destination_code` (TEXT, FK -> airports.code)
- `distance_km` (REAL): Route flight distance
- `flight_duration_min` (INTEGER): Scheduled flight time in minutes

### 4.3 `flights`
- `id` (INTEGER, PK): Flight departure identity
- `flight_number` (TEXT): e.g. AI-204, SW-101
- `airline` (TEXT): Operating carrier
- `route_id` (INTEGER, FK -> routes.id)
- `route_code`, `origin`, `destination` (TEXT)
- `departure_date` (DATE): YYYY-MM-DD
- `departure_time`, `arrival_time` (TEXT)
- `aircraft_type` (TEXT): A320neo, B737 MAX, B787-9, A350, B777
- `seat_capacity` (INTEGER): 180 to 350 seats
- `status` (TEXT): Completed, Scheduled, Cancelled

### 4.4 `bookings`
- `id` (INTEGER, PK)
- `booking_reference` (TEXT, Unique): PNR code
- `booking_date`, `travel_date` (DATE)
- `customer_id` (TEXT)
- `sales_channel` (TEXT): Direct Web, Mobile App, OTA, Travel Agency, Corporate
- `total_amount` (REAL)
- `status` (TEXT): Confirmed, Cancelled, Refunded
- `booking_lead_days` (INTEGER): Days between booking creation and travel departure

### 4.5 `tickets`
- `id` (INTEGER, PK)
- `ticket_number` (TEXT, Unique): e.g. TK-SW-00012345
- `booking_id` (INTEGER, FK -> bookings.id)
- `flight_id` (INTEGER, FK -> flights.id)
- `passenger_name`, `passenger_id` (TEXT)
- `booking_class` (TEXT): Economy, Premium Economy, Business, First Class
- `fare_amount` (REAL): Base ticket fare
- `tax_amount`, `discount_amount`, `total_price` (REAL)
- `ticket_status` (TEXT): Confirmed, Cancelled, Refunded
- `booked_at`, `travel_date` (DATE)
- `seat_number` (TEXT)

### 4.6 `seat_inventory`
- `flight_id` (INTEGER, Unique, FK -> flights.id)
- `total_seats`, `booked_seats`, `available_seats`, `blocked_seats`
- `load_factor` (REAL): Calculated seat occupancy percentage

---

## 5. REST API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `POST` | `/api/auth/login` | JWT authentication and profile retrieval |
| `GET` | `/api/auth/me` | Current authenticated session identity |
| `GET` | `/api/dashboard/summary` | 8 Executive KPI metrics with period-over-period delta |
| `GET` | `/api/dashboard/insights` | Data-driven business observations & recommendations |
| `GET` | `/api/dashboard/filter-options` | Dynamic dropdown metadata for global cross-filtering |
| `GET` | `/api/revenue/trends` | Daily, weekly, monthly pacing with prior period overlay |
| `GET` | `/api/revenue/by-route` | Route financial rankings and capacity utilization |
| `GET` | `/api/revenue/by-class` | Segmented cabin revenue and volume contributions |
| `GET` | `/api/revenue/by-flight` | Individual flight departures with load factors and status |
| `GET` | `/api/revenue/by-period` | Day-of-week and monthly travel seasonality distributions |
| `GET` | `/api/tickets` | Paginated ticket transactions with search and filters |
| `GET` | `/api/tickets/channels` | Sales channel distribution (Direct Web, App, OTA) |
| `GET` | `/api/routes/performance` | Route performance benchmarks |
| `GET` | `/api/routes/comparison` | Multi-route comparative benchmark for 2+ routes |
| `GET` | `/api/flights/performance` | Flight-level operational statistics |
| `GET` | `/api/demand/analysis` | Lead time brackets and cumulative booking pace curves |
| `GET` | `/api/inventory/summary` | Capacity gauges and critical saturation/low pace alerts |
| `GET` | `/api/fare-optimization/recommendations` | Algorithmic fare recommendations |
| `POST` | `/api/fare-optimization/simulate` | What-if price elasticity & capacity simulation |
| `GET` | `/api/forecast/revenue` | 7, 30, 90-day exponential smoothing forecast |
| `POST` | `/api/upload/preview` | File inspection and column mapping suggestion |
| `POST` | `/api/upload/process` | Batch data ingestion, validation, and error reporting |
| `GET` | `/api/upload/sample-template` | Download verified 5,000-record test CSV |
| `GET` | `/api/reports/export` | Download filtered CSV or Excel (.xlsx) reports |
| `GET` | `/api/settings` | Retrieve user preferences and alert thresholds |
| `POST` | `/api/settings` | Update thresholds and currency settings |

# AeroRevenue: Airline Revenue Management Dashboard

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![Tests](https://img.shields.io/badge/Tests-21%20Passed-success.svg)]()

An enterprise-grade commercial intelligence and decision-support web application for airline revenue management, passenger demand forecasting, dynamic pricing optimization, seat inventory control, and executive reporting.

---

## 🌟 Key Application Features

### 1. Executive Overview Dashboard
- **8 KPI Cards**: Total Revenue, Tickets Sold, Total Passengers, Average Ticket Fare, Passenger Load Factor (%), RASK (Revenue per Available Seat Kilometer), Yield (Revenue per Revenue Passenger Kilometer), and Booking Conversion Rate.
- **Period-over-Period Comparisons**: Percentage changes calculated against the previous equivalent period with hover tooltips detailing exact formulas.
- **Interactive Revenue Pacing**: Line/Area chart toggling between gross revenue, ticket volume, and average fare.
- **Route Rankings**: Horizontal bar charts ranking routes by financial yield and demand.
- **Cabin Class Distribution**: Donut visualization breaking down contributions of Economy, Premium Economy, Business, and First Class.
- **Data-Driven Intelligence Insights**: Dynamic business observations and recommended pricing actions computed directly from operational data.

### 2. Interactive Revenue Analytics
- Daily, weekly, and monthly chronological trends with prior period comparison overlay.
- Network route rankings sortable by revenue, tickets, average fare, and load factor.
- Temporal travel period analysis by day-of-week and month.
- Granular flight-level table with sorting, searching, pagination, and CSV export.

### 3. Ticket Sales Management
- Detailed ticket transactions ledger (Ticket ID, Booking PNR, Passenger, Flight, Class, Fare, Taxes, Discounts, Channel, Status).
- Sales channel distribution tracking direct web, mobile app, OTA, agency, and corporate bookings.
- Search, filter, server-side pagination, and reconciliation.

### 4. Route Performance & Multi-Route Benchmarking
- Network performance benchmarks with distance, flights, tickets, capacity, load factor, RASK, and Yield.
- **Interactive Multi-Route Comparison**: Select 2 to 5 routes to benchmark side-by-side on interactive revenue and load factor charts.

### 5. Flight Operations Performance
- Individual flight departure logs with aircraft type, scheduled seats, booked seats, and flight status.
- Load Factor vs. Revenue scatter plot identifying high-yield vs. underutilized departures.

### 6. Passenger Demand & Booking Curves
- Cumulative booking pace curve tracking reservation velocity from 60 days prior to departure day.
- Booking lead time distribution brackets (0-3d last minute, 4-7d, 8-14d, 15-30d, 31-60d, 60+d) with average fare.
- Scheduled seat capacity vs. actual passenger demand curves over time.

### 7. Fare Optimization & What-If Pricing Simulator
- **Interactive What-If Simulator**: Test hypothetical fare adjustments (-30% to +40%) using price elasticity of demand ($E_d = \% \Delta Q / \% \Delta P$) and aircraft seat capacity constraints.
- Real-time comparison of baseline vs. simulated outcomes (Projected Demand, Load Factor, Projected Revenue, Delta $, Delta %, Unaccommodated Spillover).
- Full price sensitivity curve visualizer displaying the optimal revenue peak.
- Algorithmic decision-support recommendations with confidence ratings and rationales.

### 8. Seat Inventory & Capacity Management
- Network capacity gauges (Total Scheduled Capacity, Seats Booked, Remaining Available, Load Factor).
- Visual capacity utilization by route sector.
- **Operational Alerts**: Critical saturation alerts for flights exceeding 90% capacity and low booking pace alerts for flights under 65% capacity.

### 9. Time-Series Revenue Forecasting
- Double exponential smoothing (Holt's Linear Trend) incorporating 7-day day-of-week cyclical seasonality.
- Selectable forecast horizons: 7, 30, and 90 days.
- Selectable metrics: Revenue, Ticket Demand, Average Fare.
- Historical actuals vs. projected estimates with shaded 95% confidence intervals.
- Chronological out-of-sample holdout validation reporting MAE and RMSE metrics.

### 10. Reports & Export Center
- One-click exports in **CSV** and **Microsoft Excel (.xlsx)** formats for:
  1. Revenue Summary Report
  2. Route Performance Report
  3. Flight Operations Report
  4. Ticket Sales Transaction Ledger
  5. Cabin Class Distribution Report
  6. Revenue Forecast Projections
- Reconciles identically with active global filters and configured currency.

### 11. Dataset Ingestion & Column Mapping
- Upload custom airline datasets via CSV or Excel (.xlsx).
- 4-step import wizard: File Inspection -> Column Mapping & Verification -> Validation & Preview -> Ingestion Summary Report detailing valid vs. rejected records.
- Downloadable 5,000-record sample CSV template for testing.

### 12. Settings & Security
- Instant currency toggle between **USD ($)** and **INR (₹)** with real-time conversion.
- Configurable alert thresholds for low load factor, high demand, and capacity saturation.
- Role-based authentication (Administrator and Analyst) with JWT security.

---

## 🏗️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS v4, Lucide React, Recharts |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Data & Analytics** | Pandas, NumPy, OpenPyXL, Scipy |
| **Database** | SQLite with WAL mode, foreign keys, and composite indexes |
| **Security** | Python-Jose (JWT), Passlib, PBKDF2/SHA-256 |
| **Testing** | Pytest, FastAPI TestClient, HTTPX |

---

## 📁 Project Directory Structure

```
pride-project/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── revenue.py
│   │   │   ├── tickets.py
│   │   │   ├── routes.py
│   │   │   ├── flights.py
│   │   │   ├── demand.py
│   │   │   ├── inventory.py
│   │   │   ├── fare_optimization.py
│   │   │   ├── forecast.py
│   │   │   ├── upload.py
│   │   │   ├── reports.py
│   │   │   └── settings.py
│   │   ├── database/        # SQLite connection & schema initialization
│   │   │   ├── connection.py
│   │   │   └── init_db.py
│   │   ├── services/        # Core business calculations & math models
│   │   │   ├── auth_service.py
│   │   │   ├── data_service.py
│   │   │   ├── forecasting_service.py
│   │   │   ├── fare_simulator.py
│   │   │   ├── upload_service.py
│   │   │   ├── export_service.py
│   │   │   └── insights_service.py
│   │   └── main.py          # Application entrypoint & middleware
│   ├── tests/               # Pytest automated test suite
│   │   ├── test_calculations.py
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # API service client
│   │   ├── context/AppContext.jsx # Global state & filters
│   │   ├── components/      # UI components (Navbar, Sidebar, Modals, KpiCard)
│   │   ├── pages/           # 11 distinct page modules
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── data/
│   ├── airline_revenue.db   # Relational database with 365,000+ tickets
│   └── sample_airline_data.csv # 5,000-record sample dataset
├── docs/
│   └── project_documentation.md # Technical & mathematical specification
├── .env.example
├── start_backend.bat
├── start_frontend.bat
├── start_all.bat
└── README.md
```

---

## 🚀 Quick Start & Setup Instructions

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** and **npm** installed

### 2. Backend Setup & Run

1. Open a terminal in the project root:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Initialize and seed the relational database with the synthetic dataset:
   ```bash
   python -m backend.app.database.init_db
   ```
3. Start the FastAPI backend server:
   ```bash
   python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The interactive API documentation is available at `http://127.0.0.1:8000/docs`.*

### 3. Frontend Setup & Run

1. Open a second terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at `http://localhost:5173`.

---

## 🧪 Running the Automated Test Suite

Run the full test suite verifying financial calculations, forecasting models, and API endpoints:

```bash
# Run calculation and business logic tests
python -m pytest backend/tests/test_calculations.py -v

# Run full API endpoint integration tests
python -m pytest backend/tests/test_api.py -v

# Run all tests together
python -m pytest backend/tests/ -v
```

All 21 test suites pass with zero errors.

---

## 👥 Demo Authentication Credentials

The application includes pre-configured demo credentials:

| Username | Password | Role | Description |
|---|---|---|---|
| `admin` | `admin123` | **Administrator** | Full configuration & management access |
| `analyst` | `analyst123` | **Analyst** | Revenue analysis, simulation, and exports |

*You can seamlessly switch roles in the UI via the Top Navbar user profile dropdown for demo evaluation.*

---

## 📄 License
MIT License. Developed as an advanced full-stack airline revenue management and commercial business intelligence system.

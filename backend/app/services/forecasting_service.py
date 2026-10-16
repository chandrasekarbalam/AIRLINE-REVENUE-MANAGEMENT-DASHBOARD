import datetime
import math
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from backend.app.database.connection import query_all

EXCHANGE_RATE_USD_TO_INR = 85.0

def run_revenue_forecast(
    horizon_days: int = 30,
    metric: str = "revenue",  # revenue, tickets, average_fare
    route: Optional[str] = None,
    currency: str = "USD"
) -> Dict[str, Any]:
    """
    Chronological time series forecasting with Holt's linear exponential smoothing 
    and moving average fallback, including out-of-sample chronological evaluation (MAE, RMSE).
    """
    where_clause = "WHERE t.ticket_status = 'Confirmed'"
    params = []
    if route:
        where_clause += " AND f.route_code = ?"
        params.append(route.upper())

    query = f"""
    SELECT 
        t.travel_date as date,
        COUNT(t.id) as tickets,
        SUM(t.fare_amount) as revenue,
        AVG(t.fare_amount) as average_fare
    FROM tickets t
    JOIN flights f ON t.flight_id = f.id
    {where_clause}
    GROUP BY t.travel_date
    ORDER BY t.travel_date ASC;
    """
    rows = query_all(query, tuple(params))

    if not rows or len(rows) < 14:
        return {
            "status": "insufficient_data",
            "message": "Insufficient historical data for time-series forecasting (minimum 14 daily data points required).",
            "historical": [],
            "forecast": [],
            "metrics": {"mae": None, "rmse": None, "mape": None}
        }

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Convert currency if needed
    mult = EXCHANGE_RATE_USD_TO_INR if currency.upper() == "INR" else 1.0
    if metric == "revenue":
        series = df["revenue"].values * mult
    elif metric == "average_fare":
        series = df["average_fare"].values * mult
    else:
        series = df["tickets"].values.astype(float)

    n = len(series)
    # Chronological train/test split: hold out last 20% (up to 28 days) for out-of-sample evaluation
    test_size = max(7, min(28, int(n * 0.2)))
    train_series = series[:-test_size]
    test_series = series[-test_size:]

    # Double Exponential Smoothing (Holt's Linear Trend) parameters
    alpha = 0.35  # Level smoothing factor
    beta = 0.15   # Trend smoothing factor

    # Fit on training portion to evaluate MAE & RMSE out-of-sample
    level = train_series[0]
    trend = train_series[1] - train_series[0] if len(train_series) > 1 else 0.0

    for val in train_series[1:]:
        last_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend

    # Out-of-sample predictions on test set
    test_preds = []
    for h in range(1, test_size + 1):
        pred_h = max(0.0, level + h * trend)
        test_preds.append(pred_h)

    test_preds = np.array(test_preds)
    errors = test_series - test_preds
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    # Avoid zero-division in MAPE
    non_zero = test_series > 0
    mape = float(np.mean(np.abs(errors[non_zero] / test_series[non_zero])) * 100) if np.any(non_zero) else 0.0

    # Now fit on the ENTIRE dataset to produce the forward forecast
    level_full = series[0]
    trend_full = series[1] - series[0] if len(series) > 1 else 0.0
    fitted_values = [level_full]

    residuals = []
    for i in range(1, n):
        val = series[i]
        last_level = level_full
        pred = max(0.0, level_full + trend_full)
        residuals.append(val - pred)
        level_full = alpha * val + (1 - alpha) * (level_full + trend_full)
        trend_full = beta * (level_full - last_level) + (1 - beta) * trend_full
        fitted_values.append(level_full)

    std_err = float(np.std(residuals)) if len(residuals) > 1 else (float(np.mean(series)) * 0.08)

    # Generate forward forecast points
    last_hist_date = df["date"].iloc[-1]
    forecast_points = []
    
    # 7-day seasonality adjustment factors based on historical day of week
    df["dow"] = df["date"].dt.dayofweek
    dow_means = df.groupby("dow")[metric if metric != "revenue" else "revenue"].mean()
    overall_mean = df[metric if metric != "revenue" else "revenue"].mean()
    seasonality = (dow_means / overall_mean).to_dict() if overall_mean > 0 else {}

    for h in range(1, horizon_days + 1):
        target_date = last_hist_date + pd.Timedelta(days=h)
        dow = target_date.dayofweek
        seas_factor = seasonality.get(dow, 1.0)
        # Moderate seasonality factor to prevent over-amplification
        seas_factor = 0.6 + 0.4 * seas_factor

        base_val = max(0.0, level_full + h * trend_full)
        fc_val = round(base_val * seas_factor, 2)
        
        # Prediction interval grows with square root of forecast horizon
        margin = 1.96 * std_err * math.sqrt(h)
        lower_b = round(max(0.0, fc_val - margin), 2)
        upper_b = round(fc_val + margin, 2)

        forecast_points.append({
            "date": target_date.strftime("%Y-%m-%d"),
            "forecast_value": fc_val,
            "lower_bound": lower_b,
            "upper_bound": upper_b,
            "horizon_day": h
        })

    # Historical data points for visual continuity (last 60 days)
    hist_sample = df.tail(60)
    historical_points = [{
        "date": r["date"].strftime("%Y-%m-%d"),
        "actual_value": round(float(r[metric]) * (mult if metric in ["revenue", "average_fare"] else 1.0), 2)
    } for _, r in hist_sample.iterrows()]

    return {
        "status": "success",
        "metric": metric,
        "currency": currency.upper(),
        "horizon_days": horizon_days,
        "model_type": "Holt's Linear Exponential Smoothing with Day-of-Week Seasonality",
        "evaluation_method": f"Chronological Out-of-Sample Holdout ({test_size} days)",
        "generated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "coverage_period": {
            "start": df["date"].iloc[0].strftime("%Y-%m-%d"),
            "end": last_hist_date.strftime("%Y-%m-%d"),
            "total_days": n
        },
        "performance_metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2)
        },
        "historical": historical_points,
        "forecast": forecast_points
    }

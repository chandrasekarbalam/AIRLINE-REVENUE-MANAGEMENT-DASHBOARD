import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.auth_service import create_access_token

client = TestClient(app)

def test_demo_accounts_endpoint():
    res = client.get("/api/auth/demo-accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) >= 5
    roles = [a["role"] for a in accounts]
    assert "administrator" in roles
    assert "revenue_manager" in roles
    assert "analyst" in roles
    assert "operations_manager" in roles
    assert "viewer" in roles

def test_forgot_and_reset_password():
    # Forgot password
    f_res = client.post("/api/auth/forgot-password", json={"email": "analyst@aeroanalytics.com"})
    assert f_res.status_code == 200
    assert "demo_reset_code" in f_res.json()

    # Reset password with valid code
    r_res = client.post("/api/auth/reset-password", json={
        "email": "analyst@aeroanalytics.com",
        "reset_code": "123456",
        "new_password": "analyst123_new"
    })
    assert r_res.status_code == 200

    # Login with new password
    l_res = client.post("/api/auth/login", json={
        "username": "analyst",
        "password": "analyst123_new"
    })
    assert l_res.status_code == 200
    assert "access_token" in l_res.json()

    # Reset it back to default for idempotency
    client.post("/api/auth/reset-password", json={
        "email": "analyst@aeroanalytics.com",
        "reset_code": "123456",
        "new_password": "analyst123"
    })

def test_admin_user_management():
    admin_token = create_access_token({"sub": "admin", "role": "administrator"})
    headers = {"Authorization": f"Bearer {admin_token}"}

    # List users
    res = client.get("/api/admin/users", headers=headers)
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 5

    # Check non-admin gets 403
    analyst_token = create_access_token({"sub": "analyst", "role": "analyst"})
    a_headers = {"Authorization": f"Bearer {analyst_token}"}
    forbidden_res = client.get("/api/admin/users", headers=a_headers)
    assert forbidden_res.status_code == 403

def test_revenue_by_airline_and_channel():
    res_airline = client.get("/api/revenue/by-airline")
    assert res_airline.status_code == 200
    airlines = res_airline.json()
    assert len(airlines) > 0
    assert "airline" in airlines[0]
    assert "total_revenue" in airlines[0]

    res_channel = client.get("/api/revenue/by-channel")
    assert res_channel.status_code == 200
    channels = res_channel.json()
    assert len(channels) > 0
    assert "channel" in channels[0]
    assert "total_revenue" in channels[0]

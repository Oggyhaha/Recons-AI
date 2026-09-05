import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_login_success():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "controller@razorpay-merchant.com", "password": "password123"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "controller@razorpay-merchant.com"
    assert data["user"]["role"] == "FINANCE_CONTROLLER"

def test_login_invalid_credentials():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "controller@razorpay-merchant.com", "password": "wrongpassword"}
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_register_and_login_new_user():
    email = "new_cfo@enterprise.com"
    res = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Sarah Jenkins",
            "email": email,
            "password": "SecurePassword456!",
            "organization_name": "Global Retail Ltd",
            "role": "FINANCE_CONTROLLER"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["name"] == "Sarah Jenkins"
    assert data["user"]["email"] == email

    # Test logging in with newly registered credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SecurePassword456!"}
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["email"] == email

def test_get_current_user():
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert "email" in data
    assert "role" in data
    assert len(data["permissions"]) > 0

def test_switch_role():
    res = client.post(
        "/api/v1/auth/switch-role",
        json={"role": "FINANCE_ANALYST"}
    )
    assert res.status_code == 200
    assert res.json()["active_role"] == "FINANCE_ANALYST"

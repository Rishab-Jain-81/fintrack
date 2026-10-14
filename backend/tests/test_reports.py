import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_financial_summary_happy_path(auth_client: AsyncClient):

    income_cat_payload = {
        "name": "Salary",
        "type": "income",
        "color": "#1DD601",
        "icon": "Dollar",
    }
    income_cat_response = await auth_client.post(
        "/api/v1/categories", json=income_cat_payload
    )

    assert income_cat_response.status_code == 201
    income_cat_id = income_cat_response.json()["id"]

    expense1_cat_payload = {
        "name": "Rent",
        "type": "expense",
        "color": "#0250D8",
        "icon": "Home",
    }
    expense1_cat_response = await auth_client.post(
        "/api/v1/categories", json=expense1_cat_payload
    )

    assert expense1_cat_response.status_code == 201
    expense1_cat_id = expense1_cat_response.json()["id"]

    expense2_cat_payload = {
        "name": "Groceries",
        "type": "expense",
        "color": "#9FAC10",
        "icon": "Groceries",
    }
    expense2_cat_response = await auth_client.post(
        "/api/v1/categories", json=expense2_cat_payload
    )

    assert expense2_cat_response.status_code == 201
    expense2_cat_id = expense2_cat_response.json()["id"]

    income_txn_payload = {
        "amount": 5000,
        "type": "income",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": income_cat_id,
    }

    income_txn_response = await auth_client.post(
        "/api/v1/transactions", json=income_txn_payload
    )
    assert income_txn_response.status_code == 201

    expense1_txn_payload = {
        "amount": 1500,
        "type": "expense",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": expense1_cat_id,
    }

    expense1_txn_response = await auth_client.post(
        "/api/v1/transactions", json=expense1_txn_payload
    )
    assert expense1_txn_response.status_code == 201

    expense2_txn_payload = {
        "amount": 500,
        "type": "expense",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": expense2_cat_id,
    }

    expense2_txn_response = await auth_client.post(
        "/api/v1/transactions", json=expense2_txn_payload
    )
    assert expense2_txn_response.status_code == 201

    params = {"start_date": "2026-10-14T10:00:00Z", "end_date": "2026-10-16T10:00:00Z"}

    report_response = await auth_client.get("/api/v1/reports/summary", params=params)
    assert report_response.status_code == 200
    report = report_response.json()

    assert report["start_date"] == "2026-10-14T10:00:00Z"
    assert report["end_date"] == "2026-10-16T10:00:00Z"
    assert report["total_income"] == "5000.00"
    assert report["total_expense"] == "2000.00"
    assert report["net_savings"] == "3000.00"
    assert report["breakdown_by_category"][0]["category_id"] == expense1_cat_id
    assert report["breakdown_by_category"][1]["category_id"] == expense2_cat_id

    assert report["breakdown_by_category"][0]["percentage"] == "75.00"
    assert report["breakdown_by_category"][1]["percentage"] == "25.00"

    assert report["breakdown_by_category"][0]["amount"] == "1500.00"
    assert report["breakdown_by_category"][1]["amount"] == "500.00"


@pytest.mark.asyncio
async def test_report_exclude_transaction_outside_date_range(auth_client: AsyncClient):
    income_cat_payload = {
        "name": "Salary",
        "type": "income",
        "color": "#1DD601",
        "icon": "Dollar",
    }
    income_cat_response = await auth_client.post(
        "/api/v1/categories", json=income_cat_payload
    )

    assert income_cat_response.status_code == 201
    income_cat_id = income_cat_response.json()["id"]

    expense_cat_payload = {
        "name": "Rent",
        "type": "expense",
        "color": "#0250D8",
        "icon": "Home",
    }
    expense_cat_response = await auth_client.post(
        "/api/v1/categories", json=expense_cat_payload
    )

    assert expense_cat_response.status_code == 201
    expense_cat_id = expense_cat_response.json()["id"]

    income_txn_payload = {
        "amount": 5000,
        "type": "income",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": income_cat_id,
    }

    income_txn_response = await auth_client.post(
        "/api/v1/transactions", json=income_txn_payload
    )
    assert income_txn_response.status_code == 201

    expense_txn_payload = {
        "amount": 1500,
        "type": "expense",
        "transaction_date": "2026-10-10T10:00:00Z",
        "category_id": expense_cat_id,
    }

    expense_txn_response = await auth_client.post(
        "/api/v1/transactions", json=expense_txn_payload
    )
    assert expense_txn_response.status_code == 201

    report_response = await auth_client.get(
        "/api/v1/reports/summary?start_date=2026-10-14T10:00:00Z&end_date=2026-10-16T10:00:00Z"
    )
    assert report_response.status_code == 200
    report = report_response.json()

    assert report["start_date"] == "2026-10-14T10:00:00Z"
    assert report["end_date"] == "2026-10-16T10:00:00Z"
    assert report["total_income"] == "5000.00"
    assert report["total_expense"] == "0.00"
    assert report["net_savings"] == "5000.00"
    assert report["breakdown_by_category"] == []

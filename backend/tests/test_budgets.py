import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_budget_creation_and_duplicate_rejection(auth_client: AsyncClient):

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

    budget_payload = {
        "category_id": expense_cat_id,
        "amount": "5000.00",
        "month": 10,
        "year": 2026,
    }

    budget_response = await auth_client.post("/api/v1/budgets", json=budget_payload)
    assert budget_response.status_code == 201

    budget_payload = {
        "category_id": expense_cat_id,
        "amount": "1000.00",
        "month": 10,
        "year": 2026,
    }

    budget_response = await auth_client.post("/api/v1/budgets", json=budget_payload)
    assert budget_response.status_code == 400
    assert "already exists" in budget_response.json()["detail"]


@pytest.mark.asyncio
async def test_budget_progress_under_budget(auth_client: AsyncClient):

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

    budget_payload = {
        "category_id": expense_cat_id,
        "amount": "5000.00",
        "month": 10,
        "year": 2026,
    }

    budget_response = await auth_client.post("/api/v1/budgets", json=budget_payload)
    assert budget_response.status_code == 201
    budget_id = budget_response.json()["id"]

    expense_txn_payload = {
        "amount": 1500,
        "type": "expense",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": expense_cat_id,
    }

    expense_txn_response = await auth_client.post(
        "/api/v1/transactions", json=expense_txn_payload
    )
    assert expense_txn_response.status_code == 201

    get_budget_response = await auth_client.get(f"/api/v1/budgets/{budget_id}")
    assert get_budget_response.status_code == 200

    budget = get_budget_response.json()

    assert budget["amount"] == "5000.00"
    assert budget["month"] == 10
    assert budget["year"] == 2026
    assert budget["spent_amount"] == "1500.00"
    assert budget["remaining_amount"] == "3500.00"
    assert budget["percentage_used"] == "30.00"
    assert budget["is_over_budget"] == False


@pytest.mark.asyncio
async def test_update_and_delete_budget(auth_client: AsyncClient):
    # 1. Arrange: Create category and budget
    cat_res = await auth_client.post(
        "/api/v1/categories",
        json={"name": "Streaming", "type": "expense", "color": "#EF4444", "icon": "tv"},
    )
    cat_id = cat_res.json()["id"]

    budget_res = await auth_client.post(
        "/api/v1/budgets",
        json={"category_id": cat_id, "amount": "50.00", "month": 8, "year": 2026},
    )
    assert budget_res.status_code == 201
    budget_id = budget_res.json()["id"]

    # 2. Act: Update ceiling amount
    patch_res = await auth_client.patch(
        f"/api/v1/budgets/{budget_id}",
        json={"amount": "75.00"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["amount"] == "75.00"

    # 3. Act: Delete budget
    del_res = await auth_client.delete(f"/api/v1/budgets/{budget_id}")
    assert del_res.status_code == 204

    # 4. Assert: Confirm 404 on subsequent fetch
    get_res = await auth_client.get(f"/api/v1/budgets/{budget_id}")
    assert get_res.status_code == 404

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_transaction_category_type_mismatch_fails(
    auth_client: AsyncClient,
):

    category_payload = {
        "name": "My Custom Coffee",
        "type": "expense",
        "color": "#D97706",
        "icon": "coffee",
    }
    category_response = await auth_client.post(
        "/api/v1/categories", json=category_payload
    )

    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    transaction_payload = {
        "amount": 500,
        "type": "income",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": category_id,
    }

    transaction_response = await auth_client.post(
        "/api/v1/transactions", json=transaction_payload
    )

    assert transaction_response.status_code == 400
    assert "invalid category type" in transaction_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_create_transaction_success(auth_client: AsyncClient):

    category_payload = {
        "name": "My Custom Coffee",
        "type": "expense",
        "color": "#D97706",
        "icon": "coffee",
    }
    category_response = await auth_client.post(
        "/api/v1/categories", json=category_payload
    )

    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    transaction_payload = {
        "amount": 500,
        "type": "expense",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": category_id,
    }

    transaction_response = await auth_client.post(
        "/api/v1/transactions", json=transaction_payload
    )

    assert transaction_response.status_code == 201
    transaction = transaction_response.json()

    assert transaction["amount"] == "500.00"
    assert transaction["type"] == "expense"
    assert transaction["category_id"] == category_id


@pytest.mark.asyncio
async def test_user_cannot_log_transaction_with_other_users_category(
    auth_client: AsyncClient,
):
    category_payload = {
        "name": "My Custom Coffee",
        "type": "expense",
        "color": "#D97706",
        "icon": "coffee",
    }
    category_response = await auth_client.post(
        "/api/v1/categories", json=category_payload
    )

    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    user_payload = {
        "email": "userB@example.com",
        "password": "StrongPassword123!",
        "full_name": "User B",
    }

    user_response = await auth_client.post("/api/v1/auth/register", json=user_payload)
    assert user_response.status_code == 201

    login_payload = {
        "username": user_payload["email"],
        "password": user_payload["password"],
    }

    login_response = await auth_client.post("/api/v1/auth/login", data=login_payload)
    assert login_response.status_code == 200
    userB_token = login_response.json()["access_token"]

    auth_client.headers["Authorization"] = f"Bearer {userB_token}"

    transaction_payload = {
        "amount": 500,
        "type": "expense",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": category_id,
    }

    transaction_response = await auth_client.post(
        "/api/v1/transactions", json=transaction_payload
    )

    assert transaction_response.status_code == 404
    assert "not found" in transaction_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_user_cannot_see_other_users_transaction(auth_client: AsyncClient):
    category_payload = {
        "name": "My Custom Coffee",
        "type": "expense",
        "color": "#D97706",
        "icon": "coffee",
    }
    category_response = await auth_client.post(
        "/api/v1/categories", json=category_payload
    )

    assert category_response.status_code == 201
    category_id = category_response.json()["id"]

    transaction_payload = {
        "amount": 500,
        "type": "expense",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": category_id,
    }

    transaction_response = await auth_client.post(
        "/api/v1/transactions", json=transaction_payload
    )

    assert transaction_response.status_code == 201
    transaction_id = transaction_response.json()["id"]

    user_payload = {
        "email": "userB@example.com",
        "password": "StrongPassword123!",
        "full_name": "User B",
    }

    user_response = await auth_client.post("/api/v1/auth/register", json=user_payload)
    assert user_response.status_code == 201

    login_payload = {
        "username": user_payload["email"],
        "password": user_payload["password"],
    }

    login_response = await auth_client.post("/api/v1/auth/login", data=login_payload)
    assert login_response.status_code == 200
    userB_token = login_response.json()["access_token"]

    auth_client.headers["Authorization"] = f"Bearer {userB_token}"

    conflict_response = await auth_client.get(f"/api/v1/transactions/{transaction_id}")

    assert conflict_response.status_code == 404
    assert "not found" in conflict_response.json()["detail"]


@pytest.mark.asyncio
async def test_list_transactions_with_filters(auth_client: AsyncClient):
    # 1. Arrange: Create category
    cat_res = await auth_client.post(
        "/api/v1/categories",
        json={
            "name": "Groceries",
            "type": "expense",
            "color": "#10B981",
            "icon": "cart",
        },
    )
    assert cat_res.status_code == 201
    cat_id = cat_res.json()["id"]

    # 2. Arrange: Create two transactions with different dates and types
    await auth_client.post(
        "/api/v1/transactions",
        json={
            "amount": "45.50",
            "type": "expense",
            "category_id": cat_id,
            "transaction_date": "2026-06-01T12:00:00Z",
            "description": "June groceries",
        },
    )
    await auth_client.post(
        "/api/v1/transactions",
        json={
            "amount": "80.00",
            "type": "expense",
            "category_id": cat_id,
            "transaction_date": "2026-07-01T12:00:00Z",
            "description": "July groceries",
        },
    )

    # 3. Act & Assert: Filter strictly to June
    filter_params = {
        "start_date": "2026-06-01T00:00:00Z",
        "end_date": "2026-06-30T23:59:59Z",
        "category_id": cat_id,
        "type": "expense",
        "limit": 10,
        "offset": 0,
    }
    res = await auth_client.get("/api/v1/transactions", params=filter_params)
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["description"] == "June groceries"


@pytest.mark.asyncio
async def test_update_transaction_partial(auth_client: AsyncClient):
    # 1. Arrange: Create category and transaction
    cat_res = await auth_client.post(
        "/api/v1/categories",
        json={
            "name": "Transport",
            "type": "expense",
            "color": "#3B82F6",
            "icon": "car",
        },
    )
    cat_id = cat_res.json()["id"]

    tx_res = await auth_client.post(
        "/api/v1/transactions",
        json={
            "amount": "25.00",
            "type": "expense",
            "category_id": cat_id,
            "transaction_date": "2026-06-15T08:30:00Z",
            "description": "Bus ticket",
        },
    )
    tx_id = tx_res.json()["id"]

    # 2. Act: Partial update (amount and description only)
    patch_payload = {"amount": "30.00", "description": "Express bus ticket"}
    patch_res = await auth_client.patch(
        f"/api/v1/transactions/{tx_id}", json=patch_payload
    )

    # 3. Assert
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["amount"] == "30.00"
    assert updated["description"] == "Express bus ticket"
    assert updated["category_id"] == cat_id


@pytest.mark.asyncio
async def test_delete_transaction(auth_client: AsyncClient):
    # 1. Arrange
    cat_res = await auth_client.post(
        "/api/v1/categories",
        json={
            "name": "Utilities",
            "type": "expense",
            "color": "#6366F1",
            "icon": "bolt",
        },
    )
    cat_id = cat_res.json()["id"]

    tx_res = await auth_client.post(
        "/api/v1/transactions",
        json={
            "amount": "120.00",
            "type": "expense",
            "category_id": cat_id,
            "transaction_date": "2026-06-20T10:00:00Z",
        },
    )
    tx_id = tx_res.json()["id"]

    # 2. Act: Delete transaction
    del_res = await auth_client.delete(f"/api/v1/transactions/{tx_id}")
    assert del_res.status_code == 204

    # 3. Assert: Confirm 404 on subsequent get
    get_res = await auth_client.get(f"/api/v1/transactions/{tx_id}")
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_transaction_not_found_and_invalid_patch(auth_client: AsyncClient):
    fake_id = uuid.uuid4()

    # 1. GET non-existent transaction -> 404
    get_res = await auth_client.get(f"/api/v1/transactions/{fake_id}")
    assert get_res.status_code == 404

    # 2. DELETE non-existent transaction -> 404
    del_res = await auth_client.delete(f"/api/v1/transactions/{fake_id}")
    assert del_res.status_code == 404

    # 3. POST transaction with non-existent category_id -> 404
    bad_tx_payload = {
        "amount": "100.00",
        "type": "expense",
        "transaction_date": "2026-10-15T10:00:00Z",
        "category_id": str(fake_id),
    }
    post_res = await auth_client.post("/api/v1/transactions", json=bad_tx_payload)
    assert post_res.status_code == 404

import uuid

import pytest
from app.models.category import Category
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_create_custom_category(
    auth_client: AsyncClient, db_session: AsyncSession
):

    system_category = Category(
        name="System Rent",
        type="expense",
        color="#1E40AF",
        icon="home",
        user_id=None,  # 👈 System default
    )
    db_session.add(system_category)
    await db_session.commit()
    await db_session.refresh(system_category)

    custom_payload = {
        "name": "My Custom Coffee",
        "type": "expense",
        "color": "#D97706",
        "icon": "coffee",
    }
    create_res = await auth_client.post("/api/v1/categories", json=custom_payload)
    assert create_res.status_code == 201

    list_res = await auth_client.get("/api/v1/categories")

    assert list_res.status_code == 200
    categories = list_res.json()

    category_names = [cat["name"] for cat in categories]

    assert "System Rent" in category_names
    assert "My Custom Coffee" in category_names

    sys_cat = next(cat for cat in categories if cat["name"] == "System Rent")
    cus_cat = next(cat for cat in categories if cat["name"] == "My Custom Coffee")

    assert sys_cat["user_id"] is None
    assert cus_cat["user_id"] is not None


@pytest.mark.asyncio
async def test_list_categories_includes_system_and_user_defaults(
    auth_client: AsyncClient,
    db_session: AsyncSession,
):
    system_category = Category(
        name="System Rent",
        type="expense",
        color="#1E40AF",
        icon="home",
        user_id=None,  # 👈 System default
    )
    db_session.add(system_category)
    await db_session.commit()
    await db_session.refresh(system_category)

    custom_payload = {
        "name": "My Custom Coffee",
        "type": "expense",
        "color": "#D97706",
        "icon": "coffee",
    }
    create_res = await auth_client.post("/api/v1/categories", json=custom_payload)
    assert create_res.status_code == 201

    list_res = await auth_client.get("/api/v1/categories")

    assert list_res.status_code == 200
    categories = list_res.json()

    category_names = [cat["name"] for cat in categories]

    assert "System Rent" in category_names
    assert "My Custom Coffee" in category_names

    sys_cat = next(cat for cat in categories if cat["name"] == "System Rent")
    user_cat = next(cat for cat in categories if cat["name"] == "My Custom Coffee")

    assert sys_cat["user_id"] is None
    assert user_cat["user_id"] is not None


@pytest.mark.asyncio
async def test_user_cannot_access_another_users_category(auth_client: AsyncClient):

    custom_payload = {
        "name": "My Custom icecream",
        "type": "expense",
        "color": "#FFFFFF",
        "icon": "icecream",
    }

    category_response = await auth_client.post(
        "/api/v1/categories", json=custom_payload
    )

    assert category_response.status_code == 201
    category_data = category_response.json()
    category_user_id = category_data["user_id"]
    assert category_data["name"] == "My Custom icecream"

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
    conf_category_response = await auth_client.get(
        f"/api/v1/categories/{category_user_id}"
    )

    assert conf_category_response.status_code == 404
    assert "not found" in conf_category_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_update_delete_category(auth_client: AsyncClient):
    # 1. Create
    create_res = await auth_client.post(
        "/api/v1/categories",
        json={
            "name": "Old Category",
            "type": "expense",
            "color": "#000000",
            "icon": "star",
        },
    )
    assert create_res.status_code == 201
    cat_id = create_res.json()["id"]

    # 2. Get by ID
    get_res = await auth_client.get(f"/api/v1/categories/{cat_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Old Category"

    # 3. Patch
    patch_res = await auth_client.patch(
        f"/api/v1/categories/{cat_id}",
        json={"name": "Updated Category", "color": "#FFFFFF"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Category"

    # 4. Delete
    del_res = await auth_client.delete(f"/api/v1/categories/{cat_id}")
    assert del_res.status_code == 204

    # 5. Confirm 404
    missing_res = await auth_client.get(f"/api/v1/categories/{cat_id}")
    assert missing_res.status_code == 404


@pytest.mark.asyncio
async def test_category_not_found_returns_404(auth_client: AsyncClient):
    fake_id = uuid.uuid4()
    res = await auth_client.get(f"/api/v1/categories/{fake_id}")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_category_get_patch_delete_lifecycle(auth_client: AsyncClient):
    # 1. Create category
    cat_payload = {
        "name": "Subscriptions",
        "type": "expense",
        "color": "#6366F1",
        "icon": "film",
    }
    create_res = await auth_client.post("/api/v1/categories", json=cat_payload)
    assert create_res.status_code == 201
    cat_id = create_res.json()["id"]

    # 2. GET by ID
    get_res = await auth_client.get(f"/api/v1/categories/{cat_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Subscriptions"

    # 3. PATCH update
    patch_res = await auth_client.patch(
        f"/api/v1/categories/{cat_id}",
        json={"name": "Digital Subscriptions", "color": "#4F46E5"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Digital Subscriptions"

    # 4. DELETE
    del_res = await auth_client.delete(f"/api/v1/categories/{cat_id}")
    assert del_res.status_code == 204

    # 5. Confirm 404
    missing_res = await auth_client.get(f"/api/v1/categories/{cat_id}")
    assert missing_res.status_code == 404

    # 6. Test 404 on fake category update/delete
    fake_id = uuid.uuid4()
    bad_patch = await auth_client.patch(
        f"/api/v1/categories/{fake_id}", json={"name": "X"}
    )
    assert bad_patch.status_code == 404
    bad_delete = await auth_client.delete(f"/api/v1/categories/{fake_id}")
    assert bad_delete.status_code == 404

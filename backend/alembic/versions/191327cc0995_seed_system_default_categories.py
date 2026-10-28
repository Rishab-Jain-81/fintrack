"""seed_system_default_categories

Revision ID: 191327cc0995
Revises: 58dea69e2c6b
Create Date: 2026-10-28 15:21:46.495003

"""

import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "191327cc0995"
down_revision: Union[str, Sequence[str], None] = "58dea69e2c6b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


categories_table = sa.table(
    "categories",
    sa.column("id", sa.Uuid),
    sa.column("user_id", sa.Uuid),
    sa.column("name", sa.String),
    sa.column("type", sa.String),
    sa.column("icon", sa.String),
    sa.column("color", sa.String),
    sa.column("created_at", sa.DateTime(timezone=True)),
    sa.column("updated_at", sa.DateTime(timezone=True)),
)

now = datetime.now(timezone.utc)

SYSTEM_CATEGORIES = [
    # Expenses
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Food",
        "type": "expense",
        "icon": "utensils",
        "color": "#FB5607",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Groceries",
        "type": "expense",
        "icon": "groceries",
        "color": "#10B981",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Housing & Rent",
        "type": "expense",
        "icon": "home",
        "color": "#3A86FF",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Transportation",
        "type": "expense",
        "icon": "transportation",
        "color": "#FFBE0B",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Bills",
        "type": "expense",
        "icon": "receipt",
        "color": "#06B6D4",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Healthcare",
        "type": "expense",
        "icon": "health",
        "color": "#FF006E",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Entertainment",
        "type": "expense",
        "icon": "film",
        "color": "#8338EC",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Shopping",
        "type": "expense",
        "icon": "shopping",
        "color": "#FF70A6",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Fitness",
        "type": "expense",
        "icon": "dumbbell",
        "color": "#8338EC",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Gift",
        "type": "expense",
        "icon": "gift",
        "color": "#06B6D4",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Education",
        "type": "expense",
        "icon": "education",
        "color": "#10B981",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Pet",
        "type": "expense",
        "icon": "pet",
        "color": "#FF70A6",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Travel",
        "type": "expense",
        "icon": "plane",
        "color": "#FFBE0B",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Other",
        "type": "expense",
        "icon": "other",
        "color": "#06B6D4",
        "created_at": now,
        "updated_at": now,
    },
    # Income
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Salary",
        "type": "income",
        "icon": "moneyup",
        "color": "#10B981",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Allowance",
        "type": "income",
        "icon": "coins",
        "color": "#00F5D4",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Investments",
        "type": "income",
        "icon": "trendingup",
        "color": "#3B82F6",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Award",
        "type": "income",
        "icon": "award",
        "color": "#FFBE0B",
        "created_at": now,
        "updated_at": now,
    },
    {
        "id": uuid.uuid4(),
        "user_id": None,
        "name": "Other",
        "type": "income",
        "icon": "other",
        "color": "#06B6D4",
        "created_at": now,
        "updated_at": now,
    },
]


def upgrade() -> None:
    """Upgrade schema."""
    op.bulk_insert(categories_table, SYSTEM_CATEGORIES)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(categories_table.delete().where(categories_table.c.user_id.is_(None)))

# ----------------------------------------------------
# Stage 1: Dependency Builder
# ----------------------------------------------------
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Create virtualenv and tell uv to use it
ENV VIRTUAL_ENV=/opt/venv
RUN uv venv /opt/venv && \
    uv pip install --no-cache -r pyproject.toml

# ----------------------------------------------------
# Stage 2: Lean Production Runtime
# ----------------------------------------------------
FROM python:3.12-slim-bookworm AS runner

WORKDIR /app

# Setup non-root user for security
RUN groupadd -r fintrack && useradd -r -g fintrack -d /app fintrack

# Copy virtualenv from builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Copy application source code
COPY --chown=fintrack:fintrack . /app

USER fintrack

EXPOSE 8000

# Default command: run FastAPI behind uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
# Build stage
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies for build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.12-slim AS production

WORKDIR /app

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/home/appuser/.local/bin:$PATH

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Copy application code
COPY --chown=appuser:appgroup . ./

# Create alembic versions directory and set permissions
RUN mkdir -p /app/alembic/versions && \
    chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Start command
CMD ["sh", "-c", "alembic upgrade head && python -m scripts.seed && uvicorn main:app --host 0.0.0.0 --port 8000"]

# Development stage
FROM production AS development

USER root

# Install development dependencies
RUN pip install --no-cache-dir --user watchfiles

USER appuser

CMD ["sh", "-c", "alembic upgrade head && python -m scripts.seed && watchfiles 'uvicorn main:app --host 0.0.0.0 --port 8000 --reload' /app --filter python"]

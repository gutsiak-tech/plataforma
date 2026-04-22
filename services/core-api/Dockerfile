# Build from repo root: docker build -f services/core-api/Dockerfile .
FROM python:3.11-slim

WORKDIR /app

# Install system deps for geopandas (gdal)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

COPY services/core-api/pyproject.toml ./
COPY services/core-api/app/ ./app/
RUN pip install --no-cache-dir .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

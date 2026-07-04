# EzAccess backend (FastAPI)
# Build context is the repository root so the dataset can be copied in.
#   docker build -f backend/Dockerfile -t ezaccess-backend .
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EZACCESS_DATASET_EN=/app/dataset/lieux-en.csv \
    EZACCESS_DATASET_FR=/app/dataset/lieux-fr.csv

WORKDIR /app

# Install dependencies first for better layer caching.
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Application code and dataset.
COPY backend/app ./app
COPY dataset ./dataset

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health').status==200 else 1)"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

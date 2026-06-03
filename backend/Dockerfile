# Stage 1: Build dependencies in a secure container layer
FROM python:3.13-slim AS builder
WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends gcc libc-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Runtime layer optimized for Google Cloud Run
FROM python:3.13-slim
# Set the working directory directly inside the app folder where your modules live
WORKDIR /workspace/app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# CRITICAL: Force python to treat the app directory as the root path for all module lookups
ENV PYTHONPATH="/workspace/app"

COPY --from=builder /install /usr/local

# Copy all backend contents into /workspace
COPY . /workspace/

EXPOSE 8080

# Launch directly using main:app because the working directory is already inside the app folder
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]


# Color Quantization – Backend

FastAPI service that performs server-side K-Means color quantization using
`scikit-learn`'s `MiniBatchKMeans` — the same algorithm used in the
`Color_Quantization.ipynb` notebook.

## Quick start

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The server will be available at http://localhost:8000.

## API

### GET /health
Returns `{"status": "ok"}`.

### POST /upload
Accepts `multipart/form-data` with:

| Field   | Type    | Description                              |
|---------|---------|------------------------------------------|
| `image` | file    | PNG / JPG / WEBP, max 15 MB             |
| `k`     | integer | Number of colors to keep (2 – 64)        |

Returns a **PNG image** (`image/png`) of the quantized result.

## Frontend integration

The frontend (`src/components/Quantizer.tsx`) already sends requests to
`/upload`.  When running locally, proxy that path to this server by adding
to `vite.config.ts`:

```ts
server: {
  proxy: {
    "/upload": "http://localhost:8000",
    "/health": "http://localhost:8000",
  },
},
```

In production (Docker / cloud), put both services behind a reverse proxy
(nginx / Caddy) so `/upload` routes to the FastAPI container.

## Docker (optional)

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

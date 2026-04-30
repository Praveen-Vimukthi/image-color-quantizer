# 🎨 Image Color Quantization

Reduce any image to a limited color palette using **K-Means clustering**. Upload an image, pick how many colors to keep, and instantly see the result side by side or in a before/after slider.

![image](https://img.shields.io/badge/Python-3.10+-blue?logo=python) ![image](https://img.shields.io/badge/FastAPI-backend-green?logo=fastapi) ![image](https://img.shields.io/badge/React-frontend-61DAFB?logo=react) ![image](https://img.shields.io/badge/TailwindCSS-styling-38BDF8?logo=tailwindcss)

---

## ✨ Features

- Upload PNG, JPG, or WEBP images (up to 15MB)
- Choose number of colors (K) from 2 to 32 using a slider
- Download the result as PNG, JPG, or WEBP
- Side by side view — original vs quantized
- Before / After slider view
- Powered by `MiniBatchKMeans` from scikit-learn (same as the notebook)

---

## 📁 Project Structure

```
├── frontend/         # React + TanStack Router + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Quantizer.tsx       # Main UI component
│   │   │   └── CompareSlider.tsx   # Before/after slider
│   │   └── ...
│   └── vite.config.ts              # Proxies /upload to backend
│
├── backend/          # FastAPI + scikit-learn
│   ├── main.py       # API with /upload endpoint
│   └── requirements.txt
│
└── Color_Quantization.ipynb        # Original research notebook
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Run the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check it's working:
- `http://localhost:8000/health` → `{"status":"ok"}`
- `http://localhost:8000/docs` → Interactive API docs

### 3. Run the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install       # or: bun install
npm run dev       # or: bun run dev
```

Then open `http://localhost:3000` in your browser.

> The frontend proxies `/upload` requests to the backend automatically via `vite.config.ts` — no extra config needed.

---

## 🔌 API

### `POST /upload`

Accepts `multipart/form-data`:

| Field    | Type    | Required | Description                          |
|----------|---------|----------|--------------------------------------|
| `image`  | file    | ✅       | PNG / JPG / WEBP, max 15MB           |
| `k`      | integer | ✅       | Number of colors to keep (2–64)      |
| `format` | string  | ❌       | Output format: `png`, `jpeg`, `webp` (default: `png`) |

Returns the quantized image in the requested format.

---

## 🧠 How It Works

1. The image is sent to the FastAPI backend
2. Pixels are extracted and normalized to `[0, 1]`
3. `MiniBatchKMeans` clusters pixels into `k` groups
4. Each pixel is replaced with its cluster's center color
5. The recolored image is returned to the frontend

This is identical to the approach in `Color_Quantization.ipynb`.

---

## 🛠 Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React, TanStack Router, Tailwind CSS, shadcn/ui |
| Backend  | FastAPI, Uvicorn |
| ML       | scikit-learn (MiniBatchKMeans), Pillow, NumPy |

---

## 📄 License

MIT

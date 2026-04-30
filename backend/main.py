from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

import numpy as np
from sklearn.cluster import MiniBatchKMeans
from PIL import Image
import io

app = FastAPI(title="Color Quantization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

MAX_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
MAX_DIM = 1200  


@app.get("/health")
def health():
    return {"status": "ok"}


SUPPORTED_FORMATS = {"png", "jpeg", "webp"}

@app.post("/upload")
async def upload(
    image: UploadFile = File(...),
    k: int = Form(8),
    format: str = Form("png"),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    raw = await image.read()
    if len(raw) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds 15 MB limit.")

    if not (2 <= k <= 64):
        raise HTTPException(status_code=400, detail="k must be between 2 and 64.")

    fmt = format.lower()
    if fmt not in SUPPORTED_FORMATS:
        raise HTTPException(status_code=400, detail=f"Format must be one of: {', '.join(SUPPORTED_FORMATS)}.")

    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=422, detail="Could not decode image.")

    w, h = img.size
    scale = min(1.0, MAX_DIM / max(w, h))
    if scale < 1.0:
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    image_arr = np.array(img)                        
    flat = image_arr.reshape(-1, 3).astype(np.float32) / 255.0  

    kmeans = MiniBatchKMeans(n_clusters=k, random_state=0, n_init="auto")
    kmeans.fit(flat)

    cluster_centers = kmeans.cluster_centers_          
    labels = kmeans.predict(flat)                     
    new_colors = cluster_centers[labels]               

    recolored = (new_colors.reshape(image_arr.shape) * 255).astype(np.uint8)
    out_img = Image.fromarray(recolored)

    pil_format = "JPEG" if fmt == "jpeg" else fmt.upper()
    mime_type = f"image/{fmt}"
    save_kwargs: dict = {}
    if pil_format == "JPEG":
        save_kwargs["quality"] = 92
        save_kwargs["optimize"] = True
    elif pil_format == "PNG":
        save_kwargs["optimize"] = True

    buf = io.BytesIO()
    out_img.save(buf, format=pil_format, **save_kwargs)
    buf.seek(0)

    return Response(
        content=buf.read(),
        media_type=mime_type,
        headers={"X-Colors-Used": str(k)},
    )

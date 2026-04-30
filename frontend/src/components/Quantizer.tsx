import { useCallback, useRef, useState } from "react";
import { quantizeImage } from "@/lib/quantize";
import { CompareSlider } from "./CompareSlider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type View = "split" | "compare";

export function Quantizer() {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [k, setK] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("split");
  const [dragOver, setDragOver] = useState(false);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | undefined | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Image is too large. Max 15MB.");
      return;
    }
    setOriginalFile(file);
    setResultUrl(null);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const process = async () => {
    if (!originalUrl || !originalFile) return;
    setLoading(true);
    setError(null);
    try {
      // Try backend first if available, else fall back to client-side
      let url: string | null = null;
      try {
        const fd = new FormData();
        fd.append("image", originalFile);
        fd.append("k", String(k));
        const res = await fetch("/upload", { method: "POST", body: fd });
        if (res.ok) {
          const ctype = res.headers.get("content-type") ?? "";
          if (ctype.includes("application/json")) {
            const j = await res.json();
            url = j.url || j.image || null;
          } else if (ctype.startsWith("image/")) {
            const blob = await res.blob();
            url = URL.createObjectURL(blob);
          }
        }
      } catch {
        // ignore — fallback to client
      }

      if (!url) {
        url = await quantizeImage(originalUrl, k);
      }
      setResultUrl(url);
    } catch (err) {
      console.error(err);
      setError("Failed to process image. Please try a different file.");
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!resultUrl) return;
    const ext = format === "jpeg" ? "jpg" : format;
    let href = resultUrl;
    // Convert via canvas if a non-PNG format is requested
    if (format !== "png") {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error("load failed"));
          img.src = resultUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d")!;
        if (format === "jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        href = canvas.toDataURL(`image/${format}`, 0.92);
      } catch {
        href = resultUrl;
      }
    }
    const a = document.createElement("a");
    a.href = href;
    a.download = `quantized-k${k}.${ext}`;
    a.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <header className="text-center mb-10 fade-in-up">
        <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full glass mb-5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          KMeans · Color Quantization
        </span>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          <span className="gradient-text">Image Color</span>{" "}
          <span className="text-foreground">Quantization</span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Upload an image, choose how many colors to keep, and watch it
          transform into a stylized, palette-reduced version in your browser.
        </p>
      </header>

      {/* Upload / Dropzone */}
      {!originalUrl && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`glass cursor-pointer rounded-3xl p-10 sm:p-16 text-center transition-all ${
            dragOver ? "ring-2 ring-primary scale-[1.01]" : ""
          }`}
        >
          <div className="mx-auto h-16 w-16 rounded-2xl grid place-items-center mb-5"
               style={{ background: "var(--gradient-primary)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 17V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Drop an image here</h2>
          <p className="text-muted-foreground mt-2">
            or <span className="text-primary font-medium">browse from your device</span> · PNG, JPG, WEBP up to 15MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Workspace */}
      {originalUrl && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="glass rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Number of colors (K)</label>
                <span className="text-sm font-semibold tabular-nums px-2.5 py-0.5 rounded-md bg-primary/10 text-primary">
                  {k}
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={32}
                step={1}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-full accent-[oklch(0.58_0.22_285)]"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>2</span><span>8</span><span>16</span><span>24</span><span>32</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border bg-white/5 hover:bg-white/10 text-foreground btn-soft"
              >
                Change image
              </button>
              <button
                onClick={process}
                disabled={loading}
                className="btn-hero px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner /> Processing…
                  </>
                ) : (
                  <>Process Image</>
                )}
              </button>
              <div className="inline-flex rounded-xl border border-border/60 bg-white/5 overflow-hidden backdrop-blur-sm">
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as "png" | "jpeg" | "webp")}
                  disabled={!resultUrl}
                >
                  <SelectTrigger
                    aria-label="Download format"
                    className="h-auto w-[92px] rounded-none border-0 border-r border-border/60 bg-transparent px-3 py-2.5 text-sm font-semibold text-foreground shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="min-w-[7rem] rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl shadow-xl"
                  >
                    <SelectItem value="png" className="cursor-pointer rounded-lg text-sm font-medium focus:bg-primary/15 focus:text-foreground">PNG</SelectItem>
                    <SelectItem value="jpeg" className="cursor-pointer rounded-lg text-sm font-medium focus:bg-primary/15 focus:text-foreground">JPG</SelectItem>
                    <SelectItem value="webp" className="cursor-pointer rounded-lg text-sm font-medium focus:bg-primary/15 focus:text-foreground">WEBP</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={download}
                  disabled={!resultUrl}
                  className="px-4 py-2.5 text-sm font-semibold bg-transparent hover:bg-white/10 text-foreground btn-soft disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </button>
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* View toggle */}
          {resultUrl && (
            <div className="flex justify-center">
              <div className="glass rounded-full p-1 inline-flex text-sm">
                {(["split", "compare"] as View[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-1.5 rounded-full transition ${
                      view === v
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {v === "split" ? "Side by side" : "Before / After"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Previews */}
          {view === "compare" && resultUrl ? (
            <div className="glass rounded-3xl p-3 sm:p-4">
              <CompareSlider before={originalUrl} after={resultUrl} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Panel label="Original">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="h-full w-full object-contain fade-swap"
                />
              </Panel>
              <Panel label="Quantized" loading={loading}>
                {resultUrl ? (
                  <img
                    key={resultUrl}
                    src={resultUrl}
                    alt="Quantized"
                    className="h-full w-full object-contain fade-swap"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-sm text-muted-foreground p-6 text-center">
                    {loading ? "Crunching colors…" : `Click "Process Image" to reduce to ${k} colors.`}
                  </div>
                )}
              </Panel>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </div>
      )}

      {error && !originalUrl && (
        <div className="mt-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
          {error}
        </div>
      )}
    </div>
  );
}

function Panel({
  label,
  children,
  loading,
}: {
  label: string;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="glass rounded-3xl p-3 sm:p-4 relative overflow-hidden">
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div
        className="rounded-2xl overflow-hidden bg-black/30 relative"
        style={{ aspectRatio: "4/3" }}
      >
        {children}
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-black/30 backdrop-blur-sm">
            <Spinner large />
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner({ large }: { large?: boolean }) {
  const size = large ? 36 : 16;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="animate-spin text-primary"
      fill="none"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

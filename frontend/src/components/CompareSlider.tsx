import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  before: string;
  after: string;
  alt?: string;
}

export function CompareSlider({ before, after, alt = "comparison" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = "touches" in e ? e.touches[0].clientX : e.clientX;
      move(x);
    };
    const onUp = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [move]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl select-none"
      style={{ aspectRatio: "4/3", background: "oklch(0.95 0.01 260)" }}
    >
      <img
        src={before}
        alt={`${alt} original`}
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      >
        <img
          src={after}
          alt={`${alt} processed`}
          className="absolute inset-0 h-full w-full object-contain fade-swap"
          draggable={false}
        />
      </div>

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_20px_rgba(0,0,0,0.35)]"
        style={{ left: `${pos}%`, transform: "translateX(-1px)" }}
      />
      <button
        type="button"
        aria-label="Drag to compare"
        onMouseDown={() => (dragging.current = true)}
        onTouchStart={() => (dragging.current = true)}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 grid place-items-center h-10 w-10 rounded-full bg-white shadow-lg cursor-ew-resize border border-border"
        style={{ left: `${pos}%` }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 6L22 12L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur">
        Original
      </span>
      <span className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur">
        Quantized
      </span>
    </div>
  );
}

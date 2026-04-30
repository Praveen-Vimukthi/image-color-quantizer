import { createFileRoute } from "@tanstack/react-router";
import { Quantizer } from "@/components/Quantizer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Image Color Quantization · KMeans Palette Reducer" },
      {
        name: "description",
        content:
          "Upload an image and reduce its palette with KMeans color quantization. Fast, in-browser, with side-by-side and before/after comparison.",
      },
      { property: "og:title", content: "Image Color Quantization" },
      {
        property: "og:description",
        content:
          "Reduce any image to a custom number of colors using KMeans — runs entirely in your browser.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="min-h-screen relative">
      <div className="bg-blobs" aria-hidden="true">
        <span className="b1" />
        <span className="b2" />
        <span className="b3" />
        <span className="b4" />
      </div>
      <Quantizer />
    </main>
  );
}

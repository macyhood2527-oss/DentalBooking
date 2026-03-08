"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type GalleryImageRow = {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
};

export default function InsideBrightSmileGallery() {
  const [galleryImages, setGalleryImages] = useState<GalleryImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    async function loadGalleryImages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("homepage_gallery_images")
        .select("id, image_url, caption, display_order")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error) {
        setGalleryImages((data || []) as GalleryImageRow[]);
      }
      setLoading(false);
    }

    loadGalleryImages();
    return undefined;
  }, []);

  function closeLightbox() {
    setActiveIndex(null);
  }

  function showPrevious() {
    setActiveIndex((current) => {
      if (current === null || galleryImages.length === 0) return current;
      return current === 0 ? galleryImages.length - 1 : current - 1;
    });
  }

  function showNext() {
    setActiveIndex((current) => {
      if (current === null || galleryImages.length === 0) return current;
      return current === galleryImages.length - 1 ? 0 : current + 1;
    });
  }

  useEffect(() => {
    if (activeIndex === null) return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => {
          if (current === null || galleryImages.length === 0) return current;
          return current === 0 ? galleryImages.length - 1 : current - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => {
          if (current === null || galleryImages.length === 0) return current;
          return current === galleryImages.length - 1 ? 0 : current + 1;
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, galleryImages.length]);

  const hasImages = galleryImages.length > 0;
  const activeImage = useMemo(() => {
    if (activeIndex === null) return null;
    return galleryImages[activeIndex] || null;
  }, [activeIndex, galleryImages]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--primary-dark)]">
          Gallery
        </p>
        <h2 className="mt-2 text-3xl font-bold text-[var(--foreground)]">Inside BrightSmile</h2>
        <p className="mt-2 text-[var(--muted)]">A quick look at our clinic environment.</p>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted)]">Loading gallery...</p>
        </div>
      ) : !hasImages ? (
        <div className="glass-card rounded-2xl border border-[var(--border)] p-5">
          <p className="text-sm text-[var(--muted)]">No gallery images yet.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className="glass-card group min-w-[220px] overflow-hidden rounded-2xl text-left shadow-sm transition hover:shadow-xl sm:min-w-[260px]"
            >
              <img
                src={image.image_url}
                alt={image.caption?.trim() || `Inside BrightSmile ${index + 1}`}
                className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {activeImage && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001d39]/70 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={closeLightbox}
              className="glass-soft absolute right-3 top-3 z-10 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              Close
            </button>

            <button
              type="button"
              onClick={showPrevious}
              className="glass-soft absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              ◀
            </button>

            <button
              type="button"
              onClick={showNext}
              className="glass-soft absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
            >
              ▶
            </button>

            <div className="glass-card overflow-hidden rounded-2xl border border-[var(--border)]">
              <img
                src={activeImage.image_url}
                alt={activeImage.caption?.trim() || `Inside BrightSmile ${activeIndex + 1}`}
                className="max-h-[80vh] w-full object-contain bg-black/10"
              />
            </div>

            <p className="mt-3 text-center text-sm text-white">
              {activeIndex + 1} / {galleryImages.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminSubnav from "../../../components/AdminSubnav";
import AdminToast from "../../../components/AdminToast";
import { supabase } from "../../../lib/supabase";

type GalleryImageRow = {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
};

const MAX_IMAGES = 5;

function extractStoragePath(publicUrl: string) {
  const marker = "/storage/v1/object/public/homepage-gallery/";
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export default function AdminGalleryPage() {
  const [rows, setRows] = useState<GalleryImageRow[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadGallery() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("homepage_gallery_images")
        .select("id, image_url, caption, display_order, created_at")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setRows((data || []) as GalleryImageRow[]);
      setLoading(false);
    }

    loadGallery();
    return undefined;
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const nextOrder = useMemo(() => {
    const used = new Set(rows.map((row) => row.display_order));
    for (let index = 1; index <= MAX_IMAGES; index += 1) {
      if (!used.has(index)) return index;
    }
    return null;
  }, [rows]);

  async function uploadImage(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = `homepage/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("homepage-gallery")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("homepage-gallery").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setToastMessage("");

    if (rows.length >= MAX_IMAGES) {
      setErrorMessage("Maximum of 5 gallery images reached.");
      return;
    }

    if (!selectedImageFile) {
      setErrorMessage("Please select an image to upload.");
      return;
    }

    if (!nextOrder) {
      setErrorMessage("No display slot available. Remove an image first.");
      return;
    }

    setSaving(true);

    let imageUrl = "";
    try {
      imageUrl = await uploadImage(selectedImageFile);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Image upload failed.");
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("homepage_gallery_images")
      .insert({
        image_url: imageUrl,
        caption: caption.trim() || null,
        display_order: nextOrder,
      })
      .select("id, image_url, caption, display_order, created_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setRows((prev) =>
      [...prev, data as GalleryImageRow].sort((a, b) => a.display_order - b.display_order)
    );
    setSelectedImageFile(null);
    setCaption("");
    setToastMessage("Gallery image uploaded.");
    setSaving(false);
  }

  async function handleDelete(row: GalleryImageRow) {
    setErrorMessage("");
    setToastMessage("");
    setDeletingMap((prev) => ({ ...prev, [row.id]: true }));

    const { error } = await supabase.from("homepage_gallery_images").delete().eq("id", row.id);

    if (error) {
      setErrorMessage(error.message);
      setDeletingMap((prev) => ({ ...prev, [row.id]: false }));
      return;
    }

    const path = extractStoragePath(row.image_url);
    if (path) {
      await supabase.storage.from("homepage-gallery").remove([path]);
    }

    setRows((prev) => prev.filter((item) => item.id !== row.id));
    setToastMessage("Gallery image removed.");
    setDeletingMap((prev) => ({ ...prev, [row.id]: false }));
  }

  return (
    <main className="relative overflow-hidden pb-14">
      <div className="absolute inset-0 -z-10 shell-bg" />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <AdminToast message={toastMessage} onClose={() => setToastMessage("")} />
        <section className="mb-8 glass-card rounded-[30px] border border-[var(--border)] p-7 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary-dark)]">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            BrightSmile Admin
          </div>
          <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            Homepage Gallery
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--muted)]">
            Upload and manage the 5 images shown in the homepage clinic gallery.
          </p>
        </section>
        <AdminSubnav />

        <section className="mb-6 rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Add Gallery Image</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
              {rows.length} / {MAX_IMAGES}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
              className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm"
            />
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption (optional)"
              className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
            />
            <button
              type="submit"
              disabled={saving || rows.length >= MAX_IMAGES}
              className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              {saving ? "Uploading..." : "Upload"}
            </button>
          </form>

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
        </section>

        {loading ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[var(--muted)]">Loading gallery images...</p>
          </section>
        ) : rows.length === 0 ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[var(--foreground)]">No gallery images yet</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Upload up to 5 images to show your clinic on the homepage.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {rows.map((row) => (
              <article
                key={row.id}
                className="glass-card overflow-hidden rounded-2xl border border-[var(--border)]"
              >
                <img src={row.image_url} alt={row.caption?.trim() || "Gallery image"} className="h-40 w-full object-cover" />
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {row.caption?.trim() || "No caption"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Slot {row.display_order}</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(row)}
                    disabled={deletingMap[row.id]}
                    className="mt-3 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingMap[row.id] ? "Removing..." : "Remove"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

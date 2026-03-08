"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminSubnav from "../../../components/AdminSubnav";
import AdminToast from "../../../components/AdminToast";
import { supabase } from "../../../lib/supabase";

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  image_url: string | null;
};

type ServiceForm = {
  name: string;
  description: string;
  price: string;
  duration_minutes: string;
  is_active: boolean;
  image_url: string;
};

const initialForm: ServiceForm = {
  name: "",
  description: "",
  price: "",
  duration_minutes: "",
  is_active: true,
  image_url: "",
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadServices() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, price, duration_minutes, is_active, image_url")
        .order("name", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setServices((data || []) as ServiceRow[]);
      setLoading(false);
    }

    loadServices();
    return undefined;
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
    setSelectedImageFile(null);
    setImagePreviewUrl("");
  }

  function startEdit(service: ServiceRow) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description || "",
      price: String(service.price ?? ""),
      duration_minutes: String(service.duration_minutes ?? ""),
      is_active: Boolean(service.is_active),
      image_url: service.image_url || "",
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(service.image_url || "");
    setToastMessage("");
    setErrorMessage("");
  }

  async function uploadImage(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `service-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const filePath = `services/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("service-images")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("service-images").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setToastMessage("");

    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();
    const parsedPrice = Number(form.price);
    const parsedDuration = Number(form.duration_minutes);

    if (!trimmedName) {
      setErrorMessage("Service name is required.");
      return;
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage("Price must be a valid non-negative number.");
      return;
    }
    if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      setErrorMessage("Duration must be a valid number greater than 0.");
      return;
    }

    setSaving(true);
    let nextImageUrl = form.image_url || null;

    if (selectedImageFile) {
      try {
        nextImageUrl = await uploadImage(selectedImageFile);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Image upload failed.");
        setSaving(false);
        return;
      }
    }

    if (editingId) {
      const { data, error } = await supabase
        .from("services")
        .update({
          name: trimmedName,
          description: trimmedDescription,
          price: parsedPrice,
          duration_minutes: parsedDuration,
          is_active: form.is_active,
          image_url: nextImageUrl,
        })
        .eq("id", editingId)
        .select("id, name, description, price, duration_minutes, is_active, image_url")
        .single();

      if (error) {
        setErrorMessage(error.message);
        setSaving(false);
        return;
      }

      setServices((prev) => prev.map((service) => (service.id === editingId ? data : service)));
      setToastMessage("Service updated successfully.");
      resetForm();
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("services")
      .insert({
        name: trimmedName,
        description: trimmedDescription,
        price: parsedPrice,
        duration_minutes: parsedDuration,
        is_active: form.is_active,
        image_url: nextImageUrl,
      })
      .select("id, name, description, price, duration_minutes, is_active, image_url")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setServices((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setToastMessage("Service created successfully.");
    resetForm();
    setSaving(false);
  }

  async function toggleActive(service: ServiceRow) {
    setErrorMessage("");
    setToastMessage("");
    setTogglingMap((prev) => ({ ...prev, [service.id]: true }));

    const nextValue = !service.is_active;
    const { data, error } = await supabase
      .from("services")
      .update({ is_active: nextValue })
      .eq("id", service.id)
      .select("id, name, description, price, duration_minutes, is_active, image_url")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setTogglingMap((prev) => ({ ...prev, [service.id]: false }));
      return;
    }

    setServices((prev) => prev.map((item) => (item.id === service.id ? data : item)));
    setToastMessage(`Service ${nextValue ? "activated" : "deactivated"} successfully.`);
    setTogglingMap((prev) => ({ ...prev, [service.id]: false }));
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
            Service Management
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--muted)]">
            Create, update, and manage service availability for your clinic.
          </p>
        </section>
        <AdminSubnav />

        <section className="mb-6 rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {editingId ? "Edit Service" : "Create Service"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--primary-dark)] transition hover:bg-[var(--background)]"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="service-name" className="mb-1.5 block text-sm font-medium">
                Name
              </label>
              <input
                id="service-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white p-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                required
              />
            </div>

            <div>
              <label htmlFor="service-price" className="mb-1.5 block text-sm font-medium">
                Price
              </label>
              <input
                id="service-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white p-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="service-description" className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="service-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-white p-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="service-image" className="mb-1.5 block text-sm font-medium">
                Service Image (optional)
              </label>
              <input
                id="service-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setSelectedImageFile(file);
                  if (file) {
                    setImagePreviewUrl(URL.createObjectURL(file));
                  } else {
                    setImagePreviewUrl(form.image_url || "");
                  }
                }}
                className="w-full rounded-xl border border-[var(--border)] bg-white p-3 text-sm"
              />
              {(imagePreviewUrl || form.image_url) && (
                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-white">
                  <img
                    src={imagePreviewUrl || form.image_url}
                    alt="Service preview"
                    className="h-36 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="service-duration" className="mb-1.5 block text-sm font-medium">
                Duration (minutes)
              </label>
              <input
                id="service-duration"
                type="number"
                min="1"
                step="1"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, duration_minutes: e.target.value }))
                }
                className="w-full rounded-xl border border-[var(--border)] bg-white p-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                required
              />
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">Active service</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? editingId
                    ? "Saving changes..."
                    : "Creating service..."
                  : editingId
                    ? "Save Changes"
                    : "Create Service"}
              </button>
            </div>
          </form>

          {errorMessage && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
        </section>

        {loading ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[var(--muted)]">Loading services...</p>
          </section>
        ) : services.length === 0 ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[var(--foreground)]">No services found</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Create your first service using the form above.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_36px_rgba(20,184,166,0.09)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(20,184,166,0.14)]"
              >
                {service.image_url ? (
                  <div className="mb-3 overflow-hidden rounded-2xl border border-[var(--border)]">
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--muted)]">
                    No image uploaded
                  </div>
                )}

                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">{service.name}</h3>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                      service.is_active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {service.is_active ? "active" : "inactive"}
                  </span>
                </div>

                <p className="text-sm leading-6 text-[var(--muted)]">
                  {service.description || "No description provided."}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                      Price
                    </p>
                    <p className="mt-1 font-semibold text-[var(--foreground)]">₱{service.price}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                      Duration
                    </p>
                    <p className="mt-1 font-semibold text-[var(--foreground)]">
                      {service.duration_minutes} mins
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(service)}
                    className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--primary-dark)] transition hover:bg-[var(--background)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(service)}
                    disabled={togglingMap[service.id]}
                    className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {togglingMap[service.id]
                      ? "Saving..."
                      : service.is_active
                        ? "Set Inactive"
                        : "Set Active"}
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

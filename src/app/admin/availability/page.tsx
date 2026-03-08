"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminSubnav from "../../../components/AdminSubnav";
import AdminToast from "../../../components/AdminToast";
import { supabase } from "../../../lib/supabase";

type UnavailableDate = {
  id: string;
  date: string;
  reason: string | null;
  created_at: string;
};

function formatDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AdminAvailabilityPage() {
  const [rows, setRows] = useState<UnavailableDate[]>([]);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadDates() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("unavailable_dates")
        .select("id, date, reason, created_at")
        .order("date", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setRows((data || []) as UnavailableDate[]);
      setLoading(false);
    }

    loadDates();
    return undefined;
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  async function handleAddDate(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setToastMessage("");

    if (!date) {
      setErrorMessage("Please choose a date.");
      return;
    }

    const exists = rows.some((row) => row.date === date);
    if (exists) {
      setErrorMessage("That date is already marked unavailable.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("unavailable_dates")
      .insert({ date, reason: reason.trim() || null })
      .select("id, date, reason, created_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setRows((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
    setDate("");
    setReason("");
    setToastMessage("Unavailable date added.");
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setErrorMessage("");
    setToastMessage("");
    setDeletingMap((prev) => ({ ...prev, [id]: true }));

    const { error } = await supabase.from("unavailable_dates").delete().eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      setDeletingMap((prev) => ({ ...prev, [id]: false }));
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== id));
    setToastMessage("Unavailable date removed.");
    setDeletingMap((prev) => ({ ...prev, [id]: false }));
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
            Unavailable Dates
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--muted)]">
            Mark holiday closures, day-offs, and emergency closures to block bookings.
          </p>
        </section>
        <AdminSubnav />

        <section className="mb-6 rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-7">
          <h2 className="mb-4 text-xl font-semibold text-[var(--foreground)]">Add Unavailable Date</h2>
          <form onSubmit={handleAddDate} className="grid gap-4 md:grid-cols-[220px_1fr_auto]">
            <input
              type="date"
              min={getTodayDateString()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white p-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
              required
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full rounded-xl border border-[var(--border)] bg-white p-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Date"}
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
            <p className="text-[var(--muted)]">Loading unavailable dates...</p>
          </section>
        ) : rows.length === 0 ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[var(--foreground)]">No unavailable dates set</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Add a date above to block bookings for that day.
            </p>
          </section>
        ) : (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-5 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-6">
            <div className="space-y-3">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{formatDate(row.date)}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{row.reason || "No reason provided."}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id)}
                    disabled={deletingMap[row.id]}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingMap[row.id] ? "Removing..." : "Remove"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

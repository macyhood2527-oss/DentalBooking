"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type AppointmentRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  services:
    | {
        name: string;
        description: string;
      }
    | {
        name: string;
        description: string;
      }[]
    | null;
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

function formatTime(value: string) {
  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setErrorMessage(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setErrorMessage("Please log in to view your appointments.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          services (
            name,
            description
          )
        `
        )
        .eq("user_id", user.id)
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setAppointments((data || []) as AppointmentRow[]);
      setLoading(false);
    }

    loadAppointments();
    return undefined;
  }, []);

  const hasAppointments = appointments.length > 0;

  const statusStyles = useMemo(
    () => ({
      confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
      pending: "border-amber-200 bg-amber-50 text-amber-700",
      cancelled: "border-rose-200 bg-rose-50 text-rose-700",
      completed: "border-sky-200 bg-sky-50 text-sky-700",
    }),
    []
  );

  return (
    <main className="relative overflow-hidden pb-14">
      <div className="absolute inset-0 -z-10 shell-bg" />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-8 glass-card rounded-[30px] border border-[var(--border)] p-7 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary-dark)]">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            BrightSmile Dental Clinic
          </div>
          <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            My Appointments
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
            View your upcoming and past dental bookings in one place.
          </p>
        </section>

        {loading ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[var(--muted)]">Loading your appointments...</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[26px] border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </section>
        ) : !hasAppointments ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[var(--foreground)]">No appointments yet</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Once you book a service, your schedule will appear here.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:gap-5">
            {appointments.map((appointment) => {
              const service = Array.isArray(appointment.services)
                ? appointment.services[0]
                : appointment.services;

              const normalizedStatus = appointment.status.toLowerCase();
              const badgeClasses =
                statusStyles[normalizedStatus as keyof typeof statusStyles] ||
                "border-slate-200 bg-slate-50 text-slate-700";

              return (
                <article
                  key={appointment.id}
                  className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[0_14px_36px_rgba(20,184,166,0.09)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(20,184,166,0.14)] sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">
                        {service?.name || "Service"}
                      </h2>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                        {service?.description || "No description available."}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${badgeClasses}`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                        Date
                      </p>
                      <p className="mt-1 font-medium text-[var(--foreground)]">
                        {formatDate(appointment.appointment_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                        Time
                      </p>
                      <p className="mt-1 font-medium text-[var(--foreground)]">
                        {formatTime(appointment.appointment_time)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-[var(--border)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                      Notes
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {appointment.notes?.trim() || "No notes added."}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

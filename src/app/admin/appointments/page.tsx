"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSubnav from "../../../components/AdminSubnav";
import AdminToast from "../../../components/AdminToast";
import { supabase } from "../../../lib/supabase";

type Status = "pending" | "confirmed" | "completed" | "cancelled";

type AppointmentRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
      }
    | {
        full_name: string | null;
        email: string | null;
      }[]
    | null;
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

export default function AdminPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMap, setStatusMap] = useState<Record<string, Status>>({});
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          appointment_time,
          status,
          notes,
          profiles (
            full_name,
            email
          ),
          services (
            name,
            description
          )
        `
        )
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      const rows = (data || []) as AppointmentRow[];
      setAppointments(rows);
      setStatusMap(
        rows.reduce<Record<string, Status>>((acc, row) => {
          const current = row.status.toLowerCase();
          acc[row.id] =
            current === "pending" ||
            current === "confirmed" ||
            current === "completed" ||
            current === "cancelled"
              ? current
              : "pending";
          return acc;
        }, {})
      );
      setLoading(false);
    }

    loadAppointments();
    return undefined;
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const statusStyles = useMemo(
    () => ({
      confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
      pending: "border-amber-200 bg-amber-50 text-amber-700",
      cancelled: "border-rose-200 bg-rose-50 text-rose-700",
      completed: "border-sky-200 bg-sky-50 text-sky-700",
    }),
    []
  );

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return appointments;

    return appointments.filter((appointment) => {
      const profile = Array.isArray(appointment.profiles)
        ? appointment.profiles[0]
        : appointment.profiles;
      const service = Array.isArray(appointment.services)
        ? appointment.services[0]
        : appointment.services;

      const patientName = (profile?.full_name || "").toLowerCase();
      const serviceName = (service?.name || "").toLowerCase();
      return patientName.includes(query) || serviceName.includes(query);
    });
  }, [appointments, searchTerm]);

  async function handleStatusUpdate(appointmentId: string) {
    const nextStatus = statusMap[appointmentId];
    if (!nextStatus) return;

    setSavingMap((prev) => ({ ...prev, [appointmentId]: true }));
    setErrorMessage("");

    const { error } = await supabase
      .from("appointments")
      .update({ status: nextStatus })
      .eq("id", appointmentId);

    if (error) {
      setErrorMessage(error.message);
      setSavingMap((prev) => ({ ...prev, [appointmentId]: false }));
      return;
    }

    setAppointments((prev) =>
      prev.map((row) => (row.id === appointmentId ? { ...row, status: nextStatus } : row))
    );
    setToastMessage("Appointment status updated.");
    setSavingMap((prev) => ({ ...prev, [appointmentId]: false }));
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
            Appointment Management
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--muted)]">
            Review all patient bookings and update appointment statuses from one dashboard.
          </p>
        </section>
        <AdminSubnav />

        {loading ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[var(--muted)]">Loading appointments...</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[26px] border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </section>
        ) : appointments.length === 0 ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-[var(--foreground)]">No appointments found</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              New bookings will appear here once patients start scheduling.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[26px] border border-[var(--border)] bg-white shadow-[0_18px_45px_rgba(20,184,166,0.08)]">
            <div className="border-b border-[var(--border)] p-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name or service name..."
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)]">
                <thead className="bg-[var(--background)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                      Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                      Schedule
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                      Notes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredAppointments.map((appointment) => {
                    const profile = Array.isArray(appointment.profiles)
                      ? appointment.profiles[0]
                      : appointment.profiles;
                    const service = Array.isArray(appointment.services)
                      ? appointment.services[0]
                      : appointment.services;

                    const currentStatus = appointment.status.toLowerCase();
                    const statusBadge =
                      statusStyles[currentStatus as keyof typeof statusStyles] ||
                      "border-slate-200 bg-slate-50 text-slate-700";

                    return (
                      <tr key={appointment.id} className="align-top hover:bg-[#f9fffe]">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-[var(--foreground)]">
                            {profile?.full_name?.trim() || "Unnamed patient"}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {profile?.email?.trim() || "No email"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-[var(--foreground)]">
                            {service?.name || "Service"}
                          </p>
                          <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">
                            {service?.description || "No description available."}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-[var(--foreground)]">
                            {formatDate(appointment.appointment_date)}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {formatTime(appointment.appointment_time)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
                            {appointment.notes?.trim() || "No notes added."}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`mb-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${statusBadge}`}
                          >
                            {appointment.status}
                          </span>
                          <div className="flex items-center gap-2">
                            <select
                              value={statusMap[appointment.id] || "pending"}
                              onChange={(e) =>
                                setStatusMap((prev) => ({
                                  ...prev,
                                  [appointment.id]: e.target.value as Status,
                                }))
                              }
                              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                            >
                              <option value="pending">pending</option>
                              <option value="confirmed">confirmed</option>
                              <option value="completed">completed</option>
                              <option value="cancelled">cancelled</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(appointment.id)}
                              disabled={savingMap[appointment.id]}
                              className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingMap[appointment.id] ? "Saving..." : "Update"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredAppointments.length === 0 && (
              <div className="border-t border-[var(--border)] p-6 text-center text-sm text-[var(--muted)]">
                No appointments match your search.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

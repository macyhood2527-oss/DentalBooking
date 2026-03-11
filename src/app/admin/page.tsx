"use client";

import { BarChart, CalendarCheck, CircleCheckBig, Clock3, Users, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminQuickActionCard from "../../components/AdminQuickActionCard";
import AdminStatCard from "../../components/AdminStatCard";
import AdminSubnav from "../../components/AdminSubnav";
import { supabase } from "../../lib/supabase";

type AppointmentRow = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  profiles:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
  services:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function getLocalDateYMD() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export default function AdminDashboardPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [activeServices, setActiveServices] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      const [appointmentsResult, servicesResult] = await Promise.all([
        supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_date,
            appointment_time,
            status,
            profiles (
              full_name
            ),
            services (
              name
            )
          `
          )
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true }),
        supabase.from("services").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);

      if (appointmentsResult.error) {
        setErrorMessage(appointmentsResult.error.message);
        setLoading(false);
        return;
      }

      if (servicesResult.error) {
        setErrorMessage(servicesResult.error.message);
        setLoading(false);
        return;
      }

      setAppointments((appointmentsResult.data || []) as AppointmentRow[]);
      setActiveServices(servicesResult.count || 0);
      setLoading(false);
    }

    loadDashboard();
    return undefined;
  }, []);

  const summary = useMemo(() => {
    return appointments.reduce(
      (acc, row) => {
        acc.total += 1;
        const normalized = row.status.toLowerCase();
        if (normalized === "pending") acc.pending += 1;
        else if (normalized === "confirmed") acc.confirmed += 1;
        else if (normalized === "completed") acc.completed += 1;
        else if (normalized === "cancelled") acc.cancelled += 1;
        return acc;
      },
      { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
    );
  }, [appointments]);

  const todayAppointments = useMemo(() => {
    const today = getLocalDateYMD();
    return appointments.filter((row) => row.appointment_date === today);
  }, [appointments]);

  const patientCount = useMemo(() => {
    return new Set(
      appointments
        .map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return profile?.full_name?.trim() || null;
        })
        .filter((name): name is string => Boolean(name))
    ).size;
  }, [appointments]);

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

      <div className="mx-auto max-w-7xl px-6 py-10">
        <AdminPageHeader
          title="Dashboard Overview"
          description="Track clinic performance, monitor today&apos;s schedule, and jump into admin actions."
        />
        <AdminSubnav />

        {loading ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[var(--muted)]">Loading admin dashboard...</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[26px] border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <AdminStatCard
                label="Appointments"
                value={summary.total}
                icon={<CalendarCheck className="h-5 w-5" strokeWidth={1.8} />}
              />
              <AdminStatCard
                label="Patients"
                value={patientCount}
                icon={<Users className="h-5 w-5" strokeWidth={1.8} />}
              />
              <AdminStatCard
                label="Reports"
                value={activeServices}
                icon={<BarChart className="h-5 w-5" strokeWidth={1.8} />}
              />
              <AdminStatCard
                label="Pending"
                value={summary.pending}
                tone="pending"
                icon={<Clock3 className="h-5 w-5" strokeWidth={1.8} />}
              />
              <AdminStatCard
                label="Confirmed"
                value={summary.confirmed}
                tone="confirmed"
                icon={<CalendarCheck className="h-5 w-5" strokeWidth={1.8} />}
              />
              <AdminStatCard
                label="Completed"
                value={summary.completed}
                tone="completed"
                icon={<CircleCheckBig className="h-5 w-5" strokeWidth={1.8} />}
              />
              <AdminStatCard
                label="Cancelled"
                value={summary.cancelled}
                tone="cancelled"
                icon={<XCircle className="h-5 w-5" strokeWidth={1.8} />}
              />
            </section>

            <section className="mb-2">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Operations</h2>
            </section>
            <section className="mb-6 grid gap-4 md:grid-cols-3">
              <AdminQuickActionCard
                href="/admin/appointments"
                title="Manage Appointments"
                description="Review all bookings and update statuses."
                buttonText="Open Appointments"
              />
              <AdminQuickActionCard
                href="/admin/calendar"
                title="Monthly Calendar"
                description="See bookings per day and view unavailable dates."
                buttonText="Open Calendar"
              />
              <AdminQuickActionCard
                href="/admin/services"
                title="Manage Services"
                description="Create, edit, and activate/deactivate services."
                buttonText="Open Services"
              />
            </section>

            <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  Today&apos;s Appointments
                </h2>
                <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--primary-dark)]">
                  {todayAppointments.length} today
                </span>
              </div>

              {todayAppointments.length === 0 ? (
                <p className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted)]">
                  No appointments scheduled for today.
                </p>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((appointment) => {
                    const profile = Array.isArray(appointment.profiles)
                      ? appointment.profiles[0]
                      : appointment.profiles;
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
                        className="rounded-2xl border border-[var(--border)] bg-white p-4 transition hover:bg-[#f9fffe]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">
                              {profile?.full_name?.trim() || "Unnamed patient"}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {service?.name || "Service"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--primary-dark)]">
                              {formatTime(appointment.appointment_time)}
                            </span>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${badgeClasses}`}
                            >
                              {appointment.status}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

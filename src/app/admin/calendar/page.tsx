"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSubnav from "../../../components/AdminSubnav";
import { supabase } from "../../../lib/supabase";

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

type UnavailableDateRow = {
  date: string;
  reason: string | null;
};

type CalendarDay = {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatReadableDate(dateKey: string) {
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startKey: toDateKey(start),
    endKey: toDateKey(end),
  };
}

function buildMonthGrid(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: CalendarDay[] = [];

  for (let index = 0; index < startWeekday; index += 1) {
    const date = new Date(year, month, index - startWeekday + 1);
    days.push({ date, key: toDateKey(date), inCurrentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    days.push({ date, key: toDateKey(date), inCurrentMonth: true });
  }

  const remainder = days.length % 7;
  const trailingCount = remainder === 0 ? 0 : 7 - remainder;

  for (let index = 1; index <= trailingCount; index += 1) {
    const date = new Date(year, month + 1, index);
    days.push({ date, key: toDateKey(date), inCurrentMonth: false });
  }

  return days;
}

export default function AdminCalendarPage() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey(new Date()));
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadMonthData() {
      setLoading(true);
      setErrorMessage("");

      const { startKey, endKey } = getMonthRange(visibleMonth);

      const [appointmentsResult, unavailableResult] = await Promise.all([
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
          .gte("appointment_date", startKey)
          .lte("appointment_date", endKey)
          .order("appointment_date", { ascending: true })
          .order("appointment_time", { ascending: true }),
        supabase
          .from("unavailable_dates")
          .select("date, reason")
          .gte("date", startKey)
          .lte("date", endKey)
          .order("date", { ascending: true }),
      ]);

      if (appointmentsResult.error) {
        setErrorMessage(appointmentsResult.error.message);
        setLoading(false);
        return;
      }

      if (unavailableResult.error) {
        setErrorMessage(unavailableResult.error.message);
        setLoading(false);
        return;
      }

      setAppointments((appointmentsResult.data || []) as AppointmentRow[]);
      setUnavailableDates((unavailableResult.data || []) as UnavailableDateRow[]);
      setLoading(false);
    }

    loadMonthData();
    return undefined;
  }, [visibleMonth]);

  const calendarDays = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);

  const appointmentMap = useMemo(() => {
    return appointments.reduce<Record<string, AppointmentRow[]>>((acc, row) => {
      if (!acc[row.appointment_date]) acc[row.appointment_date] = [];
      acc[row.appointment_date].push(row);
      return acc;
    }, {});
  }, [appointments]);

  const unavailableMap = useMemo(() => {
    return unavailableDates.reduce<Record<string, string | null>>((acc, row) => {
      acc[row.date] = row.reason;
      return acc;
    }, {});
  }, [unavailableDates]);

  const todayKey = toDateKey(new Date());
  const selectedAppointments = appointmentMap[selectedDate] || [];
  const selectedUnavailableReason = unavailableMap[selectedDate];

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
        <section className="mb-8 glass-card rounded-[30px] border border-[var(--border)] p-7 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary-dark)]">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            BrightSmile Admin
          </div>
          <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            Appointment Calendar
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--muted)]">
            View your monthly schedule, spot unavailable dates, and inspect daily appointments.
          </p>
        </section>
        <AdminSubnav />

        {loading ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[var(--muted)]">Loading calendar...</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[26px] border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          </section>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr]">
            <article className="rounded-[26px] border border-[var(--border)] bg-white p-4 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--primary-dark)] transition hover:bg-[var(--background)]"
                >
                  Previous
                </button>

                <h2 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                  {formatMonthYear(visibleMonth)}
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setVisibleMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                  className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--primary-dark)] transition hover:bg-[var(--background)]"
                >
                  Next
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayLabel) => (
                  <div
                    key={dayLabel}
                    className="pb-1 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
                  >
                    {dayLabel}
                  </div>
                ))}

                {calendarDays.map((day) => {
                  const count = appointmentMap[day.key]?.length || 0;
                  const isUnavailable = Boolean(unavailableMap[day.key]);
                  const isToday = day.key === todayKey;
                  const isSelected = day.key === selectedDate;

                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => setSelectedDate(day.key)}
                      className={`min-h-[96px] rounded-xl border p-2 text-left transition ${
                        day.inCurrentMonth
                          ? "border-[var(--border)] bg-white hover:bg-[var(--background)]"
                          : "border-[var(--border)]/50 bg-[#f8fbff] text-[var(--muted)]/70"
                      } ${isSelected ? "ring-2 ring-[var(--accent)]" : ""}`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isToday
                              ? "rounded-full border border-[var(--accent)] px-2 py-0.5 text-[var(--primary-dark)]"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>

                        {count > 0 && (
                          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                            {count}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        {count > 0 && (
                          <p className="text-[11px] font-medium text-[var(--muted)]">
                            {count} appointment{count > 1 ? "s" : ""}
                          </p>
                        )}

                        {isUnavailable && (
                          <span className="inline-flex rounded-full border border-rose-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-rose-700">
                            Closed
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[26px] border border-[var(--border)] bg-white p-5 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-6">
              <h3 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
                {formatReadableDate(selectedDate)}
              </h3>

              {selectedUnavailableReason !== undefined && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-sm font-semibold text-rose-700">Closed</p>
                  <p className="mt-1 text-sm text-rose-700">
                    {selectedUnavailableReason || "No reason provided."}
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-3">
                {selectedAppointments.length === 0 ? (
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--muted)]">
                    No appointments on this date.
                  </p>
                ) : (
                  selectedAppointments.map((appointment) => {
                    const profile = Array.isArray(appointment.profiles)
                      ? appointment.profiles[0]
                      : appointment.profiles;
                    const service = Array.isArray(appointment.services)
                      ? appointment.services[0]
                      : appointment.services;

                    const normalizedStatus = appointment.status.toLowerCase();
                    const badgeClass =
                      statusStyles[normalizedStatus as keyof typeof statusStyles] ||
                      "border-slate-200 bg-slate-50 text-slate-700";

                    return (
                      <article
                        key={appointment.id}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-semibold text-[var(--foreground)]">
                            {formatTime(appointment.appointment_time)}
                          </p>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${badgeClass}`}
                          >
                            {appointment.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                          {service?.name || "Service"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {profile?.full_name?.trim() || "Unnamed patient"}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            </article>
          </section>
        )}
      </div>
    </main>
  );
}

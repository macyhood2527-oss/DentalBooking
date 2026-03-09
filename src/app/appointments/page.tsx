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

type UnavailableDate = {
  date: string;
  reason: string | null;
};

const BLOCKING_STATUSES = ["pending", "confirmed"];
const RESCHEDULE_WINDOW_HOURS = 24;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateOnlyString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeTimeValue(time: string) {
  return time.slice(0, 5);
}

function generateSlotsForDate(dateValue: string) {
  const selectedDate = new Date(`${dateValue}T00:00:00`);
  const day = selectedDate.getDay();

  if (day === 0) return [];

  const startMinutes = 9 * 60;
  const endMinutes = (day === 6 ? 15 : 18) * 60;
  const slots: string[] = [];

  const todayValue = toDateOnlyString(new Date());
  const isToday = dateValue === todayValue;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    if (isToday && minutes <= currentMinutes) continue;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${pad(hours)}:${pad(mins)}`);
  }

  return slots;
}

function canPatientManageAppointment(appointment: AppointmentRow) {
  const normalizedStatus = appointment.status.toLowerCase();
  if (normalizedStatus !== "pending" && normalizedStatus !== "confirmed") return false;

  const scheduleAt = new Date(`${appointment.appointment_date}T${normalizeTimeValue(appointment.appointment_time)}`);
  const cutoff = Date.now() + RESCHEDULE_WINDOW_HOURS * 60 * 60 * 1000;
  return scheduleAt.getTime() > cutoff;
}

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
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setLoadError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setLoadError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        setLoadError("Please log in to view your appointments.");
        setLoading(false);
        return;
      }

      const [appointmentsResult, unavailableResult] = await Promise.all([
        supabase
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
          .order("appointment_time", { ascending: true }),
        supabase
          .from("unavailable_dates")
          .select("date, reason")
          .gte("date", toDateOnlyString(new Date()))
          .order("date", { ascending: true }),
      ]);

      if (appointmentsResult.error) {
        setLoadError(appointmentsResult.error.message);
        setLoading(false);
        return;
      }

      if (unavailableResult.error) {
        setLoadError(unavailableResult.error.message);
        setLoading(false);
        return;
      }

      setAppointments((appointmentsResult.data || []) as AppointmentRow[]);
      setUnavailableDates((unavailableResult.data || []) as UnavailableDate[]);
      setLoading(false);
    }

    loadAppointments();
    return undefined;
  }, []);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = window.setTimeout(() => setSuccessMessage(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const hasAppointments = appointments.length > 0;

  const unavailableDateMap = useMemo(() => {
    return unavailableDates.reduce<Record<string, string | null>>((acc, row) => {
      acc[row.date] = row.reason;
      return acc;
    }, {});
  }, [unavailableDates]);

  const statusStyles = useMemo(
    () => ({
      confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
      pending: "border-amber-200 bg-amber-50 text-amber-700",
      cancelled: "border-rose-200 bg-rose-50 text-rose-700",
      completed: "border-sky-200 bg-sky-50 text-sky-700",
    }),
    []
  );

  const minDate = toDateOnlyString(new Date());

  useEffect(() => {
    async function loadSlotsForEdit() {
      if (!editingAppointmentId || !editDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setActionError("");

      const selectedDate = new Date(`${editDate}T00:00:00`);
      if (selectedDate.getDay() === 0) {
        setAvailableSlots([]);
        setEditTime("");
        setLoadingSlots(false);
        setActionError("Clinic is closed on Sundays. Please select another date.");
        return;
      }

      const unavailableReason = unavailableDateMap[editDate];
      if (typeof unavailableReason !== "undefined") {
        setAvailableSlots([]);
        setEditTime("");
        setLoadingSlots(false);
        setActionError(
          unavailableReason
            ? `Clinic is unavailable on this date: ${unavailableReason}`
            : "Clinic is unavailable on this date."
        );
        return;
      }

      const baseSlots = generateSlotsForDate(editDate);
      if (baseSlots.length === 0) {
        setAvailableSlots([]);
        setEditTime("");
        setLoadingSlots(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_time, status")
        .eq("appointment_date", editDate)
        .in("status", BLOCKING_STATUSES)
        .neq("id", editingAppointmentId);

      if (error) {
        setAvailableSlots([]);
        setEditTime("");
        setLoadingSlots(false);
        setActionError(error.message);
        return;
      }

      const occupiedSlots = new Set(
        (data || []).map((appointment) => normalizeTimeValue(appointment.appointment_time))
      );

      const filteredSlots = baseSlots.filter((slot) => !occupiedSlots.has(slot));
      setAvailableSlots(filteredSlots);
      setEditTime((currentTime) =>
        filteredSlots.includes(currentTime) ? currentTime : (filteredSlots[0] || "")
      );
      setLoadingSlots(false);
    }

    loadSlotsForEdit();
    return undefined;
  }, [editingAppointmentId, editDate, unavailableDateMap]);

  function startEditing(appointment: AppointmentRow) {
    setActionError("");
    setSuccessMessage("");
    setEditingAppointmentId(appointment.id);
    setEditDate(appointment.appointment_date);
    setEditTime(normalizeTimeValue(appointment.appointment_time));
    setEditNotes(appointment.notes || "");
  }

  function cancelEditing() {
    setEditingAppointmentId(null);
    setEditDate("");
    setEditTime("");
    setEditNotes("");
    setAvailableSlots([]);
    setLoadingSlots(false);
  }

  async function handleSaveChanges(appointmentId: string) {
    const appointment = appointments.find((row) => row.id === appointmentId);
    if (!appointment) return;

    setActionError("");
    setSuccessMessage("");

    if (!canPatientManageAppointment(appointment)) {
      setActionError("You can only change pending or confirmed appointments at least 24 hours before schedule.");
      return;
    }

    if (!editDate || !editTime) {
      setActionError("Please select a new date and time.");
      return;
    }

    const selectedDate = new Date(`${editDate}T00:00:00`);
    if (selectedDate.getDay() === 0) {
      setActionError("Clinic is closed on Sundays. Please select another date.");
      return;
    }

    if (selectedDate < new Date(`${toDateOnlyString(new Date())}T00:00:00`)) {
      setActionError("Please choose today or a future date.");
      return;
    }

    const { data: blockedDateData, error: blockedDateError } = await supabase
      .from("unavailable_dates")
      .select("id, reason")
      .eq("date", editDate)
      .limit(1);

    if (blockedDateError) {
      setActionError(blockedDateError.message);
      return;
    }

    if ((blockedDateData || []).length > 0) {
      const blockedReason = blockedDateData?.[0]?.reason;
      setActionError(
        blockedReason
          ? `Clinic is unavailable on this date: ${blockedReason}`
          : "Clinic is unavailable on this date."
      );
      return;
    }

    const { data: existingBlocking, error: existingCheckError } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", editDate)
      .eq("appointment_time", editTime)
      .in("status", BLOCKING_STATUSES)
      .neq("id", appointmentId)
      .limit(1);

    if (existingCheckError) {
      setActionError(existingCheckError.message);
      return;
    }

    if ((existingBlocking || []).length > 0) {
      setActionError("That time slot is no longer available. Please choose another slot.");
      return;
    }

    setSavingMap((prev) => ({ ...prev, [appointmentId]: true }));

    const { error } = await supabase
      .from("appointments")
      .update({
        appointment_date: editDate,
        appointment_time: editTime,
        notes: editNotes.trim() || null,
      })
      .eq("id", appointmentId);

    if (error) {
      setActionError(error.message);
      setSavingMap((prev) => ({ ...prev, [appointmentId]: false }));
      return;
    }

    setAppointments((prev) =>
      prev
        .map((row) =>
          row.id === appointmentId
            ? {
                ...row,
                appointment_date: editDate,
                appointment_time: editTime,
                notes: editNotes.trim() || null,
              }
            : row
        )
        .sort((a, b) => {
          const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
          if (dateCompare !== 0) return dateCompare;
          return normalizeTimeValue(a.appointment_time).localeCompare(normalizeTimeValue(b.appointment_time));
        })
    );

    setSavingMap((prev) => ({ ...prev, [appointmentId]: false }));
    setSuccessMessage("Appointment details updated.");
    cancelEditing();
  }

  async function handleCancelAppointment(appointmentId: string) {
    const appointment = appointments.find((row) => row.id === appointmentId);
    if (!appointment) return;

    setActionError("");
    setSuccessMessage("");

    if (!canPatientManageAppointment(appointment)) {
      setActionError("You can only cancel pending or confirmed appointments at least 24 hours before schedule.");
      return;
    }

    const shouldContinue = window.confirm("Cancel this appointment?");
    if (!shouldContinue) return;

    setSavingMap((prev) => ({ ...prev, [appointmentId]: true }));

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) {
      setActionError(error.message);
      setSavingMap((prev) => ({ ...prev, [appointmentId]: false }));
      return;
    }

    setAppointments((prev) =>
      prev.map((row) => (row.id === appointmentId ? { ...row, status: "cancelled" } : row))
    );

    if (editingAppointmentId === appointmentId) {
      cancelEditing();
    }

    setSavingMap((prev) => ({ ...prev, [appointmentId]: false }));
    setSuccessMessage("Appointment cancelled.");
  }

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
        ) : loadError ? (
          <section className="rounded-[26px] border border-red-200 bg-red-50 p-6 shadow-sm">
            <p className="text-sm font-medium text-red-700">{loadError}</p>
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
            {successMessage ? (
              <article className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {successMessage}
              </article>
            ) : null}
            {actionError ? (
              <article className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {actionError}
              </article>
            ) : null}
            {appointments.map((appointment) => {
              const service = Array.isArray(appointment.services)
                ? appointment.services[0]
                : appointment.services;

              const normalizedStatus = appointment.status.toLowerCase();
              const badgeClasses =
                statusStyles[normalizedStatus as keyof typeof statusStyles] ||
                "border-slate-200 bg-slate-50 text-slate-700";
              const canManage = canPatientManageAppointment(appointment);
              const isEditing = editingAppointmentId === appointment.id;
              const isSaving = savingMap[appointment.id];

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

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(appointment)}
                      disabled={!canManage || isSaving}
                      className="rounded-lg border border-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--primary-dark)] disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      Reschedule / Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      disabled={!canManage || isSaving}
                      className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      {isSaving ? "Saving..." : "Cancel Appointment"}
                    </button>
                    {!canManage ? (
                      <p className="text-xs text-[var(--muted)]">
                        Changes are allowed only for pending/confirmed appointments at least 24 hours before schedule.
                      </p>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                      <p className="text-sm font-semibold text-[var(--foreground)]">Update Appointment Details</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="mb-1.5 block font-medium text-[var(--foreground)]">New Date</span>
                          <input
                            type="date"
                            value={editDate}
                            min={minDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="mb-1.5 block font-medium text-[var(--foreground)]">New Time</span>
                          <select
                            value={editTime}
                            onChange={(e) => setEditTime(e.target.value)}
                            disabled={!editDate || loadingSlots || availableSlots.length === 0}
                            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4] disabled:cursor-not-allowed disabled:bg-slate-50"
                          >
                            {loadingSlots ? (
                              <option>Loading slots...</option>
                            ) : !editDate ? (
                              <option>Select a date first</option>
                            ) : availableSlots.length === 0 ? (
                              <option>No available slots</option>
                            ) : (
                              availableSlots.map((slot) => (
                                <option key={slot} value={slot}>
                                  {formatTime(slot)}
                                </option>
                              ))
                            )}
                          </select>
                        </label>
                      </div>

                      <label className="mt-3 block text-sm">
                        <span className="mb-1.5 block font-medium text-[var(--foreground)]">Notes</span>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={3}
                          maxLength={300}
                          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                          placeholder="Additional note for the clinic"
                        />
                      </label>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveChanges(appointment.id)}
                          disabled={isSaving || !editDate || !editTime}
                          className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

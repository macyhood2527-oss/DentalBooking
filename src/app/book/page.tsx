"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
};

type UnavailableDate = {
  date: string;
  reason: string | null;
};

const SLOT_INTERVAL_MINUTES = 30;
const BLOCKING_STATUSES = ["pending", "confirmed"];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateOnlyString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function normalizeTimeValue(time: string) {
  return time.slice(0, 5);
}

function formatTime12(value: string) {
  const parsed = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
}

function generateSlotsForDate(dateValue: string) {
  const selectedDate = new Date(`${dateValue}T00:00:00`);
  const day = selectedDate.getDay();

  // Sunday: clinic closed
  if (day === 0) return [];

  const startMinutes = 9 * 60;
  const endMinutes = (day === 6 ? 15 : 18) * 60; // Sat 3PM, weekdays 6PM
  const slots: string[] = [];

  const todayValue = toDateOnlyString(new Date());
  const isToday = dateValue === todayValue;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let minutes = startMinutes; minutes < endMinutes; minutes += SLOT_INTERVAL_MINUTES) {
    if (isToday && minutes <= currentMinutes) continue;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${pad(hours)}:${pad(mins)}`);
  }

  return slots;
}

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<UnavailableDate[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [notes, setNotes] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadBookingData() {
      setLoading(true);
      setErrorMessage("");

      const [userResult, servicesResult, unavailableResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("services")
          .select("id, name, description, price, duration_minutes")
          .order("name", { ascending: true }),
        supabase
          .from("unavailable_dates")
          .select("date, reason")
          .gte("date", toDateOnlyString(new Date()))
          .order("date", { ascending: true }),
      ]);

      if (userResult.error) {
        setErrorMessage(userResult.error.message);
        setLoading(false);
        return;
      }

      setUserId(userResult.data.user?.id ?? null);

      if (servicesResult.error) {
        setErrorMessage(servicesResult.error.message);
        setLoading(false);
        return;
      }

      const fetchedServices = servicesResult.data || [];
      setServices(fetchedServices);
      if (fetchedServices.length > 0) {
        setSelectedServiceId(fetchedServices[0].id);
      }

      if (unavailableResult.error) {
        setErrorMessage(unavailableResult.error.message);
      } else {
        setUnavailableDates((unavailableResult.data || []) as UnavailableDate[]);
      }

      setLoading(false);
    }

    loadBookingData();
    return undefined;
  }, []);

  const unavailableDateMap = useMemo(() => {
    return unavailableDates.reduce<Record<string, string | null>>((acc, row) => {
      acc[row.date] = row.reason;
      return acc;
    }, {});
  }, [unavailableDates]);

  useEffect(() => {
    async function loadAvailableSlots() {
      if (!appointmentDate) {
        setAvailableSlots([]);
        setAppointmentTime("");
        return;
      }

      setErrorMessage("");
      setLoadingSlots(true);

      const selectedDate = new Date(`${appointmentDate}T00:00:00`);
      if (selectedDate.getDay() === 0) {
        setAvailableSlots([]);
        setAppointmentTime("");
        setLoadingSlots(false);
        setErrorMessage("Clinic is closed on Sundays. Please select another date.");
        return;
      }

      const unavailableReason = unavailableDateMap[appointmentDate];
      if (typeof unavailableReason !== "undefined") {
        setAvailableSlots([]);
        setAppointmentTime("");
        setLoadingSlots(false);
        setErrorMessage(
          unavailableReason
            ? `Clinic is unavailable on this date: ${unavailableReason}`
            : "Clinic is unavailable on this date."
        );
        return;
      }

      const baseSlots = generateSlotsForDate(appointmentDate);
      if (baseSlots.length === 0) {
        setAvailableSlots([]);
        setAppointmentTime("");
        setLoadingSlots(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_time, status")
        .eq("appointment_date", appointmentDate)
        .in("status", BLOCKING_STATUSES);

      if (error) {
        setAvailableSlots([]);
        setAppointmentTime("");
        setLoadingSlots(false);
        setErrorMessage(error.message);
        return;
      }

      const occupiedSlots = new Set(
        (data || []).map((appointment) => normalizeTimeValue(appointment.appointment_time))
      );

      const filteredSlots = baseSlots.filter((slot) => !occupiedSlots.has(slot));
      setAvailableSlots(filteredSlots);
      setAppointmentTime((currentTime) =>
        filteredSlots.includes(currentTime) ? currentTime : (filteredSlots[0] || "")
      );
      setLoadingSlots(false);
    }

    loadAvailableSlots();
    return undefined;
  }, [appointmentDate, unavailableDateMap]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!userId) {
      setErrorMessage("Please log in first to book an appointment.");
      return;
    }

    if (!selectedServiceId || !appointmentDate || !appointmentTime) {
      setErrorMessage("Please select a service, date, and time.");
      return;
    }

    const selectedDate = new Date(`${appointmentDate}T00:00:00`);
    if (selectedDate.getDay() === 0) {
      setErrorMessage("Clinic is closed on Sundays. Please select another date.");
      return;
    }

    if (selectedDate < new Date(`${toDateOnlyString(new Date())}T00:00:00`)) {
      setErrorMessage("Please choose today or a future date.");
      return;
    }

    const { data: blockedDateData, error: blockedDateError } = await supabase
      .from("unavailable_dates")
      .select("id, reason")
      .eq("date", appointmentDate)
      .limit(1);

    if (blockedDateError) {
      setErrorMessage(blockedDateError.message);
      return;
    }

    if ((blockedDateData || []).length > 0) {
      const blockedReason = blockedDateData?.[0]?.reason;
      setErrorMessage(
        blockedReason
          ? `Clinic is unavailable on this date: ${blockedReason}`
          : "Clinic is unavailable on this date."
      );
      return;
    }

    // Final safety check before insert in case the slot was taken just now.
    const { data: existingBlocking, error: existingCheckError } = await supabase
      .from("appointments")
      .select("id")
      .eq("appointment_date", appointmentDate)
      .eq("appointment_time", appointmentTime)
      .in("status", BLOCKING_STATUSES)
      .limit(1);

    if (existingCheckError) {
      setErrorMessage(existingCheckError.message);
      return;
    }

    if ((existingBlocking || []).length > 0) {
      setErrorMessage("That time slot is no longer available. Please choose another slot.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("appointments").insert({
      user_id: userId,
      service_id: selectedServiceId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: "pending",
      notes: notes.trim() || null,
    });

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    setMessage("Appointment booked successfully.");
    setAppointmentDate("");
    setAvailableSlots([]);
    setAppointmentTime("");
    setNotes("");
    setSubmitting(false);
  }

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  const minDate = toDateOnlyString(new Date());

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
            Book an Appointment
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--muted)]">
            Choose your preferred dental service, then pick a date and time that fits your
            schedule.
          </p>
        </section>

        {loading ? (
          <div className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[var(--muted)]">Loading booking details...</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-7">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Select Service</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Tap a card to choose your treatment.
                </p>
              </div>

              <div className="space-y-3">
                {services.length === 0 ? (
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm text-[var(--muted)]">
                    No services available right now.
                  </p>
                ) : (
                  services.map((service) => (
                    <label
                      key={service.id}
                      className={`group block cursor-pointer rounded-2xl border p-4 transition duration-200 ${
                        selectedServiceId === service.id
                          ? "border-[var(--primary)] bg-[var(--background)] shadow-[0_8px_24px_rgba(20,184,166,0.14)]"
                          : "border-[var(--border)] bg-white hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[0_10px_24px_rgba(20,184,166,0.1)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">{service.name}</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                            {service.description}
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="service"
                          value={service.id}
                          checked={selectedServiceId === service.id}
                          onChange={() => setSelectedServiceId(service.id)}
                          className="mt-1 h-4 w-4 accent-[var(--primary)]"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 font-medium text-[var(--primary-dark)]">
                          {service.duration_minutes} mins
                        </span>
                        <span className="text-base font-bold text-[var(--primary-dark)]">
                          ₱{service.price}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-7">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Schedule Details</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Confirm your date and time to reserve your slot.
                </p>
              </div>

              {selectedService && (
                <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary-dark)]">
                    Selected service
                  </p>
                  <p className="mt-1 font-semibold text-[var(--foreground)]">{selectedService.name}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="appointment-date" className="mb-1.5 block text-sm font-medium">
                    Date
                  </label>
                  <input
                    id="appointment-date"
                    type="date"
                    min={minDate}
                    value={appointmentDate}
                    onChange={(e) => {
                      setMessage("");
                      setErrorMessage("");
                      setAppointmentDate(e.target.value);
                    }}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-3 transition outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                    required
                  />
                  {unavailableDates.length > 0 && (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Unavailable dates:{" "}
                      {unavailableDates
                        .slice(0, 5)
                        .map((row) => row.date)
                        .join(", ")}
                      {unavailableDates.length > 5 ? " ..." : ""}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="appointment-time" className="mb-1.5 block text-sm font-medium">
                    Time
                  </label>
                  <select
                    id="appointment-time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-3 transition outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                    required
                    disabled={!appointmentDate || loadingSlots || availableSlots.length === 0}
                  >
                    <option value="">
                      {loadingSlots
                        ? "Loading available slots..."
                        : !appointmentDate
                          ? "Select a date first"
                          : availableSlots.length === 0
                            ? "No available slots"
                            : "Select a time slot"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {formatTime12(slot)}
                      </option>
                    ))}
                  </select>
                  {appointmentDate && !loadingSlots && availableSlots.length === 0 && (
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      No available slots for this date.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="appointment-notes" className="mb-1.5 block text-sm font-medium">
                    Notes (optional)
                  </label>
                  <textarea
                    id="appointment-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Anything you'd like the clinic to know?"
                    className="w-full rounded-xl border border-[var(--border)] bg-white p-3 transition outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    services.length === 0 ||
                    !appointmentDate ||
                    !appointmentTime ||
                    loadingSlots
                  }
                  className="mt-2 w-full rounded-xl bg-[var(--primary)] px-4 py-3 font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {submitting ? "Saving appointment..." : "Confirm Booking"}
                </button>
              </form>

              {message && (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}
              {errorMessage && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {errorMessage}
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

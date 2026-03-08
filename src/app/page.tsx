"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import InsideBrightSmileGallery from "../components/InsideBrightSmileGallery";
import { supabase } from "../lib/supabase";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
  image_url?: string | null;
};

const serviceIcons = ["✨", "🦷", "💎", "🪥", "🌿", "😁"];

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    async function loadServices() {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase services error:", error);
        return;
      }

      setServices((data || []) as Service[]);
    }

    loadServices();
    return undefined;
  }, []);

  useEffect(() => {
    let ticking = false;

    function updateScroll() {
      setScrollY(window.scrollY || 0);
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const motionDistance = Math.min(48, Math.max(0, scrollY * 0.12));

  return (
    <main className="pb-16">
      <section className="shell-bg overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 pb-10 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-24">
          <div
            className="glass-card rounded-[30px] border border-[var(--border)] p-7 sm:p-8"
            style={{ transform: `translateX(-${motionDistance}px)` }}
          >
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--primary-dark)]">
              BrightSmile Dental Clinic
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Because Every Smile Matters.
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Gentle, modern, and patient-focused dental care for every stage of your smile.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/book"
                className="rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-white shadow-md transition hover:bg-[var(--primary)]"
              >
                Book Appointment
              </Link>
              <Link
                href="#services"
                className="glass-soft rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)] transition hover:bg-[var(--card)]"
              >
                View Services
              </Link>
            </div>
          </div>

          <div style={{ transform: `translateX(${motionDistance}px)` }}>
            <div className="glass-card group overflow-hidden rounded-[30px]">
              <img
                src="/images/hero-dental.jpg"
                alt="Dental clinic treatment"
                className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-[420px]"
              />
            </div>
          </div>
        </div>

      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--primary-dark)]">
              Services
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--foreground)]">Our Dental Care</h2>
            <p className="mt-2 max-w-2xl text-[var(--muted)]">
              Professional dental services designed for comfort, convenience, and a smoother
              patient experience.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.length === 0 ? (
            <div className="glass-card rounded-[28px] border border-[var(--border)] p-8">
              <p className="text-[var(--muted)]">No services found yet.</p>
            </div>
          ) : (
            services.map((service, index) => (
              <div
                key={service.id}
                className="glass-card group rounded-[28px] border border-[var(--border)] p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(0,0,0,0.35)]"
              >
                {service.image_url ? (
                  <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--border)]">
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="glass-soft mb-5 flex h-40 items-center justify-center rounded-2xl border border-[var(--border)]">
                    <div className="glass-card flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm">
                      {serviceIcons[index % serviceIcons.length]}
                    </div>
                  </div>
                )}

                <div className="mb-5 flex items-start justify-end gap-4">
                  <span className="glass-soft rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                    {service.duration_minutes} mins
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-[var(--foreground)]">{service.name}</h3>
                <p className="mt-3 min-h-[48px] text-[var(--muted)]">{service.description}</p>

                <div className="mt-6 flex items-center justify-between">
                  <p className="text-lg font-bold text-[var(--highlight)]">₱{service.price}</p>
                  <Link
                    href="/book"
                    className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary)]"
                  >
                    Book now
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <InsideBrightSmileGallery />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--primary-dark)]">
            Why Choose Us
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            Trusted Dental Care
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="glass-card rounded-2xl p-5">
            <p className="text-2xl">🩺</p>
            <h3 className="mt-3 font-semibold text-[var(--foreground)]">Experienced Dentists</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Skilled professionals focused on safe and quality treatment.
            </p>
          </article>

          <article className="glass-card rounded-2xl p-5">
            <p className="text-2xl">🦷</p>
            <h3 className="mt-3 font-semibold text-[var(--foreground)]">Modern Equipment</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Updated tools for accurate diagnosis and effective procedures.
            </p>
          </article>

          <article className="glass-card rounded-2xl p-5">
            <p className="text-2xl">🛋️</p>
            <h3 className="mt-3 font-semibold text-[var(--foreground)]">
              Comfortable Environment
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              A clean and calming space designed for patient comfort.
            </p>
          </article>

          <article className="glass-card rounded-2xl p-5">
            <p className="text-2xl">💙</p>
            <h3 className="mt-3 font-semibold text-[var(--foreground)]">Affordable Care</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Quality dental services with practical and fair pricing.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--primary-dark)]">
            Plan Your Visit
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--foreground)]">Clinic Information</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="glass-card rounded-xl p-6 transition hover:shadow-xl">
            <p className="text-lg font-semibold text-[var(--foreground)]">📍 Address</p>
            <p className="mt-3 text-[var(--muted)]">J. Catolico Avenue</p>
            <p className="text-[var(--muted)]">General Santos City</p>
          </article>

          <article className="glass-card rounded-xl p-6 transition hover:shadow-xl">
            <p className="text-lg font-semibold text-[var(--foreground)]">📞 Phone</p>
            <p className="mt-3 text-[var(--muted)]">+63 945 6601 439</p>
          </article>

          <article className="glass-card rounded-xl p-6 transition hover:shadow-xl">
            <p className="text-lg font-semibold text-[var(--foreground)]">🕒 Opening Hours</p>
            <p className="mt-3 text-[var(--muted)]">Mon-Fri: 9:00 AM - 6:00 PM</p>
            <p className="text-[var(--muted)]">Sat: 9:00 AM - 3:00 PM</p>
            <p className="text-[var(--muted)]">Sun: Closed</p>
          </article>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Operations",
    links: [
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/appointments", label: "Appointments" },
      { href: "/admin/availability", label: "Availability" },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/admin/services", label: "Services" },
      { href: "/admin/gallery", label: "Gallery" },
      { href: "/admin/about", label: "About" },
    ],
  },
];

export default function AdminSubnav() {
  const pathname = usePathname();

  return (
    <section className="glass-card mb-6 flex flex-col gap-4 rounded-2xl border border-[var(--border)] p-4 sm:gap-3">
      <div className="overflow-x-auto pb-1">
        <nav className="flex min-w-max items-start gap-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                {group.label}
              </p>
              <div className="flex items-center gap-2">
                {group.links.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "glass-soft border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card)]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {pathname !== "/admin" && (
        <Link
          href="/admin"
          className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium text-[var(--primary-dark)] transition hover:bg-[var(--background)]"
        >
          Back to Dashboard
        </Link>
      )}
    </section>
  );
}

import Link from "next/link";

export default function Footer() {
  return (
    <footer
      id="contact"
      className="mt-10 border-t border-[var(--border)] bg-white/55 backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <section className="sm:col-span-2">
          <p className="text-lg font-semibold text-[var(--foreground)]">BrightSmile Dental Clinic</p>
          <p className="mt-2 font-medium text-[var(--primary-dark)]">Because Every Smile Matters.</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
            We provide gentle, modern, and patient-focused dental care to help every patient feel
            comfortable and confident in their smile.
          </p>
        </section>

        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--primary-dark)]">
            Contact
          </p>
          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <p>Email: mmarcelo.maxwell@gmail.com</p>
            <p>Phone: +63 945 6601 439</p>
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--primary-dark)]">
            Social
          </p>
          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <Link
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="inline-block transition hover:text-[var(--primary-dark)]"
            >
              Facebook
            </Link>
            <a
              href="mailto:mmarcelo.maxwell@gmail.com"
              className="block transition hover:text-[var(--primary-dark)]"
            >
              Email
            </a>
          </div>
        </section>
      </div>
    </footer>
  );
}

import Link from "next/link";

type AdminQuickActionCardProps = {
  href: string;
  title: string;
  description: string;
  buttonText: string;
  groupLabel?: string;
};

export default function AdminQuickActionCard({
  href,
  title,
  description,
  buttonText,
  groupLabel = "Quick Action",
}: AdminQuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-[0_14px_36px_rgba(20,184,166,0.09)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(20,184,166,0.14)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary-dark)]">
        {groupLabel}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
      <span className="mt-4 inline-flex rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition group-hover:bg-[var(--primary-dark)]">
        {buttonText}
      </span>
    </Link>
  );
}

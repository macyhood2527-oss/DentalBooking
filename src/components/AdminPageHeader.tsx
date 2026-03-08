import { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description: string;
  badgeText?: string;
  children?: ReactNode;
};

export default function AdminPageHeader({
  title,
  description,
  badgeText = "BrightSmile Admin",
  children,
}: AdminPageHeaderProps) {
  return (
    <section className="mb-8 glass-card rounded-[30px] border border-[var(--border)] p-7 sm:p-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary-dark)]">
        <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
        {badgeText}
      </div>
      <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--muted)]">{description}</p>
      {children}
    </section>
  );
}

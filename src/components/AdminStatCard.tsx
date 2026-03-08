type AdminStatCardProps = {
  label: string;
  value: number;
  tone?: "default" | "pending" | "confirmed" | "completed" | "cancelled";
};

const toneClassMap: Record<NonNullable<AdminStatCardProps["tone"]>, string> = {
  default: "border-[var(--border)] shadow-[0_14px_36px_rgba(20,184,166,0.09)]",
  pending: "border-amber-200 shadow-[0_14px_36px_rgba(251,191,36,0.1)]",
  confirmed: "border-emerald-200 shadow-[0_14px_36px_rgba(16,185,129,0.1)]",
  completed: "border-sky-200 shadow-[0_14px_36px_rgba(14,165,233,0.1)]",
  cancelled: "border-rose-200 shadow-[0_14px_36px_rgba(244,63,94,0.1)]",
};

const labelClassMap: Record<NonNullable<AdminStatCardProps["tone"]>, string> = {
  default: "text-[var(--primary-dark)]",
  pending: "text-amber-700",
  confirmed: "text-emerald-700",
  completed: "text-sky-700",
  cancelled: "text-rose-700",
};

export default function AdminStatCard({
  label,
  value,
  tone = "default",
}: AdminStatCardProps) {
  return (
    <article className={`rounded-[22px] border bg-white p-5 ${toneClassMap[tone]}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${labelClassMap[tone]}`}>
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">{value}</p>
    </article>
  );
}

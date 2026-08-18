import { useTranslations } from "next-intl";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

const STATUS_STYLES = {
  PENDING: {
    className: "bg-amber-50 text-amber-700 border-amber-200",
    labelKey: "status.pending",
  },
  APPROVED: {
    className: "bg-green-50 text-green-700 border-green-200",
    labelKey: "status.approved",
  },
  REJECTED: {
    className: "bg-red-50 text-red-700 border-red-200",
    labelKey: "status.rejected",
  },
} as const;

type Status = keyof typeof STATUS_STYLES;

export function ListingStatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const style = STATUS_STYLES[status as Status] ?? STATUS_STYLES.PENDING;

  const Icon =
    status === "APPROVED"
      ? CheckCircle2
      : status === "REJECTED"
        ? XCircle
        : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-full ${style.className}`}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {t(style.labelKey)}
    </span>
  );
}

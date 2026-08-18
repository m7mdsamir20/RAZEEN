"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Check,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface ModerationActionsProps {
  /** API segment to act on: "properties" or "requests". */
  resource: "properties" | "requests";
  id: string;
  status: string;
}

/**
 * Approve / reject / delete controls for one moderation queue row.
 * Rejection opens an inline reason field — the API refuses a blank reason,
 * and the publisher sees whatever is written here.
 */
export function ModerationActions({
  resource,
  id,
  status,
}: ModerationActionsProps) {
  const t = useTranslations();
  const router = useRouter();

  const [pendingAction, setPendingAction] = useState<
    "approve" | "reject" | "delete" | null
  >(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const endpoint = `/api/admin/${resource}/${id}`;

  async function setStatus(next: "APPROVED" | "REJECTED") {
    setError("");
    setPendingAction(next === "APPROVED" ? "approve" : "reject");

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          ...(next === "REJECTED" ? { rejectionReason: reason.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("common.error"));
        return;
      }

      setIsRejecting(false);
      setReason("");
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setPendingAction(null);
    }
  }

  async function remove() {
    if (!window.confirm(t("admin.confirmDelete"))) return;

    setError("");
    setPendingAction("delete");

    try {
      const res = await fetch(endpoint, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("common.error"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setPendingAction(null);
    }
  }

  function submitRejection() {
    if (reason.trim().length === 0) {
      setError(t("admin.rejectReasonRequired"));
      return;
    }
    setStatus("REJECTED");
  }

  const isBusy = pendingAction !== null;

  if (isRejecting) {
    return (
      <div className="w-full">
        <label
          htmlFor={`reject-reason-${id}`}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {t("admin.rejectPrompt")}
        </label>
        <textarea
          id={`reject-reason-${id}`}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          placeholder={t("admin.rejectPlaceholder")}
          rows={3}
          maxLength={500}
          autoFocus
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-[border-color,box-shadow] resize-y"
        />

        {error && (
          <p
            className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={submitRejection}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none min-h-[44px]"
          >
            {pendingAction === "reject" ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <X className="w-4 h-4" aria-hidden="true" />
            )}
            {t("admin.confirmReject")}
          </button>
          <button
            onClick={() => {
              setIsRejecting(false);
              setReason("");
              setError("");
            }}
            disabled={isBusy}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
          >
            {t("admin.cancel")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {status !== "APPROVED" && (
          <button
            onClick={() => setStatus("APPROVED")}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:outline-none min-h-[44px]"
          >
            {pendingAction === "approve" ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="w-4 h-4" aria-hidden="true" />
            )}
            {status === "REJECTED" ? t("admin.reopenRequest") : t("admin.approve")}
          </button>
        )}

        {status !== "REJECTED" && (
          <button
            onClick={() => setIsRejecting(true)}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:outline-none min-h-[44px]"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            {t("admin.reject")}
          </button>
        )}

        <button
          onClick={remove}
          disabled={isBusy}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-[color,background-color,border-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
        >
          {pendingAction === "delete" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          )}
          {t("admin.delete")}
        </button>
      </div>

      {error && (
        <p
          className="flex items-center gap-1.5 mt-2 text-sm text-red-600"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Status lifecycle controls for an enquiry (NEW → CONTACTED → CLOSED).
 *
 * Management and marketing enquiries share the same lifecycle and the same
 * controls, so they share this component and differ only in which admin
 * endpoint the change is sent to.
 */
export function ManagementActions({
  id,
  status,
  endpoint = "/api/admin/management",
}: {
  id: string;
  status: string;
  endpoint?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function setStatus(next: "NEW" | "CONTACTED" | "CLOSED") {
    setError("");
    setPending(next);

    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? t("common.error"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setPending(null);
    }
  }

  const buttonClass =
    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]";

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "NEW" && (
          <button
            onClick={() => setStatus("CONTACTED")}
            disabled={pending !== null}
            className={`${buttonClass} text-white bg-primary hover:bg-primary/90`}
          >
            {pending === "CONTACTED" ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="w-4 h-4" aria-hidden="true" />
            )}
            {t("admin.markContacted")}
          </button>
        )}

        {status !== "CLOSED" && (
          <button
            onClick={() => setStatus("CLOSED")}
            disabled={pending !== null}
            className={`${buttonClass} text-gray-600 border border-gray-300 hover:bg-gray-50`}
          >
            {pending === "CLOSED" ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <X className="w-4 h-4" aria-hidden="true" />
            )}
            {t("admin.markClosed")}
          </button>
        )}

        {status === "CLOSED" && (
          <button
            onClick={() => setStatus("NEW")}
            disabled={pending !== null}
            className={`${buttonClass} text-primary border border-primary/30 hover:bg-primary/5`}
          >
            {pending === "NEW" ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            )}
            {t("admin.reopenRequest")}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

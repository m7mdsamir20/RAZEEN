"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Check, Undo2, Trash2, Loader2 } from "lucide-react";

/** Read/unread toggle and delete for one contact message. */
export function MessageActions({
  id,
  isRead,
}: {
  id: string;
  isRead: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState<"toggle" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function toggleRead() {
    setError("");
    setPending("toggle");

    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !isRead }),
      });

      if (!res.ok) {
        setError(t("common.error"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    if (!window.confirm(t("admin.confirmDelete"))) return;

    setError("");
    setPending("delete");

    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setError(t("common.error"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("common.error"));
    } finally {
      setPending(null);
    }
  }

  const busy = pending !== null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={toggleRead}
          disabled={busy}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px] ${
            isRead
              ? "text-gray-600 border border-gray-300 hover:bg-gray-50"
              : "text-white bg-primary hover:bg-primary/90"
          }`}
        >
          {pending === "toggle" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : isRead ? (
            <Undo2 className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Check className="w-4 h-4" aria-hidden="true" />
          )}
          {isRead ? t("messages.markUnread") : t("messages.markRead")}
        </button>

        <button
          onClick={remove}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-[color,background-color,border-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[44px]"
        >
          {pending === "delete" ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          )}
          {t("admin.delete")}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

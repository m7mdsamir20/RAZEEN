"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogIn } from "lucide-react";
import { LoginModal } from "./LoginModal";

interface SignInButtonProps {
  /** Overrides the default "sign in" wording where a page needs its own. */
  label?: string;
  className?: string;
  /** Runs after a successful sign-in, in addition to refreshing the route. */
  onSignedIn?: () => void;
}

/**
 * Opens the sign-in dialog wherever a visitor is stopped for not being signed
 * in, so the message is never a dead end. On success the route is refreshed so
 * server components re-read the new session.
 */
export function SignInButton({
  label,
  className = "",
  onSignedIn,
}: SignInButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[48px] ${className}`}
      >
        <LogIn className="w-5 h-5" aria-hidden="true" />
        {label ?? t("auth.login")}
      </button>

      {isOpen ? (
        <LoginModal
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            router.refresh();
            onSignedIn?.();
          }}
        />
      ) : null}
    </>
  );
}

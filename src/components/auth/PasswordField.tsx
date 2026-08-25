"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  checkPassword,
  PASSWORD_RULE_ORDER,
  PASSWORD_MAX_LENGTH,
} from "@/lib/validations/auth";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Shows the live rule checklist. Off for the sign-in field. */
  showRules?: boolean;
  autoComplete?: "current-password" | "new-password";
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

/**
 * A password input with a reveal toggle, and — where a password is being
 * chosen — a checklist that ticks off each rule as it is met.
 *
 * Showing the rules as they are satisfied beats rejecting the form after the
 * fact: nobody has to guess what "not strong enough" meant.
 */
export function PasswordField({
  label,
  value,
  onChange,
  showRules = false,
  autoComplete = "current-password",
  disabled = false,
  error,
  placeholder,
}: PasswordFieldProps) {
  const t = useTranslations();
  const id = useId();
  const [isVisible, setIsVisible] = useState(false);

  // Nothing to correct until something has been typed.
  const met = checkPassword(value);
  const missing =
    value.length > 0 ? PASSWORD_RULE_ORDER.filter((rule) => !met[rule]) : [];

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1.5"
      >
        {label}
      </label>

      <div className="relative">
        <Lock
          className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />

        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className="w-full ps-11 pe-12 py-3 text-base border border-gray-200 rounded-xl focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus:outline-none transition-[border-color,box-shadow] min-h-[48px] disabled:opacity-60"
        />

        <button
          type="button"
          onClick={() => setIsVisible((v) => !v)}
          aria-label={
            isVisible ? t("auth.hidePassword") : t("auth.showPassword")
          }
          className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 text-gray-400 hover:text-gray-600 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none"
        >
          {isVisible ? (
            <EyeOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Eye className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {error ? (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {/* Only what is still missing, and only once there is something to
          judge. An empty field shows nothing, and the list empties itself as
          each rule is satisfied — so a valid password leaves no clutter. */}
      {showRules && missing.length > 0 ? (
        <ul
          className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1"
          aria-live="polite"
        >
          {missing.map((rule) => (
            <li
              key={rule}
              className="flex items-center gap-1.5 text-xs text-amber-700"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {t(`auth.rule${rule[0].toUpperCase()}${rule.slice(1)}`)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

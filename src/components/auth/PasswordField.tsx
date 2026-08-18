"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff, Check, X } from "lucide-react";
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

  const met = checkPassword(value);

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

      {showRules ? (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1.5">
            {t("auth.passwordRulesTitle")}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
            {PASSWORD_RULE_ORDER.map((rule) => {
              const done = met[rule];
              const labelKey = `auth.rule${rule[0].toUpperCase()}${rule.slice(1)}`;

              return (
                <li
                  key={rule}
                  className={`flex items-center gap-1.5 text-xs ${
                    done ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  {t(labelKey)}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

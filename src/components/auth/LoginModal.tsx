"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  Phone,
  Shield,
  User,
  KeyRound,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { OtpInput } from "./OtpInput";
import { PasswordField } from "./PasswordField";
import { isStrongPassword } from "@/lib/validations/auth";

/**
 * Signing in uses the password. The verification code is only involved where
 * a phone number has to be proved: creating an account, and recovering one
 * whose password has been forgotten.
 */
type Mode = "login" | "register" | "reset";
type Step = "identify" | "otp";

const RESEND_SECONDS = 30;
const CODE_LENGTH = 4;

const FIELD_CLASS =
  "w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-[border-color,box-shadow] min-h-[48px]";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Rendered only while open — the parent unmounts it on close, so every step,
 * field and error resets naturally without a state-clearing effect.
 */
export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const t = useTranslations();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("identify");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isReset = mode === "reset";

  const passwordsReady =
    isStrongPassword(password) && password === confirmPassword;

  // Focus the leading field of each step
  useEffect(() => {
    if (step !== "identify") return;
    const timer = setTimeout(() => firstFieldRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [step, mode]);

  // Close on Escape, and lock background scrolling while open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Resend cooldown — ticks down to zero after a code is sent
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setStep("identify");
    setError("");
    setOtp("");
    setOtpError(false);
    setDevCode("");
    setPassword("");
    setConfirmPassword("");
  }

  /** Maps the shared account-mismatch codes onto their messages. */
  function showMismatch(code: string | undefined, fallback: string) {
    if (code === "NO_ACCOUNT") setError(t("auth.noAccountError"));
    else if (code === "ACCOUNT_EXISTS") setError(t("auth.accountExistsError"));
    else setError(fallback);
  }

  function finish() {
    onSuccess();
    onClose();
  }

  // ------------------------------------------------------------------
  // Sign in — password only, no code
  // ------------------------------------------------------------------
  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "WRONG_PASSWORD") {
          setError(
            data.attemptsLeft > 0
              ? `${t("auth.wrongPassword")} — ${t("auth.attemptsLeft", {
                  count: data.attemptsLeft,
                })}`
              : t("auth.wrongPassword")
          );
        } else if (data.code === "LOCKED") {
          setError(t("auth.accountLocked", { minutes: data.minutesLeft }));
        } else if (data.code === "NO_PASSWORD") {
          setError(t("auth.noPasswordSet"));
        } else {
          showMismatch(data.code, data.error ?? t("common.error"));
        }
        return;
      }

      finish();
    } catch {
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ------------------------------------------------------------------
  // Send the verification code — registration and reset only
  // ------------------------------------------------------------------
  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          mode: isRegister ? "register" : "reset",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "SMS_FAILED") setError(t("auth.smsFailed"));
        else showMismatch(data.code, data.error ?? t("common.error"));
        return;
      }

      if (data.devCode) setDevCode(data.devCode);
      setOtp("");
      setOtpError(false);
      setResendIn(RESEND_SECONDS);
      setStep("otp");
    } catch {
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ------------------------------------------------------------------
  // Finish registration, or set a new password
  // ------------------------------------------------------------------
  async function submitCode(codeToCheck: string) {
    // When resetting, the new password is chosen on this step.
    if (isReset && !passwordsReady) {
      setError(
        password !== confirmPassword
          ? t("auth.passwordsMismatch")
          : t("auth.passwordWeak")
      );
      return;
    }

    setError("");
    setOtpError(false);
    setIsSubmitting(true);

    try {
      const endpoint = isRegister
        ? "/api/auth/register"
        : "/api/auth/reset-password";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code: codeToCheck,
          password,
          confirmPassword,
          ...(isRegister ? { name: name.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "NO_ACCOUNT" || data.code === "ACCOUNT_EXISTS") {
          showMismatch(data.code, data.error);
          setStep("identify");
          return;
        }

        if (data.code === "OTP_EXPIRED") {
          setError(t("auth.otpExpired"));
          return;
        }

        // Wrong code: redden and shake the boxes, then clear for another try.
        setOtpError(true);
        setError(t("auth.wrongCode"));
        setTimeout(() => setOtp(""), 450);
        return;
      }

      finish();
    } catch {
      setError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmitIdentify = (() => {
    if (phone.length !== 10) return false;
    if (isLogin) return password.length > 0;
    if (isRegister) return name.trim().length >= 2 && passwordsReady;
    return true; // reset asks only for the number on this step
  })();

  const canSubmitCode =
    otp.length === CODE_LENGTH && (!isReset || passwordsReady);

  const title = isRegister
    ? t("auth.registerTitle")
    : isReset
      ? t("auth.resetTitle")
      : t("auth.loginTitle");

  const subtitle =
    step === "otp"
      ? t("auth.otpSent")
      : isRegister
        ? t("auth.registerSubtitle")
        : isReset
          ? t("auth.resetSubtitle")
          : t("auth.loginSubtitle");

  return (
    // `text-start` is deliberate: the dialog is rendered wherever it is
    // opened from, and a centred container (such as a Gate) would otherwise
    // cascade its alignment into the modal's own headings and labels.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overscroll-contain text-start"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div
        ref={modalRef}
        className="flex flex-col w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header — stays put while the body scrolls, so the title and the
            close button are always reachable */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2
              id="login-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-[color,background-color] focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
            aria-label={t("common.cancel")}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto overscroll-contain">
          {/* Step: identify — the fields differ per mode */}
          {step === "identify" && (
            <form
              onSubmit={isLogin ? signIn : sendCode}
              noValidate
              className="space-y-4"
            >
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  {isRegister ? (
                    <User className="w-6 h-6 text-primary" aria-hidden="true" />
                  ) : isReset ? (
                    <KeyRound
                      className="w-6 h-6 text-primary"
                      aria-hidden="true"
                    />
                  ) : (
                    <Phone className="w-6 h-6 text-primary" aria-hidden="true" />
                  )}
                </div>
              </div>

              {isRegister ? (
                <div>
                  <label
                    htmlFor="register-name"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    {t("auth.name")}
                  </label>
                  <input
                    ref={firstFieldRef}
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    placeholder={t("auth.enterName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={FIELD_CLASS}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t("auth.phone")}
                </label>
                <input
                  ref={isRegister ? undefined : firstFieldRef}
                  id="phone"
                  type="tel"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="05XXXXXXXX"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setError("");
                  }}
                  className={FIELD_CLASS}
                  required
                />
              </div>

              {/* Sign-in asks for the existing password; registration sets one */}
              {isLogin ? (
                <PasswordField
                  label={t("auth.password")}
                  placeholder={t("auth.enterPassword")}
                  value={password}
                  onChange={(v) => {
                    setPassword(v);
                    setError("");
                  }}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              ) : null}

              {isRegister ? (
                <>
                  <PasswordField
                    label={t("auth.password")}
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    showRules
                  />
                  <PasswordField
                    label={t("auth.confirmPassword")}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    error={
                      confirmPassword.length > 0 && password !== confirmPassword
                        ? t("auth.passwordsMismatch")
                        : undefined
                    }
                  />
                </>
              ) : null}

              {error ? <ErrorNote message={error} /> : null}

              <button
                type="submit"
                disabled={!canSubmitIdentify || isSubmitting}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : null}
                {isLogin
                  ? isSubmitting
                    ? t("auth.signingIn")
                    : t("auth.signIn")
                  : t("auth.sendOtp")}
              </button>

              {/* Forgotten password — only offered where it applies */}
              {isLogin ? (
                <p className="text-center">
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded py-1"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </p>
              ) : null}

              {/* Switch between signing in and registering */}
              <p className="text-center text-sm text-gray-500 pt-1">
                {isLogin ? (
                  <>
                    {t("auth.noAccountPrompt")}{" "}
                    <SwitchLink
                      onClick={() => switchMode("register")}
                      label={t("auth.createAccount")}
                    />
                  </>
                ) : (
                  <>
                    {t("auth.hasAccountPrompt")}{" "}
                    <SwitchLink
                      onClick={() => switchMode("login")}
                      label={t("auth.backToLogin")}
                    />
                  </>
                )}
              </p>
            </form>
          )}

          {/* Step: verification code (plus the new password when resetting) */}
          {step === "otp" && (
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
              </div>

              <p className="text-sm text-gray-500 text-center">
                {t("auth.codeSentTo")}{" "}
                <span dir="ltr" className="font-medium text-gray-900">
                  {phone}
                </span>
              </p>

              {devCode ? (
                <p className="text-sm text-center font-mono bg-amber-50 text-amber-700 px-3 py-2 rounded-lg border border-amber-200">
                  DEV: {devCode}
                </p>
              ) : null}

              <OtpInput
                length={CODE_LENGTH}
                value={otp}
                onChange={(next) => {
                  setOtp(next);
                  if (otpError) {
                    setOtpError(false);
                    setError("");
                  }
                }}
                hasError={otpError}
                disabled={isSubmitting}
                // Resetting still needs the new password below, so a complete
                // code must not submit the form on its own.
                onComplete={isReset ? undefined : submitCode}
              />

              {isReset ? (
                <>
                  <PasswordField
                    label={t("auth.newPassword")}
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    showRules
                  />
                  <PasswordField
                    label={t("auth.confirmPassword")}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    error={
                      confirmPassword.length > 0 && password !== confirmPassword
                        ? t("auth.passwordsMismatch")
                        : undefined
                    }
                  />
                </>
              ) : null}

              {error ? <ErrorNote message={error} /> : null}

              <button
                onClick={() => submitCode(otp)}
                disabled={!canSubmitCode || isSubmitting}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : null}
                {isSubmitting
                  ? isRegister
                    ? t("auth.creatingAccount")
                    : t("auth.verifying")
                  : isReset
                    ? t("auth.resetSubmit")
                    : t("auth.verifyOtp")}
              </button>

              <div className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("identify");
                    setOtp("");
                    setOtpError(false);
                    setError("");
                    setDevCode("");
                  }}
                  className="text-gray-500 hover:text-primary transition-colors py-2 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                >
                  {t("auth.changeNumber")}
                </button>

                <button
                  type="button"
                  onClick={() => sendCode()}
                  disabled={resendIn > 0 || isSubmitting}
                  className="text-primary hover:underline disabled:text-gray-400 disabled:no-underline transition-colors py-2 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
                >
                  {resendIn > 0
                    ? t("auth.resendIn", { seconds: resendIn })
                    : t("auth.resendCode")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SwitchLink({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none rounded"
    >
      {label}
    </button>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg"
      role="alert"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
      {message}
    </p>
  );
}

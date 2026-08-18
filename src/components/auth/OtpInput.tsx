"use client";

import { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  /** Turns the boxes red and shakes them. */
  hasError?: boolean;
  disabled?: boolean;
  /** Fired when the last box is filled, so the parent can auto-submit. */
  onComplete?: (value: string) => void;
}

/**
 * One box per digit, with the behaviour people expect from a code field:
 * typing advances, Backspace retreats, arrows move, and a pasted code fills
 * every box at once.
 */
export function OtpInput({
  value,
  onChange,
  length = 4,
  hasError = false,
  disabled = false,
  onComplete,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first empty box whenever the code is cleared (e.g. after an error).
  useEffect(() => {
    if (value.length === 0) inputsRef.current[0]?.focus();
  }, [value.length]);

  function setDigit(index: number, digit: string) {
    const next = value.split("");
    next[index] = digit;

    // Keep the string dense so `value.length` tracks how many boxes are filled.
    const joined = next.join("").replace(/\D/g, "").slice(0, length);
    onChange(joined);

    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (joined.length === length) onComplete?.(joined);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();

      if (value[index]) {
        // Clear this box first; a second press moves back.
        const next = value.split("");
        next[index] = "";
        onChange(next.join("").replace(/\D/g, ""));
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        const next = value.split("");
        next[index - 1] = "";
        onChange(next.join("").replace(/\D/g, ""));
      }
      return;
    }

    // Arrow keys follow visual order, which is LTR even on an RTL page.
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (!pasted) return;

    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  }

  return (
    <div
      dir="ltr"
      className={`flex justify-center gap-2 sm:gap-3 ${hasError ? "animate-otp-shake" : ""}`}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          spellCheck={false}
          maxLength={1}
          disabled={disabled}
          value={value[index] ?? ""}
          onChange={(e) => setDigit(index, e.target.value.replace(/\D/g, "").slice(-1))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`${index + 1}`}
          aria-invalid={hasError}
          className={`w-14 h-16 sm:w-16 sm:h-[72px] text-center text-2xl font-semibold font-mono border-2 rounded-xl transition-[border-color,background-color,box-shadow] focus:outline-none disabled:opacity-60 ${
            hasError
              ? "border-red-500 bg-red-50 text-red-700 focus-visible:ring-2 focus-visible:ring-red-200"
              : "border-gray-300 text-gray-900 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          }`}
        />
      ))}
    </div>
  );
}

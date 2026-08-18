"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { FormField, FIELD_CLASS } from "@/components/ui/FormField";

type Errors = Partial<Record<string, string>>;

export function ContactForm() {
  const t = useTranslations();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  function reset() {
    setName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setMessage("");
    setErrors({});
    setSubmitError("");
  }

  function validate(): boolean {
    const next: Errors = {};

    if (name.trim().length < 2) next.name = t("contact.nameRequired");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = t("contact.emailInvalid");
    if (phone.trim() && !/^05\d{8}$/.test(phone.trim()))
      next.phone = t("contact.phoneInvalid");
    if (subject.trim().length < 2) next.subject = t("contact.subjectRequired");
    if (message.trim().length < 10) next.message = t("contact.messageMin");

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        setSubmitError(
          res.status === 429 ? t("contact.rateLimited") : t("common.error")
        );
        return;
      }

      setIsDone(true);
    } catch {
      setSubmitError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-gray-200 rounded-2xl">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t("contact.successTitle")}
        </h2>
        <p className="text-base text-gray-500 max-w-sm mb-6">
          {t("contact.successDesc")}
        </p>
        <button
          onClick={() => {
            setIsDone(false);
            reset();
          }}
          className="px-6 py-3 text-base font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none min-h-[48px]"
        >
          {t("contact.sendAnother")}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white border border-gray-200 rounded-2xl p-5"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t("contact.formTitle")}
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="contact-name" label={t("contact.name")} error={errors.name}>
            <input
              id="contact-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("contact.namePlaceholder")}
              className={FIELD_CLASS}
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
            />
          </FormField>

          <FormField
            id="contact-email"
            label={t("contact.email")}
            error={errors.email}
          >
            <input
              id="contact-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("contact.emailPlaceholder")}
              className={FIELD_CLASS}
              maxLength={200}
              aria-invalid={Boolean(errors.email)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="contact-phone"
            label={t("contact.phoneOptional")}
            error={errors.phone}
          >
            <input
              id="contact-phone"
              type="tel"
              dir="ltr"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="05XXXXXXXX"
              className={FIELD_CLASS}
              aria-invalid={Boolean(errors.phone)}
            />
          </FormField>

          <FormField
            id="contact-subject"
            label={t("contact.subject")}
            error={errors.subject}
          >
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("contact.subjectPlaceholder")}
              className={FIELD_CLASS}
              maxLength={200}
              aria-invalid={Boolean(errors.subject)}
            />
          </FormField>
        </div>

        <FormField
          id="contact-message"
          label={t("contact.message")}
          error={errors.message}
        >
          <textarea
            id="contact-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("contact.messagePlaceholder")}
            rows={6}
            className={`${FIELD_CLASS} resize-y`}
            maxLength={5000}
            aria-invalid={Boolean(errors.message)}
          />
        </FormField>
      </div>

      {submitError && (
        <p
          className="flex items-center gap-2 mt-4 px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 w-full mt-5 px-6 py-3 text-base font-medium text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none min-h-[52px]"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="w-5 h-5" aria-hidden="true" />
        )}
        {isSubmitting ? t("contact.sending") : t("contact.send")}
      </button>
    </form>
  );
}

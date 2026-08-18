import { AlertCircle } from "lucide-react";

/** Shared input styling for every form control in the app. */
export const FIELD_CLASS =
  "w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-[border-color,box-shadow] min-h-[48px]";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1.5"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

interface GateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  /**
   * A way out of the gate — typically a sign-in button. Without one the
   * visitor is told what is missing but given no means to fix it.
   */
  children?: React.ReactNode;
}

/**
 * Shown in place of a form when the visitor is not allowed to use it yet —
 * not signed in, or signed in but not Nafath verified.
 */
export function Gate({ icon, title, description, children }: GateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-base text-gray-500 max-w-sm">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

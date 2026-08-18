"use client";

import { useLocale } from "next-intl";
import { formatAmount, discountedPrice } from "@/lib/utils";
import { Riyal } from "./Riyal";

interface PriceProps {
  amount: number;
  /** When set, `amount` is struck through and the reduced figure leads. */
  discountPercent?: number | null;
  className?: string;
  /** Styling for the struck-through original, when a discount applies. */
  originalClassName?: string;
}

/** A price with the Riyal mark, and the original struck through when discounted. */
export function Price({
  amount,
  discountPercent,
  className = "",
  originalClassName = "",
}: PriceProps) {
  const locale = useLocale();

  const hasDiscount =
    typeof discountPercent === "number" &&
    discountPercent > 0 &&
    discountPercent < 100;

  const payable = hasDiscount ? discountedPrice(amount, discountPercent) : amount;

  return (
    <span className="inline-flex items-baseline flex-wrap gap-x-2">
      <span className={`inline-flex items-baseline gap-1 ${className}`}>
        {formatAmount(payable, locale)}
        <Riyal />
      </span>

      {hasDiscount && (
        <span
          className={`inline-flex items-baseline gap-1 line-through text-gray-400 font-normal ${originalClassName}`}
        >
          {formatAmount(amount, locale)}
          <Riyal />
        </span>
      )}
    </span>
  );
}

/** The "-20%" chip shown next to a discounted price. */
export function DiscountBadge({
  discountPercent,
  className = "",
}: {
  discountPercent: number;
  className?: string;
}) {
  const locale = useLocale();

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full ${className}`}
    >
      {new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA").format(
        discountPercent
      )}
      % −
    </span>
  );
}

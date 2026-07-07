/**
 * Bidi-safe numeric primitives.
 *
 * In an RTL document (`dir="rtl"`) neutral characters (`-`, `$`, digits, `%`,
 * `,`, `.`) are re-ordered by the Unicode bidi algorithm relative to the
 * surrounding Arabic text. That is what causes "-12%" to render as "%12-"
 * and "$2,900" to render as "900,2$". The fix is to isolate each numeric
 * unit in its own directional context — either via `<bdi>` (default in
 * modern browsers: `unicode-bidi: isolate`) or with an explicit LTR wrapper.
 *
 * Never build a price by concatenating currency + number + decimals in
 * separate spans inside an RTL container — the neutrals flip. Always emit
 * the whole token as one `<bdi>` element.
 */
import { useLocale } from "@/i18n/LocaleProvider";

export function Bdi({ children, className }: { children: React.ReactNode; className?: string }) {
  return <bdi className={className} dir="ltr">{children}</bdi>;
}

/** Formatted currency amount, isolated so RTL text can't reorder it. */
export function Money({
  usd,
  className,
  strike,
}: {
  usd: number;
  className?: string;
  strike?: boolean;
}) {
  const { formatPrice } = useLocale();
  return (
    <bdi
      dir="ltr"
      className={`${strike ? "line-through" : ""} ${className ?? ""}`.trim()}
    >
      {formatPrice(usd)}
    </bdi>
  );
}

/** Percentage / discount token, e.g. "-12%". */
export function Percent({
  value,
  sign = "",
  suffix = "%",
  className,
}: {
  value: number;
  sign?: "" | "+" | "-";
  suffix?: string;
  className?: string;
}) {
  return (
    <bdi dir="ltr" className={className}>
      {sign}
      {value}
      {suffix}
    </bdi>
  );
}

/** Generic isolated numeric token (quantities, counts, SKUs, order #). */
export function Num({ children, className }: { children: React.ReactNode; className?: string }) {
  return <bdi dir="ltr" className={className}>{children}</bdi>;
}
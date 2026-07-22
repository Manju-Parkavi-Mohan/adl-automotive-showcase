import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

/**
 * International phone input with country flag + dial-code selector.
 * Value is stored in E.164 format (e.g. "+13213155394").
 */
export function PhoneField({
  value,
  onChange,
  defaultCountry,
  placeholder = "Phone number",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <PhoneInput
      international
      defaultCountry={(defaultCountry?.toUpperCase() as never) || undefined}
      value={value || undefined}
      onChange={(v) => onChange(v ?? "")}
      placeholder={placeholder}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 [&_input]:flex-1 [&_input]:bg-transparent [&_input]:outline-none",
        className,
      )}
    />
  );
}
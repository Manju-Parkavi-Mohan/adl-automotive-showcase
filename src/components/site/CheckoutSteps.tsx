import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStep = "cart" | "address" | "shipping" | "payment" | "confirm" | "complete";

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: "cart", label: "Cart" },
  { id: "address", label: "Address" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
  { id: "confirm", label: "Confirm" },
  { id: "complete", label: "Complete" },
];

export function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <nav
      aria-label="Checkout progress"
      className="mb-6 rounded-xl border border-border bg-white px-4 py-3 shadow-sm"
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {STEPS.map((step, idx) => {
          const isCurrent = idx === currentIdx;
          const isDone = idx < currentIdx;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={cn(
                  "font-medium",
                  isCurrent && "text-primary",
                  isDone && "text-foreground",
                  !isCurrent && !isDone && "text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
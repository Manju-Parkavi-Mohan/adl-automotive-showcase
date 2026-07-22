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

export function CheckoutSteps({
  current,
  onNavigate,
}: {
  current: CheckoutStep;
  onNavigate?: (step: CheckoutStep) => void;
}) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <nav
      aria-label="Checkout progress"
      className="mb-6 rounded-xl border border-border bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3"
    >
      <ol className="flex flex-nowrap items-center gap-x-1.5 overflow-x-auto whitespace-nowrap text-[11px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-x-2 sm:text-sm">
        {STEPS.map((step, idx) => {
          const isCurrent = idx === currentIdx;
          const isDone = idx < currentIdx;
          const clickable = isDone && !!onNavigate;
          return (
            <li key={step.id} className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onNavigate!(step.id)}
                  className="font-medium text-foreground underline-offset-2 hover:text-primary hover:underline"
                >
                  {step.label}
                </button>
              ) : (
                <span
                  className={cn(
                    "font-medium",
                    isCurrent && "text-primary",
                    !isCurrent && !isDone && "text-muted-foreground",
                    isDone && !onNavigate && "text-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {step.label}
                </span>
              )}
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 sm:h-4 sm:w-4" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
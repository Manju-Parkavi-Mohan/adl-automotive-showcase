import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getOrderedCountries, findCountry } from "@/lib/countries";

export function CountrySelect({
  value,
  onChange,
  placeholder = "Select country",
  className,
}: {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const countries = useMemo(() => getOrderedCountries(), []);
  const selected = findCountry(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{selected.flag}</span>
              <span>{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            // itemValue is "CODE|Name" — match either.
            const q = search.trim().toLowerCase();
            if (!q) return 1;
            return itemValue.toLowerCase().includes(q) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.code}|${c.name}`}
                  onSelect={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                >
                  <span className="me-2 text-base leading-none">{c.flag}</span>
                  <span>{c.name}</span>
                  <Check
                    className={cn(
                      "ms-auto h-4 w-4",
                      value?.toUpperCase() === c.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
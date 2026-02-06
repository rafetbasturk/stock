// src/components/MultiSelectFilter.tsx
import { useState } from "react";
import type { Column } from "@tanstack/react-table";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export interface MultiSelectFilterProps {
  filter: {
    columnId: string;
    label: string;
    options: { value: string; label: string }[];
  };
  column: Column<any, unknown>;
  onChange: (columnId: string, selectedValues: string[]) => void;
}

export function MultiSelectFilter({
  filter,
  column,
  onChange,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const raw = column.getFilterValue();
  const selectedValues: string[] = Array.isArray(raw) ? raw : [];

  const allOptionValues = filter.options.map((opt) => opt.value);

  const handleSelect = (value: string) => {
    let next: string[];

    if (value === "all") {
      // "All" → clear filter
      next = [];
    } else {
      if (selectedValues.includes(value)) {
        next = selectedValues.filter((v) => v !== value);
      } else {
        next = [...selectedValues, value];
      }

      // If every option is selected, treat as "All" (no filter)
      if (next.length === allOptionValues.length) {
        next = [];
      }
    }

    onChange(filter.columnId, next);
  };

  const isAllSelected = selectedValues.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full md:w-48 font-normal text-muted-foreground"
        >
          {filter.label} <ChevronDown />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full md:w-48 p-0" align="center">
        <Command>
          <CommandInput placeholder={`${filter.label} ara...`} />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="all" onSelect={() => handleSelect("all")}>
                <div className="flex items-center">
                  <div
                    className={`border rounded w-4 h-4 mr-2 flex items-center justify-center ${
                      isAllSelected
                        ? "bg-primary border-primary"
                        : "border-gray-300"
                    }`}
                  >
                    {isAllSelected && (
                      <div className="w-2 h-2 bg-white rounded-sm" />
                    )}
                  </div>
                  Tümü
                </div>
              </CommandItem>

              {filter.options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <div className="flex items-center capitalize">
                      <div
                        className={`border rounded w-4 h-4 mr-2 flex items-center justify-center ${
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-sm" />
                        )}
                      </div>
                      {option.label}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

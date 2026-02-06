import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { cn } from "@/lib/utils";
import { Field, FieldError, FieldLabel } from "../ui/field";

type Entity = {
  id: number;
  code?: string;
  name: string;
  [key: string]: any;
};

type Props<T extends Entity> = {
  id?: string;
  label?: string;
  placeholder?: string;
  entities: T[];
  value: number | null;
  onChange: (id: number) => void;
  isLoading?: boolean;
  error?: string;
  required?: boolean;
};

export default function EntityCombobox<T extends Entity>({
  id = "entity_id",
  label,
  placeholder = "Bir kayıt seçin",
  entities,
  value,
  onChange,
  isLoading = false,
  error,
  required = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = entities.find((e) => e.id === value);

  const filteredEntities = useMemo(() => {
    if (!search) return entities;
    const lower = search.toLowerCase();
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(lower) ||
        e.code?.toLowerCase().includes(lower)
    );
  }, [search, entities]);

  return (
    <Field className="gap-1 relative">
      {label && (
        <FieldLabel htmlFor={id}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </FieldLabel>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild id={id}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!error}
            disabled={isLoading}
            className={cn("w-full justify-between", error && "border-red-500")}
          >
            <div className="flex-1 min-w-0 text-left truncate capitalize">
              {isLoading
                ? "Yükleniyor..."
                : selected
                  ? selected.code
                    ? `${selected.code} - ${selected.name}`
                    : selected.name
                  : placeholder}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput
              placeholder="Ara..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Yükleniyor...</CommandEmpty>
              ) : filteredEntities.length === 0 ? (
                <CommandEmpty>Kayıt bulunamadı.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredEntities.map((entity) => (
                    <CommandItem
                      key={entity.id}
                      value={`${entity.code ?? ""} ${entity.name}`}
                      onSelect={() => {
                        onChange(entity.id);
                        setOpen(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            entity.id === value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {entity.code && (
                          <span className="font-medium">{entity.code}</span>
                        )}
                        <span className="truncate max-w-50">
                          {entity.name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {(entity?.price! / 100).toFixed(2)} {entity?.currency}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <FieldError className="text-xs absolute -bottom-4">{error}</FieldError>
      )}
    </Field>
  );
}

import { fetchCustomers } from "@/lib/queries/customers";
import { useEffect, useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import EntitySelect from "./form/EntitySelect";

type Props = {
  value: number | null;
  onValueChange: (id: number | null) => void;
  error?: string;
  onErrorChange?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  required?: boolean;
  label?: string;
  includeAllOption?: boolean;
  filterIds?: number[];
};

export default function CustomerInput({
  value,
  onValueChange,
  error,
  onErrorChange,
  required = false,
  label,
  includeAllOption = false,
  filterIds,
}: Props) {
  const { data: customers, isLoading } = useSuspenseQuery(fetchCustomers);

  const filtered = useMemo(() => {
    if (!customers) return [];
    if (!filterIds) return customers;
    return customers.filter((c) => filterIds.includes(c.id));
  }, [customers, filterIds]);

  const customerOptions =
    filtered?.map((c) => ({
      id: c.id,
      label: `${c.code} - ${c.name}`,
    })) ?? [];

  // --- Auto-select if only 1 available ---
  useEffect(() => {
    if (filtered.length === 1 && !value) {
      onValueChange(filtered[0]?.id ?? 0);
    }
  }, [filtered, value, onValueChange]);

  const options = includeAllOption
    ? [
        {
          id: "all",
          label: "Tümü",
          value: "all",
          returnValue: null,
        },
        ...customerOptions,
      ]
    : customerOptions;

  return (
    <EntitySelect
      name="customer_id"
      label={label}
      placeholder="Tüm müşteriler"
      value={value}
      onValueChange={onValueChange}
      error={error}
      onErrorChange={onErrorChange}
      required={required}
      loading={isLoading}
      options={options}
    />
  );
}

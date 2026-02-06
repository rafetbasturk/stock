// src/components/products/product-form/hooks/useProductForm.ts
import { useEffect, useRef, useState } from "react";
import {
  convertFormValueToNumber,
  createNumberInputHandler,
} from "@/lib/inputUtils";
import type { Currency, InsertProduct, Product } from "@/types";
import { unitArray } from "@/lib/constants";
import { FieldErrors } from "@/lib/error/utils/formErrors";

const productInitials: InsertProduct = {
  code: "",
  name: "",
  customer_id: 1,
  price: 0,
  currency: "EUR",
  unit: unitArray[0],
  stock_quantity: 0,
  min_stock_level: 0,
  other_codes: "",
  post_process: "",
  material: "",
  specs: "",
  specs_net: "",
  notes: "",
  coating: "",
};

// ✅ Normalize a form for comparison (avoid false dirty due to types / formatting)
function normalizeForm(form: InsertProduct): InsertProduct {
  return {
    ...form,
    code: form.code?.trim() ?? "",
    name: form.name?.trim() ?? "",
    customer_id: Number(form.customer_id ?? 0),
    stock_quantity: Number(form.stock_quantity ?? 0),
    min_stock_level: Number(form.min_stock_level ?? 0),
    price: Number(form.price ?? 0),
    other_codes: form.other_codes ?? "",
    post_process: form.post_process ?? "",
    material: form.material ?? "",
    specs: form.specs ?? "",
    specs_net: form.specs_net ?? "",
    notes: form.notes ?? "",
    coating: form.coating ?? "",
    unit: form.unit ?? unitArray[0],
  };
}

function areFormsEqual(a: InsertProduct, b: InsertProduct): boolean {
  const na = normalizeForm(a);
  const nb = normalizeForm(b);
  return JSON.stringify(na) === JSON.stringify(nb);
}

type Props = {
  item?: Product | null;
  onSuccess: (payload: InsertProduct) => void;
};

export function useProductForm({ item, onSuccess }: Props) {
  const [form, setForm] = useState<InsertProduct>(productInitials);
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  // 🧊 Baseline form snapshot (never mutated directly)
  const initialFormRef = useRef<InsertProduct>(productInitials);

  // When product changes (open edit / new product), reset form + baseline
  useEffect(() => {
    if (item) {
      const normalizedProduct: InsertProduct = {
        ...item,
        // convert stored cents → UI currency
        price: (item.price ?? 0) / 100,
      };

      setForm(normalizedProduct);
      initialFormRef.current = normalizedProduct;
    } else {
      setForm(productInitials);
      initialFormRef.current = productInitials;
    }
  }, [item?.id]); // 👈 only when switching item

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!form.code?.trim()) {
      errors.code = { i18n: { ns: "validation", key: "required" } };
    }

    if (!form.name?.trim()) {
      errors.name = { i18n: { ns: "validation", key: "required" } };
    }

    if (form.price && form.price < 0) {
      errors.price = { i18n: { ns: "validation", key: "invalid" } };
    }

    if (form.stock_quantity && form.stock_quantity < 0) {
      errors.stock_quantity = { i18n: { ns: "validation", key: "invalid" } };
    }

    if (form.min_stock_level && form.min_stock_level < 0) {
      errors.min_stock_level = { i18n: { ns: "validation", key: "invalid" } };
    }

    if (
      form.min_stock_level !== undefined &&
      form.stock_quantity !== undefined
    ) {
      if (form.min_stock_level > form.stock_quantity) {
        errors.min_stock_level = { i18n: { ns: "validation", key: "invalid" } };
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNumberChange = createNumberInputHandler(setForm, setFormErrors);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // 🔍 hasChanged is derived from baseline vs current form
  const hasChanged = item ? !areFormsEqual(initialFormRef.current, form) : true; // new product is always "dirty" (can submit)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 🛑 In edit mode, if nothing changed → do nothing
    if (item && !hasChanged) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const { id, created_at, updated_at, deleted_at, ...formData } = form;
    const payload: InsertProduct = {
      ...formData,
      stock_quantity: Number(formData.stock_quantity),
      min_stock_level: Number(formData.min_stock_level),
      price: Math.round(convertFormValueToNumber(formData.price) * 100),
    };

    try {
      onSuccess(payload);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomerChange = (id: number | null) =>
    setForm((prev) => ({ ...prev, customer_id: Number(id) }));

  const handleCurrencyChange = (currency: Currency) => {
    setForm((prev) => ({
      ...prev,
      currency: currency,
    }));
  };

  return {
    form,
    setForm,
    formErrors,
    setFormErrors,
    handleNumberChange,
    handleTextChange,
    handleSubmit,
    handleCustomerChange,
    handleCurrencyChange,
    hasChanged, // 👈 expose
  };
}

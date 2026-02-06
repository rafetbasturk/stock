import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { InsertProduct, ProductListRow } from "@/types";
import { useProductForm } from "./product-form/hooks/useProductForm";
import {
  ProductFormBasicInfo,
  ProductFormFooter,
  ProductFormHeader,
  ProductFormTechInfo,
} from "./product-form";
import * as Tabs from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Box, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useCreateProductMutation, useUpdateProductMutation } from "@/lib/mutations/products";

interface BasePaginatedFormProps<TData, TSubmitPayload> {
  item?: TData;
  isSubmitting: boolean;
  onClose: () => void;
  onSuccess: (payload: TSubmitPayload) => void;
}

type ProductFormProps = BasePaginatedFormProps<ProductListRow, InsertProduct>;

export default function ProductForm({
  item: product,
  onClose,
  onSuccess: onSuccessProp,
  isSubmitting: isSubmittingProp,
}: ProductFormProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const {
    form,
    setForm,
    formErrors,
    setFormErrors,
    handleNumberChange,
    handleTextChange,
    handleSubmit,
    handleCustomerChange,
    handleCurrencyChange,
    hasChanged,
  } = useProductForm({
    item: product,
    onSuccess: (val) => {
      if (!product) {
        createMutation.mutate(val);
      } else {
        updateMutation.mutate({ id: product.id, data: val });
      }
    },
  });

  const createMutation = useCreateProductMutation(
    () => {
      onSuccessProp(form);
    },
    {
      setAllErrors: (errors) => setFormErrors(errors),
      resetErrors: () => setFormErrors({}),
    },
  );

  const updateMutation = useUpdateProductMutation(
    () => {
      onSuccessProp(form);
    },
    {
      setAllErrors: (errors) => setFormErrors(errors),
      resetErrors: () => setFormErrors({}),
    },
  );

  const isSubmitting =
    isSubmittingProp || createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 sm:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col gap-0 border-none bg-background shadow-2xl">
        <ProductFormHeader productId={product?.id} />

        <form className="flex-1 flex flex-col min-h-0" onSubmit={handleSubmit}>
          <Tabs.Root
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col md:flex-row min-h-0"
          >
            {/* Sidebar Navigation */}
            <Tabs.List className="w-full md:w-64 bg-secondary/20 border-b md:border-b-0 md:border-r p-8 flex md:flex-col gap-2 shrink-0 overflow-x-auto no-scrollbar">
              <TabTrigger
                value="basic"
                icon={Box}
                label="Temel Bilgiler"
                description="KOD, AD ve Stok"
                active={activeTab === "basic"}
              />
              <TabTrigger
                value="tech"
                icon={Settings}
                label="Teknik Detaylar"
                description="Malzeme ve Ölçü"
                active={activeTab === "tech"}
              />
            </Tabs.List>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="p-8"
                >
                  {activeTab === "basic" ? (
                    <ProductFormBasicInfo
                      form={form}
                      setForm={setForm}
                      formErrors={formErrors}
                      setFormErrors={setFormErrors}
                      onTextChange={handleTextChange}
                      onCustomerChange={handleCustomerChange}
                      onNumberChange={handleNumberChange}
                      onCurrencyChange={handleCurrencyChange}
                    />
                  ) : (
                    <ProductFormTechInfo
                      form={form}
                      setForm={setForm}
                      formErrors={formErrors}
                      onTextChange={handleTextChange}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs.Root>

          <ProductFormFooter
            productId={product?.id}
            isSubmitting={isSubmitting}
            onClose={onClose}
            hasChanged={hasChanged}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TabTrigger({
  value,
  icon: Icon,
  label,
  description,
  active,
}: {
  value: string;
  icon: any;
  label: string;
  description: string;
  active: boolean;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className={cn(
        "group relative flex items-center md:items-start gap-3 p-3 text-left transition-all duration-200 rounded-xl border border-transparent outline-none w-full",
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "hover:bg-secondary/80 text-muted-foreground hover:text-foreground",
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg shrink-0",
          active
            ? "bg-white/20"
            : "bg-background border border-border shadow-sm",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="hidden md:flex flex-col gap-0.5 text-left">
        <span className="text-sm font-bold tracking-tight">{label}</span>
        <span
          className={cn(
            "text-[10px] uppercase font-bold tracking-wider opacity-60",
            active ? "text-white" : "text-muted-foreground",
          )}
        >
          {description}
        </span>
      </div>
      {active && (
        <ChevronRight className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 size-4 text-white/50" />
      )}
    </Tabs.Trigger>
  );
}

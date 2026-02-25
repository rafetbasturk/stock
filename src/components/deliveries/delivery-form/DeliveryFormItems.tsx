// src/components/deliveries/delivery-form/DeliveryFormItems.tsx
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import EmptyDeliveryTable from "./EmptyDeliveryTable";
import type { DeliveryItem, OrderMinimal } from "../DeliveryForm";
import type { FieldErrors } from "@/lib/error/utils/formErrors";
import type { I18nErrorMessage } from "@/lib/error/core/errorTransport";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FieldError } from "@/components/ui/field";
import Combobox from "@/components/form/Combobox";
import { cn } from "@/lib/utils";
import { convertToCurrencyFormat } from "@/lib/currency";

interface Props {
  orders: Array<OrderMinimal>;
  items: Array<DeliveryItem>;
  kind: "DELIVERY" | "RETURN";
  onItemChange: (index: number, field: string, value: any) => void;
  removeItem: (index: number) => void;
  addItem: () => void;
  errors: FieldErrors;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
}

export default function DeliveryFormItems({
  orders,
  items,
  kind,
  onItemChange,
  removeItem,
  addItem,
  errors,
  setErrors,
}: Props) {
  const { t } = useTranslation();
  const getError = (i: number, field: string): I18nErrorMessage | undefined =>
    errors[`items.${i}.${field}`];
  const renderError = (error?: I18nErrorMessage) =>
    error ? t(`${error.i18n.ns}:${error.i18n.key}`, error.params) : "";

  const clearError = (i: number, field: string) =>
    setErrors((prev) => {
      const k = `items.${i}.${field}`;
      if (!prev[k]) return prev;
      const s = { ...prev };
      delete s[k];
      return s;
    });

  const subtotal = items.reduce(
    (sum, i) => sum + (i.price ?? 0) * i.delivered_quantity,
    0
  );

  const netDelivered = (deliveries?: Array<any>) =>
    deliveries?.reduce(
      (sum, d) =>
        sum +
        ((d?.delivery?.kind === "RETURN" ? -1 : 1) *
          (d?.delivered_quantity ?? 0)),
      0
    ) ?? 0;

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-lg">Ürün Kalemleri</h3>

      {/* ============= TABLE ============= */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-9.5" />
                <TableHead className="min-w-45">
                  Sipariş Numarası
                </TableHead>
                <TableHead className="min-w-50">Ürün Kodu</TableHead>
                <TableHead className="min-w-50">Ürün Adı</TableHead>
                <TableHead className="w-15 text-center">Birim</TableHead>
                <TableHead className="w-26.25 text-right">Fiyat</TableHead>
                <TableHead className="w-40">Sevk Adedi</TableHead>
                <TableHead className="w-30 text-right">Tutar</TableHead>
                <TableHead className="w-15" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center">
                    <EmptyDeliveryTable />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, idx) => {
                  const order = orders.find((o) => o.id === item.order_id);
                  const deliveredQtyError = getError(idx, "delivered_quantity");

                  const orderItems = [
                    ...(order?.items || []).map((oi) => {
                      const sent = netDelivered(oi.deliveries);
                      const remaining =
                        kind === "RETURN"
                          ? Math.max(sent, 0)
                          : Math.max(oi.quantity - sent, 0);

                      return {
                        value: oi.id,
                        label: oi.product.code,
                        searchText: `${oi.product.code} ${oi.product.name}`,
                        disabled: remaining <= 0,
                        data: {
                          name: oi.product.name,
                          qty: oi.quantity,
                          sent,
                          remaining,
                        },
                      };
                    }),
                    ...(order?.customItems || []).map((ci) => {
                      const sent = netDelivered(ci.deliveries);
                      const remaining =
                        kind === "RETURN"
                          ? Math.max(sent, 0)
                          : Math.max(ci.quantity - sent, 0);

                      return {
                        value: ci.id,
                        label: ci.custom_name || ci.custom_code || "Özel ürün",
                        searchText: `${ci.custom_name} ${ci.custom_code}`,
                        disabled: remaining <= 0,
                        data: {
                          name: ci.custom_name || "Özel ürün",
                          qty: ci.quantity,
                          sent,
                          remaining,
                        },
                      };
                    }),
                  ];

                  const remaining = item.remaining_quantity;
                  const deliveredNow = item.delivered_quantity;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-center">{idx + 1}</TableCell>

                      {/* == ORDER SELECTION == */}
                      <TableCell>
                        <Combobox
                          placeholder="Sipariş seç"
                          items={orders.map((o) => ({
                            value: o.id,
                            label: o.order_number,
                          }))}
                          value={item.order_id ?? null}
                          onChange={(v) => {
                            clearError(idx, "order_id");
                            onItemChange(idx, "order_id", v);
                          }}
                          error={getError(idx, "order_id")}
                        />
                      </TableCell>

                      {/* == PRODUCT SELECT == */}
                      <TableCell>
                        <Combobox
                          items={orderItems}
                          value={item.order_item_id ?? ""}
                          onChange={(v) =>
                            onItemChange(idx, "order_item_id", Number(v))
                          }
                          error={getError(idx, "order_item_id")}
                          placeholder="Ürün seç"
                          renderItem={(option) => {
                            const d = option.data; // shortcut

                            return (
                              <div className="flex flex-col w-full">
                                {/* MAIN LINE: Product Code + Lock */}
                                <div className="font-medium text-sm truncate">
                                  {option.label}
                                </div>

                                {/* SECONDARY ROW — Quantities */}
                                {d && (
                                  <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                                    {/* Ordered */}
                                    <span className="px-1.5 py-0.5 bg-gray-200 rounded">
                                      {d.qty} sipariş
                                    </span>

                                    {/* Sent */}
                                    <span className="px-1.5 py-0.5 bg-blue-200 rounded">
                                      {d.sent} net sevk
                                    </span>

                                    {/* Remaining */}
                                    <span
                                      className={cn(
                                        "px-1.5 py-0.5 rounded font-semibold",
                                        d.remaining === 0
                                          ? "bg-red-200 text-red-700"
                                          : "bg-green-200 text-green-700"
                                      )}
                                    >
                                      {d.remaining} kalan
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                      </TableCell>

                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-center">{item.unit}</TableCell>

                      <TableCell className="text-right">
                        {(item.price ?? 0) / 100} ₺
                      </TableCell>

                      {/* === DELIVERED QTY + PROGRESS === */}
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={remaining}
                          className={cn(
                            "w-20",
                            getError(idx, "delivered_quantity") &&
                              "border-red-500"
                          )}
                          value={item.delivered_quantity}
                          onChange={(e) => {
                            clearError(idx, "delivered_quantity");
                            onItemChange(
                              idx,
                              "delivered_quantity",
                              Number(e.target.value)
                            );
                          }}
                        />

                        {deliveredQtyError && (
                          <FieldError>{renderError(deliveredQtyError)}</FieldError>
                        )}
                      </TableCell>

                      <TableCell className="text-right font-semibold">
                        {convertToCurrencyFormat({
                          cents: (item.price ?? 0) * deliveredNow,
                        })}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ADD NEW ITEM */}
      <Button
        onClick={addItem}
        variant="outline"
        className="mt-2 flex gap-2"
        type="button"
      >
        <Plus size={15} /> Kalem Ekle
      </Button>

      {errors.items && (
        <FieldError>
          {t(`${errors.items.i18n.ns}:${errors.items.i18n.key}`, errors.items.params)}
        </FieldError>
      )}

      {/* FOOTER TOTALS */}
      <div className="flex justify-end mt-6 text-sm">
        <strong className="text-lg">
          Toplam:{" "}
          {new Intl.NumberFormat("tr", {
            style: "currency",
            currency: items[0]?.currency || "TRY",
          }).format(subtotal / 100)}
        </strong>
      </div>
    </div>
  );
}

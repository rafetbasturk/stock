// src/components/deliveries/delivery-form/DeliveryFormItems.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import EmptyDeliveryTable from "./EmptyDeliveryTable";
import { FieldError } from "@/components/ui/field";
import Combobox from "@/components/form/Combobox";
import { cn } from "@/lib/utils";
import { convertToCurrencyFormat } from "@/lib/currency";
import type { DeliveryItem, OrderMinimal } from "../DeliveryForm";

interface Props {
  orders: OrderMinimal[];
  items: DeliveryItem[];
  onItemChange: (index: number, field: string, value: any) => void;
  removeItem: (index: number) => void;
  addItem: () => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function DeliveryFormItems({
  orders,
  items,
  onItemChange,
  removeItem,
  addItem,
  errors,
  setErrors,
}: Props) {
  const getError = (i: number, field: string) => errors[`items.${i}.${field}`];

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

                  const orderItems = [
                    ...(order?.items || []).map((oi) => {
                      const totalSent =
                        oi.deliveries?.reduce(
                          (sum, d) => sum + d.delivered_quantity,
                          0
                        ) ?? 0;
                      const remaining = Math.max(
                        (oi.quantity ?? 0) - totalSent,
                        0
                      );

                      return {
                        value: oi.id,
                        label: oi.product.code,
                        searchText: `${oi.product.code} ${oi.product.name}`,
                        disabled: remaining <= 0,
                        data: {
                          name: oi.product.name,
                          qty: oi.quantity,
                          sent: totalSent,
                          remaining,
                        },
                      };
                    }),
                    ...(order?.customItems || []).map((ci) => {
                      const totalSent =
                        ci.deliveries?.reduce(
                          (sum, d) => sum + d.delivered_quantity,
                          0
                        ) ?? 0;
                      const remaining = Math.max(
                        (ci.quantity ?? 0) - totalSent,
                        0
                      );

                      return {
                        value: ci.id,
                        label: ci.custom_name || ci.custom_code || "Özel ürün",
                        searchText: `${ci.custom_name} ${ci.custom_code}`,
                        disabled: remaining <= 0,
                        data: {
                          name: ci.custom_name || "Özel ürün",
                          qty: ci.quantity,
                          sent: totalSent,
                          remaining,
                        },
                      };
                    }),
                  ];

                  const remaining = item.remaining_quantity ?? 0;
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
                                      {d.sent} sevk
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

                        {getError(idx, "delivered_quantity") && (
                          <FieldError>
                            {getError(idx, "delivered_quantity")}
                          </FieldError>
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

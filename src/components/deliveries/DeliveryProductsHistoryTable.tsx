import { CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryWithItems } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function DeliveryProductsHistoryTable({
  delivery,
}: {
  delivery: DeliveryWithItems;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border rounded-md m-2 shadow-inner",
        "bg-background border-border",
        "animate-accordion-down duration-500"
      )}
    >
      <h3 className="text-base font-semibold px-4 pt-4 text-foreground">
        📦 Sevk Ürün Detayları
      </h3>

      <div className="max-h-100 overflow-y-auto overflow-x-auto rounded animate-in delay-100 duration-300 m-2 border">
        <Table className="w-full table-auto">
          <TableHeader>
            <TableRow className="bg-muted text-muted-foreground text-xs capitalize">
              <TableHead className="w-20 text-center">Sıra No</TableHead>
              <TableHead className="min-w-40">Ürün</TableHead>
              <TableHead className="text-center min-w-17.5">
                Sipariş
              </TableHead>
              <TableHead className="text-center min-w-22.5">
                Toplam Sevk
              </TableHead>
              <TableHead className="text-center min-w-17.5 text-blue-700 dark:text-blue-400">
                Bu Sevk
              </TableHead>
              <TableHead className="text-center min-w-21.25">Durum</TableHead>
              <TableHead className="min-w-60">
                Geçmiş Sevkiyatlar
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {delivery.items.map((item, i) => {
              const product = item.orderItem?.product ?? item.customOrderItem;
              const ordered =
                item.orderItem?.quantity ?? item.customOrderItem?.quantity ?? 0;
              const past = item.orderItem?.deliveries ?? [];

              const deliveredTotal = past.reduce(
                (s, d) => s + d.delivered_quantity,
                0
              );
              const remaining = ordered - deliveredTotal;
              const progress =
                ordered > 0
                  ? Math.min((deliveredTotal / ordered) * 100, 100)
                  : 0;

              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    "text-sm border-b border-border transition-colors hover:bg-accent/90",
                    remaining === 0 && "bg-green-500/5 dark:bg-green-400/10"
                  )}
                >
                  {/* Sıra No */}
                  <TableCell>
                    <div className="font-medium text-center text-foreground">
                      {i + 1}
                    </div>
                  </TableCell>

                  {/* Ürün */}
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {product?.code}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {product?.name}
                    </div>
                  </TableCell>

                  {/* Sipariş */}
                  <TableCell className="text-center text-foreground">
                    {ordered}
                  </TableCell>

                  {/* Toplam Sevk */}
                  <TableCell className="text-center font-semibold text-green-700 dark:text-green-400">
                    {deliveredTotal}
                  </TableCell>

                  {/* Bu Sevk */}
                  <TableCell className="text-center font-semibold text-blue-700 dark:text-blue-400">
                    {item.delivered_quantity}
                  </TableCell>

                  {/* Durum + Progress */}
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium text-green-700 dark:text-green-400">
                          %{progress.toFixed(0)}
                        </span>

                        <span
                          className={cn(
                            "flex items-center gap-1 font-medium",
                            remaining > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          )}
                        >
                          {remaining > 0 ? (
                            <>
                              <Clock className="w-3 h-3" />
                              {remaining} eksik
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                              Tamamlandı
                            </>
                          )}
                        </span>
                      </div>

                      <div className="h-2 w-full rounded bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded transition-all",
                            remaining > 0
                              ? "bg-green-600 dark:bg-green-500"
                              : "bg-green-500 dark:bg-green-400"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  {/* Geçmiş Sevkiyatlar */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {past.length ? (
                        past
                          .filter(
                            (d) =>
                              d.delivery.delivery_number !==
                              delivery.delivery_number
                          )
                          .map((d) => (
                            <Badge
                              key={d.id}
                              variant="secondary"
                              className="text-xs px-2 py-0.5 w-fit"
                            >
                              {new Date(
                                d.delivery.delivery_date
                              ).toLocaleDateString("tr-TR")}
                              {" — "}
                              {d.delivery.delivery_number}
                              {" — "}
                              {d.delivered_quantity} adet
                            </Badge>
                          ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Önceki sevk yok
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

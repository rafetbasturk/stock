// src/components/deliveries/DeliveryItemsList.tsx
import { DetailTable } from "../DetailTable";
import { getDeliveryItemColumns } from "./deliveryItemsColumns";

export interface DeliveryItemRow {
  id: number;
  product_code: string;
  product_name: string;
  unit: string;
  unit_price: number; // TL
  delivered_quantity: number;
  total_price: number; // TL
  order_number: string;
  order_date: Date;
  currency: string;
  is_custom: boolean;
}

interface Props {
  delivery: any; // full API result array you shared
}

export default function DeliveryItemsList({ delivery }: Props) {
  const items = delivery?.items ?? [];

  const rows: DeliveryItemRow[] = items
    .sort((a: any, b: any) => a.order_number - b.order_number)
    .map((di: any) => {
      const isCustom = !!di.customOrderItem;

      const orderSource = di.orderItem ?? di.customOrderItem;

      const order_number = orderSource?.order?.order_number ?? "—";
      const order_date = orderSource?.order?.order_date
        ? new Date(orderSource.order.order_date)
        : new Date();

      const currency = orderSource?.currency ?? "TRY";

      const product = di.orderItem?.product;
      const productName = product?.name ?? di.customOrderItem?.name ?? "—";
      const productCode =
        product?.code ??
        di.customOrderItem?.custom_code ??
        di.customOrderItem?.name ??
        "—";

      const unit = product?.unit ?? di.customOrderItem?.unit ?? "adet";

      const unitPrice = orderSource?.unit_price ?? 0;
      const deliveredQty = di.delivered_quantity ?? 0;
      const totalPrice = unitPrice * deliveredQty;

      return {
        id: di.id,
        product_code: productCode,
        product_name: productName,
        unit,
        unit_price: unitPrice / 100,
        delivered_quantity: deliveredQty,
        total_price: totalPrice / 100,
        order_number,
        order_date,
        currency,
        is_custom: isCustom,
      };
    });

  const columns = getDeliveryItemColumns();

  return (
    <div className="border rounded-lg shadow-sm">
      <DetailTable data={rows} columns={columns} />
    </div>
  );
}

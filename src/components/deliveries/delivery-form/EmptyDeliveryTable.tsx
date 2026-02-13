import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ShoppingCart } from "lucide-react";


export default function EmptyDeliveryTable() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShoppingCart className="h-12 w-12 text-gray-500" />
        </EmptyMedia>
        <EmptyTitle>Henüz sevk maddesi eklenmedi</EmptyTitle>
        <EmptyDescription>
          Listeye ürün eklemek için aşağıdaki butonu kullanın
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

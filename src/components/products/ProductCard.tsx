import { MoreHorizontal } from "lucide-react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProductCardProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => Promise<void>;
};

export default function ProductCard({
  product,
  onEdit,
  onDelete,
}: ProductCardProps) {
  return (
    <div className="flex flex-wrap justify-between items-center rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div className="min-w-0 break-words">
        <p className="text-sm text-muted-foreground">
          Ürün Kodu: {product.code}
        </p>
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-sm">
          Stok:{" "}
          <span className="font-medium">
            {product.stock_quantity} {product.unit}
          </span>
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(product)}>
            Düzenle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(product.id)}>
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

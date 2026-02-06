import { DataTableRowActions } from "../DataTableRowActions";
import type { ColumnDef } from "@tanstack/react-table";
import type { ActionMenuItem, ProductListRow } from "@/types";

export const getColumns = (
  onEdit: (product: ProductListRow) => void,
  onDelete: (id: number) => void
): Array<ColumnDef<ProductListRow>> => {
  const productActions: Array<ActionMenuItem<ProductListRow>> = [
    {
      label: "Düzenle",
      action: (product) => onEdit(product),
      separatorAfter: true,
    },
    {
      label: "Sil",
      action: (product) => onDelete(product.id),
      isDestructive: true,
    },
  ];

  return [
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      size: 50,
      cell: ({ row }) => (
        <DataTableRowActions row={row} actions={productActions} />
      ),
    },
    {
      accessorKey: "code",
      header: "Ürün Kodu",
      size: 150,
      cell: ({ row }) => (
        <div className="font-medium truncate">{row.getValue("code")}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Ürün Adı",
      minSize: 200,
      size: 300,
      cell: ({ row }) => <div className="truncate">{row.getValue("name")}</div>,
      enableHiding: false,
    },
    {
      accessorKey: "price",
      header: () => <div className="ml-auto">Fiyat</div>,
      meta: { filterTitle: "Fiyat" },
      size: 120,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const price = Number(row.getValue("price")) / 100;
        const formatted = new Intl.NumberFormat("tr", {
          style: "currency",
          currency: row.original.currency || "TRY",
        }).format(price);

        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "stock_quantity",
      header: () => <div className="m-auto">Stok Adedi</div>,
      meta: { filterTitle: "Stok Adedi" },
      enableGlobalFilter: false,
      size: 120,
      cell: ({ row }) => {
        const stockQuantity = Number(row.getValue("stock_quantity"));
        const minStockLevel = Number(row.original.min_stock_level);

        const stockClassName =
          stockQuantity <= minStockLevel ? "text-red-500" : "text-green-600";

        return (
          <div className={`text-center font-bold ${stockClassName}`}>
            {stockQuantity}
          </div>
        );
      },
      enableHiding: false,
      enableSorting: false,
    },
    {
      accessorKey: "other_codes",
      header: "Diğer Kod",
      size: 150,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue("other_codes")}
        </div>
      ),
    },
    {
      accessorKey: "material",
      header: "Malzeme Cinsi",
      size: 150,
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue("material")}
        </div>
      ),
    },
    {
      accessorKey: "post_process",
      header: "Üretim Sonrası",
      size: 150,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue("post_process")}
        </div>
      ),
    },
    {
      accessorKey: "coating",
      header: "Kaplama",
      size: 150,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue("coating")}
        </div>
      ),
    },
    {
      accessorKey: "specs",
      header: "Ölçü (Paylı)",
      size: 120,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue("specs")}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "specs_net",
      header: "Net Ölçü",
      size: 120,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue("specs_net")}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "notes",
      header: "Açıklama",
      minSize: 200,
      size: 250,
      cell: ({ row }) => (
        <div className="text-muted-foreground truncate">
          {row.getValue("notes")}
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "customer",
      header: "Müşteri Adı",
      size: 150,
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground truncate">
            {row.original.customer.name}
          </div>
        );
      },
    },
  ];
};

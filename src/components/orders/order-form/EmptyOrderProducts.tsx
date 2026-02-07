import { ShoppingCart } from 'lucide-react'

export default function EmptyOrderProducts() {
  return (
    <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground">
      <ShoppingCart className="h-10 w-10 mx-auto mb-2" />
      <p className="font-medium">Henüz ürün eklenmedi</p>
      <p className="text-sm">Listeye ürün eklemek için aşağıdaki butonu kullanın</p>
    </div>
  )
}

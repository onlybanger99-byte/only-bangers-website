import { PublicProductsGrid } from '@/components/products/PublicProductsGrid'
import { listActiveProducts } from '@/lib/products/service'

export default async function ProductsPage() {
  const productsResult = await listActiveProducts()
  const products = productsResult.ok ? productsResult.data : []

  return (
    <div className="page-background">
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Premium Products</h1>
          <p className="page-subtitle">Professional grooming products for the modern man</p>
        </div>

        <PublicProductsGrid products={products} />
      </div>
    </div>
  )
}

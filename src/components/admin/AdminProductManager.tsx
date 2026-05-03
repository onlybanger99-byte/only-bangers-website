'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminModal } from './AdminModal'
import styles from '@/app/admin/dashboard/dashboard.module.css'

type AdminProductRow = {
  id: string
  name: string
  slug: string
  description: string
  priceLabel: string
  price: number
  imageUrl: string | null
  category: string
  stockQuantity: number
  isActive: boolean
}

type ProductFormState = {
  name: string
  slug: string
  description: string
  price: string
  imageUrl: string
  category: string
  stockQuantity: string
  isActive: boolean
}

function toFormState(product?: AdminProductRow | null): ProductFormState {
  return {
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    imageUrl: product?.imageUrl ?? '',
    category: product?.category ?? '',
    stockQuantity: product ? String(product.stockQuantity) : '0',
    isActive: product?.isActive ?? true,
  }
}

export function AdminProductManager({
  products,
}: {
  products: AdminProductRow[]
}) {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState<AdminProductRow | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState<ProductFormState>(toFormState())
  const [loadingAction, setLoadingAction] = useState<'save' | 'delete' | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const modalTitle = useMemo(
    () => (selectedProduct ? `Manage ${selectedProduct.name}` : 'Create Product'),
    [selectedProduct]
  )

  const openCreate = () => {
    setSelectedProduct(null)
    setForm(toFormState())
    setError('')
    setMessage('')
    setIsCreateOpen(true)
  }

  const openManage = (product: AdminProductRow) => {
    setSelectedProduct(product)
    setForm(toFormState(product))
    setError('')
    setMessage('')
    setIsCreateOpen(true)
  }

  const submit = async () => {
    setLoadingAction('save')
    setError('')
    setMessage('')

    const endpoint = selectedProduct ? `/api/admin/products/${selectedProduct.id}` : '/api/admin/products'
    const method = selectedProduct ? 'PATCH' : 'POST'
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...form,
        price: Number.parseFloat(form.price),
        stockQuantity: Number.parseInt(form.stockQuantity, 10),
      }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message} ${details}`.trim() : 'Could not save this product.')
      setLoadingAction(null)
      return
    }

    setMessage(selectedProduct ? 'Product updated.' : 'Product created.')
    setLoadingAction(null)
    router.refresh()
    if (!selectedProduct) {
      setForm(toFormState())
    }
  }

  const remove = async () => {
    if (!selectedProduct || !window.confirm('Deactivate this product from the public store?')) {
      return
    }

    setLoadingAction('delete')
    setError('')
    setMessage('')

    const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
      method: 'DELETE',
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not delete this product.')
      setLoadingAction(null)
      return
    }

    setMessage('Product deactivated.')
    setLoadingAction(null)
    router.refresh()
    setIsCreateOpen(false)
  }

  return (
    <div className={styles.formStack}>
      <div className={styles.inlineActions}>
        <button type="button" className={styles.primaryButton} onClick={openCreate}>
          Create Product
        </button>
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.cardGrid}>
        {products.map((product) => (
          <article key={product.id} className={styles.recordCard}>
            <div className={styles.recordTop}>
              <div>
                <p className={styles.referenceText}>{product.category}</p>
                <h3 className={styles.cardTitle}>{product.name}</h3>
                <p className={styles.cardSubmeta}>{product.priceLabel}</p>
              </div>
              <span className={styles.secondaryButton}>{product.isActive ? 'Active' : 'Inactive'}</span>
            </div>

            <div className={styles.metaGrid}>
              <div>
                <span className={styles.metaLabel}>Stock</span>
                <strong className={styles.metaValue}>{String(product.stockQuantity)}</strong>
              </div>
              <div>
                <span className={styles.metaLabel}>Slug</span>
                <strong className={styles.metaValue}>{product.slug}</strong>
              </div>
            </div>

            <button type="button" className={styles.primaryButton} onClick={() => openManage(product)}>
              Manage Product
            </button>
          </article>
        ))}
      </div>

      <AdminModal
        open={isCreateOpen}
        title={modalTitle}
        subtitle={selectedProduct ? selectedProduct.slug : 'Add a new product to the public shop'}
        onClose={() => setIsCreateOpen(false)}
      >
        <div className={styles.modalContent}>
          <div className={styles.filtersGridCompactWide}>
            <input className={styles.input} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Product name" />
            <input className={styles.input} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="Slug (optional)" />
            <input className={styles.input} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
            <input className={styles.input} type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))} placeholder="Stock quantity" />
            <input className={styles.input} type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="Price" />
            <input className={styles.input} value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Image URL" />
          </div>

          <textarea className={styles.input} rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Product description" />

          <div className={styles.inlineActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              data-active={form.isActive}
              onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
            >
              {form.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>

          <div className={styles.inlineActions}>
            <button type="button" className={styles.primaryButton} disabled={loadingAction !== null} onClick={submit}>
              {loadingAction === 'save' ? 'Saving...' : 'Save Changes'}
            </button>
            {selectedProduct ? (
              <button type="button" className={styles.dangerButton} disabled={loadingAction !== null} onClick={remove}>
                {loadingAction === 'delete' ? 'Deleting...' : 'Delete Product'}
              </button>
            ) : null}
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

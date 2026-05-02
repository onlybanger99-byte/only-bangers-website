'use client'

import { useState } from 'react'
import type { BarberGalleryImageSummary } from '@/lib/barber-gallery/service'
import { getSafeImage } from '@/lib/safe-image'
import styles from '@/app/barber/dashboard/dashboard.module.css'

export function BarberGalleryManager({
  initialImages,
}: {
  initialImages: BarberGalleryImageSummary[]
}) {
  const [images, setImages] = useState(initialImages)
  const [imageUrl, setImageUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const refresh = async () => {
    const response = await fetch('/api/barber/gallery')
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not refresh gallery images.')
      return
    }

    setImages(Array.isArray(payload.data) ? payload.data : [])
  }

  const addImage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    const response = await fetch('/api/barber/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        caption,
      }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not add this gallery image.')
      setLoading(false)
      return
    }

    setImageUrl('')
    setCaption('')
    setMessage('Gallery image added.')
    setLoading(false)
    await refresh()
  }

  const removeImage = async (imageId: string) => {
    setLoading(true)
    setMessage('')
    setError('')

    const response = await fetch(`/api/barber/gallery/${imageId}`, {
      method: 'DELETE',
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not remove this gallery image.')
      setLoading(false)
      return
    }

    setMessage('Gallery image removed.')
    setLoading(false)
    await refresh()
  }

  return (
    <div className={styles.formStack}>
      <form className={styles.formGrid} onSubmit={addImage}>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Image URL</span>
          <input
            className={styles.input}
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
            required
          />
        </label>
        <label className={styles.field}>
          <span className={styles.metaLabel}>Caption</span>
          <input
            className={styles.input}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Fresh cut"
          />
        </label>
        <div className={styles.field}>
          <span className={styles.metaLabel}>Action</span>
          <button type="submit" className={styles.primaryButton} disabled={loading}>
            {loading ? 'Saving...' : 'Add Gallery Image'}
          </button>
        </div>
      </form>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      {images.length > 0 ? (
        <div className={styles.cardGrid}>
          {images.map((image) => (
            <article key={image.id} className={styles.recordCard}>
              <img src={getSafeImage(image.imageUrl)} alt={image.caption ?? 'Barber gallery image'} className={styles.galleryPreviewImage} />
              <p className={styles.cardText}>{image.caption ?? 'No caption added yet.'}</p>
              <div className={styles.inlineActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={loading}
                  onClick={() => removeImage(image.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.cardSubmeta}>No gallery images added yet.</p>
      )}
    </div>
  )
}

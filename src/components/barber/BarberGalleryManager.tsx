'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { BarberGalleryImageSummary } from '@/lib/barber-gallery/service'
import { getSafeImage } from '@/lib/safe-image'
import { BarberDashboardModal } from './BarberDashboardModal'
import styles from '@/app/barber/dashboard/dashboard.module.css'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export function BarberGalleryManager({
  initialImages,
}: {
  initialImages: BarberGalleryImageSummary[]
}) {
  const [images, setImages] = useState(initialImages)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [loadingAction, setLoadingAction] = useState<'upload' | `save-${string}` | `delete-${string}` | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [editingCaptions, setEditingCaptions] = useState<Record<string, string>>({})
  const [visibilityDrafts, setVisibilityDrafts] = useState<Record<string, boolean>>({})
  const uploadInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setImages(initialImages)
  }, [initialImages])

  useEffect(() => {
    const nextCaptions = Object.fromEntries(images.map((image) => [image.id, image.caption ?? '']))
    const nextVisibility = Object.fromEntries(images.map((image) => [image.id, image.isVisible]))
    setEditingCaptions(nextCaptions)
    setVisibilityDrafts(nextVisibility)
  }, [images])

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(nextPreviewUrl)

    return () => {
      URL.revokeObjectURL(nextPreviewUrl)
    }
  }, [selectedFile])

  const sortedImages = useMemo(
    () => [...images].sort((left, right) => left.sortOrder - right.sortOrder || right.createdAt.localeCompare(left.createdAt)),
    [images]
  )

  async function refresh() {
    const response = await fetch('/api/barber/gallery')
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not refresh gallery images.')
      return
    }

    setImages(Array.isArray(payload.data) ? payload.data : [])
  }

  function resetUploadForm() {
    setSelectedFile(null)
    setCaption('')
  }

  function openFilePicker() {
    uploadInputRef.current?.click()
  }

  async function uploadImage() {
    if (!selectedFile) {
      setError('Choose an image before uploading.')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError('Image size must be 5MB or smaller.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('caption', caption)

    setLoadingAction('upload')
    setMessage('')
    setError('')

    const response = await fetch('/api/barber/gallery', {
      method: 'POST',
      body: formData,
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message}${details ? ` ${details}` : ''}` : 'Could not upload this gallery image.')
      setLoadingAction(null)
      return
    }

    setLoadingAction(null)
    setMessage('Gallery image uploaded.')
    setIsModalOpen(false)
    resetUploadForm()
    await refresh()
  }

  async function saveImage(imageId: string) {
    setLoadingAction(`save-${imageId}`)
    setMessage('')
    setError('')

    const response = await fetch(`/api/barber/gallery/${imageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caption: editingCaptions[imageId] ?? '',
        isVisible: visibilityDrafts[imageId] ?? true,
      }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(payload?.error?.message ? `${payload.error.message}${details ? ` ${details}` : ''}` : 'Could not update this gallery image.')
      setLoadingAction(null)
      return
    }

    setLoadingAction(null)
    setMessage('Gallery image updated.')
    await refresh()
  }

  async function removeImage(imageId: string) {
    if (!window.confirm('Delete this gallery image?')) {
      return
    }

    setLoadingAction(`delete-${imageId}`)
    setMessage('')
    setError('')

    const response = await fetch(`/api/barber/gallery/${imageId}`, {
      method: 'DELETE',
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not remove this gallery image.')
      setLoadingAction(null)
      return
    }

    setLoadingAction(null)
    setMessage('Gallery image removed.')
    await refresh()
  }

  return (
    <div className={styles.formStack}>
      <div className={styles.inlineActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => {
            setIsModalOpen(true)
            window.setTimeout(() => openFilePicker(), 0)
          }}
        >
          Add Gallery Image
        </button>
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      {sortedImages.length > 0 ? (
        <div className={styles.galleryGrid}>
          {sortedImages.map((image) => {
            const isSaving = loadingAction === `save-${image.id}`
            const isDeleting = loadingAction === `delete-${image.id}`

            return (
              <article key={image.id} className={styles.galleryCard}>
                <img
                  src={getSafeImage(image.imageUrl)}
                  alt={image.caption ?? 'Barber gallery image'}
                  className={styles.galleryPreviewImage}
                />

                <div className={styles.formStack}>
                  <div className={styles.recordTop}>
                    <div>
                      <p className={styles.referenceText}>Gallery Image</p>
                      <h3 className={styles.cardTitle}>{image.caption || 'Untitled image'}</h3>
                    </div>
                    <span className={styles.secondaryButton}>
                      {visibilityDrafts[image.id] ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  <label className={styles.field}>
                    <span className={styles.metaLabel}>Caption</span>
                    <input
                      className={styles.input}
                      value={editingCaptions[image.id] ?? ''}
                      onChange={(event) =>
                        setEditingCaptions((current) => ({
                          ...current,
                          [image.id]: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <div className={styles.inlineFieldRow}>
                    <span className={styles.metaLabel}>Visibility</span>
                    <div className={styles.toggleGroup}>
                      <button
                        type="button"
                        className={styles.toggleButton}
                        data-active={visibilityDrafts[image.id] !== false}
                        onClick={() =>
                          setVisibilityDrafts((current) => ({
                            ...current,
                            [image.id]: true,
                          }))
                        }
                      >
                        Visible
                      </button>
                      <button
                        type="button"
                        className={styles.toggleButton}
                        data-active={visibilityDrafts[image.id] === false}
                        onClick={() =>
                          setVisibilityDrafts((current) => ({
                            ...current,
                            [image.id]: false,
                          }))
                        }
                      >
                        Hidden
                      </button>
                    </div>
                  </div>

                  <div className={styles.inlineActions}>
                    <button type="button" className={styles.primaryButton} disabled={!!loadingAction} onClick={() => saveImage(image.id)}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className={styles.secondaryButton} disabled={!!loadingAction} onClick={() => removeImage(image.id)}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <article className={styles.compactEmptyCard}>
          <p className={styles.cardSubmeta}>No gallery images added yet.</p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setIsModalOpen(true)
              window.setTimeout(() => openFilePicker(), 0)
            }}
          >
            Add Gallery Image
          </button>
        </article>
      )}

      <BarberDashboardModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eyebrow="Gallery"
        title="Add Gallery Image"
        subtitle="Upload a JPG, PNG, or WEBP image from your device. Maximum size: 5MB."
        footer={
          <div className={styles.modalFooterActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setIsModalOpen(false)}>
              Close
            </button>
            <button type="button" className={styles.secondaryButton} onClick={resetUploadForm}>
              Clear
            </button>
            <button type="button" className={styles.secondaryButton} onClick={openFilePicker}>
              Choose Image
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={loadingAction === 'upload'}
              onClick={() => void uploadImage()}
            >
              {loadingAction === 'upload' ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        }
      >
        <div className={styles.modalBodyStack}>
          <label className={styles.uploadDropZone}>
            <span className={styles.cardTitle}>Choose image</span>
            <span className={styles.cardSubmeta}>Tap to browse your local device.</span>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={styles.hiddenFileInput}
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {previewUrl ? (
            <img src={previewUrl} alt="Selected gallery preview" className={styles.galleryPreviewImage} />
          ) : null}

          <label className={styles.field}>
            <span className={styles.metaLabel}>Caption</span>
            <input
              className={styles.input}
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Fresh fade with clean lineup"
            />
          </label>
        </div>
      </BarberDashboardModal>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminModal } from './AdminModal'
import type { SiteContentGroup, SiteContentItem } from '@/lib/site-content/types'
import { getSafeImageUrl } from '@/lib/safe-image'
import styles from '@/app/admin/dashboard/dashboard.module.css'

type DraftItem = {
  id: string | null
  key: string
  label: string
  type: SiteContentItem['type']
  value: string
  imageUrl: string
  videoUrl: string
  storagePath: string
  metadata: Record<string, unknown>
  isActive: boolean
}

function toDraft(item: SiteContentItem): DraftItem {
  return {
    id: item.id,
    key: item.key,
    label: item.label,
    type: item.type,
    value: item.value ?? '',
    imageUrl: item.imageUrl ?? '',
    videoUrl: item.videoUrl ?? '',
    storagePath: item.storagePath ?? '',
    metadata: item.metadata ?? {},
    isActive: item.isActive,
  }
}

function isVideoItem(item: DraftItem) {
  return item.type === 'video' || item.metadata.accepts === 'video'
}

function isMediaItem(item: DraftItem) {
  return (
    item.type === 'image' ||
    item.type === 'video' ||
    item.type === 'logo' ||
    item.type === 'background' ||
    item.type === 'service_media'
  )
}

function getPreviewUrl(item: DraftItem) {
  if (!isMediaItem(item)) {
    return null
  }

  return isVideoItem(item)
    ? getSafeImageUrl(item.videoUrl || item.value)
    : getSafeImageUrl(item.imageUrl || item.value)
}

export function AdminSiteContentManager({
  groups,
}: {
  groups: SiteContentGroup[]
}) {
  const router = useRouter()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, DraftItem>>(
    Object.fromEntries(groups.flatMap((group) => group.items.map((item) => [item.key, toDraft(item)])))
  )
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  )

  const selectedItem = useMemo(() => {
    if (!selectedItemKey) {
      return null
    }

    for (const group of groups) {
      const found = group.items.find((item) => item.key === selectedItemKey)

      if (found) {
        return found
      }
    }

    return null
  }, [groups, selectedItemKey])

  useEffect(() => {
    setDrafts(
      Object.fromEntries(groups.flatMap((group) => group.items.map((item) => [item.key, toDraft(item)])))
    )
  }, [groups])

  const formatError = (result: any, fallback: string) => {
    const details = Array.isArray(result?.error?.details) ? result.error.details.join(' ') : ''
    return result?.error?.message ? `${result.error.message}${details ? ` ${details}` : ''}` : fallback
  }

  const setDraftValue = (key: string, updates: Partial<DraftItem>) => {
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...updates,
      },
    }))
  }

  const saveItem = async (item: DraftItem) => {
    setLoadingKey(item.key)
    setMessage('')
    setError('')

    const payload = {
      key: item.key,
      label: item.label,
      type: item.type,
      value: item.value,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      storagePath: item.storagePath,
      metadata: item.metadata,
      isActive: item.isActive,
    }

    const response = await fetch(item.id ? `/api/admin/site-content/${item.id}` : '/api/admin/site-content', {
      method: item.id ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.ok) {
      setError(formatError(result, 'Could not save this content item.'))
      setLoadingKey(null)
      return
    }

    setMessage(`Saved ${item.label}.`)
    setLoadingKey(null)
    router.refresh()
  }

  const uploadAsset = async (item: DraftItem, file: File) => {
    setUploadingKey(item.key)
    setMessage('')
    setError('')

    let contentId = item.id

    if (!contentId) {
      const createResponse = await fetch('/api/admin/site-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: item.key,
          label: item.label,
          type: item.type,
          value: item.value,
          imageUrl: item.imageUrl,
          videoUrl: item.videoUrl,
          storagePath: item.storagePath,
          metadata: item.metadata,
          isActive: item.isActive,
        }),
      })
      const createResult = await createResponse.json().catch(() => null)

      if (!createResponse.ok || !createResult?.ok || !createResult?.data?.id) {
        setError(formatError(createResult, 'Could not create this content item before upload.'))
        setUploadingKey(null)
        return
      }

      contentId = createResult.data.id as string
    }

    const formData = new FormData()
    formData.set('file', file)

    const response = await fetch(`/api/admin/site-content/${contentId}/upload`, {
      method: 'POST',
      body: formData,
    })
    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.ok) {
      setError(formatError(result, 'Could not upload this asset.'))
      setUploadingKey(null)
      return
    }

    setMessage(`Uploaded asset for ${item.label}.`)
    setUploadingKey(null)
    router.refresh()
  }

  const deleteItem = async (item: DraftItem) => {
    if (!item.id || !window.confirm(`Delete ${item.label}?`)) {
      return
    }

    setLoadingKey(item.key)
    setMessage('')
    setError('')

    const response = await fetch(`/api/admin/site-content/${item.id}`, {
      method: 'DELETE',
    })
    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.ok) {
      setError(formatError(result, 'Could not delete this content item.'))
      setLoadingKey(null)
      return
    }

    setMessage(`Deleted ${item.label}.`)
    setLoadingKey(null)
    setSelectedItemKey(null)
    router.refresh()
  }

  return (
    <>
      <div className={styles.cardGrid}>
        {groups.map((group) => (
          <article key={group.id} className={styles.recordCard}>
            <div className={styles.recordTop}>
              <div>
                <p className={styles.referenceText}>{group.label}</p>
                <h3 className={styles.cardTitle}>{group.itemCount} items</h3>
                <p className={styles.cardText}>{group.description}</p>
              </div>
              <div className={styles.badgeCluster}>
                <span className={styles.secondaryButton}>{group.activeCount} active</span>
              </div>
            </div>

            <button type="button" className={styles.primaryButton} onClick={() => setSelectedGroupId(group.id)}>
              Manage
            </button>
          </article>
        ))}
      </div>

      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      <AdminModal
        open={selectedGroup !== null}
        title={selectedGroup?.label ?? 'Manage content'}
        subtitle={selectedGroup?.description}
        onClose={() => setSelectedGroupId(null)}
      >
        <div className={styles.cardGrid}>
          {selectedGroup?.items.map((item) => {
            const draft = drafts[item.key] ?? toDraft(item)
            const previewUrl = getPreviewUrl(draft)
            const isConfigured = Boolean(previewUrl || draft.value.trim())

            return (
              <article key={item.key} className={styles.recordCard}>
                <div className={styles.recordTop}>
                  <div>
                    <p className={styles.referenceText}>{item.key}</p>
                    <h3 className={styles.cardTitle}>{draft.label}</h3>
                    <p className={styles.cardSubmeta}>{draft.type.replace(/_/g, ' ')}</p>
                  </div>
                  <div className={styles.badgeCluster}>
                    <span className={styles.secondaryButton}>{isConfigured ? 'Configured' : 'Missing'}</span>
                    <span className={draft.isActive ? styles.secondaryButton : styles.dangerButton}>
                      {draft.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {previewUrl ? (
                  isVideoItem(draft) ? (
                    <video controls style={{ width: '100%', height: '12rem', borderRadius: '1rem', objectFit: 'cover' }}>
                      <source src={previewUrl} />
                    </video>
                  ) : (
                    <img
                      src={previewUrl}
                      alt={draft.label}
                      style={{ width: '100%', height: '12rem', borderRadius: '1rem', objectFit: 'cover' }}
                    />
                  )
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '12rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(212, 175, 55, 0.14)',
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(12, 12, 12, 0.92))',
                    }}
                  />
                )}

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setSelectedItemKey(item.key)}
                >
                  Manage
                </button>
              </article>
            )
          })}
        </div>
      </AdminModal>

      <AdminModal
        open={selectedItem !== null}
        title={selectedItem?.label ?? 'Manage asset'}
        subtitle={selectedItem?.key}
        onClose={() => setSelectedItemKey(null)}
      >
        {selectedItem ? (
          <div className={styles.modalContent}>
            {(() => {
              const draft = drafts[selectedItem.key] ?? toDraft(selectedItem)
              const previewUrl = getPreviewUrl(draft)

              return (
                <>
                  <div className={styles.badgeCluster}>
                    <button
                      type="button"
                      className={draft.isActive ? styles.secondaryButton : styles.dangerButton}
                      onClick={() => setDraftValue(selectedItem.key, { isActive: !draft.isActive })}
                    >
                      {draft.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <span className={styles.secondaryButton}>
                      {previewUrl || draft.value.trim() ? 'Configured' : 'Missing'}
                    </span>
                  </div>

                  {previewUrl ? (
                    isVideoItem(draft) ? (
                      <video controls style={{ width: '100%', height: '14rem', borderRadius: '1rem', objectFit: 'cover' }}>
                        <source src={previewUrl} />
                      </video>
                    ) : (
                      <img
                        src={previewUrl}
                        alt={draft.label}
                        style={{ width: '100%', height: '14rem', borderRadius: '1rem', objectFit: 'cover' }}
                      />
                    )
                  ) : null}

                  <label className={styles.field}>
                    <span className={styles.metaLabel}>Label</span>
                    <input
                      className={styles.input}
                      value={draft.label}
                      onChange={(event) => setDraftValue(selectedItem.key, { label: event.target.value })}
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.metaLabel}>{isVideoItem(draft) ? 'Video URL or value' : 'Value or image URL'}</span>
                    <input
                      className={styles.input}
                      value={draft.value}
                      onChange={(event) => setDraftValue(selectedItem.key, { value: event.target.value })}
                      placeholder={isVideoItem(draft) ? 'https://...' : 'https://... or text value'}
                    />
                  </label>

                  {!isVideoItem(draft) ? (
                    <label className={styles.field}>
                      <span className={styles.metaLabel}>Image URL</span>
                      <input
                        className={styles.input}
                        value={draft.imageUrl}
                        onChange={(event) => setDraftValue(selectedItem.key, { imageUrl: event.target.value })}
                        placeholder="https://..."
                      />
                    </label>
                  ) : (
                    <label className={styles.field}>
                      <span className={styles.metaLabel}>Video URL</span>
                      <input
                        className={styles.input}
                        value={draft.videoUrl}
                        onChange={(event) => setDraftValue(selectedItem.key, { videoUrl: event.target.value })}
                        placeholder="https://..."
                      />
                    </label>
                  )}

                  <div className={styles.inlineActions}>
                    <label className={styles.secondaryButton} style={{ cursor: 'pointer' }}>
                      {uploadingKey === selectedItem.key ? 'Uploading...' : 'Upload Asset'}
                      <input
                        type="file"
                        hidden
                        accept={isVideoItem(draft) ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
                        onChange={(event) => {
                          const file = event.target.files?.[0]

                          if (file) {
                            void uploadAsset(draft, file)
                          }

                          event.target.value = ''
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={loadingKey === selectedItem.key}
                      onClick={() => saveItem(draft)}
                    >
                      {loadingKey === selectedItem.key ? 'Saving...' : 'Save Changes'}
                    </button>
                    {draft.id ? (
                      <button
                        type="button"
                        className={styles.dangerButton}
                        disabled={loadingKey === selectedItem.key}
                        onClick={() => deleteItem(draft)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </>
              )
            })()}
          </div>
        ) : null}
      </AdminModal>
    </>
  )
}

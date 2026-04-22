'use client'

import { useId, useRef } from 'react'
import styles from '@/app/barber/dashboard/dashboard.module.css'
import type { BarberContentCaptureState } from '@/lib/barber-dashboard/types'
import { StatusBadge } from './StatusBadge'

function CaptureSlot({
  title,
  isReady,
  inputId,
  inputRef,
  accept,
  onSelect,
}: {
  title: string
  isReady: boolean
  inputId: string
  inputRef: React.RefObject<HTMLInputElement | null>
  accept: string
  onSelect: () => void
}) {
  return (
    <div className={styles.captureSlot}>
      <div className={styles.captureTop}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <StatusBadge
          label={isReady ? 'Ready' : 'Missing'}
          tone={isReady ? 'ready' : 'missing'}
        />
      </div>

      <div className={styles.capturePreview} aria-hidden="true">
        {isReady ? 'Asset linked' : 'Waiting for capture'}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className={styles.hiddenInput}
        onChange={onSelect}
      />

      <label htmlFor={inputId} className={styles.captureButton}>
        Upload Asset
      </label>
    </div>
  )
}

export function ContentCaptureCard({
  capture,
  onUploadBefore,
  onUploadAfter,
  onUploadVideo,
}: {
  capture: BarberContentCaptureState
  onUploadBefore: () => void
  onUploadAfter: () => void
  onUploadVideo: () => void
}) {
  const beforeId = useId()
  const afterId = useId()
  const videoId = useId()
  const beforeRef = useRef<HTMLInputElement>(null)
  const afterRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  return (
    <article className={styles.detailCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>Content Capture</p>
          <h2 className={styles.panelTitle}>Before, after, and video state</h2>
        </div>
      </div>

      <div className={styles.captureGrid}>
        <CaptureSlot
          title="Before Photo"
          isReady={capture.beforePhotoReady}
          inputId={beforeId}
          inputRef={beforeRef}
          accept="image/*"
          onSelect={onUploadBefore}
        />
        <CaptureSlot
          title="After Photo"
          isReady={capture.afterPhotoReady}
          inputId={afterId}
          inputRef={afterRef}
          accept="image/*"
          onSelect={onUploadAfter}
        />
        <CaptureSlot
          title="Short Video"
          isReady={capture.videoReady}
          inputId={videoId}
          inputRef={videoRef}
          accept="video/*"
          onSelect={onUploadVideo}
        />
      </div>

      <p className={styles.panelText}>
        Upload actions are session-local for now and are structured to map cleanly
        to future storage uploads and content processing APIs.
      </p>
    </article>
  )
}

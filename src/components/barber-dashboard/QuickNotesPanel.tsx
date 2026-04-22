'use client'

import { useEffect, useState } from 'react'
import styles from '@/app/barber/dashboard/dashboard.module.css'

export function QuickNotesPanel({
  initialHaircutNotes,
  initialFollowUpRecommendation,
}: {
  initialHaircutNotes: string
  initialFollowUpRecommendation: string
}) {
  const [haircutNotes, setHaircutNotes] = useState(initialHaircutNotes)
  const [followUpRecommendation, setFollowUpRecommendation] = useState(
    initialFollowUpRecommendation
  )
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    if (!savedMessage) {
      return
    }

    const timeout = window.setTimeout(() => setSavedMessage(''), 2200)
    return () => window.clearTimeout(timeout)
  }, [savedMessage])

  return (
    <article className={styles.detailCard}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>Quick Notes</p>
          <h2 className={styles.panelTitle}>Haircut notes and follow-up</h2>
        </div>
      </div>

      <div className={styles.notesForm}>
        <label className={styles.formField}>
          <span className={styles.infoLabel}>Haircut notes</span>
          <textarea
            className={styles.textArea}
            value={haircutNotes}
            onChange={(event) => setHaircutNotes(event.target.value)}
            rows={5}
            aria-label="Haircut notes"
          />
        </label>

        <label className={styles.formField}>
          <span className={styles.infoLabel}>Follow-up recommendation</span>
          <textarea
            className={styles.textArea}
            value={followUpRecommendation}
            onChange={(event) => setFollowUpRecommendation(event.target.value)}
            rows={4}
            aria-label="Follow-up recommendation"
          />
        </label>

        <div className={styles.notesFooter}>
          <button
            type="button"
            className={styles.primaryAction}
            onClick={() => setSavedMessage('Session notes saved for this workspace.')}
          >
            Save Draft
          </button>
          {savedMessage ? <span className={styles.savedMessage}>{savedMessage}</span> : null}
        </div>
      </div>
    </article>
  )
}

import Image from 'next/image'
import styles from '@/app/portal/dashboard/dashboard.module.css'
import type { PortalMediaItem } from '@/lib/portal-dashboard/types'

export function MediaCard({
  item,
}: {
  item: PortalMediaItem
}) {
  return (
    <article className={styles.mediaCard}>
      <div className={styles.mediaImageWrap}>
        <Image
          src={item.imageUrl}
          alt={item.title}
          className={styles.mediaImage}
          fill
          sizes="(max-width: 1080px) 100vw, 50vw"
        />
      </div>
      <div className={styles.mediaCopy}>
        <span className={styles.mediaFormat}>{item.format}</span>
        <h4 className={styles.cardTitle}>{item.title}</h4>
        <p className={styles.cardMeta}>{item.capturedAtLabel}</p>
      </div>
    </article>
  )
}

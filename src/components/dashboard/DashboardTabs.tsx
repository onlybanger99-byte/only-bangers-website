'use client'

import styles from './dashboard-shared.module.css'

export interface DashboardTabOption<T extends string> {
  id: T
  label: string
}

export function DashboardTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  label,
}: {
  tabs: ReadonlyArray<DashboardTabOption<T>>
  activeTab: T
  onChange: (tab: T) => void
  label: string
}) {
  return (
    <div className={styles.tabsBar} role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={styles.tabButton}
          data-active={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

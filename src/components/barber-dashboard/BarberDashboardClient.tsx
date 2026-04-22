'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from '@/app/barber/dashboard/dashboard.module.css'
import type {
  BarberAppointmentStatus,
  BarberDashboardViewModel,
} from '@/lib/barber-dashboard/types'
import { ClientSummaryCard } from './ClientSummaryCard'
import { ContentCaptureCard } from './ContentCaptureCard'
import { QuickNotesPanel } from './QuickNotesPanel'
import { ScheduleCard } from './ScheduleCard'
import { StatusBadge } from './StatusBadge'
import { WorkflowControls } from './WorkflowControls'

type CaptureStateMap = Record<
  string,
  {
    beforePhotoReady: boolean
    afterPhotoReady: boolean
    videoReady: boolean
  }
>

export function BarberDashboardClient({
  dashboard,
}: {
  dashboard: BarberDashboardViewModel
}) {
  const [activeAppointmentId, setActiveAppointmentId] = useState(
    dashboard.todaySchedule[0]?.id ?? ''
  )
  const [statusMap, setStatusMap] = useState<Record<string, BarberAppointmentStatus>>(
    () =>
      dashboard.todaySchedule.reduce<Record<string, BarberAppointmentStatus>>(
        (accumulator, appointment) => {
          accumulator[appointment.id] = appointment.status
          return accumulator
        },
        {}
      )
  )
  const [captureMap, setCaptureMap] = useState<CaptureStateMap>(() =>
    dashboard.todaySchedule.reduce<CaptureStateMap>((accumulator, appointment) => {
      accumulator[appointment.id] = appointment.contentCapture
      return accumulator
    }, {})
  )

  useEffect(() => {
    if (!dashboard.todaySchedule.some((appointment) => appointment.id === activeAppointmentId)) {
      setActiveAppointmentId(dashboard.todaySchedule[0]?.id ?? '')
    }
  }, [activeAppointmentId, dashboard.todaySchedule])

  const appointments = useMemo(
    () =>
      dashboard.todaySchedule.map((appointment) => ({
        ...appointment,
        status: statusMap[appointment.id] ?? appointment.status,
        contentCapture: captureMap[appointment.id] ?? appointment.contentCapture,
      })),
    [captureMap, dashboard.todaySchedule, statusMap]
  )

  const activeAppointment = appointments[0]
    ? appointments.find((appointment) => appointment.id === activeAppointmentId) ??
      appointments[0]
    : null

  const cutsCompletedToday = appointments.filter(
    (appointment) => appointment.status === 'completed'
  ).length

  const updateStatus = (status: BarberAppointmentStatus) => {
    if (!activeAppointment) {
      return
    }

    setStatusMap((current) => ({
      ...current,
      [activeAppointment.id]: status,
    }))
  }

  const updateCapture = (
    field: 'beforePhotoReady' | 'afterPhotoReady' | 'videoReady'
  ) => {
    if (!activeAppointment) {
      return
    }

    setCaptureMap((current) => ({
      ...current,
      [activeAppointment.id]: {
        ...current[activeAppointment.id],
        [field]: true,
      },
    }))
  }

  return (
    <div className={styles.dashboardGrid}>
      <section className={styles.primaryColumn}>
        <article className={styles.heroCard}>
          <div>
            <p className={styles.eyebrow}>Barber Operations</p>
            <h1 className={styles.heroTitle}>{dashboard.operator.displayName}</h1>
            <p className={styles.heroSubtitle}>{dashboard.operator.specialty}</p>
            <p className={styles.heroText}>{dashboard.operator.focusNote}</p>
          </div>

          <div className={styles.heroMeta}>
            <div className={styles.heroStat}>
              <span className={styles.infoLabel}>Shift</span>
              <strong className={styles.heroValue}>{dashboard.operator.shiftLabel}</strong>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.infoLabel}>Data Mode</span>
              <StatusBadge
                label={dashboard.dataSource === 'live' ? 'Live Schedule' : 'Mock Schedule'}
                tone={dashboard.dataSource === 'live' ? 'ready' : 'missing'}
              />
            </div>
          </div>
        </article>

        <article className={styles.sectionCard}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Today&apos;s Schedule</p>
              <h2 className={styles.panelTitle}>Appointments in the chair today</h2>
            </div>
          </div>

          {appointments.length > 0 ? (
            <div className={styles.scheduleList}>
              {appointments.map((appointment) => (
                <ScheduleCard
                  key={appointment.id}
                  appointment={appointment}
                  isActive={appointment.id === activeAppointment?.id}
                  onSelect={() => setActiveAppointmentId(appointment.id)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No bookings are assigned to this barber yet for today.</p>
            </div>
          )}
        </article>

        {activeAppointment ? (
          <div className={styles.detailGrid}>
            <ClientSummaryCard appointment={activeAppointment} />
            <WorkflowControls
              currentStatus={activeAppointment.status}
              onChangeStatus={updateStatus}
            />
            <ContentCaptureCard
              capture={activeAppointment.contentCapture}
              onUploadBefore={() => updateCapture('beforePhotoReady')}
              onUploadAfter={() => updateCapture('afterPhotoReady')}
              onUploadVideo={() => updateCapture('videoReady')}
            />
            <QuickNotesPanel
              initialHaircutNotes={dashboard.quickNotesSeed.haircutNotes}
              initialFollowUpRecommendation={
                dashboard.quickNotesSeed.followUpRecommendation
              }
            />
          </div>
        ) : null}
      </section>

      <aside className={styles.sidebarColumn}>
        <article className={styles.sectionCard}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Performance Summary</p>
              <h2 className={styles.panelTitle}>Today&apos;s operator snapshot</h2>
            </div>
          </div>

          <div className={styles.performanceGrid}>
            <div className={styles.performanceCard}>
              <span className={styles.infoLabel}>Cuts completed</span>
              <strong className={styles.performanceValue}>{cutsCompletedToday}</strong>
            </div>

            <div className={styles.performanceCard}>
              <span className={styles.infoLabel}>Repeat clients</span>
              <strong className={styles.performanceValue}>
                {dashboard.performance.repeatClientsCount}
              </strong>
            </div>

            <div className={styles.performanceCard}>
              <span className={styles.infoLabel}>Average duration</span>
              <strong className={styles.performanceValue}>
                {dashboard.performance.averageServiceDuration}
              </strong>
            </div>
          </div>
        </article>

        <article className={styles.sectionCard}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>Workspace State</p>
              <h2 className={styles.panelTitle}>Connection and handoff</h2>
            </div>
          </div>

          <p className={styles.panelText}>{dashboard.readinessMessage}</p>
          <div className={styles.workspaceList}>
            <div className={styles.workspaceItem}>
              <span className={styles.infoLabel}>Workflow actions</span>
              <span className={styles.workspaceValue}>Session-local operator state</span>
            </div>
            <div className={styles.workspaceItem}>
              <span className={styles.infoLabel}>Content capture</span>
              <span className={styles.workspaceValue}>Ready for storage upload integration</span>
            </div>
            <div className={styles.workspaceItem}>
              <span className={styles.infoLabel}>Role readiness</span>
              <span className={styles.workspaceValue}>Barber / admin / customer role model</span>
            </div>
          </div>
        </article>
      </aside>
    </div>
  )
}

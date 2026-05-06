'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BarberOperatorProfile } from '@/lib/barber-dashboard/types'
import { getSafeImage } from '@/lib/safe-image'
import { BarberDashboardModal } from './BarberDashboardModal'
import { supabase } from '@/lib/supabase/client'
import styles from '@/app/barber/dashboard/dashboard.module.css'

type ProfileModal = 'basic' | 'location' | 'socials' | 'images' | null

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

function ActionCard({
  title,
  preview,
  buttonLabel,
  onClick,
}: {
  title: string
  preview: string
  buttonLabel: string
  onClick: () => void
}) {
  return (
    <article className={styles.profileActionCard}>
      <div className={styles.profileActionCopy}>
        <p className={styles.referenceText}>{title}</p>
        <p className={styles.cardSubmeta}>{preview}</p>
      </div>
      <button type="button" className={styles.secondaryButton} onClick={onClick}>
        {buttonLabel}
      </button>
    </article>
  )
}

export function BarberProfileEditor({
  profile,
}: {
  profile: BarberOperatorProfile
}) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<ProfileModal>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingModal, setSavingModal] = useState<ProfileModal | null>(null)
  const [uploading, setUploading] = useState<'profile' | 'cover' | null>(null)
  const [basicInfo, setBasicInfo] = useState({
    displayName: profile.displayName,
    fullName: profile.fullName ?? profile.displayName,
    phone: profile.phone ?? '',
    bio: profile.bio,
  })
  const [locationInfo, setLocationInfo] = useState({
    location: profile.location ?? '',
    cuttingLocation: profile.cuttingLocation ?? '',
    mapUrl: profile.mapUrl ?? '',
    latitude: profile.latitude != null ? String(profile.latitude) : '',
    longitude: profile.longitude != null ? String(profile.longitude) : '',
  })
  const [socialInfo, setSocialInfo] = useState({
    instagramUrl: profile.instagramUrl ?? '',
    tiktokUrl: profile.tiktokUrl ?? '',
    facebookUrl: profile.facebookUrl ?? '',
    portfolioUrl: profile.portfolioUrl ?? '',
  })
  const [profileImageUrl, setProfileImageUrl] = useState(profile.image ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(profile.coverImageUrl ?? '')
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null)
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState(profile.email ?? '')
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  })
  const [hasPasswordLogin, setHasPasswordLogin] = useState<boolean | null>(null)
  const [securityLoading, setSecurityLoading] = useState<'email' | 'password' | 'reset' | null>(null)

  useEffect(() => {
    setBasicInfo({
      displayName: profile.displayName,
      fullName: profile.fullName ?? profile.displayName,
      phone: profile.phone ?? '',
      bio: profile.bio,
    })
    setLocationInfo({
      location: profile.location ?? '',
      cuttingLocation: profile.cuttingLocation ?? '',
      mapUrl: profile.mapUrl ?? '',
      latitude: profile.latitude != null ? String(profile.latitude) : '',
      longitude: profile.longitude != null ? String(profile.longitude) : '',
    })
    setSocialInfo({
      instagramUrl: profile.instagramUrl ?? '',
      tiktokUrl: profile.tiktokUrl ?? '',
      facebookUrl: profile.facebookUrl ?? '',
      portfolioUrl: profile.portfolioUrl ?? '',
    })
    setProfileImageUrl(profile.image ?? '')
    setCoverImageUrl(profile.coverImageUrl ?? '')
    setPendingEmail(profile.email ?? '')
  }, [profile])

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) {
        return
      }

      const providers = Array.isArray(data.user?.app_metadata?.providers)
        ? (data.user?.app_metadata?.providers as string[])
        : []
      setHasPasswordLogin(providers.includes('email'))
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedProfileFile) {
      setProfilePreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedProfileFile)
    setProfilePreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedProfileFile])

  useEffect(() => {
    if (!selectedCoverFile) {
      setCoverPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedCoverFile)
    setCoverPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedCoverFile])

  const socialPreview = useMemo(() => {
    const activeLinks = Object.values(socialInfo).filter((value) => value.trim().length > 0).length
    return activeLinks > 0 ? `${activeLinks} link${activeLinks === 1 ? '' : 's'} connected` : 'No social links added yet.'
  }, [socialInfo])

  const imagePreview = useMemo(() => {
    if (profileImageUrl && coverImageUrl) {
      return 'Profile and cover image uploaded.'
    }

    if (profileImageUrl || coverImageUrl) {
      return 'One image uploaded. Add the other for a stronger profile.'
    }

    return 'No profile or cover image uploaded yet.'
  }, [coverImageUrl, profileImageUrl])

  function parseOptionalNumber(value: string) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  async function saveProfile(payload: Record<string, unknown>, modal: ProfileModal, successMessage: string) {
    setSavingModal(modal)
    setMessage('')
    setError('')

    const response = await fetch('/api/barber/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: basicInfo.displayName,
        fullName: basicInfo.fullName,
        phone: basicInfo.phone,
        location: locationInfo.location,
        cuttingLocation: locationInfo.cuttingLocation,
        mapUrl: locationInfo.mapUrl,
        latitude: locationInfo.latitude ? parseOptionalNumber(locationInfo.latitude) : null,
        longitude: locationInfo.longitude ? parseOptionalNumber(locationInfo.longitude) : null,
        instagramUrl: socialInfo.instagramUrl,
        tiktokUrl: socialInfo.tiktokUrl,
        facebookUrl: socialInfo.facebookUrl,
        portfolioUrl: socialInfo.portfolioUrl,
        avatarUrl: profileImageUrl || null,
        profileImageUrl: profileImageUrl || null,
        coverImageUrl: coverImageUrl || null,
        bio: basicInfo.bio,
        ...payload,
      }),
    })
    const responsePayload = await response.json().catch(() => null)

    if (!response.ok || !responsePayload?.ok) {
      const details = Array.isArray(responsePayload?.error?.details)
        ? responsePayload.error.details.join(' ')
        : ''
      setError(
        responsePayload?.error?.message
          ? `${responsePayload.error.message}${details ? ` ${details}` : ''}`
          : 'Could not save profile changes.'
      )
      setSavingModal(null)
      return
    }

    setMessage(successMessage)
    setSavingModal(null)
    setActiveModal(null)
    router.refresh()
  }

  async function uploadImage(kind: 'profile' | 'cover') {
    const file = kind === 'profile' ? selectedProfileFile : selectedCoverFile

    if (!file) {
      setError(`Choose a ${kind} image before uploading.`)
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('Image size must be 5MB or smaller.')
      return
    }

    setUploading(kind)
    setMessage('')
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('kind', kind)

    const response = await fetch('/api/barber/profile/images', {
      method: 'POST',
      body: formData,
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(
        payload?.error?.message
          ? `${payload.error.message}${details ? ` ${details}` : ''}`
          : `Could not upload ${kind} image.`
      )
      setUploading(null)
      return
    }

    if (kind === 'profile') {
      setProfileImageUrl(payload.data.imageUrl)
      setSelectedProfileFile(null)
    } else {
      setCoverImageUrl(payload.data.imageUrl)
      setSelectedCoverFile(null)
    }

    setMessage(`${kind === 'profile' ? 'Profile' : 'Cover'} image uploaded.`)
    setUploading(null)
    router.refresh()
  }

  async function requestEmailChange() {
    if (!pendingEmail.trim()) {
      setError('Enter the new email address you want to use.')
      return
    }

    setSecurityLoading('email')
    setError('')
    setMessage('')

    const response = await fetch('/api/auth/request-email-change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newEmail: pendingEmail }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(
        payload?.error?.message
          ? `${payload.error.message}${details ? ` ${details}` : ''}`
          : 'Could not request an email change.'
      )
      setSecurityLoading(null)
      return
    }

    setMessage(payload?.message ?? 'Check your new email address to verify the change.')
    setSecurityLoading(null)
  }

  async function savePassword() {
    if (!passwordForm.password.trim()) {
      setError('Enter a new password before saving.')
      return
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('Password and confirm password must match.')
      return
    }

    setSecurityLoading('password')
    setError('')
    setMessage('')

    const response = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordForm),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      setError(payload?.error?.message ?? 'Could not save your password.')
      setSecurityLoading(null)
      return
    }

    setHasPasswordLogin(true)
    setPasswordForm({
      password: '',
      confirmPassword: '',
    })
    setMessage(payload?.message ?? 'Password saved successfully.')
    setSecurityLoading(null)
  }

  async function requestPasswordReset() {
    if (!profile.email?.trim()) {
      setError('Your account does not have an email address available for recovery.')
      return
    }

    setSecurityLoading('reset')
    setError('')
    setMessage('')

    const response = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: profile.email }),
    })
    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.ok) {
      const details = Array.isArray(payload?.error?.details) ? payload.error.details.join(' ') : ''
      setError(
        payload?.error?.message
          ? `${payload.error.message}${details ? ` ${details}` : ''}`
          : 'Could not send the password reset email.'
      )
      setSecurityLoading(null)
      return
    }

    setMessage(payload?.message ?? 'Check your email for the password setup or recovery link.')
    setSecurityLoading(null)
  }

  return (
    <div className={styles.formStack}>
      {message ? <p className={styles.successText}>{message}</p> : null}
      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.profileActionGrid}>
        <ActionCard
          title="Basic Info"
          preview={basicInfo.bio ? `${basicInfo.displayName} · ${basicInfo.bio.slice(0, 96)}` : 'Add your display name, bio, and phone.'}
          buttonLabel="Edit Basic Info"
          onClick={() => setActiveModal('basic')}
        />
        <ActionCard
          title="Location"
          preview={
            locationInfo.cuttingLocation || locationInfo.location
              ? `${locationInfo.cuttingLocation || locationInfo.location}${locationInfo.mapUrl ? ' · Map linked' : ''}`
              : 'Add your area, cutting location, and optional Google Maps link.'
          }
          buttonLabel="Add/Edit Location"
          onClick={() => setActiveModal('location')}
        />
        <ActionCard
          title="Social Links"
          preview={socialPreview}
          buttonLabel="Manage Social Links"
          onClick={() => setActiveModal('socials')}
        />
        <ActionCard
          title="Images"
          preview={imagePreview}
          buttonLabel="Upload Images"
          onClick={() => setActiveModal('images')}
        />
      </div>

      <BarberDashboardModal
        open={activeModal === 'basic'}
        onClose={() => setActiveModal(null)}
        eyebrow="Profile"
        title="Edit Basic Info"
        subtitle="Keep the essentials here so customers understand who they’re booking with."
        footer={
          <div className={styles.modalFooterActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setActiveModal(null)}>
              Close
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={savingModal === 'basic'}
              onClick={() => saveProfile({}, 'basic', 'Basic info updated.')}
            >
              {savingModal === 'basic' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Display Name</span>
            <input
              className={styles.input}
              value={basicInfo.displayName}
              onChange={(event) => setBasicInfo((current) => ({ ...current, displayName: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Full Name</span>
            <input
              className={styles.input}
              value={basicInfo.fullName}
              onChange={(event) => setBasicInfo((current) => ({ ...current, fullName: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Phone</span>
            <input
              className={styles.input}
              value={basicInfo.phone}
              onChange={(event) => setBasicInfo((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+27..."
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.metaLabel}>Bio</span>
          <textarea
            className={styles.textarea}
            rows={5}
            value={basicInfo.bio}
            onChange={(event) => setBasicInfo((current) => ({ ...current, bio: event.target.value }))}
          />
        </label>

        <div className={styles.summaryCard}>
          <p className={styles.referenceText}>Email address</p>
          <p className={styles.cardSubmeta}>
            Current email: {profile.email ?? 'Email not available'}
          </p>
          <label className={styles.field}>
            <span className={styles.metaLabel}>New email</span>
            <input
              type="email"
              className={styles.input}
              value={pendingEmail}
              onChange={(event) => setPendingEmail(event.target.value)}
              placeholder="new@email.com"
            />
          </label>
          <div className={styles.inlineActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={securityLoading === 'email'}
              onClick={() => {
                void requestEmailChange()
              }}
            >
              {securityLoading === 'email' ? 'Sending...' : 'Change Email'}
            </button>
          </div>
          <p className={styles.cardSubmeta}>
            We’ll send a verification email to the new address before the change becomes active.
          </p>
        </div>

        <div className={styles.summaryCard}>
          <p className={styles.referenceText}>Password</p>
          <p className={styles.cardSubmeta}>
            {hasPasswordLogin === false
              ? 'Set a password so you can log in with email and password later.'
              : 'For security, your current password is never shown here.'}
          </p>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.metaLabel}>New password</span>
              <input
                type="password"
                className={styles.input}
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.metaLabel}>Confirm new password</span>
              <input
                type="password"
                className={styles.input}
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
            </label>
          </div>
          <div className={styles.inlineActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={securityLoading === 'password'}
              onClick={() => {
                void savePassword()
              }}
            >
              {securityLoading === 'password'
                ? 'Saving...'
                : hasPasswordLogin === false
                  ? 'Set Password'
                  : 'Change Password'}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={securityLoading === 'reset'}
              onClick={() => {
                void requestPasswordReset()
              }}
            >
              {securityLoading === 'reset' ? 'Sending...' : 'Send Reset Email'}
            </button>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.cardSubmeta}>
            Cutting location is required before your profile can go live.
          </p>
        </div>
      </BarberDashboardModal>

      <BarberDashboardModal
        open={activeModal === 'location'}
        onClose={() => setActiveModal(null)}
        eyebrow="Profile"
        title="Add or Edit Location"
        subtitle="Paste your Google Maps location link or enter your area manually."
        footer={
          <div className={styles.modalFooterActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setActiveModal(null)}>
              Close
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={savingModal === 'location'}
              onClick={() => saveProfile({}, 'location', 'Location details updated.')}
            >
              {savingModal === 'location' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Location / Area</span>
            <input
              className={styles.input}
              value={locationInfo.location}
              onChange={(event) => setLocationInfo((current) => ({ ...current, location: event.target.value }))}
              placeholder="Johannesburg CBD"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Cutting Location</span>
            <input
              className={styles.input}
              value={locationInfo.cuttingLocation}
              onChange={(event) =>
                setLocationInfo((current) => ({ ...current, cuttingLocation: event.target.value }))
              }
              placeholder="Apartment studio, shop number, or estate"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Google Maps URL</span>
            <input
              className={styles.input}
              value={locationInfo.mapUrl}
              onChange={(event) => setLocationInfo((current) => ({ ...current, mapUrl: event.target.value }))}
              placeholder="https://maps.google.com/..."
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Latitude</span>
            <input
              className={styles.input}
              value={locationInfo.latitude}
              onChange={(event) => setLocationInfo((current) => ({ ...current, latitude: event.target.value }))}
              placeholder="-26.2041"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Longitude</span>
            <input
              className={styles.input}
              value={locationInfo.longitude}
              onChange={(event) => setLocationInfo((current) => ({ ...current, longitude: event.target.value }))}
              placeholder="28.0473"
            />
          </label>
        </div>
      </BarberDashboardModal>

      <BarberDashboardModal
        open={activeModal === 'socials'}
        onClose={() => setActiveModal(null)}
        eyebrow="Profile"
        title="Manage Social Links"
        subtitle="Use full URLs where possible so your public barber page can link straight out."
        footer={
          <div className={styles.modalFooterActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setActiveModal(null)}>
              Close
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={savingModal === 'socials'}
              onClick={() => saveProfile({}, 'socials', 'Social links updated.')}
            >
              {savingModal === 'socials' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Instagram URL</span>
            <input
              className={styles.input}
              value={socialInfo.instagramUrl}
              onChange={(event) => setSocialInfo((current) => ({ ...current, instagramUrl: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>TikTok URL</span>
            <input
              className={styles.input}
              value={socialInfo.tiktokUrl}
              onChange={(event) => setSocialInfo((current) => ({ ...current, tiktokUrl: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Facebook URL</span>
            <input
              className={styles.input}
              value={socialInfo.facebookUrl}
              onChange={(event) => setSocialInfo((current) => ({ ...current, facebookUrl: event.target.value }))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.metaLabel}>Portfolio URL</span>
            <input
              className={styles.input}
              value={socialInfo.portfolioUrl}
              onChange={(event) => setSocialInfo((current) => ({ ...current, portfolioUrl: event.target.value }))}
            />
          </label>
        </div>
      </BarberDashboardModal>

      <BarberDashboardModal
        open={activeModal === 'images'}
        onClose={() => setActiveModal(null)}
        eyebrow="Profile"
        title="Upload Profile Images"
        subtitle="Upload clean, customer-facing images from your device. Files are stored in Supabase Storage."
        footer={
          <div className={styles.modalFooterActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setActiveModal(null)}>
              Close
            </button>
          </div>
        }
      >
        <div className={styles.profileImagesGrid}>
          <div className={styles.formStack}>
            <p className={styles.metaLabel}>Profile Image</p>
            <img
              src={profilePreviewUrl || getSafeImage(profileImageUrl)}
              alt="Profile preview"
              className={styles.profileUploadPreview}
            />
            <label className={styles.uploadDropZone}>
              <span className={styles.cardTitle}>Choose profile image</span>
              <span className={styles.cardSubmeta}>JPG, PNG, or WEBP up to 5MB.</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.hiddenFileInput}
                onChange={(event) => setSelectedProfileFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={uploading === 'profile'}
              onClick={() => {
                void uploadImage('profile')
              }}
            >
              {uploading === 'profile' ? 'Uploading...' : 'Upload Profile Image'}
            </button>
          </div>

          <div className={styles.formStack}>
            <p className={styles.metaLabel}>Cover Image</p>
            <img
              src={coverPreviewUrl || getSafeImage(coverImageUrl)}
              alt="Cover preview"
              className={styles.coverUploadPreview}
            />
            <label className={styles.uploadDropZone}>
              <span className={styles.cardTitle}>Choose cover image</span>
              <span className={styles.cardSubmeta}>Use a wide image for your public barber page.</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.hiddenFileInput}
                onChange={(event) => setSelectedCoverFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={uploading === 'cover'}
              onClick={() => {
                void uploadImage('cover')
              }}
            >
              {uploading === 'cover' ? 'Uploading...' : 'Upload Cover Image'}
            </button>
          </div>
        </div>
      </BarberDashboardModal>
    </div>
  )
}

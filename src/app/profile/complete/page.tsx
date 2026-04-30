import { sanitizeNextPath } from '@/lib/auth/next-path'
import { redirect } from 'next/navigation'

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const nextPath = sanitizeNextPath(resolvedSearchParams.next) ?? '/portal/dashboard'
  redirect(`/portal/profile/complete?next=${encodeURIComponent(nextPath)}`)
}

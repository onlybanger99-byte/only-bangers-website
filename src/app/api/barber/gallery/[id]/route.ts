import { deleteGalleryImage } from '@/lib/barber-gallery/service'
import { getUserRole } from '@/lib/auth/get-user-role'
import { getBarberProfileByUserId } from '@/lib/barbers/service'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, role } = await getUserRole()

  if (!user) {
    return Response.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } }, { status: 401 })
  }

  if (role !== 'barber') {
    return Response.json({ ok: false, error: { code: 'FORBIDDEN', message: 'Only barbers can manage gallery images.' } }, { status: 403 })
  }

  const profile = await getBarberProfileByUserId(user.id)

  if (!profile?.id) {
    return Response.json({ ok: false, error: { code: 'PROFILE_MISSING', message: 'Your barber profile is not active yet.' } }, { status: 400 })
  }

  const { id } = await context.params
  const result = await deleteGalleryImage(profile.id, id)

  if (!result.ok) {
    return Response.json({ ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } }, { status: 400 })
  }

  return Response.json({ ok: true })
}

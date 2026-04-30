import { getUserRole } from '@/lib/auth/get-user-role'
import { getLatestBarberApplicationForUser } from '@/lib/barber-applications/service'

export async function GET() {
  const { user } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  const application = await getLatestBarberApplicationForUser(user.id)

  return Response.json({
    ok: true,
    data: application,
  })
}

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/auth/get-user-role'
import { uploadBarberStorageImage } from '@/lib/barber-gallery/service'
import { getBarberProfileByUserId } from '@/lib/barbers/service'

export async function POST(request: Request) {
  const { user, role } = await getUserRole()

  if (!user) {
    return Response.json(
      { ok: false, error: { code: 'UNAUTHORIZED', message: 'You must be signed in.' } },
      { status: 401 }
    )
  }

  if (role !== 'barber') {
    return Response.json(
      { ok: false, error: { code: 'FORBIDDEN', message: 'Only approved barbers can upload profile images.' } },
      { status: 403 }
    )
  }

  const profile = await getBarberProfileByUserId(user.id)

  if (!profile?.id) {
    return Response.json(
      { ok: false, error: { code: 'PROFILE_MISSING', message: 'Your barber profile is not active yet.' } },
      { status: 400 }
    )
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')
  const kind = typeof formData?.get('kind') === 'string' ? String(formData?.get('kind')) : 'profile'

  if (!(file instanceof File)) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Choose an image file before uploading.',
        },
      },
      { status: 400 }
    )
  }

  if (kind !== 'profile' && kind !== 'cover') {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image kind must be profile or cover.',
        },
      },
      { status: 400 }
    )
  }

  const uploadResult = await uploadBarberStorageImage(profile.id, file, {
    folder: kind,
  })

  if (!uploadResult.ok) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: uploadResult.message,
          details: uploadResult.details,
        },
      },
      { status: 400 }
    )
  }

  const updates =
    kind === 'cover'
      ? {
          cover_image_url: uploadResult.data.imageUrl,
          updated_at: new Date().toISOString(),
        }
      : {
          avatar_url: uploadResult.data.imageUrl,
          profile_image_url: uploadResult.data.imageUrl,
          profile_photo_url: uploadResult.data.imageUrl,
          updated_at: new Date().toISOString(),
        }

  const adminClient = createAdminClient()

  if (!adminClient) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'SERVICE_ROLE_MISSING',
          message: 'Supabase service role is required for image uploads.',
        },
      },
      { status: 500 }
    )
  }

  const { error } = await adminClient
    .from('barber_profiles')
    .update(updates)
    .eq('id', profile.id)
    .eq('user_id', user.id)

  if (error) {
    return Response.json(
      {
        ok: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Image uploaded, but the barber profile could not be updated.',
          details: [error.message],
        },
      },
      { status: 400 }
    )
  }

  return Response.json({
    ok: true,
    data: {
      kind,
      imageUrl: uploadResult.data.imageUrl,
      storagePath: uploadResult.data.storagePath,
    },
  })
}

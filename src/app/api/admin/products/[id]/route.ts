import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { deleteProductAsAdmin, updateProductAsAdmin } from '@/lib/products/service'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { id } = await context.params
  const body = await request.json()
  const result = await updateProductAsAdmin(id, {
    name: body.name,
    slug: body.slug,
    description: body.description,
    price: body.price,
    imageUrl: body.imageUrl,
    category: body.category,
    stockQuantity: body.stockQuantity,
    isActive: body.isActive,
  })

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const { id } = await context.params
  const result = await deleteProductAsAdmin(id)

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message, details: result.details } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}

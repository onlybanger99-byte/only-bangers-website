import type { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/require-role'
import { createProductAsAdmin, listAllProductsForAdmin } from '@/lib/products/service'

export async function GET(request: NextRequest) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const result = await listAllProductsForAdmin()

  if (!result.ok) {
    return Response.json(
      { ok: false, error: { code: 'DATABASE_ERROR', message: result.message } },
      { status: 400 }
    )
  }

  return Response.json({ ok: true, data: result.data })
}

export async function POST(request: NextRequest) {
  const authError = await requireRole(request, ['admin'])

  if (authError) {
    return authError
  }

  const body = await request.json()
  const result = await createProductAsAdmin({
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

  return Response.json({ ok: true, data: result.data }, { status: 201 })
}

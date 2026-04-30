import { NextResponse } from 'next/server'
import type { BookingApiResponse, BookingErrorCode, BookingResult } from './types'

function getStatusForCode(code: BookingErrorCode) {
  switch (code) {
    case 'UNAUTHORIZED':
      return 401
    case 'FORBIDDEN':
      return 403
    case 'INCOMPLETE_PROFILE':
      return 409
    case 'NOT_FOUND':
      return 404
    case 'SLOT_UNAVAILABLE':
      return 409
    case 'VALIDATION_ERROR':
      return 400
    case 'TABLE_MISSING':
      return 503
    case 'DATABASE_ERROR':
    default:
      return 500
  }
}

export function bookingApiResponse<T>(result: BookingResult<T>) {
  if (result.ok) {
    return NextResponse.json<BookingApiResponse<T>>({
      ok: true,
      data: result.data,
    })
  }

  return NextResponse.json<BookingApiResponse<T>>(
    {
      ok: false,
      error: {
        code: result.code,
        message: result.message,
        details: result.details,
      },
    },
    { status: getStatusForCode(result.code) }
  )
}

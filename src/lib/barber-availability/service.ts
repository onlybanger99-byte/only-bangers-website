import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  ApplicationAvailabilitySlotRecord,
  AvailabilitySlotInput,
  AvailabilitySlotRecord,
  AvailabilitySlotSummary,
} from './types'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}(:\d{2})?$/.test(value)
}

function normalizeTime(value: string) {
  const normalized = normalizeText(value)
  return normalized.length === 5 ? `${normalized}:00` : normalized
}

function toSummary(row: AvailabilitySlotRecord | ApplicationAvailabilitySlotRecord): AvailabilitySlotSummary {
  return {
    id: row.id,
    availableDate: row.available_date,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  }
}

function validateSlot(input: AvailabilitySlotInput) {
  const details: string[] = []
  const availableDate = normalizeText(input.availableDate)
  const startTime = normalizeTime(input.startTime)
  const endTime = normalizeTime(input.endTime)

  if (!isValidDate(availableDate)) {
    details.push('Availability date must be valid and formatted as YYYY-MM-DD.')
  }

  if (!isValidTime(startTime)) {
    details.push('Start time is required.')
  }

  if (!isValidTime(endTime)) {
    details.push('End time is required.')
  }

  if (isValidTime(startTime) && isValidTime(endTime) && startTime >= endTime) {
    details.push('End time must be after the start time.')
  }

  return {
    details,
    availableDate,
    startTime,
    endTime,
  }
}

async function getPrivilegedSupabase() {
  return createAdminClient() ?? (await createClient())
}

async function getBarberProfileIdentity(
  userId: string,
  supabaseOverride?: Awaited<ReturnType<typeof getPrivilegedSupabase>>
) {
  const supabase = supabaseOverride ?? (await getPrivilegedSupabase())
  const { data } = await supabase
    .from('barber_profiles')
    .select('id, is_active')
    .eq('user_id', userId)
    .maybeSingle()

  if (typeof data?.id !== 'string') {
    return null
  }

  if (typeof data?.is_active === 'boolean' && !data.is_active) {
    return null
  }

  return data.id
}

export async function listBarberAvailabilitySlots(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('barber_availability_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('available_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-availability] Failed to load barber slots', error)
    return {
      ok: false as const,
      message: 'We could not load barber availability right now.',
      data: [] as AvailabilitySlotSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as AvailabilitySlotRecord[]).map(toSummary),
  }
}

export async function listApplicationAvailabilitySlots(applicationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('barber_application_availability_slots')
    .select('*')
    .eq('application_id', applicationId)
    .order('available_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-availability] Failed to load application slots', error)
    return []
  }

  return ((data ?? []) as ApplicationAvailabilitySlotRecord[]).map(toSummary)
}

export async function replaceApplicationAvailabilitySlots(
  applicationId: string,
  userId: string,
  slots: AvailabilitySlotInput[]
) {
  const validatedSlots = slots
    .map(validateSlot)
    .filter((slot) => slot.details.length === 0)

  const supabase = await getPrivilegedSupabase()
  const { error: deleteError } = await supabase
    .from('barber_application_availability_slots')
    .delete()
    .eq('application_id', applicationId)

  if (deleteError) {
    console.error('[barber-availability] Failed to clear application slots', deleteError)
    return
  }

  if (validatedSlots.length === 0) {
    return
  }

  const { error: insertError } = await supabase
    .from('barber_application_availability_slots')
    .insert(
      validatedSlots.map((slot) => ({
        application_id: applicationId,
        user_id: userId,
        available_date: slot.availableDate,
        start_time: slot.startTime,
        end_time: slot.endTime,
      }))
    )

  if (insertError) {
    console.error('[barber-availability] Failed to save application slots', insertError)
  }
}

export async function copyApplicationAvailabilityToBarber(
  applicationId: string,
  userId: string,
  supabaseOverride?: Awaited<ReturnType<typeof getPrivilegedSupabase>>
) {
  const supabase = supabaseOverride ?? (await getPrivilegedSupabase())
  const barberProfileId = await getBarberProfileIdentity(userId, supabase)

  if (!barberProfileId) {
    return
  }

  const { data, error } = await supabase
    .from('barber_application_availability_slots')
    .select('*')
    .eq('application_id', applicationId)
    .order('available_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('[barber-availability] Failed to read application slots for approval', error)
    return
  }

  const { error: clearError } = await supabase
    .from('barber_availability_slots')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true)

  if (clearError) {
    console.error('[barber-availability] Failed to clear existing barber slots', clearError)
  }

  const rows = (data ?? []) as ApplicationAvailabilitySlotRecord[]

  if (rows.length === 0) {
    return
  }

  const { error: insertError } = await supabase
    .from('barber_availability_slots')
    .insert(
      rows.map((slot) => ({
        barber_profile_id: barberProfileId,
        user_id: userId,
        available_date: slot.available_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_active: true,
      }))
    )

  if (insertError) {
    console.error('[barber-availability] Failed to copy application slots to barber availability', insertError)
  }
}

export async function createBarberAvailabilitySlot(userId: string, input: AvailabilitySlotInput) {
  const validated = validateSlot(input)

  if (validated.details.length > 0) {
    return {
      ok: false as const,
      message: 'Availability slot is invalid.',
      details: validated.details,
    }
  }

  const barberProfileId = await getBarberProfileIdentity(userId)

  if (!barberProfileId) {
    return {
      ok: false as const,
      message: 'Your barber profile is not active yet.',
      details: ['A barber profile is required before availability can be managed.'],
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('barber_availability_slots')
    .insert({
      barber_profile_id: barberProfileId,
      user_id: userId,
      available_date: validated.availableDate,
      start_time: validated.startTime,
      end_time: validated.endTime,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[barber-availability] Failed to create slot', error)
    return {
      ok: false as const,
      message: 'We could not save this availability slot.',
      details: [error.message],
    }
  }

  return {
    ok: true as const,
    data: toSummary(data as AvailabilitySlotRecord),
  }
}

export async function removeBarberAvailabilitySlot(userId: string, slotId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('barber_availability_slots')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', slotId)
    .eq('user_id', userId)

  if (error) {
    console.error('[barber-availability] Failed to remove slot', error)
    return {
      ok: false as const,
      message: 'We could not remove this availability slot.',
      details: [error.message],
    }
  }

  return { ok: true as const }
}

export async function updateBarberAvailabilitySlot(
  userId: string,
  slotId: string,
  input: AvailabilitySlotInput
) {
  const validated = validateSlot(input)

  if (validated.details.length > 0) {
    return {
      ok: false as const,
      message: 'Availability slot is invalid.',
      details: validated.details,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('barber_availability_slots')
    .update({
      available_date: validated.availableDate,
      start_time: validated.startTime,
      end_time: validated.endTime,
      updated_at: new Date().toISOString(),
      is_active: true,
    })
    .eq('id', slotId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    console.error('[barber-availability] Failed to update slot', error)
    return {
      ok: false as const,
      message: 'We could not update this availability slot.',
      details: [error.message],
    }
  }

  return {
    ok: true as const,
    data: toSummary(data as AvailabilitySlotRecord),
  }
}

export async function listBarberAvailabilitySlotsForDate(userId: string, date: string) {
  const normalizedDate = normalizeText(date)

  if (!isValidDate(normalizedDate)) {
    return {
      ok: false as const,
      message: 'date must be formatted as YYYY-MM-DD.',
      data: [] as AvailabilitySlotSummary[],
    }
  }

  const supabase = await getPrivilegedSupabase()
  const { data, error } = await supabase
    .from('barber_availability_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('available_date', normalizedDate)
    .eq('is_active', true)
    .order('start_time', { ascending: true })

  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[barber-availability] Failed to load slots by date', error)
    return {
      ok: false as const,
      message: 'We could not load barber availability for this date.',
      data: [] as AvailabilitySlotSummary[],
    }
  }

  return {
    ok: true as const,
    data: ((data ?? []) as AvailabilitySlotRecord[]).map(toSummary),
  }
}

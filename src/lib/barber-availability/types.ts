export interface AvailabilitySlotRecord {
  id: string
  barber_profile_id: string | null
  user_id: string
  available_date: string
  start_time: string
  end_time: string
  is_active?: boolean | null
  created_at: string
  updated_at: string
}

export interface ApplicationAvailabilitySlotRecord {
  id: string
  application_id: string
  user_id: string
  available_date: string
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}

export interface AvailabilitySlotInput {
  availableDate: string
  startTime: string
  endTime: string
}

export interface AvailabilitySlotSummary {
  id: string
  availableDate: string
  startTime: string
  endTime: string
}

export interface CustomerProfileRecord {
  id?: string | number
  user_id: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  profile_image_url?: string | null
  profile_photo_url?: string | null
  avatar_url?: string | null
  created_at?: string
}

export interface CustomerProfileInput {
  firstName: string
  lastName: string
  phoneNumber: string
  profileImageUrl?: string
}

export interface CustomerProfileSummary {
  userId: string
  firstName: string
  lastName: string
  fullName: string
  phoneNumber: string
  profileImageUrl: string
  isComplete: boolean
}

export interface CustomerProfileCompletionState {
  userId: string
  profile: CustomerProfileSummary | null
  isComplete: boolean
  missingRequiredFields: Array<'first_name' | 'phone_number'>
}

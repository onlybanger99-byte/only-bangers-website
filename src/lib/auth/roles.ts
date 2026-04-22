export const APP_ROLES = ['admin', 'barber', 'customer'] as const

export type AppRole = (typeof APP_ROLES)[number]
export type UserRole = AppRole | null

const ROLE_ALIASES: Record<string, AppRole> = {
  admin: 'admin',
  owner: 'admin',
  barber: 'barber',
  customer: 'customer',
  client: 'customer',
}

const APP_ROLE_SET = new Set<AppRole>(APP_ROLES)

export const ROLE_ROUTE_ACCESS = {
  admin: ['admin'],
  barber: ['barber'],
  portal: ['customer'],
} satisfies Record<string, readonly AppRole[]>

export function normalizeRole(role: string | null | undefined): UserRole {
  if (typeof role !== 'string') {
    return null
  }

  return ROLE_ALIASES[role] ?? null
}

export function isAppRole(role: string | null | undefined): role is AppRole {
  return typeof role === 'string' && APP_ROLE_SET.has(role as AppRole)
}

export function hasRequiredRole(
  role: UserRole,
  allowedRoles: readonly AppRole[]
): role is AppRole {
  return role !== null && allowedRoles.includes(role)
}

export function getDefaultDashboardForRole(role: UserRole) {
  if (role === 'admin') {
    return '/admin/dashboard'
  }

  if (role === 'barber') {
    return '/barber/dashboard'
  }

  if (role === 'customer') {
    return '/portal/dashboard'
  }

  return '/login'
}

import type { UserPermissions } from './permissions'
import { defaultStaffPermissions } from './permissions'

export type CustomRole = {
  id: string
  label: string
  description: string
  permissions: UserPermissions
}

const STORAGE_KEY = 'hds_custom_roles'
const HIDDEN_BUILTIN_KEY = 'hds_hidden_builtin_roles'

export function loadHiddenBuiltInRoles(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HIDDEN_BUILTIN_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.filter((r) => r !== 'admin') : []
  } catch {
    return []
  }
}

export function saveHiddenBuiltInRoles(roles: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    HIDDEN_BUILTIN_KEY,
    JSON.stringify(roles.filter((r) => r !== 'admin'))
  )
}

export function loadCustomRoles(): CustomRole[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CustomRole[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomRoles(roles: CustomRole[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles))
}

export function createCustomRoleId(label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `role-${slug || 'custom'}-${Date.now().toString(36)}`
}

export function buildCustomRoleValue(id: string) {
  return `custom:${id}`
}

export function isCustomRoleValue(value: string) {
  return value.startsWith('custom:')
}

export function customRoleIdFromValue(value: string) {
  return value.startsWith('custom:') ? value.slice(7) : ''
}

export function resolveApiRole(
  value: string,
  permissions: UserPermissions,
  customRoles: CustomRole[]
): { role: 'staff' | 'admin'; permissions: UserPermissions } {
  if (value === 'admin') {
    return { role: 'admin', permissions }
  }
  if (isCustomRoleValue(value)) {
    const custom = customRoles.find((r) => r.id === customRoleIdFromValue(value))
    return { role: 'staff', permissions: custom?.permissions ?? permissions }
  }
  return { role: 'staff', permissions }
}

export function newCustomRoleDraft(label: string, description: string): CustomRole {
  return {
    id: createCustomRoleId(label),
    label: label.trim(),
    description: description.trim() || 'Custom staff role',
    permissions: defaultStaffPermissions(),
  }
}

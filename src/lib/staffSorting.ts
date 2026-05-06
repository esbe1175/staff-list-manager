import type { StaffMember } from '../types/document'

export function sortStaffForPrint(staff: StaffMember[], locale: string): StaffMember[] {
  return [...staff].sort((first, second) => {
    if (first.isPraktikant !== second.isPraktikant) {
      return first.isPraktikant ? 1 : -1
    }

    return first.name.localeCompare(second.name, locale, {
      numeric: true,
      sensitivity: 'base',
    })
  })
}

import type { StaffMember } from '../types/document'

const staffNameCollator = new Intl.Collator('da', {
  numeric: true,
  sensitivity: 'base',
})

export function sortStaffForPrint(staff: StaffMember[]): StaffMember[] {
  return [...staff].sort((first, second) => {
    if (first.isPraktikant !== second.isPraktikant) {
      return first.isPraktikant ? 1 : -1
    }

    return staffNameCollator.compare(first.name, second.name)
  })
}

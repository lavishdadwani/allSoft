// The API expects document_date as DD-MM-YYYY; native <input type="date"> gives YYYY-MM-DD.
export function isoToApiDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return ''
  return `${day}-${month}-${year}`
}

export function apiDateToIso(apiDate: string): string {
  const [day, month, year] = apiDate.split('-')
  if (!year || !month || !day) return ''
  return `${year}-${month}-${day}`
}

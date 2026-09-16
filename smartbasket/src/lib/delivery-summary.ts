// Existing rider compensation used by the dashboard.
export const DELIVERY_EARNING = 40
export function deliveryDayStart(now = new Date()) {
  const pakistanDate = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return new Date(`${pakistanDate}T00:00:00+05:00`)
}

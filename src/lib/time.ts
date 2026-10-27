/** Server-side date helpers keep impure clock reads out of component render. */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

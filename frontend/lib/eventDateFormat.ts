/** Preserve each design's locale/options while keeping date parsing at one boundary. */
export function formatEventDate(value: string | Date, locale?: Parameters<Date['toLocaleDateString']>[0], options?: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleDateString(locale, options);
}
export function formatEventTime(value: string | Date, locale?: Parameters<Date['toLocaleTimeString']>[0], options?: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleTimeString(locale, options);
}

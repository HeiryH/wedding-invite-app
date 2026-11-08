/** Explicit empty-string policy preserves legacy templates while supporting intentional blanks. */
export function configValue(config: Record<string, string> | undefined, key: string, fallback: string, empty: 'fallback' | 'preserve' = 'fallback') {
  const value = config?.[key];
  return empty === 'preserve' ? value ?? fallback : value || fallback;
}

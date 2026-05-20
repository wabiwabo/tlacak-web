const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur']);

export function isRtlLanguage(language: string): boolean {
  const base = language.split('-')[0]?.toLowerCase() ?? '';
  return RTL_LANGUAGES.has(base);
}

export function directionFor(language: string): 'rtl' | 'ltr' {
  return isRtlLanguage(language) ? 'rtl' : 'ltr';
}

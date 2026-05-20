import { describe, expect, it } from 'vitest';
import { isRtlLanguage, directionFor } from '../rtl';

describe('rtl helpers', () => {
  it('detects RTL languages', () => {
    expect(isRtlLanguage('ar')).toBe(true);
    expect(isRtlLanguage('fa')).toBe(true);
    expect(isRtlLanguage('he')).toBe(true);
    expect(isRtlLanguage('ar-SA')).toBe(true);
    expect(isRtlLanguage('en-US')).toBe(false);
  });

  it('treats other languages as LTR', () => {
    expect(isRtlLanguage('en')).toBe(false);
    expect(isRtlLanguage('id')).toBe(false);
  });

  it('maps a language to a direction string', () => {
    expect(directionFor('ar')).toBe('rtl');
    expect(directionFor('en')).toBe('ltr');
  });
});

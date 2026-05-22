import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportColumns } from '../use-report-columns';

beforeEach(() => localStorage.clear());

describe('useReportColumns', () => {
  it('starts from the default visible set', () => {
    const { result } = renderHook(() => useReportColumns('trips', ['startTime', 'distance']));
    expect(result.current[0]).toEqual(['startTime', 'distance']);
  });

  it('persists a changed selection to localStorage', () => {
    const { result } = renderHook(() => useReportColumns('trips', ['startTime']));
    act(() => result.current[1](['startTime', 'maxSpeed']));
    expect(JSON.parse(localStorage.getItem('report-columns-trips') as string)).toEqual([
      'startTime',
      'maxSpeed',
    ]);
  });
});

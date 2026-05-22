import { describe, expect, it, vi, beforeEach } from 'vitest';
import { downloadBlob } from '../download';

beforeEach(() => vi.restoreAllMocks());

describe('downloadBlob', () => {
  it('creates an object URL and clicks an anchor to download', () => {
    const createUrl = vi.fn(() => 'blob:fake');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadBlob(new Blob(['x']), 'report.xlsx');

    expect(createUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeUrl).toHaveBeenCalledWith('blob:fake');
  });
});

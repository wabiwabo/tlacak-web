const EXCEL_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Triggers a browser download of a blob under the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Re-requests a report endpoint asking for an Excel spreadsheet and downloads it.
 * `path` is the report path incl. its query string, e.g. `/reports/trips?from=...`.
 */
export async function downloadReport(path: string, filename: string): Promise<void> {
  const response = await fetch(`/api${path}`, { headers: { Accept: EXCEL_MIME } });
  if (!response.ok) {
    throw new Error((await response.text()) || response.statusText);
  }
  downloadBlob(await response.blob(), filename);
}

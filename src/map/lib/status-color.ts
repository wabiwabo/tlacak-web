export type StatusColorKey = 'success' | 'error' | 'neutral';

/** Maps a device status to the sprite colour suffix used in icon images. */
export function getStatusColor(status: string | undefined): StatusColorKey {
  switch (status) {
    case 'online':
      return 'success';
    case 'offline':
      return 'error';
    default:
      return 'neutral';
  }
}

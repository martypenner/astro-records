export function formatDuration(
  duration: number,
  pretty: boolean = false,
): string {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  return `${hours === 0 ? '' : hours + ':'}${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${pretty ? Math.floor(seconds) : seconds}`;
}

import { path } from '@tauri-apps/api';
export function getReadableDate(date: number | string | Date) {
  date = new Date(date);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}
export async function getReadableFilename(pathname: string) {
  return await path.basename(pathname, '.seq.json');
}

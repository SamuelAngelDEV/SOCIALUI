import { PlatformId } from '@/constants/platforms';

export type Category = 'feed' | 'reels' | 'messages' | 'video' | 'other';

export const CATEGORY_LABELS: Record<Category, string> = {
  feed: 'Feed',
  reels: 'Reels & Shorts',
  messages: 'Messages',
  video: 'Watching',
  other: 'Other',
};

/** Map a pathname inside a platform's WebView to a time category. */
export function mapPathToCategory(platform: PlatformId, path: string): Category {
  const p = path.toLowerCase();
  switch (platform) {
    case 'instagram':
      if (p.startsWith('/direct')) return 'messages';
      if (p.startsWith('/reels') || p.startsWith('/reel/')) return 'reels';
      if (p === '/' || p.startsWith('/p/')) return 'feed';
      return 'other';
    case 'youtube':
      if (p.startsWith('/shorts')) return 'reels';
      if (p.startsWith('/watch')) return 'video';
      if (p === '/' || p === '') return 'feed';
      return 'other';
    case 'twitter':
      if (p.startsWith('/messages')) return 'messages';
      if (p === '/home' || p === '/') return 'feed';
      return 'other';
    case 'facebook':
      if (p.startsWith('/messages')) return 'messages';
      if (p.startsWith('/reel')) return 'reels';
      if (p.startsWith('/watch')) return 'video';
      if (p === '/' || p.startsWith('/home')) return 'feed';
      return 'other';
    case 'reddit':
      if (p.startsWith('/message') || p.startsWith('/chat')) return 'messages';
      if (p === '/' || p.startsWith('/r/')) return 'feed';
      return 'other';
    case 'tiktok':
      if (p.startsWith('/messages')) return 'messages';
      return 'reels'; // TikTok is short video wall-to-wall
    case 'linkedin':
      if (p.startsWith('/messaging')) return 'messages';
      if (p.startsWith('/feed') || p === '/') return 'feed';
      return 'other';
    default:
      return 'other';
  }
}

/** Local-time day key, e.g. '2026-07-23'. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday of the week containing d, as a day key — identifies the week. */
export function weekKey(d: Date = new Date()): string {
  const copy = new Date(d);
  const dow = (copy.getDay() + 6) % 7; // Mon=0 … Sun=6
  copy.setDate(copy.getDate() - dow);
  return dayKey(copy);
}

/** The 7 day keys of the week identified by its Monday key, Mon..Sun. */
export function weekDays(monKey: string): string[] {
  const [y, m, d] = monKey.split('-').map(Number);
  const mon = new Date(y, m - 1, d);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mon);
    day.setDate(mon.getDate() + i);
    return dayKey(day);
  });
}

/** '1h 24m', '4m 32s', '12s'. */
export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const min = Math.floor(s / 60);
  if (min < 60) {
    const rs = s % 60;
    return rs ? `${min}m ${rs}s` : `${min}m`;
  }
  const h = Math.floor(min / 60);
  const rm = min % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

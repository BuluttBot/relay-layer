export const COLUMN_CONFIG = [
  { key: 'inbox', label: 'INBOX', color: '#7C5CFC' },
  { key: 'assigned', label: 'ASSIGNED', color: '#3B82F6' },
  { key: 'in_progress', label: 'IN PROGRESS', color: '#2DD4BF' },
  { key: 'review', label: 'REVIEW', color: '#F59E0B' },
  { key: 'done', label: 'DONE', color: '#10B981' },
  { key: 'burak', label: 'BURAK', color: '#EC4899' },
  { key: 'published', label: 'PUBLISHED', color: '#8B5CF6' },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  active: '#2DD4BF',
  idle: '#F59E0B',
  offline: '#5E6272',
};

export const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#5E6272',
};
